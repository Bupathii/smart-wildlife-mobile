import { File } from "expo-file-system";
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
  /** Local file URIs of evidence photos selected on device. */
  evidenceUris?: string[];
}

export interface SubmitIncidentResponse {
  success: boolean;
  data?: { _id: string; [key: string]: unknown };
  alreadySynchronized?: boolean;
}

/**
 * Append evidence photos from local URIs to a FormData object.
 *
 * Uses expo-file-system's File class — the same approach as conflict.service.ts —
 * because expo/fetch's FormData implementation understands expo-file-system File
 * objects and can stream them directly. Calling fetch(localUri) to get a Blob
 * does NOT work because expo/fetch is an HTTP client and cannot read file:// URIs.
 *
 * @param form         - The FormData to append files into.
 * @param evidenceUris - Array of local file:// or content:// URIs.
 */
async function appendEvidencePhotos(
  form: FormData,
  evidenceUris: string[],
): Promise<void> {
  for (const uri of evidenceUris) {
    const file = new File(uri);

    if (!file.exists) {
      throw new Error(
        `Evidence photo is no longer available on this device: ${uri}`,
      );
    }

    form.append("evidence", file);
  }
}

export async function submitIncidentReport(
  payload: SubmitIncidentPayload,
  token: string,
): Promise<SubmitIncidentResponse> {
  // Build a multipart/form-data body so the backend's multer middleware
  // can receive both text fields and the evidence file(s) in one request.
  const form = new FormData();

  form.append("clientIncidentId", payload.clientIncidentId);
  form.append("incidentType",     payload.incidentType);
  form.append("description",      payload.description);
  form.append("severity",         payload.severity);
  form.append("locationSource",   payload.locationSource);
  form.append("latitude",         String(payload.latitude));
  form.append("longitude",        String(payload.longitude));

  if (payload.locationTimestamp) {
    form.append("locationTimestamp", payload.locationTimestamp);
  }

  if (payload.evidenceUris && payload.evidenceUris.length > 0) {
    await appendEvidencePhotos(form, payload.evidenceUris);
  }

  // NOTE: do NOT set Content-Type manually — fetch sets the correct
  // multipart/form-data boundary automatically when body is FormData.
  const response = await fetch(`${API_BASE_URL}/incidents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
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
