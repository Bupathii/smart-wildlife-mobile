import "../../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider, useAppTheme } from "@/theme/ThemeContext";

function AppStack() {
  const { colors, dark } = useAppTheme();
  return (
    <AuthProvider>
      <StatusBar style={dark ? "light" : "dark"} />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </AuthProvider>
  );
}
export default function RootLayout() {
  return <ThemeProvider><AppStack /></ThemeProvider>;
}
