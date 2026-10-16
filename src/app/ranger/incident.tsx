import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowUpRight, ChevronRight, ClipboardCheck, FileWarning, ShieldCheck, WifiOff } from "lucide-react-native";
import { useAppTheme } from "@/theme/ThemeContext";
import { HeroPanel } from "@/components/premium/HeroPanel";
import { Reveal, SpringPressable } from "@/components/premium/Motion";
import { SectionHeading } from "@/components/premium/SectionHeading";

/** Presentation-only update: original incident report / history route targets remain unchanged. */
export default function IncidentDashboard() {
  const { colors, dark } = useAppTheme();
  const choices = [
    { title: "Report an incident", description: "Capture sightings, evidence and GPS location", icon: FileWarning,
      route: "/ranger/incident-report" as const, note: "NEW REPORT" },
    { title: "My incident reports", description: "Review submissions, statuses and pending sync", icon: ClipboardCheck,
      route: "/ranger/my-incidents" as const, note: "REPORT HISTORY" },
  ];
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 23, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
      <HeroPanel compact eyebrow="FIELD INTELLIGENCE" title="Incident reporting"
        description="Document what matters. Every field observation helps protect wildlife and people."
        footer={<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ShieldCheck size={15} color="#EAC482" />
          <Text style={{ color: "#E5D5AE", fontSize: 11, fontWeight: "700" }}>Secure conservation field records</Text>
        </View>} />
      <Reveal delay={90} style={{ marginTop: 29, marginBottom: 15 }}>
        <SectionHeading title="Reporting tools" caption="Choose what you want to do" />
      </Reveal>
      <View style={{ gap: 12 }}>
        {choices.map((item, index) => {
          const Icon = item.icon;
          return <Reveal key={item.route} delay={155 + index * 85}>
            <SpringPressable onPress={() => router.push(item.route)} accessibilityRole="button" accessibilityLabel={item.title}
              style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                borderWidth: 1, borderColor: colors.border, padding: 18, borderRadius: 23,
                shadowColor: colors.shadow, shadowOpacity: dark ? 0 : .055,
                shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, elevation: dark ? 0 : 2 })}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: colors.softGreen,
                  alignItems: "center", justifyContent: "center" }}><Icon size={23} color={colors.primary} strokeWidth={1.9} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.6 }}>{item.note}</Text>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900", marginTop: 4 }}>{item.title}</Text>
                </View>
                <View style={{ height: 32, width: 32, borderRadius: 12, backgroundColor: colors.surfaceAlt,
                  alignItems: "center", justifyContent: "center" }}><ChevronRight size={19} color={colors.primary} /></View>
              </View>
              <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 14 }}>{item.description}</Text>
            </SpringPressable>
          </Reveal>;
        })}
      </View>
      <Reveal delay={270} style={{ marginTop: 20 }}>
        <View style={{ borderRadius: 22, backgroundColor: colors.softGreen, borderWidth: 1, borderColor: colors.border, padding: 17 }}>
          <View style={{ flexDirection: "row", gap: 11, alignItems: "center" }}>
            <View style={{ width: 39, height: 39, borderRadius: 13, backgroundColor: colors.surface,
              alignItems: "center", justifyContent: "center" }}><WifiOff size={18} color={colors.primary} /></View>
            <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: "800", fontSize: 13 }}>Designed for field conditions</Text>
              <Text style={{ color: colors.muted, fontSize: 11.5, marginTop: 4, lineHeight: 17 }}>You can capture incidents offline and sync them when a connection returns.</Text></View>
            <ArrowUpRight color={colors.primary} size={17} />
          </View>
        </View>
      </Reveal>
    </ScrollView>
  );
}
