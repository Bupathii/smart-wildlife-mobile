import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useCallback, useEffect, useRef, useState } from "react";

import { useFocusEffect } from "expo-router";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import * as Location from "expo-location";

import { useAuth } from "@/context/AuthContext";
import {
  completeMyPatrol,
  countPendingLocations,
  getMyPatrol,
  positionAlongRoute,
  reportLocation,
  startMyPatrol,
} from "@/services/patrol.service";
import {
  LocationReport,
  MyPatrol,
  MyPatrolResponse,
  PatrolStatus,
} from "@/types/patrol";

/** How often the phone reports its position while a patrol is running. */
const REPORT_INTERVAL_MS = 20_000;
/** Demo walk: faster reports and a fixed step along the route each time. */
const DEMO_INTERVAL_MS = 10_000;
const DEMO_STEP_KM = 0.3;
const KEEP_AWAKE_TAG = "ranger-patrol";

const IN_PROGRESS: PatrolStatus[] = ["ACTIVE", "DELAYED", "ON_HOLD"];
const STATUS_LABEL: Record<PatrolStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  DELAYED: "Delayed",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
}

function formatClock(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** What the tracking line under the buttons says. */
interface TrackingState {
  message: string;
  waiting: number;
  lastSentAt: Date | null;
}

const IDLE_TRACKING: TrackingState = { message: "", waiting: 0, lastSentAt: null };

/** Reads the phone's real position, asking for permission the first time. */
async function readDevicePosition(): Promise<LocationReport | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timestamp: new Date(position.timestamp).toISOString(),
  };
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(100, percentage)}%` }]} />
    </View>
  );
}

function WaypointChecklist({ patrol }: { patrol: MyPatrol }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        Waypoints ({patrol.waypointsReached}/{patrol.waypoints.length})
      </Text>
      {patrol.waypoints.map((waypoint) => (
        <View key={waypoint.number} style={styles.waypointRow}>
          <View style={[styles.waypointDot, waypoint.reached && styles.waypointDotReached]}>
            <Text style={[styles.waypointNumber, waypoint.reached && styles.waypointNumberReached]}>
              {waypoint.reached ? "✓" : waypoint.number}
            </Text>
          </View>
          <Text style={styles.waypointText}>
            Waypoint {waypoint.number} · {waypoint.latitude.toFixed(4)},{" "}
            {waypoint.longitude.toFixed(4)}
          </Text>
          <Text style={waypoint.reached ? styles.reachedText : styles.pendingText}>
            {waypoint.reached ? "Reached" : "Pending"}
          </Text>
        </View>
      ))}
    </View>
  );
}

function InsightsCard({ data }: { data: MyPatrolResponse }) {
  const { insights, history } = data;
  const last = insights.lastEvaluation;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>My patrol insights</Text>
      <View style={styles.statGrid}>
        <StatTile label="Patrols completed" value={String(insights.completedPatrols)} />
        <StatTile label="Average coverage" value={`${insights.averageCoverage}%`} />
        <StatTile label="Total distance" value={`${insights.totalDistanceKm} km`} />
        <StatTile
          label="Average rating"
          value={insights.averageRating > 0 ? `${insights.averageRating} / 5` : "—"}
        />
      </View>

      {last && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackTitle}>
            Latest evaluation · {last.patrolId} · {"★".repeat(last.rating)}
            {"☆".repeat(5 - last.rating)}
          </Text>
          <Text style={styles.feedbackText}>{last.notes || "No notes were added."}</Text>
        </View>
      )}

      {history.length > 0 && <Text style={styles.subTitle}>Recent patrols</Text>}
      {history.map((item) => (
        <View key={item.patrolId} style={styles.historyRow}>
          <View style={styles.flexOne}>
            <Text style={styles.historyName}>
              {item.patrolId} · {item.route.name}
            </Text>
            <Text style={styles.muted}>
              {formatDateTime(item.endTime)} · {formatDuration(item.durationMinutes)} ·{" "}
              {item.distanceCoveredKm} km
            </Text>
          </View>
          <Text style={styles.historyCoverage}>{item.coveragePercentage}%</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * My Patrol: the ranger sees the assigned patrol, starts it, and while it
 * is running the phone reports its position so the Park Manager can follow
 * the patrol on the web dashboard. The screen must stay open during the
 * patrol (it is kept awake); positions taken without a connection are
 * stored and sent later.
 */
export default function RangerPatrol() {
  const { token } = useAuth();
  const [data, setData] = useState<MyPatrolResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoWalk, setDemoWalk] = useState(false);
  const [tracking, setTracking] = useState<TrackingState>(IDLE_TRACKING);
  const demoDistance = useRef(0);

  const patrol = data?.patrol ?? null;
  const inProgress = patrol ? IN_PROGRESS.includes(patrol.status) : false;
  const patrolId = patrol?.patrolId ?? null;

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const response = await getMyPatrol(token);
      setData(response);
      setError("");
      if (response.patrol) {
        const waiting = await countPendingLocations(response.patrol.patrolId);
        setTracking((current) => ({ ...current, waiting }));
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Unable to load your patrol");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  /** Takes one position (real or demo), stores it and tries to send it. */
  const reportOnce = useCallback(async () => {
    if (!token || !patrol) return;

    let point: LocationReport | null = null;
    if (demoWalk) {
      demoDistance.current = Math.min(
        patrol.route.routeLength,
        Math.max(demoDistance.current, patrol.distanceCoveredKm) + DEMO_STEP_KM
      );
      point = {
        ...positionAlongRoute(patrol.waypoints, demoDistance.current),
        timestamp: new Date().toISOString(),
      };
    } else {
      try {
        point = await readDevicePosition();
      } catch {
        point = null;
      }
    }

    if (!point) {
      setTracking((current) => ({
        ...current,
        message: "Location is not available. Allow location access or turn on Demo walk.",
      }));
      return;
    }

    const outcome = await reportLocation(token, patrol.patrolId, point);
    if (outcome.result) {
      setTracking({ message: "Sending location", waiting: outcome.waiting, lastSentAt: new Date() });
      await load();
    } else if (outcome.rejected) {
      setTracking((current) => ({ ...current, message: outcome.rejected ?? "", waiting: 0 }));
    } else {
      setTracking((current) => ({
        ...current,
        message: "No connection – locations are saved on this phone",
        waiting: outcome.waiting,
      }));
    }
  }, [token, patrol, demoWalk, load]);

  // The latest reportOnce is kept in a ref so the timer below is not
  // restarted every time the patrol data refreshes.
  const reportRef = useRef(reportOnce);
  useEffect(() => {
    reportRef.current = reportOnce;
  }, [reportOnce]);

  useEffect(() => {
    if (!inProgress || !patrolId) return undefined;

    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    reportRef.current();
    const timer = setInterval(
      () => reportRef.current(),
      demoWalk ? DEMO_INTERVAL_MS : REPORT_INTERVAL_MS
    );

    return () => {
      clearInterval(timer);
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [inProgress, patrolId, demoWalk]);

  async function runAction(action: (token: string) => Promise<MyPatrolResponse>) {
    if (!token) return;
    setBusy(true);
    try {
      setData(await action(token));
      setError("");
      setTracking(IDLE_TRACKING);
      demoDistance.current = 0;
    } catch (problem) {
      Alert.alert(
        "Patrol",
        problem instanceof Error ? problem.message : "The action could not be completed"
      );
    } finally {
      setBusy(false);
    }
  }

  function confirmEnd() {
    Alert.alert("End patrol", "Mark this patrol as completed?", [
      { text: "Cancel", style: "cancel" },
      { text: "End patrol", style: "destructive", onPress: () => runAction(completeMyPatrol) },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.muted}>Loading your patrol…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      {error !== "" && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.secondaryButton} onPress={load}>
            <Text style={styles.secondaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {data && !patrol && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No patrol assigned</Text>
          <Text style={styles.muted}>
            {data.ranger.name}, you have no patrol at the moment. When the Park Manager assigns
            one it will appear here. Pull down to refresh.
          </Text>
        </View>
      )}

      {patrol && (
        <>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.patrolId}>{patrol.patrolId}</Text>
              <View style={[styles.badge, inProgress && styles.badgeActive]}>
                <Text style={[styles.badgeText, inProgress && styles.badgeTextActive]}>
                  {STATUS_LABEL[patrol.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.routeName}>{patrol.route.name}</Text>
            {patrol.route.description !== "" && (
              <Text style={styles.muted}>{patrol.route.description}</Text>
            )}
            <Text style={styles.muted}>
              {inProgress ? "Started" : "Planned start"} {formatDateTime(patrol.startTime)} ·
              planned end {formatDateTime(patrol.endTime)}
            </Text>
            <Text style={styles.muted}>Team: {patrol.teammates.join(", ")}</Text>

            <View style={styles.progressBlock}>
              <View style={styles.rowBetween}>
                <Text style={styles.progressLabel}>Route progress</Text>
                <Text style={styles.progressLabel}>{patrol.progressPercentage}%</Text>
              </View>
              <ProgressBar percentage={patrol.progressPercentage} />
            </View>

            <View style={styles.statGrid}>
              <StatTile
                label="Distance"
                value={`${patrol.distanceCoveredKm} / ${patrol.route.routeLength} km`}
              />
              <StatTile label="Coverage" value={`${patrol.coveragePercentage}%`} />
              <StatTile
                label="Waypoints"
                value={`${patrol.waypointsReached} / ${patrol.waypoints.length}`}
              />
              <StatTile label="Time on patrol" value={formatDuration(patrol.durationMinutes)} />
            </View>

            {patrol.status === "PLANNED" && (
              <Pressable
                style={[styles.primaryButton, busy && styles.disabled]}
                disabled={busy}
                onPress={() => runAction(startMyPatrol)}
              >
                <Text style={styles.primaryButtonText}>{busy ? "Starting…" : "Start patrol"}</Text>
              </Pressable>
            )}

            {inProgress && (
              <>
                <View style={styles.trackingBox}>
                  <Text style={styles.trackingText}>
                    {tracking.message || "Preparing to send location…"}
                  </Text>
                  <Text style={styles.muted}>
                    Last sent {formatClock(tracking.lastSentAt)}
                    {tracking.waiting > 0 ? ` · ${tracking.waiting} waiting to send` : ""}
                  </Text>
                  <Text style={styles.muted}>Keep this screen open while you are on patrol.</Text>
                </View>

                <View style={styles.rowBetween}>
                  <View style={styles.flexOne}>
                    <Text style={styles.switchLabel}>Demo walk</Text>
                    <Text style={styles.muted}>
                      Sends positions along the route instead of this phone's GPS (for
                      demonstrations away from the park).
                    </Text>
                  </View>
                  <Switch
                    value={demoWalk}
                    onValueChange={setDemoWalk}
                    trackColor={{ true: "#0F766E" }}
                  />
                </View>

                <Pressable
                  style={[styles.endButton, busy && styles.disabled]}
                  disabled={busy}
                  onPress={confirmEnd}
                >
                  <Text style={styles.primaryButtonText}>{busy ? "Ending…" : "End patrol"}</Text>
                </Pressable>
              </>
            )}
          </View>

          <WaypointChecklist patrol={patrol} />
        </>
      )}

      {data && <InsightsCard data={data} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7f5" },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  flexOne: { flex: 1 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#14532d" },
  subTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginTop: 8 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  patrolId: { fontSize: 14, fontWeight: "700", color: "#0F766E" },
  routeName: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  muted: { fontSize: 13, color: "#64748b", lineHeight: 19 },
  badge: { backgroundColor: "#e2e8f0", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  badgeActive: { backgroundColor: "#dcfce7" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  badgeTextActive: { color: "#166534" },
  progressBlock: { gap: 6, marginTop: 6 },
  progressLabel: { fontSize: 13, fontWeight: "600", color: "#334155" },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: "#e2e8f0", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5, backgroundColor: "#0F766E" },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  statTile: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 12,
  },
  statValue: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 2 },
  primaryButton: {
    backgroundColor: "#0F766E",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  endButton: {
    backgroundColor: "#b91c1c",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#b91c1c",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryButtonText: { color: "#b91c1c", fontWeight: "700" },
  disabled: { opacity: 0.6 },
  trackingBox: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    padding: 12,
    gap: 2,
    marginTop: 6,
  },
  trackingText: { fontSize: 14, fontWeight: "700", color: "#065f46" },
  switchLabel: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  waypointRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  waypointDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  waypointDotReached: { backgroundColor: "#0F766E" },
  waypointNumber: { fontSize: 12, fontWeight: "700", color: "#475569" },
  waypointNumberReached: { color: "#ffffff" },
  waypointText: { flex: 1, fontSize: 13, color: "#334155" },
  reachedText: { fontSize: 12, fontWeight: "700", color: "#166534" },
  pendingText: { fontSize: 12, color: "#94a3b8" },
  feedback: { backgroundColor: "#fffbeb", borderRadius: 12, padding: 12, gap: 4, marginTop: 6 },
  feedbackTitle: { fontSize: 13, fontWeight: "700", color: "#92400e" },
  feedbackText: { fontSize: 13, color: "#78350f", lineHeight: 19 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
  },
  historyName: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  historyCoverage: { fontSize: 15, fontWeight: "700", color: "#0F766E" },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 14,
    gap: 10,
  },
  errorText: { color: "#991b1b", fontSize: 14 },
});
