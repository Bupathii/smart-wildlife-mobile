import RoleTabPage from "@/components/RoleTabPage";
import { useAuth } from "@/context/AuthContext";

export default function RangerHome() {
  const { user } = useAuth();

  return (
    <RoleTabPage
      title={`Ranger Dashboard`}
      subtitle={`Welcome, ${user?.name || "Ranger"}. Manage field patrol activities and wildlife incidents.`}
      items={[
        "View active patrol",
        "Track patrol route",
        "Report wildlife or poaching incident",
        "Receive wildlife risk alerts",
        "Work with offline field data",
      ]}
    />
  );
}