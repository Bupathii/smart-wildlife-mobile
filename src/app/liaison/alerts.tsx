import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { AlertTriangle, BellRing, MapPin, RadioTower, RefreshCw, ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/theme/ThemeContext";
import { getRangerAlerts, type RangerAlert } from "@/services/tracking.service";

export default function LiaisonAlerts() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const [alerts, setAlerts] = useState<RangerAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (refresh = false) => {
    if (!token) { setLoading(false); return; }
    if (refresh) setRefreshing(true);
    try { setError(""); setAlerts(await getRangerAlerts(token)); }
    catch (err) { setError(err instanceof Error ? err.message : "Alerts are unavailable right now."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const active = alerts.filter(a => !["RESOLVED", "ESCALATED"].includes(a.status.toUpperCase()));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}>
      <View style={{ borderRadius: 25, backgroundColor: colors.hero, padding: 23, flexDirection: "row", alignItems: "center", gap: 15 }}>
        <View style={{ width: 51, height: 51, alignItems: "center", justifyContent: "center", backgroundColor: "#27594B", borderRadius: 17 }}>
          <BellRing color="#EEC989" size={25} /></View>
        <View style={{ flex: 1 }}><Text style={{ color: "#FFFFFF", fontSize: 21, fontWeight: "900" }}>Wildlife risk alerts</Text>
          <Text style={{ color: "#C2DBCC", fontSize: 12, lineHeight: 18, marginTop: 5 }}>Monitor animal movement near communities</Text></View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 23, marginBottom: 14 }}>
        <View><Text style={{ color: colors.text, fontSize: 19, fontWeight: "800" }}>Active warnings</Text>
          <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>Live tracking alerts for your team</Text></View>
        <Pressable onPress={() => void load(true)} style={{ padding: 10, borderRadius: 12, backgroundColor: colors.surface }}>
          <RefreshCw size={20} color={colors.primary} /></Pressable>
      </View>
      {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} /> :
        error ? <Text style={{ color: colors.danger, marginTop: 15 }}>{error}</Text> : active.length === 0 ?
        <View style={{ borderRadius: 20, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, padding: 25, alignItems: "center" }}>
          <ShieldCheck size={34} color={colors.primary} /><Text style={{ color: colors.text, fontWeight: "800", marginTop: 12 }}>No active warnings</Text>
          <Text style={{ color: colors.muted, textAlign: "center", fontSize: 12, lineHeight: 19, marginTop: 7 }}>New alerts will appear here when tracking devices report a risk event.</Text>
        </View> : <View style={{ gap: 12 }}>{active.map(a => (
          <View key={a.alertId} style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, padding: 18, borderRadius: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}><AlertTriangle size={19} color={colors.danger} />
              <Text style={{ color: colors.danger, fontSize: 11, fontWeight: "900", letterSpacing: 1 }}>{a.priority} PRIORITY</Text></View>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800", marginTop: 11 }}>{a.animalName || a.animalId}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 9 }}><MapPin size={15} color={colors.primary} />
              <Text style={{ color: colors.muted, fontSize: 13 }}>{a.zone}</Text></View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8 }}><RadioTower size={15} color={colors.primary} />
              <Text style={{ color: colors.muted, fontSize: 12 }}>{a.status.replaceAll("_", " ")}</Text></View>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 9 }}>Location: {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}</Text>
          </View>
        ))}</View>}
      <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center", lineHeight: 17, marginTop: 24 }}>
        Alert management actions are performed by authorized ranger personnel. This view provides liaison awareness.
      </Text>
    </ScrollView>
  );
}
