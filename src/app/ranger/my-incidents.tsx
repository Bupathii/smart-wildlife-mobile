import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getAllIncidents, type IncidentRecord } from "@/services/incident.storage";
import { synchronizeData } from "@/services/incident.sync";

export default function MyIncidentsScreen() {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    setLoading(true);
    const all = await getAllIncidents();
    setIncidents(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setLoading(false);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleSync() {
    if (!token) return;
    setSyncing(true);
    await synchronizeData(token);
    await load();
    setSyncing(false);
  }

  const pendingCount = incidents.filter((i) => i.syncStatus === "PENDING_SYNC").length;

  function renderItem({ item }: { item: IncidentRecord }) {
    const synced = item.syncStatus === "SYNCHRONIZED";
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardType}>{item.incidentType.replace(/_/g, " ")}</Text>
          <View style={[styles.badge, synced ? styles.badgeSynced : styles.badgePending]}>
            <Text style={styles.badgeText}>{synced ? "● Synchronized" : "● Pending"}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.cardMeta}>
          {item.severity && `${item.severity} · `}
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pendingCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={handleSync} disabled={syncing}>
          {syncing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.syncBannerText}>⟳ Sync {pendingCount} pending report{pendingCount > 1 ? "s" : ""}</Text>
          )}
        </TouchableOpacity>
      )}
      <FlatList
        data={incidents}
        keyExtractor={(item) => item.clientIncidentId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#0F766E" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No incident reports yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7f5" },
  syncBanner: {
    backgroundColor: "#0F766E", paddingVertical: 10,
    alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
  },
  syncBannerText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardType: { fontSize: 14, fontWeight: "700", color: "#111827", textTransform: "capitalize", flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeSynced: { backgroundColor: "#D1FAE5" },
  badgePending: { backgroundColor: "#FEF3C7" },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#111827" },
  cardDesc: { fontSize: 13, color: "#6B7280", lineHeight: 18, marginBottom: 6 },
  cardMeta: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { fontSize: 15, color: "#94A3B8" },
});
