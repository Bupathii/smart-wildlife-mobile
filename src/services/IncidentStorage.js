import AsyncStorage from '@react-native-async-storage/async-storage';

// SyncStatus enum — mirrors class diagram definition
export const SyncStatus = Object.freeze({
  PENDING_SYNC: 'PENDING_SYNC',
  SYNCHRONIZED: 'SYNCHRONIZED',
});

const KEY_PREFIX = 'incident:';
const ALL_IDS_KEY = 'incident:__ids__';

// Build the per-incident storage key
function incidentKey(clientIncidentId) {
  return `${KEY_PREFIX}${clientIncidentId}`;
}

/**
 * Load the ordered list of all stored incident IDs.
 * @returns {Promise<string[]>}
 */
async function loadAllIds() {
  const raw = await AsyncStorage.getItem(ALL_IDS_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Persist the full ID list.
 * @param {string[]} ids
 * @returns {Promise<void>}
 */
async function saveAllIds(ids) {
  await AsyncStorage.setItem(ALL_IDS_KEY, JSON.stringify(ids));
}

/**
 * Save an incident to local persistent storage.
 * If an incident with the same clientIncidentId already exists it is overwritten.
 *
 * Corresponds to IncidentStorage.saveIncident() in the class diagram.
 *
 * @param {object} incident - must include clientIncidentId and syncStatus
 * @returns {Promise<void>}
 */
export async function saveIncident(incident) {
  const { clientIncidentId } = incident;

  if (!clientIncidentId) {
    throw new Error('incident.clientIncidentId is required for local storage');
  }

  await AsyncStorage.setItem(
    incidentKey(clientIncidentId),
    JSON.stringify(incident)
  );

  // Keep the ID list up to date
  const ids = await loadAllIds();
  if (!ids.includes(clientIncidentId)) {
    ids.push(clientIncidentId);
    await saveAllIds(ids);
  }
}

/**
 * Retrieve a single incident by its client-side ID.
 *
 * @param {string} clientIncidentId
 * @returns {Promise<object|null>}
 */
export async function getIncident(clientIncidentId) {
  const raw = await AsyncStorage.getItem(incidentKey(clientIncidentId));
  return raw ? JSON.parse(raw) : null;
}

/**
 * Return all incidents whose syncStatus is PENDING_SYNC.
 *
 * Used by SyncManager to find what needs to be sent to the server.
 *
 * @returns {Promise<object[]>}
 */
export async function getAllPending() {
  const ids = await loadAllIds();
  const results = [];

  for (const id of ids) {
    const incident = await getIncident(id);
    if (incident && incident.syncStatus === SyncStatus.PENDING_SYNC) {
      results.push(incident);
    }
  }

  return results;
}

/**
 * Return all stored incidents regardless of sync status.
 *
 * @returns {Promise<object[]>}
 */
export async function getAllIncidents() {
  const ids = await loadAllIds();
  const results = [];

  for (const id of ids) {
    const incident = await getIncident(id);
    if (incident) results.push(incident);
  }

  return results;
}

/**
 * Update an incident's syncStatus to SYNCHRONIZED.
 *
 * Corresponds to IncidentStorage.markSynchronized() / statusUpdated in the sequence diagram.
 *
 * @param {string} clientIncidentId
 * @returns {Promise<void>}
 */
export async function markSynchronized(clientIncidentId) {
  const incident = await getIncident(clientIncidentId);
  if (!incident) return;

  await saveIncident({ ...incident, syncStatus: SyncStatus.SYNCHRONIZED });
}
