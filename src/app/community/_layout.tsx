import {
  ClipboardList,
  FilePlus2,
  House,
  UserRound,
} from "lucide-react-native";

import {
  Redirect,
  Tabs,
} from "expo-router";

import {
  useAuth,
} from "@/context/AuthContext";

const ACTIVE_COLOR =
  "#0F766E";

const INACTIVE_COLOR =
  "#64748B";

export default function CommunityLayout() {
  const { user } =
    useAuth();

  if (!user) {
    return (
      <Redirect href="/login" />
    );
  }

  if (
    user.role !==
    "COMMUNITY_MEMBER"
  ) {
    return (
      <Redirect href="/" />
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor:
            "#0F766E",
        },

        headerTintColor:
          "#FFFFFF",

        headerTitleStyle: {
          fontWeight: "700",
        },

        tabBarActiveTintColor:
          ACTIVE_COLOR,

        tabBarInactiveTintColor:
          INACTIVE_COLOR,

        tabBarStyle: {
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor:
            "#FFFFFF",
          borderTopColor:
            "#E2E8F0",
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",

          headerTitle:
            "Community Home",

          tabBarIcon: ({
            color,
            size,
          }) => (
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

          headerShown: false,

          tabBarIcon: ({
            color,
            size,
          }) => (
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
          title:
            "My Reports",

          headerShown: false,

          tabBarIcon: ({
            color,
            size,
          }) => (
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

          headerTitle:
            "My Profile",

          tabBarIcon: ({
            color,
            size,
          }) => (
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