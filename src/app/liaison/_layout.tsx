import { useAppTheme } from "@/theme/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BellRing,
  ClipboardList,
  House,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";

import {
  Redirect,
  Tabs,
} from "expo-router";

import {
  useAuth,
} from "@/context/AuthContext";


export default function LiaisonLayout() {
  const { user } = useAuth();
  const { colors, dark } = useAppTheme();

  if (!user) {
    return (
      <Redirect href="/login" />
    );
  }

  if (
    user.role !==
    "COMMUNITY_LIAISON_OFFICER"
  ) {
    return (
      <Redirect href="/" />
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primaryStrong,
        },

        headerTintColor:
          "#FFFFFF",

        headerRight: () => <ThemeToggle compact header />,

        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
        },

        tabBarActiveTintColor:
          colors.primary,

        tabBarInactiveTintColor:
          colors.muted,

        tabBarStyle: {
          height: 68,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor:
            colors.surface,
          borderTopColor:
            colors.border,
          borderTopWidth: 1,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      {/* HOME */}

      <Tabs.Screen
        name="index"
        options={{
          title: "Home",

          headerTitle:
            "Liaison Dashboard",

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

      {/* CONFLICT REPORTS */}

      <Tabs.Screen
        name="conflicts"
        options={{
          title: "Conflicts",

          /*
           * conflicts folder has its
           * own Stack header.
           */
          headerShown: false,

          popToTopOnBlur: true,

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

      {/* RISK ALERTS */}

      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",

          headerTitle:
            "Wildlife Risk Alerts",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <BellRing
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      {/* RESPONSES */}

      <Tabs.Screen
        name="responses"
        options={{
          title: "Responses",

          headerTitle:
            "Response Activities",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <ShieldCheck
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      {/* PROFILE */}

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          headerTitle:
            "Liaison Profile",

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