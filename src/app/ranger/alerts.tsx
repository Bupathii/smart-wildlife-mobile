import RoleTabPage from "@/components/RoleTabPage";

export default function RangerAlerts() {
  return (
    <RoleTabPage
      title="Wildlife Alerts"
      subtitle="Wildlife risk alerts assigned to the Ranger will appear here."
      items={[
        "View new wildlife risk alerts",
        "View animal and location details",
        "Assess risk",
        "Initiate response",
      ]}
    />
  );
}