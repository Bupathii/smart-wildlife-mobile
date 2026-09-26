import RoleTabPage from "@/components/RoleTabPage";

export default function LiaisonConflicts() {
  return (
    <RoleTabPage
      title="Conflict Reports"
      subtitle="Community human-wildlife conflict reports will appear here."
      items={[
        "View submitted community reports",
        "Review conflict details",
        "View conflict location",
        "Check supporting evidence",
        "Start a response",
      ]}
    />
  );
}