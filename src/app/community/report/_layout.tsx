import {
    Stack,
} from "expo-router";

import {
    ConflictReportProvider,
} from "@/context/ConflictReportContext";

export default function ReportLayout() {
  return (
    <ConflictReportProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor:
              "#FFFFFF",
          },

          headerTintColor:
            "#0F172A",

          headerTitleStyle: {
            fontWeight: "700",
          },

          headerShadowVisible:
            false,

          contentStyle: {
            backgroundColor:
              "#F8FAFC",
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