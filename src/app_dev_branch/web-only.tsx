import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { Redirect, router } from "expo-router";

import { useAuth } from "@/context/AuthContext";

export default function WebOnlyScreen() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🖥️</Text>

      <Text style={styles.title}>
        Web Dashboard Required
      </Text>

      <Text style={styles.text}>
        The {user.role.replaceAll("_", " ")} role
        uses the Wildlife Conservation web
        dashboard.
      </Text>

      <Text style={styles.email}>
        {user.email}
      </Text>

      <Pressable
        style={styles.button}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>
          Logout
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8faf8",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  icon: {
    fontSize: 60,
    marginBottom: 20,
  },

  title: {
    fontSize: 25,
    color: "#14532d",
    fontWeight: "800",
    textAlign: "center",
  },

  text: {
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 12,
  },

  email: {
    marginTop: 14,
    color: "#334155",
    fontWeight: "600",
  },

  button: {
    marginTop: 30,
    backgroundColor: "#166534",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 10,
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});