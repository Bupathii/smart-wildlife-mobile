import { useAppTheme } from "@/theme/ThemeContext";
import {
    Stack,
} from "expo-router";

export default function ReportsLayout() {
  const { colors } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor:
            colors.surface,
        },

        headerTintColor:
          colors.text,

        headerTitleStyle: {
          fontWeight: "700",
        },

        headerShadowVisible:
          false,

        contentStyle: {
          backgroundColor:
            colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "My Reports",
        }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          title:
            "Report Details",
        }}
      />
    </Stack>
  );
}