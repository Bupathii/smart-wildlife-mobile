import { useAppTheme } from "@/theme/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
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

import {
  usePendingConflictSync,
} from "@/hooks/usePendingConflictSync";


export default function CommunityLayout() {
  const { user } = useAuth();
  const { colors, dark } = useAppTheme();

  usePendingConflictSync();

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

          popToTopOnBlur: true,

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
          title: "My Reports",

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