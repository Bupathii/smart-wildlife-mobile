import RoleTabPage from "@/components/RoleTabPage";
import { useAuth } from "@/context/AuthContext";

export default function LiaisonHome() {
  const { user } = useAuth();

  return (
    <RoleTabPage
      title="Community Liaison Dashboard"
      subtitle={`Welcome, ${user?.name || "Community Liaison Officer"}. Review community reports and coordinate wildlife responses.`}
      items={[
        "Review community conflict reports",
        "Receive wildlife risk alerts",
        "Coordinate conflict response",
        "Track response activities",
      ]}
    />
  );
}