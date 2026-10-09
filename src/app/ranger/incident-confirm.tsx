import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle, ClipboardList, ChevronLeft } from "lucide-react-native";

export default function IncidentConfirmScreen() {
  const { syncStatus, serverId, clientIncidentId } = useLocalSearchParams<{
    syncStatus: string;
    serverId?: string;
    clientIncidentId: string;
  }>();

  const isSynced = syncStatus === "Synchronized";
  const displayId = (serverId || clientIncidentId || "").slice(0, 10);

  return (
    <View style={styles.root}>
      {/* decorative circles */}
      <View style={[styles.circle, styles.circleTopLeft]} />
      <View style={[styles.circle, styles.circleBottomRight]} />

      {/* card */}
      <View style={styles.card}>
        {/* checkmark icon */}
        <View style={styles.iconWrap}>
          <CheckCircle size={52} color="#16A34A" strokeWidth={1.8} />
        </View>

        <Text style={styles.title}>Report Submitted</Text>
        <Text style={styles.subtitle}>
          {isSynced
            ? "Your incident report has been successfully synchronized with the central database."
            : "Your report has been saved locally and will sync when connected."}
        </Text>

        {/* status badge */}
        <View style={[styles.badge, isSynced ? styles.badgeSynced : styles.badgePending]}>
          <View style={[styles.dot, isSynced ? styles.dotSynced : styles.dotPending]} />
          <Text style={[styles.badgeText, isSynced ? styles.badgeTextSynced : styles.badgeTextPending]}>
            {isSynced ? "Synchronized" : "Pending"}
          </Text>
        </View>

        {/* ID */}
        {displayId ? (
          <Text style={styles.idText}>ID: {displayId}...</Text>
        ) : null}

        {/* actions */}
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push("/ranger/my-incidents")}
        >
          <ClipboardList size={18} color="#fff" strokeWidth={2} />
          <Text style={styles.primaryBtnText}>My Reports</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.replace("/ranger/incident")}
        >
          <ChevronLeft size={18} color="#0F766E" strokeWidth={2} />
          <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
}

const BG = "#EEF7EE";
const PRIMARY = "#0F766E";
const CIRCLE_COLOR = "rgba(15,118,110,0.08)";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: CIRCLE_COLOR,
  },
  circleTopLeft: { width: 240, height: 240, top: -80, left: -80 },
  circleBottomRight: { width: 300, height: 300, bottom: -100, right: -100 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    gap: 12,
  },

  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#14532d",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 21,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "center",
  },
  badgeSynced: { backgroundColor: "#dcfce7" },
  badgePending: { backgroundColor: "#fef3c7" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotSynced: { backgroundColor: "#16A34A" },
  dotPending: { backgroundColor: "#D97706" },
  badgeText: { fontSize: 14, fontWeight: "700" },
  badgeTextSynced: { color: "#166534" },
  badgeTextPending: { color: "#92400e" },

  idText: {
    fontSize: 12,
    color: "#94a3b8",
    alignSelf: "flex-start",
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#166534",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 24,
    width: "100%",
    borderWidth: 1.5,
    borderColor: PRIMARY,
    backgroundColor: "#fff",
  },
  secondaryBtnText: { color: PRIMARY, fontSize: 15, fontWeight: "600" },
});
