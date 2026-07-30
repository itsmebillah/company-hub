"use server";

import { AttendanceSelfieService } from "@/features/attendance/services/attendance-selfie.service";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";

export async function uploadAttendanceSelfieAction(formData: FormData) {
  try {
    await FeatureAccessService.requireForCurrentCompany("attendance");
    const phase = formData.get("phase");
    const attendanceDate = formData.get("attendanceDate");
    const file = formData.get("file");

    if (
      (phase !== "checkin" && phase !== "checkout") ||
      typeof attendanceDate !== "string" ||
      !(file instanceof File)
    ) {
      throw new Error("Selfie upload request is invalid.");
    }

    const result = await AttendanceSelfieService.upload({
      file,
      phase,
      attendanceDate,
    });

    return {
      ok: true as const,
      message: "Attendance selfie uploaded.",
      path: result.objectPath,
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Unable to upload attendance selfie.",
      path: "",
    };
  }
}
