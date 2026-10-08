import { Redirect, Tabs } from "expo-router";
import {
  ClipboardList,
  FilePlus2,
  House,
  UserRound,
} from "lucide-react-native";

import { useAuth } from "@/context/AuthContext";

const ACTIVE_COLOR = "#166534";
const INACTIVE_COLOR = "#64748B";

export default function CommunityLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role !== "COMMUNITY_MEMBER") {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#166534",
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
          headerTitle: "Community Home",
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
        name="report"
        options={{
          title: "Report",
          headerTitle: "Report Wildlife Conflict",
          tabBarIcon: ({ color, size }) => (
            <FilePlus2
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "My Reports",
          headerTitle: "My Reports",
          tabBarIcon: ({ color, size }) => (
            <ClipboardList
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
          headerTitle: "My Profile",
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