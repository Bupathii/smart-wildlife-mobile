import RoleTabPage from "@/components/RoleTabPage";

export default function CommunityReports() {
  return (
    <RoleTabPage
      title="My Reports"
      subtitle="Submitted community conflict reports will appear here."
      items={[
        "View submitted reports",
        "Check report status",
        "View report details",
      ]}
    />
  );
}