import { useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  Text, TextInput, View } from "react-native";
import { Redirect, router } from "expo-router";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck,
  UsersRound, MapPinned, Leaf } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/theme/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { User } from "@/types/auth";

const DEMO_ACCOUNTS = [
  { label: "Community member", role: "COMMUNITY_MEMBER", email: "community.demo@wildlife.lk", password: "Community@123" },
  { label: "Wildlife ranger", role: "RANGER", email: "ranger.demo@wildlife.lk", password: "Ranger@123" },
  { label: "Liaison officer", role: "COMMUNITY_LIAISON_OFFICER", email: "liaison.demo@wildlife.lk", password: "Liaison@123" },
];

export default function LoginScreen() {
  const { login, user } = useAuth();
  const { colors, dark } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  if (user) return <Redirect href="/" />;

  function navigateByRole(next: User) {
    switch (next.role) {
      case "COMMUNITY_MEMBER": router.replace("/community"); break;
      case "RANGER": router.replace("/ranger"); break;
      case "COMMUNITY_LIAISON_OFFICER": router.replace("/liaison"); break;
      default: router.replace("/web-only");
    }
  }
  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing information", "Please enter your email address and password."); return;
    }
    try { setLoading(true); navigateByRole(await login(email.trim(), password)); }
    catch (error: unknown) { Alert.alert("Sign in failed", error instanceof Error ? error.message : "Unable to sign in."); }
    finally { setLoading(false); }
  }
  async function handleDemoLogin(account: (typeof DEMO_ACCOUNTS)[number]) {
    try {
      setDemoLoading(account.role); setEmail(account.email); setPassword(account.password);
      navigateByRole(await login(account.email, account.password));
    } catch (error: unknown) {
      Alert.alert("Demo login failed", error instanceof Error ? error.message : "Unable to sign in.");
    } finally { setDemoLoading(null); }
  }
  const anyLoading = loading || demoLoading !== null;
  const fieldStyle = { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border,
    borderWidth: 1, borderRadius: 15, height: 54, fontSize: 15, paddingLeft: 45, paddingRight: 47 } as const;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 23, paddingTop: 24, paddingBottom: 34 }}>
        <View style={{ alignItems: "flex-end" }}><ThemeToggle compact /></View>
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <Image source={require("../../../assets/brand/wildsentinel-mark.png")} resizeMode="contain" style={{ width: 124, height: 124 }} />
          <Text style={{ fontSize: 34, fontWeight: "900", letterSpacing: -1.4, color: colors.text, marginTop: 5 }}>
            Wild<Text style={{ color: colors.accent }}>Sentinel</Text>
          </Text>
          <Text style={{ fontSize: 10, letterSpacing: 2.6, color: colors.primary, fontWeight: "800", marginTop: 6 }}>
            PROTECT · MONITOR · PRESERVE
          </Text>
          <Text style={{ color: colors.muted, textAlign: "center", lineHeight: 21, maxWidth: 300, fontSize: 13, marginTop: 15 }}>
            Intelligent wildlife conservation and anti-poaching monitoring platform.
          </Text>
        </View>
        <View style={{ backgroundColor: colors.surface, borderRadius: 25, padding: 22, marginTop: 27,
          borderColor: colors.border, borderWidth: 1, shadowColor: colors.shadow, shadowOpacity: dark ? 0 : 0.06,
          shadowRadius: 14, elevation: 2 }}>
          <Text style={{ fontSize: 23, fontWeight: "800", color: colors.text }}>Welcome back</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 5, marginBottom: 20 }}>
            Sign in to your conservation workspace
          </Text>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: 8 }}>Email address</Text>
          <View style={{ justifyContent: "center" }}>
            <Mail size={19} color={colors.muted} style={{ position: "absolute", left: 15, zIndex: 1 }} />
            <TextInput value={email} onChangeText={setEmail} editable={!anyLoading} autoCapitalize="none"
              autoCorrect={false} keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.muted}
              style={fieldStyle} accessibilityLabel="Email address" />
          </View>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", marginTop: 17, marginBottom: 8 }}>Password</Text>
          <View style={{ justifyContent: "center" }}>
            <LockKeyhole size={19} color={colors.muted} style={{ position: "absolute", left: 15, zIndex: 1 }} />
            <TextInput value={password} onChangeText={setPassword} editable={!anyLoading}
              secureTextEntry={!showPassword} autoCapitalize="none" placeholder="Enter your password"
              placeholderTextColor={colors.muted} style={fieldStyle} accessibilityLabel="Password" />
            <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              onPress={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 14, padding: 3 }}>
              {showPassword ? <EyeOff size={19} color={colors.muted} /> : <Eye size={19} color={colors.muted} />}
            </Pressable>
          </View>
          <Pressable onPress={() => void handleLogin()} disabled={anyLoading}
            style={{ height: 55, backgroundColor: "#14785D", borderRadius: 15, marginTop: 24, opacity: anyLoading ? 0.6 : 1,
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 15 }}>Sign in securely</Text><ArrowRight size={18} color="#FFFFFF" /></>}
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 25, marginBottom: 16 }}>
          <View style={{ height: 1, backgroundColor: colors.border, flex: 1 }} />
          <Text style={{ color: colors.muted, letterSpacing: 1.4, fontWeight: "800", fontSize: 10 }}>DEMO ACCESS</Text>
          <View style={{ height: 1, backgroundColor: colors.border, flex: 1 }} />
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", marginBottom: 13 }}>
          Explore each existing role with a test account
        </Text>
        <View style={{ gap: 9 }}>
          {DEMO_ACCOUNTS.map((account, i) => {
            const Icon = i === 0 ? UsersRound : i === 1 ? MapPinned : ShieldCheck;
            return <Pressable key={account.role} disabled={anyLoading} onPress={() => void handleDemoLogin(account)}
              style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceAlt : colors.surface, borderColor: colors.border,
                borderWidth: 1, borderRadius: 17, paddingVertical: 13, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12, opacity: anyLoading ? .6 : 1 })}>
              <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.softGreen,
                alignItems: "center", justifyContent: "center" }}><Icon size={20} color={colors.primary} /></View>
              <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>{account.label}</Text>
                <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{account.email}</Text></View>
              {demoLoading === account.role ? <ActivityIndicator color={colors.primary} /> : <ArrowRight size={17} color={colors.primary} />}
            </Pressable>;
          })}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 29 }}>
          <Leaf size={13} color={colors.primary} /><Text style={{ fontSize: 11, color: colors.muted }}>WildSentinel · Conservation starts with awareness</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
