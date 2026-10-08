import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function IncidentConfirmScreen() {
  const { syncStatus, incidentType } = useLocalSearchParams<{
    syncStatus: string;
    incidentType: string;
  }>();

  const synchronized = syncStatus === "SYNCHRONIZED";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>{synchronized ? "✅" : "⏳"}</Text>
        <Text style={styles.title}>
          {synchronized ? "Report Submitted" : "Report Saved Offline"}
        </Text>
        <Text style={styles.type}>{incidentType?.replace(/_/g, " ")}</Text>

        <View style={[styles.badge, synchronized ? styles.badgeSynced : styles.badgePending]}>
          <Text style={styles.badgeText}>
            {synchronized ? "● Synchronized" : "● Pending Sync"}
          </Text>
        </View>

        <Text style={styles.message}>
          {synchronized
            ? "Your incident report has been submitted to the central system."
            : "No internet connection. Report saved locally and will sync automatically when you're back online."}
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace("/ranger/incident")}
        >
          <Text style={styles.primaryBtnText}>Report Another</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/ranger/my-incidents")}
        >
          <Text style={styles.secondaryBtnText}>View My Reports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7f5", justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 28,
    alignItems: "center", shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 12, elevation: 3,
  },
  icon: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  type: { fontSize: 14, color: "#64748B", marginBottom: 16, textTransform: "capitalize" },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  badgeSynced: { backgroundColor: "#D1FAE5" },
  badgePending: { backgroundColor: "#FEF3C7" },
  badgeText: { fontWeight: "600", fontSize: 13, color: "#111827" },
  message: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  primaryBtn: {
    width: "100%", backgroundColor: "#0F766E", borderRadius: 10,
    paddingVertical: 13, alignItems: "center", marginBottom: 10,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    width: "100%", borderWidth: 1.5, borderColor: "#0F766E",
    borderRadius: 10, paddingVertical: 13, alignItems: "center",
  },
  secondaryBtnText: { color: "#0F766E", fontWeight: "700", fontSize: 15 },
});
