import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";

import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { user, ready } = useAuth();
  const { colors } = useAppTheme();
  if (!ready) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.primary} /></View>;

  if (!user) {
    return <Redirect href="/login" />;
  }

  switch (user.role) {
    case "COMMUNITY_MEMBER":
      return <Redirect href="/community" />;

    case "RANGER":
      return <Redirect href="/ranger" />;

    case "COMMUNITY_LIAISON_OFFICER":
      return <Redirect href="/liaison" />;

    default:
      return <Redirect href="/web-only" />;
  }
}