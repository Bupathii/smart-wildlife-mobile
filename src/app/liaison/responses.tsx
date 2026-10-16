import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { CheckCircle2, ChevronRight, ClipboardList, RefreshCw, ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/theme/ThemeContext";
import { getStaffConflictReports } from "@/services/conflict.service";
import type { ConflictReport } from "@/types/conflict";

export default function LiaisonResponses() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const [reports, setReports] = useState<ConflictReport[]>([]);
  const [selected, setSelected] = useState<"active" | "resolved">("active");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (refresh = false) => {
    if (!token) { setLoading(false); return; }
    if (refresh) setRefreshing(true);
    try { setError(""); const result = await getStaffConflictReports(token); setReports(result.reports); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load responses."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const filtered = useMemo(() => reports.filter(r => selected === "active" ?
    (r.status === "RESPONDING" || r.status === "UNDER_REVIEW") : r.status === "RESOLVED"), [reports, selected]);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 55 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}>
      <View style={{ backgroundColor: colors.hero, borderRadius: 25, padding: 24 }}>
        <ShieldCheck size={33} color="#EEC989" />
        <Text style={{ color: "#FFFFFF", fontSize: 23, fontWeight: "900", marginTop: 16 }}>Response activities</Text>
        <Text style={{ color: "#B4D3C6", fontSize: 12, marginTop: 7, lineHeight: 19 }}>Track cases where field teams are reviewing, responding or have resolved a conflict.</Text>
      </View>
      <View style={{ flexDirection: "row", marginTop: 22, gap: 10, marginBottom: 17 }}>
        {(["active", "resolved"] as const).map(mode => <Pressable key={mode} onPress={() => setSelected(mode)}
          style={{ flex: 1, borderRadius: 14, padding: 13, alignItems: "center", backgroundColor: selected === mode ? colors.primaryStrong : colors.surface,
            borderWidth: 1, borderColor: selected === mode ? colors.primary : colors.border }}>
          <Text style={{ color: selected === mode ? "#FFFFFF" : colors.text, fontSize: 13, fontWeight: "800" }}>{mode === "active" ? "Active responses" : "Resolved cases"}</Text>
        </Pressable>)}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>{selected === "active" ? "Ongoing cases" : "Completed cases"}</Text>
        <Pressable onPress={() => void load(true)} style={{ padding: 10, borderRadius: 12, backgroundColor: colors.surface }}><RefreshCw size={19} color={colors.primary} /></Pressable>
      </View>
      {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 35 }} /> :
        error ? <Text style={{ color: colors.danger }}>{error}</Text> : filtered.length === 0 ?
        <View style={{ alignItems: "center", padding: 30, borderRadius: 20, borderWidth: 1, backgroundColor: colors.surface, borderColor: colors.border }}>
          <ClipboardList size={34} color={colors.primary} />
          <Text style={{ color: colors.text, fontWeight: "800", marginTop: 11 }}>No {selected} cases in the latest reports</Text>
          <Text style={{ color: colors.muted, textAlign: "center", fontSize: 12, marginTop: 7 }}>Cases appear here as they are reviewed and updated.</Text>
        </View> : <View style={{ gap: 10 }}>{filtered.map(r => <Pressable key={r._id}
          onPress={() => router.push({ pathname: "/liaison/conflicts/[id]", params: { id: r._id } })}
          style={({ pressed }) => ({ flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
            borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 15 })}>
          {selected === "resolved" ? <CheckCircle2 size={22} color={colors.primary} /> : <ClipboardList size={22} color={colors.primary} />}
          <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: "800", fontSize: 13 }}>{r.conflictType.replaceAll("_", " ")}</Text>
            <Text style={{ color: colors.muted, marginTop: 5, fontSize: 11 }}>{r.status.replaceAll("_", " ")} · {r.urgencyLevel} priority</Text></View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>)}</View>}
      <Text style={{ color: colors.muted, textAlign: "center", fontSize: 11, marginTop: 22 }}>Showing matching cases within the latest 50 reports. Open a case to review or update it.</Text>
    </ScrollView>
  );
}
