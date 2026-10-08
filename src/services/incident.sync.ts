import NetInfo from "@react-native-community/netinfo";
import { API_BASE_URL } from "./api";
import {
  getAllPending,
  markSynchronized,
  saveIncident,
  SyncStatus,
  type IncidentRecord,
} from "./incident.storage";

export async function checkConnectivity(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export async function submitToServer(
  incident: IncidentRecord,
  token: string
): Promise<{ success: boolean; serverId?: string }> {
  const formData = new FormData();
  formData.append("clientIncidentId", incident.clientIncidentId);
  formData.append("incidentType", incident.incidentType);
  formData.append("description", incident.description);
  if (incident.latitude != null) formData.append("latitude", String(incident.latitude));
  if (incident.longitude != null) formData.append("longitude", String(incident.longitude));
  if (incident.locationSource) formData.append("locationSource", incident.locationSource);
  if (incident.severity) formData.append("severity", incident.severity);
  if (incident.evidencePhotoUri) {
    const filename = incident.evidencePhotoUri.split("/").pop() || "photo.jpg";
    formData.append("evidence", { uri: incident.evidencePhotoUri, name: filename, type: "image/jpeg" } as any);
  }

  const res = await fetch(`${API_BASE_URL}/incidents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (res.status === 409) return { success: true }; // already exists
  if (!res.ok) return { success: false };

  const data = await res.json();
  return { success: true, serverId: data.report?._id };
}

export async function storeOffline(incident: IncidentRecord): Promise<void> {
  incident.syncStatus = SyncStatus.PENDING_SYNC;
  await saveIncident(incident);
}

export async function synchronizeData(token: string): Promise<{ synced: number; failed: number }> {
  const pending = await getAllPending();
  let synced = 0;
  let failed = 0;
  for (const incident of pending) {
    const result = await submitToServer(incident, token).catch(() => ({ success: false }));
    if (result.success) {
      await markSynchronized(incident.clientIncidentId, result.serverId);
      synced++;
    } else {
      failed++;
    }
  }
  return { synced, failed };
}

export function subscribeToConnectivity(
  token: string,
  onSynced?: (count: number) => void
): () => void {
  return NetInfo.addEventListener(async (state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      const { synced } = await synchronizeData(token);
      if (synced > 0 && onSynced) onSynced(synced);
    }
  });
}
