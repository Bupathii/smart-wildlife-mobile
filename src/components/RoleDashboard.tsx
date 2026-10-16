import { useCallback, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, Text, View, ActivityIndicator } from "react-native";
import { HeroPanel } from "@/components/premium/HeroPanel";
import { Reveal, SpringPressable } from "@/components/premium/Motion";
import { SectionHeading } from "@/components/premium/SectionHeading";
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

function MetricCard({ item, index }: { item: Metric; index: number }) {
  const { colors, dark } = useAppTheme();
  const Icon = item.icon;
  return (
    <Reveal delay={60 + index * 75} style={{ width: "47%", flexGrow: 1 }}>
      <View style={{ borderRadius: 22, padding: 16, minHeight: 156, backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.border, shadowColor: colors.shadow,
        shadowOpacity: dark ? 0 : .055, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: dark ? 0 : 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ width: 39, height: 39, borderRadius: 14, backgroundColor: colors.softGreen,
            alignItems: "center", justifyContent: "center" }}><Icon color={colors.primary} size={20} strokeWidth={2} /></View>
          <View style={{ height: 5, width: 20, borderRadius: 3, backgroundColor: colors.accent, opacity: .7 }} />
        </View>
        <Text numberOfLines={1} style={{ fontSize: 30, marginTop: 12, fontWeight: "900", color: colors.text, letterSpacing: -1.1 }}>{item.value}</Text>
        <Text numberOfLines={2} style={{ color: colors.text, fontSize: 12.5, lineHeight: 17, fontWeight: "800", marginTop: 4 }}>{item.label}</Text>
        <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 10.5, marginTop: 5 }}>{item.detail}</Text>
      </View>
    </Reveal>
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
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 56 }}>
        <Reveal style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 23 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 }}>
            <View style={{ width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center",
              backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}>
              <Image source={require("../../assets/brand/wildsentinel-mark.png")} resizeMode="contain" style={{ width: 41, height: 41 }} />
            </View>
            <View><Text style={{ fontSize: 21, fontWeight: "900", letterSpacing: -1.1, color: colors.text }}>Wild<Text style={{ color: colors.accent }}>Sentinel</Text></Text>
              <Text style={{ color: colors.muted, fontSize: 9, letterSpacing: 1.75, fontWeight: "800", marginTop: 2 }}>CONSERVATION INTELLIGENCE</Text></View>
          </View>
          <ThemeToggle compact />
        </Reveal>
        <HeroPanel eyebrow={config.eyebrow} title={config.heading} description={config.description}
          footer={<View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <View style={{ width: 7, height: 7, borderRadius: 5, backgroundColor: "#5CD6A9" }} />
            <Text numberOfLines={1} style={{ color: "#EBD4A6", fontWeight: "800", fontSize: 12, flex: 1 }}>Welcome, {user?.name || "Wildlife protector"}</Text>
          </View>} />
        <Reveal delay={110} style={{ marginTop: 29, marginBottom: 16 }}>
          <SectionHeading title="At a glance" caption="Your current conservation activity"
            aside={<SpringPressable onPress={() => void load(true)} accessibilityLabel="Refresh dashboard"
              style={{ padding: 11, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
              <RefreshCw size={18} color={colors.primary} /></SpringPressable>} />
        </Reveal>
        {busy ? <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} /> :
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {metrics.map((metric, index) => <MetricCard key={metric.label} item={metric} index={index} />)}
          </View>}
        {!!loadNote && <View style={{ borderRadius: 13, borderWidth: 1, borderColor: colors.border, padding: 12,
          backgroundColor: colors.surfaceAlt, marginTop: 12 }}><Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>{loadNote}</Text></View>}
        <Reveal delay={160} style={{ marginTop: 32, marginBottom: 15 }}>
          <SectionHeading title="Your workspace" caption="Every tool, one secure place" />
        </Reveal>
        <View style={{ gap: 11 }}>
          {config.actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Reveal key={action.title} delay={Math.min(85 + index * 55, 360)}>
                <SpringPressable onPress={() => navigate(action.href)} accessibilityRole="button" accessibilityLabel={action.title}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                    borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 16,
                    shadowColor: colors.shadow, shadowOpacity: dark ? 0 : .035,
                    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: dark ? 0 : 1 })}>
                  <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: index === 0 ? colors.softGreen : colors.surfaceAlt,
                    justifyContent: "center", alignItems: "center" }}><Icon size={22} color={colors.primary} strokeWidth={1.9} /></View>
                  <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 14.5, fontWeight: "800", letterSpacing: -.25 }}>{action.title}</Text>
                    <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 11.5, marginTop: 5 }}>{action.description}</Text></View>
                  <View style={{ width: 28, height: 28, borderRadius: 11, alignItems: "center", justifyContent: "center",
                    backgroundColor: colors.surfaceAlt }}><ChevronRight size={17} color={colors.primary} /></View>
                </SpringPressable>
              </Reveal>
            );
          })}
        </View>
        <Reveal delay={260} style={{ marginTop: 24 }}>
          <View style={{ backgroundColor: colors.softGreen, borderRadius: 23, padding: 19, flexDirection: "row", gap: 13, alignItems: "flex-start",
            borderWidth: 1, borderColor: colors.border }}>
            <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface,
              alignItems: "center", justifyContent: "center" }}><Sprout size={20} color={colors.primary} /></View>
            <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 13, fontWeight: "900" }}>{config.tagline}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 7 }}>{summary || "Reliable field reporting for safer wildlife and communities."}</Text></View>
          </View>
        </Reveal>
        <Text style={{ color: colors.muted, opacity: .75, textAlign: "center", fontSize: 10, marginTop: 26, letterSpacing: 1.2 }}>WILDSENTINEL  •  CONSERVE WITH CONFIDENCE</Text>
      </ScrollView>
    </View>
  );
}
