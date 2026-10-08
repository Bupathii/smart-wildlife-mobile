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
