import { View } from "react-native";
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

        headerShadowVisible: false,

        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 17,
        },

        tabBarActiveTintColor:
          colors.primary,

        tabBarHideOnKeyboard: true,

        tabBarInactiveTintColor:
          colors.muted,

        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 9,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 9,
          shadowColor: colors.shadow,
          shadowOpacity: dark ? 0 : 0.09,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: -3 },
        },

        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "700",
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
            focused,
            color,
            size,
          }) => (
            <View style={{ minWidth: 40, height: 32, borderRadius: 12,
              backgroundColor: focused ? colors.softGreen : "transparent",
              alignItems: "center", justifyContent: "center" }}>
              <House
              color={color}
              size={size}
              strokeWidth={2.2}
            />
            </View>
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
            focused,
            color,
            size,
          }) => (
            <View style={{ minWidth: 40, height: 32, borderRadius: 12,
              backgroundColor: focused ? colors.softGreen : "transparent",
              alignItems: "center", justifyContent: "center" }}>
              <Map
              color={color}
              size={size}
              strokeWidth={2.2}
            />
            </View>
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
            focused,
            color,
            size,
          }) => (
            <View style={{ minWidth: 40, height: 32, borderRadius: 12,
              backgroundColor: focused ? colors.softGreen : "transparent",
              alignItems: "center", justifyContent: "center" }}>
              <LocateFixed
              color={color}
              size={size}
              strokeWidth={2.2}
            />
            </View>
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
            focused,
            color,
            size,
          }) => (
            <View style={{ minWidth: 40, height: 32, borderRadius: 12,
              backgroundColor: focused ? colors.softGreen : "transparent",
              alignItems: "center", justifyContent: "center" }}>
              <FileWarning
              color={color}
              size={size}
              strokeWidth={2.2}
            />
            </View>
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
            focused,
            color,
            size,
          }) => (
            <View style={{ minWidth: 40, height: 32, borderRadius: 12,
              backgroundColor: focused ? colors.softGreen : "transparent",
              alignItems: "center", justifyContent: "center" }}>
              <ClipboardList
              color={color}
              size={size}
              strokeWidth={2.2}
            />
            </View>
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
            focused,
            color,
            size,
          }) => (
            <View style={{ minWidth: 40, height: 32, borderRadius: 12,
              backgroundColor: focused ? colors.softGreen : "transparent",
              alignItems: "center", justifyContent: "center" }}>
              <BellRing
              color={color}
              size={size}
              strokeWidth={2.2}
            />
            </View>
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
            focused,
            color,
            size,
          }) => (
            <View style={{ minWidth: 40, height: 32, borderRadius: 12,
              backgroundColor: focused ? colors.softGreen : "transparent",
              alignItems: "center", justifyContent: "center" }}>
              <UserRound
              color={color}
              size={size}
              strokeWidth={2.2}
            />
            </View>
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
