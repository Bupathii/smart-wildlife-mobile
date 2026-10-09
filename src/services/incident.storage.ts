import AsyncStorage from "@react-native-async-storage/async-storage";
import { PendingIncidentReport, SyncStatus } from "@/types/incident";

const STORAGE_KEY = "incident_reports";

export async function getAllIncidents(): Promise<PendingIncidentReport[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as PendingIncidentReport[];
}

export async function saveIncident(
  report: PendingIncidentReport,
): Promise<void> {
  const existing = await getAllIncidents();
  const idx = existing.findIndex(
    (r) => r.clientIncidentId === report.clientIncidentId,
  );
  if (idx >= 0) {
    existing[idx] = report;
  } else {
    existing.unshift(report);
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export async function updateIncidentStatus(
  clientIncidentId: string,
  syncStatus: SyncStatus,
  serverId?: string,
): Promise<void> {
  const existing = await getAllIncidents();
  const idx = existing.findIndex(
    (r) => r.clientIncidentId === clientIncidentId,
  );
  if (idx >= 0) {
    existing[idx].syncStatus = syncStatus;
    if (serverId) existing[idx].serverId = serverId;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
}

export async function getPendingIncidents(): Promise<PendingIncidentReport[]> {
  const all = await getAllIncidents();
  // Retry both "Pending" and "Failed" reports on sync
  return all.filter((r) => r.syncStatus === "Pending" || r.syncStatus === "Failed");
}

export async function clearAllIncidents(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
