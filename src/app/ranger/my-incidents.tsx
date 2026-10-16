import { useThemedStyles } from "@/theme/useThemedStyles";
import { Reveal } from "@/components/premium/Motion";
import { SectionHeading } from "@/components/premium/SectionHeading";
import { FileText, ShieldCheck } from "lucide-react-native";
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
import { RefreshCw, Trash2 } from "lucide-react-native";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "@/context/AuthContext";
import {
  getAllIncidents,
  updateIncidentStatus,
  deleteIncident,
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

function ReportCard({
  report,
  onDelete,
}: {
  report: PendingIncidentReport;
  onDelete: (id: string) => void;
}) {
  const themedStyles = useThemedStyles(styles);
  const ss = statusStyle(report.syncStatus);
  const dateStr = report.createdAt
    ? new Date(report.createdAt).toISOString().slice(0, 10)
    : "";

  function handleDeletePress() {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to permanently delete this incident report? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(report.clientIncidentId),
        },
      ],
    );
  }

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

        {/* Status badge + delete button stacked on the right */}
        <View style={themedStyles.cardRight}>
          <View style={[themedStyles.badge, ss.badge]}>
            <View style={[themedStyles.dot, ss.dot]} />
            <Text style={[themedStyles.badgeText, ss.text]}>
              {report.syncStatus === "Synchronized" ? "Synchronized" : "Pending"}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [themedStyles.deleteBtn, pressed && { opacity: 0.65 }]}
            onPress={handleDeletePress}
            hitSlop={8}
            accessibilityLabel="Delete report"
            accessibilityRole="button"
          >
            <Trash2 size={16} color="#e11d48" strokeWidth={2} />
          </Pressable>
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

  const handleDelete = useCallback(
    async (clientIncidentId: string) => {
      try {
        await deleteIncident(clientIncidentId);
        // Refresh the list immediately after deletion
        await loadReports();
      } catch {
        Alert.alert("Error", "Could not delete the report. Please try again.");
      }
    },
    [loadReports],
  );

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

      <ScrollView
        contentContainerStyle={themedStyles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0F766E" />
        }
      >
        <Reveal style={{ marginBottom: 9 }}>
          <View style={{ backgroundColor: "#103D33", borderRadius: 23, paddingHorizontal: 21, paddingVertical: 22 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <ShieldCheck size={16} color="#E8BE79" />
              <Text style={{ color: "#E8BE79", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 }}>YOUR FIELD RECORDS</Text>
            </View>
            <Text style={{ fontSize: 23, fontWeight: "900", color: "#FFFFFF", letterSpacing: -.5 }}>Incident history</Text>
            <Text style={{ color: "#BFDACD", fontSize: 12, marginTop: 7, lineHeight: 18 }}>Review reports saved on this device and synchronize them when connected.</Text>
          </View>
        </Reveal>
        <View style={{ marginTop: 11, marginBottom: 5 }}><SectionHeading title="Your reports" caption={`${reports.length} stored ${reports.length === 1 ? "report" : "reports"}`} /></View>

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
            <ReportCard
              key={r.clientIncidentId}
              report={r}
              onDelete={handleDelete}
            />
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

  /* Right-hand column: badge stacked above delete button */
  cardRight: {
    alignItems: "flex-end",
    gap: 10,
    flexShrink: 0,
  },

  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fff1f2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
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
