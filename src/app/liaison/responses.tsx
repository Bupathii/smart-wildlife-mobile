import RoleTabPage from "@/components/RoleTabPage";

export default function LiaisonResponses() {
  return (
    <RoleTabPage
      title="Responses"
      subtitle="Wildlife conflict response activities will be tracked here."
      items={[
        "Active responses",
        "Completed responses",
        "Response status",
        "Follow-up actions",
      ]}
    />
  );
}