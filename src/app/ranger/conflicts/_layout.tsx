import {
    Stack,
} from "expo-router";

export default function RangerConflictLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },

        headerTintColor: "#0F172A",

        headerTitleStyle: {
          fontWeight: "700",
        },

        headerShadowVisible: false,

        contentStyle: {
          backgroundColor: "#F8FAFC",
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