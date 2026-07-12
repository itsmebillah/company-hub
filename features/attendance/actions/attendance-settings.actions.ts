"use server";

import { revalidatePath } from "next/cache";

import { AttendanceSettingsService } from "@/features/attendance/services/attendance-settings.service";
import type {
  AttendanceActionState,
  AttendanceSettingsValues,
} from "@/features/attendance/types/attendance.types";

export async function updateAttendanceSettingsAction(
  values: AttendanceSettingsValues,
): Promise<AttendanceActionState> {
  try {
    await AttendanceSettingsService.updateSettings(values);
    revalidatePath("/admin/settings");
    revalidatePath("/admin/settings/attendance");
    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/attendance/reports");

    return {
      ok: true,
      message: "Attendance settings saved.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to save attendance settings.",
    };
  }
}
