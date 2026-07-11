import type { AttendancePolicyMode } from "@/features/attendance/types/attendance.types";

export const ATTENDANCE_POLICY_OPTIONS: Array<{
  value: AttendancePolicyMode;
  label: string;
  description: string;
}> = [
  {
    value: "assigned_location_only",
    label: "Assigned Location Only",
    description:
      "Employees can check in only from locations explicitly assigned to them.",
  },
  {
    value: "company_location",
    label: "Company Location",
    description:
      "Use assigned locations when available, otherwise fall back to active company locations.",
  },
  {
    value: "any_company_location",
    label: "Any Company Location",
    description:
      "Employees can check in from any active company location.",
  },
  {
    value: "remote",
    label: "Remote",
    description:
      "Attendance is allowed from anywhere. GPS is optional and geofence checks are skipped.",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    description:
      "Employees can check in from assigned locations, company locations, or remotely.",
  },
];

export function getAttendancePolicyOption(mode: AttendancePolicyMode) {
  return (
    ATTENDANCE_POLICY_OPTIONS.find((option) => option.value === mode) ??
    ATTENDANCE_POLICY_OPTIONS[1]
  );
}
