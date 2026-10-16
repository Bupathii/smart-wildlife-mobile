import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { LogOut, Mail, ShieldCheck, UserRound, Settings2 } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/theme/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const roleNames: Record<string, string> = {
  RANGER: "Wildlife Ranger", COMMUNITY_MEMBER: "Community Member",
  COMMUNITY_LIAISON_OFFICER: "Community Liaison Officer",
};
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out of WildSentinel?", [
      { text: "Stay signed in", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => { void logout(); router.replace("/login"); } },
    ]);
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 21, paddingBottom: 55 }}>
      <View style={{ backgroundColor: colors.hero, borderRadius: 25, alignItems: "center", padding: 25, marginBottom: 24 }}>
        <Image source={require("../../assets/brand/wildsentinel-mark.png")} style={{ width: 83, height: 83 }} resizeMode="contain" />
        <Text style={{ fontSize: 17, color: "#FFFFFF", fontWeight: "900", marginTop: 5 }}>Wild<Text style={{ color: "#E4BB73" }}>Sentinel</Text></Text>
        <View style={{ width: 62, height: 62, borderRadius: 21, backgroundColor: "#2C765C",
          marginTop: 20, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#FFFFFF", fontSize: 27, fontWeight: "900" }}>{user?.name?.[0]?.toUpperCase() || "U"}</Text>
        </View>
        <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginTop: 12 }}>{user?.name || "User"}</Text>
        <Text style={{ color: "#BED8C9", fontSize: 12, marginTop: 5 }}>{roleNames[user?.role || ""] || "Conservation Team"}</Text>
      </View>
      <Text style={{ fontSize: 18, color: colors.text, fontWeight: "800", marginBottom: 12 }}>Account details</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}><Mail size={19} color={colors.primary} />
          <View style={{ flex: 1 }}><Text style={{ fontSize: 11, color: colors.muted }}>Email address</Text>
            <Text style={{ marginTop: 5, color: colors.text, fontSize: 14, fontWeight: "700" }}>{user?.email || "—"}</Text></View></View>
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}><ShieldCheck size={19} color={colors.primary} />
          <View style={{ flex: 1 }}><Text style={{ fontSize: 11, color: colors.muted }}>Account role</Text>
            <Text style={{ marginTop: 5, color: colors.text, fontSize: 14, fontWeight: "700" }}>{roleNames[user?.role || ""] || "—"}</Text></View></View>
      </View>
      <Text style={{ color: colors.text, fontWeight: "800", fontSize: 18, marginTop: 27, marginBottom: 12 }}>Preferences</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 11, alignItems: "center", flex: 1 }}><Settings2 color={colors.primary} size={20} />
          <View><Text style={{ color: colors.text, fontWeight: "700" }}>App appearance</Text><Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>Switch themes instantly</Text></View></View>
        <ThemeToggle compact />
      </View>
      <Pressable onPress={handleLogout} style={{ borderRadius: 17, borderWidth: 1, borderColor: colors.border,
        backgroundColor: colors.surface, height: 54, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", marginTop: 29 }}>
        <LogOut size={19} color={colors.danger} /><Text style={{ fontWeight: "800", color: colors.danger }}>Sign out</Text>
      </Pressable>
      <Text style={{ color: colors.muted, textAlign: "center", fontSize: 11, marginTop: 24 }}>WildSentinel · Smart Wildlife Conservation</Text>
    </ScrollView>
  );
}
