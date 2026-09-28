import {
    Stack,
} from "expo-router";

export default function LiaisonConflictLayout() {
  return (
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