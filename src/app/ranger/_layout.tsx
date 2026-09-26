import { Redirect, Tabs } from "expo-router";
import {
  BellRing,
  FileWarning,
  House,
  Map,
  UserRound,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";

const ACTIVE_COLOR = "#166534";
const INACTIVE_COLOR = "#64748B";

export default function RangerLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role !== "RANGER") {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#14532D",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
        },

        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,

        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          borderTopWidth: 1,
          height: 68,
          paddingTop: 7,
          paddingBottom: 8,
          elevation: 10,
          shadowColor: "#000000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },

        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "Ranger Dashboard",
          tabBarIcon: ({ color, size }) => (
            <House
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="patrol"
        options={{
          title: "Patrol",
          headerTitle: "My Patrol",
          tabBarIcon: ({ color, size }) => (
            <Map
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="incident"
        options={{
          title: "Report",
          headerTitle: "Report Incident",
          tabBarIcon: ({ color, size }) => (
            <FileWarning
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          headerTitle: "Wildlife Risk Alerts",
          tabBarIcon: ({ color, size }) => (
            <BellRing
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "Ranger Profile",
          tabBarIcon: ({ color, size }) => (
            <UserRound
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />
    </Tabs>
  );
}