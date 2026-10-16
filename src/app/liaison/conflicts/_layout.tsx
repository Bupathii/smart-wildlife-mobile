import { useAppTheme } from "@/theme/ThemeContext";
import {
    Stack,
} from "expo-router";

export default function LiaisonConflictLayout() {
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
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title:
            "Conflict Reports",
        }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          title:
            "Review Conflict",
        }}
      />
    </Stack>
  );
}