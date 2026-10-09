import { Redirect } from "expo-router";

import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { user } = useAuth();

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