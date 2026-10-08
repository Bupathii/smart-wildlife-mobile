import RoleTabPage from "@/components/RoleTabPage";
import { useAuth } from "@/context/AuthContext";

export default function CommunityHome() {
  const { user } = useAuth();

  return (
    <RoleTabPage
      title={`Welcome, ${user?.name || "Community Member"}`}
      subtitle="Help protect your community by reporting wildlife conflicts quickly."
      items={[
        "Report a human-wildlife conflict",
        "Provide conflict location",
        "Attach supporting evidence",
        "Track submitted reports",
      ]}
    />
  );
}