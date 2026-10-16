import { useAppTheme } from "@/theme/ThemeContext";
import {
  Stack,
} from "expo-router";

import {
  ConflictReportProvider,
} from "@/context/ConflictReportContext";

export default function ReportLayout() {
  const { colors } = useAppTheme();
  return (
    <ConflictReportProvider>
      <Stack
        screenOptions={{
          animation: "slide_from_right",
          animationDuration: 230,
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
            title:
              "Report Conflict",
          }}
        />

        <Stack.Screen
          name="location"
          options={{
            title:
              "Conflict Location",
          }}
        />

        <Stack.Screen
          name="details"
          options={{
            title:
              "Conflict Details",
          }}
        />

        <Stack.Screen
          name="evidence"
          options={{
            title:
              "Supporting Evidence",
          }}
        />

        <Stack.Screen
          name="review"
          options={{
            title:
              "Review Report",
          }}
        />

        <Stack.Screen
          name="success"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </ConflictReportProvider>
  );
}