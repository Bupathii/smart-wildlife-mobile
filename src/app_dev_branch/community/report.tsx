import RoleTabPage from "@/components/RoleTabPage";

export default function CommunityReport() {
  return (
    <RoleTabPage
      title="Report Conflict"
      subtitle="Human-wildlife conflict reporting module."
      items={[
        "Select conflict type",
        "Provide GPS or manual location",
        "Enter conflict details",
        "Attach optional supporting evidence",
        "Review and submit report",
      ]}
    />
  );
}