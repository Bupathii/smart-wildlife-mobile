import { fetch } from "expo/fetch";
import { API_BASE_URL } from "@/services/api";
import { PendingIncidentReport } from "@/types/incident";

export interface SubmitIncidentPayload {
  clientIncidentId: string;
  incidentType: string;
  description: string;
  severity: string;
  locationSource: string;
  latitude: number;
  longitude: number;
  locationTimestamp?: string;
}

export interface SubmitIncidentResponse {
  success: boolean;
  data?: { _id: string; [key: string]: unknown };
  alreadySynchronized?: boolean;
}

export async function submitIncidentReport(
  payload: SubmitIncidentPayload,
  token: string,
): Promise<SubmitIncidentResponse> {
  const response = await fetch(`${API_BASE_URL}/incidents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientIncidentId: payload.clientIncidentId,
      incidentType: payload.incidentType,
      description: payload.description,
      severity: payload.severity,
      locationSource: payload.locationSource,
      latitude: payload.latitude,
      longitude: payload.longitude,
      locationTimestamp: payload.locationTimestamp,
    }),
  });

  if (response.status === 409) {
    const body = await response.json().catch(() => ({}));
    return {
      success: false,
      alreadySynchronized: body?.alreadySynchronized === true,
    };
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw Object.assign(new Error(err?.message ?? "Submit failed"), {
      status: response.status,
      data: err,
    });
  }

  const json = await response.json();
  // Backend returns { success, report } not { success, data }
  return { success: true, data: json.report ?? json.data };
}

export async function fetchMyIncidents(
  token: string,
  page = 1,
  limit = 20,
): Promise<{ reports: PendingIncidentReport[]; total: number }> {
  const response = await fetch(
    `${API_BASE_URL}/incidents/my?page=${page}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch incidents");
  }

  const json = await response.json();
  // Backend returns { success, reports, total } not { success, data }
  return {
    reports: json.reports ?? json.data ?? [],
    total: json.total ?? 0,
  };
}
