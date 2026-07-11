import "server-only";

import { logActivity } from "@/features/activity/utils/activity-log";
import { requireCurrentEmployeeContext } from "@/features/auth/services/current-employee-context.service";
import {
  ATTENDANCE_SELFIES_BUCKET,
  buildAttendanceSelfiePath,
} from "@/lib/media";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_SELFIE_SIZE_BYTES = 5 * 1024 * 1024;

function getImageExtension(fileName: string, mimeType: string) {
  const fromName = fileName.split(".").pop()?.toLowerCase();

  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export const AttendanceSelfieService = {
  async upload(input: {
    file: File;
    phase: "checkin" | "checkout";
    attendanceDate: string;
  }) {
    if (!input.file.type.startsWith("image/")) {
      throw new Error("Please capture a valid selfie image.");
    }

    if (input.file.size > MAX_SELFIE_SIZE_BYTES) {
      throw new Error("Selfie image must be 5 MB or smaller.");
    }

    const employee = await requireCurrentEmployeeContext();
    const supabase = createSupabaseAdminClient();
    const extension = getImageExtension(input.file.name, input.file.type);
    const storagePath = buildAttendanceSelfiePath({
      companyId: employee.companyId,
      employeeId: employee.employeeId,
      attendanceDate: input.attendanceDate,
      phase: input.phase,
      extension,
    });
    const arrayBuffer = await input.file.arrayBuffer();

    const { error } = await supabase.storage
      .from(ATTENDANCE_SELFIES_BUCKET)
      .upload(storagePath, arrayBuffer, {
        upsert: true,
        cacheControl: "3600",
        contentType: input.file.type || undefined,
      });

    if (error) {
      console.error("[AttendanceSelfieService] Unable to upload selfie.", error);
      throw new Error("Unable to upload attendance selfie.");
    }

    await logActivity({
      companyId: employee.companyId,
      module: "attendance",
      action: "updated",
      entityType: "attendance_records",
      description: `Uploaded ${input.phase} selfie for attendance`,
      metadata: {
        employeeId: employee.employeeId,
        storagePath,
        phase: input.phase,
      },
    });

    return {
      path: storagePath,
      bucket: ATTENDANCE_SELFIES_BUCKET,
    };
  },

  async getSignedUrl(path: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(ATTENDANCE_SELFIES_BUCKET)
      .createSignedUrl(path, 60 * 10);

    if (error) {
      console.error("[AttendanceSelfieService] Unable to sign selfie URL.", error);
      return null;
    }

    return data.signedUrl;
  },
};
