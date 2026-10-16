import { useAppTheme } from "@/theme/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BellRing,
  ClipboardList,
  FileWarning,
  House,
  LocateFixed,
  Map,
  UserRound,
} from "lucide-react-native";

import {
  Redirect,
  Tabs,
} from "expo-router";

import {
  useAuth,
} from "@/context/AuthContext";


export default function RangerLayout() {
  const { user } = useAuth();
  const { colors, dark } = useAppTheme();

  if (!user) {
    return (
      <Redirect href="/login" />
    );
  }

  if (user.role !== "RANGER") {
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

        headerTintColor: "#FFFFFF",

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
          height: 70,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },

        tabBarLabelStyle: {
          fontSize: 9,
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
            "Ranger Dashboard",

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

      {/* PATROL */}

      <Tabs.Screen
        name="patrol"
        options={{
          title: "Patrol",

          headerTitle:
            "My Patrol",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <Map
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      {/* TRACKING */}

      <Tabs.Screen
        name="tracking"
        options={{
          title: "Tracking",

          headerTitle:
            "Wildlife Tracking",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <LocateFixed
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      {/* REPORT INCIDENT */}

      <Tabs.Screen
        name="incident"
        options={{
          title: "Report",

          headerTitle:
            "Report Incident",

          tabBarIcon: ({
            color,
            size,
          }) => (
            <FileWarning
              color={color}
              size={size}
              strokeWidth={2.2}
            />
          ),
        }}
      />

      {/* COMMUNITY CONFLICT REPORTS */}

      <Tabs.Screen
        name="conflicts"
        options={{
          title: "Conflicts",

          /*
           * conflicts folder has
           * its own Stack header.
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

      {/* PROFILE */}

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          headerTitle:
            "Ranger Profile",

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

      {/* INCIDENT HIDDEN ROUTES — Member 3: wildlife-incident-reporting */}

      <Tabs.Screen
        name="incident-report"
        options={{
          title: "Report",
          headerTitle: "Report Incident",
          headerShown: true,
          tabBarItemStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <FileWarning color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen
        name="incident-confirm"
        options={{
          title: "Report Status",
          headerTitle: "Report Status",
          headerShown: true,
          tabBarItemStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <FileWarning color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-incidents"
        options={{
          title: "My Reports",
          headerTitle: "My Reports",
          headerShown: true,
          tabBarItemStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <FileWarning color={color} size={size} strokeWidth={2.2} />
          ),
        }}
      />
    </Tabs>
  );
}
