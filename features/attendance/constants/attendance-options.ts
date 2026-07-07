import type { AttendanceStatus } from "@/features/attendance/types/attendance.types";

export const ATTENDANCE_STATUS_OPTIONS: Array<{
  value: AttendanceStatus;
  label: string;
}> = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "holiday", label: "Holiday" },
  { value: "leave", label: "Leave" },
  { value: "weekend", label: "Weekend" },
];

export function getAttendanceStatusLabel(status: AttendanceStatus) {
  return (
    ATTENDANCE_STATUS_OPTIONS.find((item) => item.value === status)?.label ??
    status
  );
}

export const ATTENDANCE_RULES = {
  officeStartTime: "09:30",
  halfDayWorkingMinutes: 240,
  fullDayWorkingMinutes: 480,
} as const;

export const ATTENDANCE_GPS_RULES = {
  maxAccuracyMeters: 100,
} as const;
