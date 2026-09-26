import RoleTabPage from "@/components/RoleTabPage";

export default function RangerPatrol() {
  return (
    <RoleTabPage
      title="My Patrol"
      subtitle="Ranger patrol information will be displayed here."
      items={[
        "Assigned patrol route",
        "Current patrol status",
        "GPS location tracking",
        "Patrol progress",
      ]}
    />
  );
}