import RoleTabPage from "@/components/RoleTabPage";

export default function LiaisonAlerts() {
  return (
    <RoleTabPage
      title="Wildlife Risk Alerts"
      subtitle="High-risk wildlife alerts assigned to the Community Liaison Officer."
      items={[
        "View new risk alerts",
        "View animal location",
        "Assess conflict risk",
        "Initiate community response",
      ]}
    />
  );
}