import { createIncident } from '../api/incidents';
import { SyncStatus, saveIncident } from './IncidentStorage';
import { checkConnectivity, storeOffline, synchronizeData } from './SyncManager';

// Required fields for a valid incident report
const REQUIRED_FIELDS = ['incidentType', 'description', 'location', 'evidencePhotos'];

// Incident types matching the backend enum
export const INCIDENT_TYPES = Object.freeze([
  'SNARE',
  'ANIMAL_CARCASS',
  'ILLEGAL_CAMP',
  'ANIMAL_FOOTPRINT',
  'POACHING',
  'OTHER',
]);

// Labels shown in the UI picker
export const INCIDENT_TYPE_LABELS = Object.freeze({
  SNARE: 'Snare',
  ANIMAL_CARCASS: 'Animal Carcass',
  ILLEGAL_CAMP: 'Illegal Camp',
  ANIMAL_FOOTPRINT: 'Animal Footprint',
  POACHING: 'Poaching',
  OTHER: 'Other',
});

/**
 * Generate a simple UUID v4 without external dependencies.
 * Used as the client-side idempotency key (clientIncidentId).
 *
 * @returns {string}
 */
export function generateClientIncidentId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate incident data on the client before attempting submission.
 *
 * Corresponds to validateIncident(details) in the sequence diagram.
 * Returns { valid: boolean, missingFields: string[] }.
 *
 * @param {object} data
 * @returns {{ valid: boolean, missingFields: string[] }}
 */
export function validateIncident(data) {
  const missingFields = [];

  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      missingFields.push(field);
    }
  }

  if (data.description && !data.description.trim()) {
    if (!missingFields.includes('description')) missingFields.push('description');
  }

  if (data.evidencePhotos && data.evidencePhotos.length === 0) {
    if (!missingFields.includes('evidencePhotos')) missingFields.push('evidencePhotos');
  }

  if (data.location) {
    const { latitude, longitude } = data.location;
    if (latitude === undefined || longitude === undefined ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180) {
      missingFields.push('location');
    }
  }

  return { valid: missingFields.length === 0, missingFields };
}

/**
 * Build the FormData payload from a structured incident object.
 *
 * @param {object} incident
 * @returns {FormData}
 */
function buildFormData(incident) {
  const formData = new FormData();

  formData.append('clientIncidentId', incident.clientIncidentId);
  formData.append('incidentType', incident.incidentType);
  formData.append('description', incident.description);
  formData.append('locationSource', incident.location.source);
  formData.append('latitude', String(incident.location.latitude));
  formData.append('longitude', String(incident.location.longitude));
  formData.append('locationTimestamp', incident.location.timestamp);

  if (incident.severity) {
    formData.append('severity', incident.severity);
  }

  for (const photo of incident.evidencePhotos) {
    formData.append('evidence', {
      uri: photo.uri,
      type: photo.type || 'image/jpeg',
      name: photo.name || 'photo.jpg',
    });
  }

  return formData;
}

/**
 * Orchestrate the full incident submission flow per the sequence diagram:
 *
 *   validateIncident → createIncident (local) → saveIncident (IncidentStorage)
 *   → checkConnectivity → synchronize if online / storeOffline if not
 *
 * @param {object} data - { incidentType, description, location, evidencePhotos, severity? }
 * @returns {Promise<{ syncStatus: string, clientIncidentId: string }>}
 * @throws {{ missingFields: string[] }} when client validation fails
 */
export async function submitIncident(data) {
  // Step 1 — client-side validation
  const validation = validateIncident(data);
  if (!validation.valid) {
    const err = new Error('Validation failed');
    err.missingFields = validation.missingFields;
    throw err;
  }

  // Step 2 — createIncident: build local incident object
  const clientIncidentId = data.clientIncidentId || generateClientIncidentId();
  const incident = {
    clientIncidentId,
    incidentType: data.incidentType,
    description: data.description.trim(),
    location: data.location,
    evidencePhotos: data.evidencePhotos,
    severity: data.severity || 'MEDIUM',
    syncStatus: SyncStatus.PENDING_SYNC,
    createdAt: new Date().toISOString(),
  };

  // Step 3 — saveIncident: always persist locally first
  await saveIncident(incident);

  // Step 4 — checkConnectivity
  const online = await checkConnectivity();

  if (!online) {
    // E3: offline — keep pending, inform ranger
    return { syncStatus: SyncStatus.PENDING_SYNC, clientIncidentId };
  }

  // Step 5 — synchronize: try to send to CentralIncidentDB
  try {
    const formData = buildFormData(incident);
    await createIncident(formData);

    // Mark synchronized both locally and signal success
    await saveIncident({ ...incident, syncStatus: SyncStatus.SYNCHRONIZED });
    return { syncStatus: SyncStatus.SYNCHRONIZED, clientIncidentId };
  } catch (err) {
    const status = err.response?.status;

    // 409 = already submitted (idempotent re-send)
    if (status === 409) {
      await saveIncident({ ...incident, syncStatus: SyncStatus.SYNCHRONIZED });
      return { syncStatus: SyncStatus.SYNCHRONIZED, clientIncidentId };
    }

    // Network failure → stay pending so retry picks it up
    return { syncStatus: SyncStatus.PENDING_SYNC, clientIncidentId };
  }
}
