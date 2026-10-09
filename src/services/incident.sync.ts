import NetInfo from "@react-native-community/netinfo";
import {
  getPendingIncidents,
  updateIncidentStatus,
} from "@/services/incident.storage";
import { submitIncidentReport } from "@/services/incident.service";

export interface SyncIncidentsResult {
  synced: number;
  remaining: number;
  failed: number;
  skipped: number;
}

export async function syncPendingIncidents(
  token: string,
): Promise<SyncIncidentsResult> {
  const netState = await NetInfo.fetch();
  const isOnline =
    netState.isConnected === true &&
    netState.isInternetReachable !== false;

  if (!isOnline) {
    const pending = await getPendingIncidents();
    return { synced: 0, remaining: pending.length, failed: 0, skipped: 0 };
  }

  const pending = await getPendingIncidents();
  let synced = 0;
  let remaining = 0;

  for (const report of pending) {
    // If required fields are missing, keep in local queue for retry
    if (
      !report.incidentType ||
      !report.description?.trim() ||
      report.location?.latitude == null ||
      report.location?.longitude == null
    ) {
      remaining++;
      continue;
    }

    try {
      const result = await submitIncidentReport(
        {
          clientIncidentId: report.clientIncidentId,
          incidentType: report.incidentType,
          description: report.description,
          severity: report.severity ?? "MEDIUM",
          locationSource: report.location.source ?? "GPS",
          latitude: report.location.latitude,
          longitude: report.location.longitude,
          locationTimestamp: report.location.timestamp,
        },
        token,
      );

      if (result.success) {
        await updateIncidentStatus(
          report.clientIncidentId,
          "Synchronized",
          result.data?._id,
        );
        synced++;
      } else if (result.alreadySynchronized) {
        // 409 handled cleanly in service — already on server
        await updateIncidentStatus(report.clientIncidentId, "Synchronized");
        synced++;
      } else {
        // Keep report as Pending so user can retry later
        remaining++;
      }
    } catch (err: unknown) {
      // expo/fetch errors carry .status and .data (not .response like axios)
      const fetchErr = err as {
        status?: number;
        data?: { alreadySynchronized?: boolean };
      };
      if (fetchErr?.status === 409 && fetchErr?.data?.alreadySynchronized) {
        await updateIncidentStatus(report.clientIncidentId, "Synchronized");
        synced++;
      } else {
        // Keep report as Pending so user can retry later
        remaining++;
      }
    }
  }

  return { synced, remaining, failed: 0, skipped: 0 };
}

