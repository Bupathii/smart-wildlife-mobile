import { useCallback, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { ArrowUpRight, BellRing, ChevronRight, ClipboardCheck, CloudOff, Compass,
  FilePlus2, FileText, LocateFixed, Map, RadioTower, RefreshCw, ShieldCheck, ShieldAlert, Sprout,
  UsersRound, type LucideIcon } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/theme/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getMyPatrol } from "@/services/patrol.service";
import { getRangerAlerts } from "@/services/tracking.service";
import { getAllIncidents } from "@/services/incident.storage";
import { getStaffConflictReports, getMyConflictReports } from "@/services/conflict.service";
import { getPendingConflictReports } from "@/services/pendingConflict.service";

type Role = "ranger" | "community" | "liaison";
type LinkAction = { title: string; description: string; href: string; icon: LucideIcon };
type Metric = { label: string; value: string; detail: string; icon: LucideIcon };
const configs: Record<Role, { eyebrow: string; heading: string; tagline: string; description: string; actions: LinkAction[] }> = {
  ranger: {
    eyebrow: "FIELD OPERATIONS", heading: "Protect every trail.",
    tagline: "Ranger command centre", description: "Monitor your assigned patrol, wildlife movement and field incidents in one place.",
    actions: [
      { title: "My Patrol", description: "Routes & live field progress", href: "/ranger/patrol", icon: Map },
      { title: "Wildlife Tracking", description: "Animal collars & locations", href: "/ranger/tracking", icon: LocateFixed },
      { title: "Report Incident", description: "Capture evidence offline", href: "/ranger/incident-report", icon: FilePlus2 },
      { title: "Risk Alerts", description: "Review active warnings", href: "/ranger/alerts", icon: BellRing },
      { title: "Community Conflicts", description: "Review public reports", href: "/ranger/conflicts", icon: UsersRound },
      { title: "My Incident Reports", description: "Sync & check submission status", href: "/ranger/my-incidents", icon: ClipboardCheck },
    ],
  },
  community: {
    eyebrow: "COMMUNITY SAFETY", heading: "Every report matters.",
    tagline: "Community hub", description: "Share wildlife sightings, report conflicts and stay informed about your reports.",
    actions: [
      { title: "Report a Conflict", description: "Wildlife sightings & crop damage", href: "/community/report", icon: FilePlus2 },
      { title: "My Reports", description: "View reports & response updates", href: "/community/reports", icon: ClipboardCheck },
      { title: "My Profile", description: "Account and appearance", href: "/community/profile", icon: UsersRound },
    ],
  },
  liaison: {
    eyebrow: "RESPONSE COORDINATION", heading: "Act before impact.",
    tagline: "Liaison operations", description: "Review community incidents, prioritize urgent cases and coordinate responses.",
    actions: [
      { title: "Conflict Reports", description: "Review & update incoming reports", href: "/liaison/conflicts", icon: FileText },
      { title: "Responses", description: "See active & resolved cases", href: "/liaison/responses", icon: ShieldCheck },
      { title: "Wildlife Alerts", description: "Risk monitoring overview", href: "/liaison/alerts", icon: BellRing },
      { title: "My Profile", description: "Account and appearance", href: "/liaison/profile", icon: UsersRound },
    ],
  },
};

function MetricCard({ item }: { item: Metric }) {
  const { colors } = useAppTheme();
  const Icon = item.icon;
  return (
    <View style={{ flexBasis: "47%", flexGrow: 1, padding: 16, borderRadius: 20, backgroundColor: colors.surface,
      borderColor: colors.border, borderWidth: 1, minHeight: 143 }}>
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.softGreen,
        justifyContent: "center", alignItems: "center" }}><Icon size={18} color={colors.primary} /></View>
      <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 11 }}>{item.value}</Text>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700", marginTop: 2 }}>{item.label}</Text>
      <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{item.detail}</Text>
    </View>
  );
}

export default function RoleDashboard({ role }: { role: Role }) {
  const { user, token } = useAuth();
  const { dark, colors } = useAppTheme();
  const config = configs[role];
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadNote, setLoadNote] = useState("");
  const [summary, setSummary] = useState("");

  const load = useCallback(async (manual = false) => {
    if (!token) { setBusy(false); return; }
    if (manual) setRefreshing(true);
    setLoadNote("");
    try {
      if (role === "ranger") {
        const results = await Promise.allSettled([getMyPatrol(token), getRangerAlerts(token), getAllIncidents()]);
        const patrol = results[0].status === "fulfilled" ? results[0].value : null;
        const alerts = results[1].status === "fulfilled" ? results[1].value : null;
        const incidents = results[2].status === "fulfilled" ? results[2].value : null;
        setMetrics([
          { icon: Compass, label: "Patrol progress", value: patrol?.patrol ? `${Math.round(patrol.patrol.progressPercentage)}%` : patrol ? "—" : "—", detail: patrol?.patrol?.route?.name || "No current patrol" },
          { icon: BellRing, label: "Active risk alerts", value: alerts ? String(alerts.filter(a => !["RESOLVED", "ESCALATED"].includes(a.status.toUpperCase())).length) : "—", detail: "Tracking notifications" },
          { icon: ClipboardCheck, label: "Saved incidents", value: incidents ? String(incidents.length) : "—", detail: "On this device" },
          { icon: CloudOff, label: "Awaiting sync", value: incidents ? String(incidents.filter(i => i.syncStatus !== "Synchronized").length) : "—", detail: "Locally stored reports" },
        ]);
        setSummary(patrol?.patrol ? `Assigned: ${patrol.patrol.route.name} · ${patrol.patrol.status.toLowerCase().replaceAll("_", " ")}` : "Your next patrol assignment will appear here when available.");
        if (results.slice(0, 2).some(x => x.status === "rejected")) setLoadNote("Some live information is unavailable. Pull down to retry.");
      } else if (role === "community") {
        const results = await Promise.allSettled([getMyConflictReports(token), getPendingConflictReports()]);
        const reports = results[0].status === "fulfilled" ? results[0].value.reports : null;
        const offline = results[1].status === "fulfilled" ? results[1].value : null;
        setMetrics([
          { icon: FileText, label: "Reports submitted", value: reports ? String(reports.length) : "—", detail: "Saved on the server" },
          { icon: RadioTower, label: "In progress", value: reports ? String(reports.filter(r => r.status !== "RESOLVED").length) : "—", detail: "Not yet resolved" },
          { icon: ShieldCheck, label: "Resolved", value: reports ? String(reports.filter(r => r.status === "RESOLVED").length) : "—", detail: "Completed responses" },
          { icon: CloudOff, label: "Offline drafts", value: offline ? String(offline.length) : "—", detail: "Waiting for sync" },
        ]);
        setSummary("Your reports help field teams act faster and protect communities near wildlife habitats.");
        if (results[0].status === "rejected") setLoadNote("Live report totals are unavailable. Pull down to retry.");
      } else {
        const reports = await getStaffConflictReports(token);
        const items = reports.reports;
        setMetrics([
          { icon: FileText, label: "Total reports", value: String(reports.pagination?.totalReports ?? items.length), detail: "All registered cases" },
          { icon: ShieldAlert, label: "High priority", value: String(items.filter(r => ["HIGH", "CRITICAL"].includes(r.urgencyLevel) && r.status !== "RESOLVED").length), detail: "In latest 50 reports" },
          { icon: RadioTower, label: "Responding", value: String(items.filter(r => r.status === "RESPONDING").length), detail: "In latest 50 reports" },
          { icon: ShieldCheck, label: "Resolved", value: String(items.filter(r => r.status === "RESOLVED").length), detail: "In latest 50 reports" },
        ]);
        setSummary("Review new community conflict reports and update each case from the Conflicts screen.");
      }
    } catch {
      setLoadNote("Unable to reach the server. Check the connection and pull down to retry.");
      setMetrics([]);
    } finally { setBusy(false); setRefreshing(false); }
  }, [role, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const navigate = (href: string) => router.push(href as Href);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 19, paddingTop: 20, paddingBottom: 44 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 17 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image source={require("../../assets/brand/wildsentinel-mark.png")} style={{ width: 37, height: 38 }} resizeMode="contain" />
            <View><Text style={{ fontSize: 19, fontWeight: "900", letterSpacing: -0.6, color: colors.text }}>Wild<Text style={{ color: colors.accent }}>Sentinel</Text></Text>
              <Text style={{ color: colors.muted, fontSize: 10, letterSpacing: 2, fontWeight: "700" }}>CONSERVATION NETWORK</Text></View>
          </View>
          <ThemeToggle compact />
        </View>
        <View style={{ backgroundColor: colors.hero, minHeight: 210, padding: 24, borderRadius: 26, overflow: "hidden", position: "relative" }}>
          <Image source={require("../../assets/brand/wildsentinel-mark.png")} resizeMode="contain"
            style={{ position: "absolute", width: 190, height: 200, right: -40, bottom: -35, opacity: 0.25 }} />
          <View style={{ borderRadius: 999, alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12,
            backgroundColor: "rgba(228,187,115,.18)", marginBottom: 17 }}>
            <Text style={{ color: "#EEC989", fontSize: 10, letterSpacing: 1.8, fontWeight: "800" }}>{config.eyebrow}</Text>
          </View>
          <Text style={{ color: "#FFFFFF", fontSize: 27, fontWeight: "900", maxWidth: "80%", letterSpacing: -0.7 }}>{config.heading}</Text>
          <Text style={{ color: "#B4D3C6", fontSize: 13, marginTop: 10, maxWidth: "81%", lineHeight: 20 }}>{config.description}</Text>
          <Text numberOfLines={1} style={{ color: "#EEC989", fontSize: 12, fontWeight: "700", marginTop: 20 }}>Hello, {user?.name || "Wildlife protector"}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 27, marginBottom: 14 }}>
          <View><Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>Live overview</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Actual activity from your connected system</Text></View>
          <Pressable onPress={() => void load(true)} accessibilityLabel="Refresh dashboard" style={{ padding: 10, backgroundColor: colors.surface, borderRadius: 12 }}>
            <RefreshCw size={19} color={colors.primary} /></Pressable>
        </View>
        {busy ? <ActivityIndicator style={{ marginVertical: 35 }} size="large" color={colors.primary} /> : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>{metrics.map(m => <MetricCard item={m} key={m.label} />)}</View>
        )}
        {!!loadNote && <Text style={{ color: colors.accent, fontSize: 12, marginTop: 10 }}>{loadNote}</Text>}
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 29, marginBottom: 13 }}>Quick actions</Text>
        <View style={{ gap: 11 }}>
          {config.actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Pressable key={action.title} onPress={() => navigate(action.href)}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 13,
                  backgroundColor: pressed ? colors.surfaceAlt : colors.surface, borderColor: colors.border,
                  borderWidth: 1, padding: 15, borderRadius: 19 })}>
                <View style={{ width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 15,
                  backgroundColor: index === 0 ? colors.softGreen : colors.surfaceAlt }}>
                  <Icon size={22} color={colors.primary} strokeWidth={2} /></View>
                <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: "800", fontSize: 14 }}>{action.title}</Text>
                  <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{action.description}</Text></View>
                <ChevronRight size={18} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
        <View style={{ backgroundColor: colors.softGreen, borderRadius: 20, padding: 18, marginTop: 24,
          flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
          <Sprout size={22} color={colors.primary} />
          <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>{config.tagline}</Text>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 5 }}>{summary || "Reliable field reporting for safer wildlife and communities."}</Text></View>
          <ArrowUpRight size={17} color={colors.primary} />
        </View>
      </ScrollView>
    </View>
  );
}
