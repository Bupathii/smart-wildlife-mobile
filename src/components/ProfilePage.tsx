import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/login");
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </Text>
      </View>

      <Text style={styles.name}>
        {user?.name || "User"}
      </Text>

      <Text style={styles.email}>
        {user?.email}
      </Text>

      <View style={styles.roleCard}>
        <Text style={styles.roleLabel}>
          Account Role
        </Text>

        <Text style={styles.roleValue}>
          {user?.role?.replaceAll("_", " ")}
        </Text>
      </View>

      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7f5",
    padding: 24,
    alignItems: "center",
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#166534",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "700",
  },

  name: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },

  email: {
    color: "#64748b",
    marginTop: 5,
  },

  roleCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  roleLabel: {
    color: "#64748b",
    fontSize: 13,
  },

  roleValue: {
    color: "#14532d",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 5,
  },

  logoutButton: {
    backgroundColor: "#b91c1c",
    width: "100%",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
  },

  logoutText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
});