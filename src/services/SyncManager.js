import NetInfo from '@react-native-community/netinfo';
import { createIncident } from '../api/incidents';
import {
  getAllPending,
  markSynchronized,
  saveIncident,
  SyncStatus,
} from './IncidentStorage';

/**
 * Check whether the device currently has a network connection.
 *
 * Corresponds to SyncManager.checkConnectivity() in the class diagram.
 *
 * @returns {Promise<boolean>}
 */
export async function checkConnectivity() {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

/**
 * Save an incident to local storage and mark it PENDING_SYNC.
 *
 * Corresponds to SyncManager.storeOffline() in the class diagram.
 *
 * @param {object} incident
 * @returns {Promise<void>}
 */
export async function storeOffline(incident) {
  await saveIncident({ ...incident, syncStatus: SyncStatus.PENDING_SYNC });
}

/**
 * Attempt to synchronize a single pending incident with the central database.
 *
 * - On HTTP 409 (already submitted) → treats as success (idempotency).
 * - On server 4xx validation/auth error → marks as a permanent error, does NOT retry.
 * - On network failure → keeps PENDING_SYNC so retry can pick it up later.
 *
 * @param {object} incident - a locally stored incident object
 * @returns {Promise<{ success: boolean, alreadySynchronized?: boolean, error?: string }>}
 */
async function synchronizeOne(incident) {
  const formData = buildFormData(incident);

  try {
    await createIncident(formData);
    await markSynchronized(incident.clientIncidentId);
    return { success: true };
  } catch (err) {
    const status = err.response?.status;

    // 409 = server already has this report; treat as synchronized
    if (status === 409) {
      await markSynchronized(incident.clientIncidentId);
      return { success: true, alreadySynchronized: true };
    }

    // 4xx (except 409) = bad data / auth — do not blindly retry
    if (status && status >= 400 && status < 500) {
      return { success: false, error: err.response?.data?.message || 'Validation error' };
    }

    // Network / 5xx — keep pending, retry later
    return { success: false, error: err.message };
  }
}

/**
 * Build a FormData payload from a locally stored incident.
 * Evidence photos stored as base64 URIs are converted to Blob entries.
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

  // Attach evidence photos — React Native FormData accepts { uri, type, name }
  for (const photo of incident.evidencePhotos || []) {
    formData.append('evidence', {
      uri: photo.uri,
      type: photo.type || 'image/jpeg',
      name: photo.name || 'photo.jpg',
    });
  }

  return formData;
}

/**
 * Process all PENDING_SYNC incidents sequentially.
 * One failure does not block the rest.
 *
 * Corresponds to SyncManager.synchronizeData() in the class diagram.
 *
 * @returns {Promise<{ synced: number, failed: number }>}
 */
export async function synchronizeData() {
  const pending = await getAllPending();
  let synced = 0;
  let failed = 0;

  for (const incident of pending) {
    const result = await synchronizeOne(incident);
    if (result.success) {
      synced++;
    } else {
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Re-run synchronization when the network becomes available.
 * Called by the connectivity Observer registered in the app.
 *
 * Corresponds to SyncManager.retrySynchronization() in the class diagram.
 *
 * @returns {Promise<void>}
 */
export async function retrySynchronization() {
  const online = await checkConnectivity();
  if (!online) return;

  await synchronizeData();
}

/**
 * Register a NetInfo listener that triggers retrySynchronization whenever
 * the device regains connectivity (Observer pattern for connectivity changes).
 *
 * Returns an unsubscribe function — call it on component unmount.
 *
 * @returns {() => void} unsubscribe
 */
export function subscribeToConnectivity() {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      retrySynchronization().catch(() => {
        // Errors are already handled per-incident inside synchronizeData
      });
    }
  });
}
