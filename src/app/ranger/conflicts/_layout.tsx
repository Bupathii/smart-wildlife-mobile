import { useAppTheme } from "@/theme/ThemeContext";
import {
    Stack,
} from "expo-router";

export default function RangerConflictLayout() {
  const { colors } = useAppTheme();
  return (
    <Stack
      screenOptions={{
          animation: "slide_from_right",
          animationDuration: 230,
        headerStyle: {
          backgroundColor: colors.surface,
        },

        headerTintColor: colors.text,

        headerTitleStyle: {
          fontWeight: "700",
        },

        headerShadowVisible: false,

        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Conflict Reports",
        }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          title: "Review Conflict",
        }}
      />
    </Stack>
  );
}