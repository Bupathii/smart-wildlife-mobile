import { useState } from "react";

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { Redirect, router } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/auth";

const DEMO_ACCOUNTS = [
  {
    label: "Community Member",
    role: "COMMUNITY_MEMBER",
    email: "community.demo@wildlife.lk",
    password: "Community@123",
  },
  {
    label: "Ranger",
    role: "RANGER",
    email: "ranger.demo@wildlife.lk",
    password: "Ranger@123",
  },
  {
    label: "Community Liaison Officer",
    role: "COMMUNITY_LIAISON_OFFICER",
    email: "liaison.demo@wildlife.lk",
    password: "Liaison@123",
  },
];

export default function LoginScreen() {
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(
    null
  );

  if (user) {
    return <Redirect href="/" />;
  }

  function navigateByRole(loggedUser: User) {
    switch (loggedUser.role) {
      case "COMMUNITY_MEMBER":
        router.replace("/community");
        break;

      case "RANGER":
        router.replace("/ranger");
        break;

      case "COMMUNITY_LIAISON_OFFICER":
        router.replace("/liaison");
        break;

      default:
        router.replace("/web-only");
        break;
    }
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const loggedUser = await login(
        email.trim(),
        password
      );

      navigateByRole(loggedUser);
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error?.message || "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(
    account: (typeof DEMO_ACCOUNTS)[number]
  ) {
    try {
      setDemoLoading(account.role);

      setEmail(account.email);
      setPassword(account.password);

      const loggedUser = await login(
        account.email,
        account.password
      );

      navigateByRole(loggedUser);
    } catch (error: any) {
      Alert.alert(
        "Demo Login Failed",
        error?.message ||
          `Unable to login as ${account.label}.`
      );
    } finally {
      setDemoLoading(null);
    }
  }

  const anyLoading = loading || demoLoading !== null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>WC</Text>
        </View>

        <Text style={styles.title}>
          Wildlife Conservation
        </Text>

        <Text style={styles.subtitle}>
          Smart Wildlife Conservation and Anti-Poaching
          Monitoring System
        </Text>

        <View style={styles.loginCard}>
          <Text style={styles.sectionTitle}>
            Sign In
          </Text>

          <Text style={styles.label}>
            Email Address
          </Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Enter your email"
            editable={!anyLoading}
          />

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter your password"
            editable={!anyLoading}
          />

          <Pressable
            style={[
              styles.loginButton,
              anyLoading && styles.disabledButton,
            ]}
            onPress={handleLogin}
            disabled={anyLoading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>
                Login
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>
            DEMO ACCESS
          </Text>
          <View style={styles.divider} />
        </View>

        <Text style={styles.demoDescription}>
          Select a demo user to quickly test each mobile
          application role.
        </Text>

        <View style={styles.demoContainer}>
          {DEMO_ACCOUNTS.map((account) => {
            const isCurrentLoading =
              demoLoading === account.role;

            return (
              <Pressable
                key={account.role}
                style={[
                  styles.demoButton,
                  anyLoading && styles.disabledDemoButton,
                ]}
                onPress={() =>
                  handleDemoLogin(account)
                }
                disabled={anyLoading}
              >
                <View style={styles.demoTextContainer}>
                  <Text style={styles.demoTitle}>
                    {account.label}
                  </Text>

                  <Text style={styles.demoEmail}>
                    {account.email}
                  </Text>
                </View>

                <View style={styles.demoAction}>
                  {isCurrentLoading ? (
                    <ActivityIndicator
                      color="#166534"
                      size="small"
                    />
                  ) : (
                    <Text style={styles.demoActionText}>
                      Login
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Mobile Application Roles
          </Text>

          <Text style={styles.infoText}>
            Community Members can report wildlife conflicts.
            Rangers can manage field patrol activities and
            incidents. Community Liaison Officers can review
            conflicts and respond to wildlife risk alerts.
          </Text>
        </View>

        <Text style={styles.footer}>
          Wildlife Conservation System
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7f5",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 35,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#166534",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 18,
  },

  logoText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },

  title: {
    textAlign: "center",
    color: "#14532d",
    fontSize: 27,
    fontWeight: "800",
  },

  subtitle: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 26,
    paddingHorizontal: 12,
  },

  loginCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
    marginBottom: 7,
    marginTop: 8,
  },

  input: {
    height: 50,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0f172a",
  },

  loginButton: {
    height: 52,
    backgroundColor: "#166534",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 11,
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#dbe3dc",
  },

  dividerText: {
    marginHorizontal: 12,
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },

  demoDescription: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 15,
    paddingHorizontal: 10,
  },

  demoContainer: {
    gap: 11,
  },

  demoButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#bbd8c3",
    borderRadius: 13,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  disabledDemoButton: {
    opacity: 0.65,
  },

  demoTextContainer: {
    flex: 1,
    paddingRight: 12,
  },

  demoTitle: {
    fontSize: 15,
    color: "#14532d",
    fontWeight: "700",
  },

  demoEmail: {
    marginTop: 3,
    color: "#64748b",
    fontSize: 12,
  },

  demoAction: {
    minWidth: 58,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
  },

  demoActionText: {
    color: "#166534",
    fontWeight: "700",
    fontSize: 13,
  },

  infoBox: {
    marginTop: 22,
    backgroundColor: "#ecfdf3",
    borderRadius: 13,
    padding: 15,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },

  infoTitle: {
    color: "#14532d",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 5,
  },

  infoText: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },

  footer: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 28,
  },
});