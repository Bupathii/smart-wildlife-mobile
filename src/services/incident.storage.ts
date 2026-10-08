import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./api";

// Sync status constants
export const SyncStatus = {
  PENDING_SYNC: "PENDING_SYNC",
  SYNCHRONIZED: "SYNCHRONIZED",
} as const;

export type SyncStatusType = (typeof SyncStatus)[keyof typeof SyncStatus];

export interface IncidentRecord {
  clientIncidentId: string;
  incidentType: string;
  description: string;
  latitude?: number;
  longitude?: number;
  locationSource?: string;
  severity?: string;
  evidencePhotoUri?: string;
  syncStatus: SyncStatusType;
  serverId?: string;
  createdAt: string;
}

const ID_KEY = "incident:__ids__";
const key = (id: string) => `incident:${id}`;

export async function saveIncident(incident: IncidentRecord): Promise<void> {
  const { clientIncidentId } = incident;
  if (!clientIncidentId) throw new Error("incident.clientIncidentId is required for local storage");

  await AsyncStorage.setItem(key(clientIncidentId), JSON.stringify(incident));

  const raw = await AsyncStorage.getItem(ID_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  if (!ids.includes(clientIncidentId)) {
    ids.push(clientIncidentId);
    await AsyncStorage.setItem(ID_KEY, JSON.stringify(ids));
  }
}

export async function getIncident(clientIncidentId: string): Promise<IncidentRecord | null> {
  const raw = await AsyncStorage.getItem(key(clientIncidentId));
  return raw ? JSON.parse(raw) : null;
}

export async function getAllIncidents(): Promise<IncidentRecord[]> {
  const raw = await AsyncStorage.getItem(ID_KEY);
  if (!raw) return [];
  const ids: string[] = JSON.parse(raw);
  const results = await Promise.all(ids.map((id) => getIncident(id)));
  return results.filter(Boolean) as IncidentRecord[];
}

export async function getAllPending(): Promise<IncidentRecord[]> {
  const all = await getAllIncidents();
  return all.filter((r) => r.syncStatus === SyncStatus.PENDING_SYNC);
}

export async function markSynchronized(clientIncidentId: string, serverId?: string): Promise<void> {
  const incident = await getIncident(clientIncidentId);
  if (!incident) return;
  incident.syncStatus = SyncStatus.SYNCHRONIZED;
  if (serverId) incident.serverId = serverId;
  await AsyncStorage.setItem(key(clientIncidentId), JSON.stringify(incident));
}
