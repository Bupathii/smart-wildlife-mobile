import RoleTabPage from "@/components/RoleTabPage";

export default function RangerIncident() {
  return (
    <RoleTabPage
      title="Report Incident"
      subtitle="Report wildlife or suspected poaching incidents from the field."
      items={[
        "Select incident type",
        "Capture GPS location",
        "Take or upload evidence",
        "Enter incident description",
        "Review and submit",
        "Offline synchronization support",
      ]}
    />
  );
}