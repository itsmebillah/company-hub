import "server-only";

import { SupabaseAttendanceSelfieStorage } from "@/features/attendance/storage/supabase-attendance-selfie-storage";
import type { AttendanceSelfieStorage } from "@/features/attendance/storage/attendance-selfie-storage";

const configuredAttendanceSelfieStorage: AttendanceSelfieStorage =
  SupabaseAttendanceSelfieStorage;

export function getAttendanceSelfieStorage(): AttendanceSelfieStorage {
  return configuredAttendanceSelfieStorage;
}
