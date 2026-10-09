import { API_BASE_URL } from "./api";

export interface AnimalLocationPayload {
  animalId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface TrackingResponse {
  success: boolean;
  message: string;
  alertGenerated: boolean;
  alertId?: string | null;
  priority?: string | null;
  notifiedResponder?: string | null;
  assignedRangerId?: string | null;
  animal?: {
    animalId: string;
    name?: string;
    species?: string;
  } | null;
}

export interface TrackedAnimal {
  animalId: string;
  name: string;
  species: string;
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    lastUpdated?: string;
  };
}

export interface CollarTrackingSession {
  animalId: string;
  name: string;
  species: string;
  status: "REQUESTED" | "ACTIVE" | "STOPPED";
  requestedAt?: string;
}

export interface RangerAlert {
  alertId: string;
  animalId: string;
  animalName?: string;
  zone: string;
  latitude: number;
  longitude: number;
  priority: string;
  status: string;
  timestamp?: string;
}

async function trackingRequest<T>(token: string, path: string, method = "GET"): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/tracking${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || "Tracking request failed");
  }
  return data as T;
}

export async function startRemoteTracking(token: string, animalId: string): Promise<void> {
  await trackingRequest(token, `/animals/${encodeURIComponent(animalId)}/tracking/start`, "POST");
}

export async function stopRemoteTracking(token: string, animalId: string): Promise<void> {
  await trackingRequest(token, `/animals/${encodeURIComponent(animalId)}/tracking/stop`, "POST");
}

export async function getAnimalTrackingSession(
  token: string,
  animalId: string
): Promise<CollarTrackingSession> {
  const data = await trackingRequest<{ session: CollarTrackingSession }>(
    token,
    `/animals/${encodeURIComponent(animalId)}/tracking/session`
  );
  return data.session;
}

export async function getCollarTrackingSession(
  token: string
): Promise<CollarTrackingSession | null> {
  const data = await trackingRequest<{ session: CollarTrackingSession | null }>(token, "/collar/session");
  return data.session;
}

export async function activateCollarTracking(token: string, animalId: string): Promise<void> {
  await trackingRequest(token, `/animals/${encodeURIComponent(animalId)}/tracking/activate`, "POST");
}

export async function getRangerAlerts(token: string): Promise<RangerAlert[]> {
  const data = await trackingRequest<{ alerts: RangerAlert[] }>(token, "/alerts");
  return Array.isArray(data.alerts) ? data.alerts : [];
}

export async function getTrackedAnimals(token: string): Promise<TrackedAnimal[]> {
  const response = await fetch(`${API_BASE_URL}/animals`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid response from animal registry');
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Unable to load registered animals');
  }

  return Array.isArray(data.animals) ? data.animals : [];
}

export async function sendAnimalLocation(
  token: string,
  payload: AnimalLocationPayload
): Promise<TrackingResponse> {
  const response = await fetch(`${API_BASE_URL}/tracking/location`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  let data: any;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from tracking server");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Unable to send tracking location");
  }

  return data as TrackingResponse;
}
