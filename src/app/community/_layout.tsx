import { View } from "react-native";
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
          backgroundColor:
            colors.surface,
          borderTopColor:
            colors.border,
          borderTopWidth: 1,
          elevation: 9,
          shadowColor: colors.shadow,
          shadowOpacity: dark ? 0 : 0.09,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: -3 },
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
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

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          headerTitle:
            "My Profile",

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
    </Tabs>
  );
}