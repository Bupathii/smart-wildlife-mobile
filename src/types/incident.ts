export type IncidentType =
  | "POACHING"
  | "ILLEGAL_CAMP"
  | "SNARE"
  | "ANIMAL_CARCASS"
  | "ANIMAL_FOOTPRINT"
  | "OTHER";

export type LocationSource = "GPS" | "MANUAL";

export type SyncStatus = "Pending" | "Synchronized" | "Failed";

export interface IncidentLocation {
  latitude: number;
  longitude: number;
  source: LocationSource;
  timestamp?: string;
}

export interface PendingIncidentReport {
  clientIncidentId: string;
  incidentType: IncidentType;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  location: IncidentLocation;
  evidenceUris: string[];
  createdAt: string;
  syncStatus: SyncStatus;
  serverId?: string;
}
