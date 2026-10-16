import { useThemedStyles } from "@/theme/useThemedStyles";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { RefreshCw } from "lucide-react-native";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "@/context/AuthContext";
import {
  getAllIncidents,
  updateIncidentStatus,
} from "@/services/incident.storage";
import { syncPendingIncidents } from "@/services/incident.sync";
import { PendingIncidentReport } from "@/types/incident";

const INCIDENT_LABELS: Record<string, string> = {
  POACHING: "Poaching",
  ILLEGAL_CAMP: "Illegal Camp",
  SNARE: "Snare",
  ANIMAL_CARCASS: "Animal Carcass",
  ANIMAL_FOOTPRINT: "Animal Footprint",
  OTHER: "Other",
};

function statusStyle(status: string) {
  if (status === "Synchronized") {
    return {
      badge: { backgroundColor: "#dcfce7" },
      dot: { backgroundColor: "#16A34A" },
      text: { color: "#166534" },
    };
  }
  return {
    badge: { backgroundColor: "#fef3c7" },
    dot: { backgroundColor: "#D97706" },
    text: { color: "#92400e" },
  };
}

function ReportCard({ report }: { report: PendingIncidentReport }) {
  const themedStyles = useThemedStyles(styles);
  const ss = statusStyle(report.syncStatus);
  const dateStr = report.createdAt
    ? new Date(report.createdAt).toISOString().slice(0, 10)
    : "";

  return (
    <View style={themedStyles.card}>
      <View style={themedStyles.cardTop}>
        <View style={themedStyles.cardLeft}>
          <Text style={themedStyles.cardTitle}>
            {INCIDENT_LABELS[report.incidentType] ?? report.incidentType}
          </Text>
          <Text style={themedStyles.cardDate}>{dateStr}</Text>
          {report.description ? (
            <Text style={themedStyles.cardDesc} numberOfLines={1}>
              {report.description}
            </Text>
          ) : null}
        </View>
        <View style={[themedStyles.badge, ss.badge]}>
          <View style={[themedStyles.dot, ss.dot]} />
          <Text style={[themedStyles.badgeText, ss.text]}>
            {report.syncStatus === "Synchronized" ? "Synchronized" : "Pending"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function MyIncidentsScreen() {
  const themedStyles = useThemedStyles(styles);
  const { token } = useAuth();
  const [reports, setReports] = useState<PendingIncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async () => {
    const all = await getAllIncidents();
    // Auto-migrate any legacy "Failed" status back to "Pending" so user can retry syncing
    for (const r of all) {
      if ((r.syncStatus as string) === "Failed") {
        await updateIncidentStatus(r.clientIncidentId, "Pending");
        r.syncStatus = "Pending";
      }
    }
    setReports(all);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReports().finally(() => setLoading(false));
    }, [loadReports]),
  );

  const handleSync = useCallback(async () => {
    if (!token) {
      Alert.alert("Not logged in", "Please log in to sync reports.");
      return;
    }

    setSyncing(true);
    try {
      const network = await NetInfo.fetch();
      const online =
        network.isConnected === true &&
        network.isInternetReachable !== false;

      if (!online) {
        Alert.alert(
          "No Internet Connection",
          "Pending reports will remain saved on this device until internet access is available."
        );
        return;
      }

      const result = await syncPendingIncidents(token);
      await loadReports();

      if (result.synced > 0 && result.remaining === 0) {
        Alert.alert(
          "Synchronization Complete",
          `${result.synced} report${result.synced === 1 ? "" : "s"} synchronized successfully.`
        );
      } else if (result.synced > 0) {
        Alert.alert(
          "Partially Synchronized",
          `${result.synced} report${result.synced === 1 ? "" : "s"} synchronized. ${result.remaining} report${result.remaining === 1 ? "" : "s"} still pending.`
        );
      } else if (result.remaining > 0) {
        Alert.alert(
          "Sync Incomplete",
          `${result.remaining} report${result.remaining === 1 ? "" : "s"} could not be synced and remain pending. You can try again later.`
        );
      } else {
        Alert.alert("Up to Date", "No pending reports to sync.");
      }
    } catch {
      Alert.alert("Error", "Sync failed. Check connection.");
    } finally {
      setSyncing(false);
    }
  }, [token, loadReports]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }, [loadReports]);

  return (
    <View style={themedStyles.root}>
      <View style={[themedStyles.circle, themedStyles.circleTopLeft]} />
      <View style={[themedStyles.circle, themedStyles.circleBottomRight]} />

      <ScrollView
        contentContainerStyle={themedStyles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0F766E" />
        }
      >
        <Text style={themedStyles.pageTitle}>My Incident Reports</Text>

        {/* Sync button */}
        <Pressable
          style={({ pressed }) => [
            themedStyles.syncBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#0F766E" />
          ) : (
            <RefreshCw size={18} color="#0F766E" strokeWidth={2} />
          )}
          <Text style={themedStyles.syncBtnText}>
            {syncing ? "Syncing..." : "Sync Pending Reports"}
          </Text>
        </Pressable>

        {/* Reports list */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0F766E"
            style={{ marginTop: 40 }}
          />
        ) : reports.length === 0 ? (
          <View style={themedStyles.empty}>
            <Text style={themedStyles.emptyText}>No incident reports yet.</Text>
            <Text style={themedStyles.emptySubtext}>
              Submit your first report from the Report Incident tab.
            </Text>
          </View>
        ) : (
          reports.map((r) => (
            <ReportCard key={r.clientIncidentId} report={r} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const BG = "#EEF7EE";
const PRIMARY = "#0F766E";
const CIRCLE_COLOR = "rgba(15,118,110,0.07)";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: CIRCLE_COLOR,
  },
  circleTopLeft: { width: 200, height: 200, top: -60, left: -60 },
  circleBottomRight: { width: 280, height: 280, bottom: -80, right: -80 },

  scroll: { padding: 18, paddingBottom: 60, gap: 12 },

  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#14532d",
    marginBottom: 4,
  },

  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  syncBtnText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardLeft: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardDate: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexShrink: 0,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  empty: {
    alignItems: "center",
    marginTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
});
