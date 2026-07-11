import "server-only";

import { logActivity } from "@/features/activity/utils/activity-log";
import { AttendancePolicyRepository } from "@/features/attendance/repositories/attendance-policy.repository";
import type { AttendanceSettingsValues } from "@/features/attendance/types/attendance.types";
import { NotificationService } from "@/features/notifications/services/notification.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function validateAttendanceSettings(values: AttendanceSettingsValues) {
  if (values.gpsAccuracyThresholdMeters <= 0) {
    throw new Error("GPS accuracy threshold must be greater than 0.");
  }

  if (values.allowedRadiusMeters <= 0) {
    throw new Error("Allowed radius must be greater than 0.");
  }

  if (values.allowEarlyCheckInMinutes < 0) {
    throw new Error("Early check-in minutes cannot be negative.");
  }
}

async function getActiveCompany() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("Company was not found.");
  }

  return data;
}

export const AttendanceSettingsService = {
  async getSettings() {
    const company = await getActiveCompany();
    return AttendancePolicyRepository.getSettings(company.id);
  },

  async updateSettings(values: AttendanceSettingsValues) {
    validateAttendanceSettings(values);

    const company = await getActiveCompany();
    await AttendancePolicyRepository.updateSettings(
      company.id,
      company.name,
      values,
    );

    await NotificationService.createForActiveCompanyEmployees({
      companyId: company.id,
      type: "attendance",
      title: "Attendance policy updated",
      message: `Attendance mode is now ${values.attendanceMode.replaceAll("_", " ")}.`,
      actionUrl: "/attendance",
    });

    if (values.requireSelfie) {
      await NotificationService.createForActiveCompanyEmployees({
        companyId: company.id,
        type: "attendance",
        title: "Attendance selfie required",
        message: "A selfie is now required for attendance check-in.",
        actionUrl: "/attendance",
      });
    }

    await logActivity({
      companyId: company.id,
      module: "attendance",
      action: "updated",
      entityType: "company_settings",
      entityId: company.id,
      description: `Updated attendance settings for ${company.name}`,
      metadata: {
        attendanceMode: values.attendanceMode,
        gpsAccuracyThresholdMeters: values.gpsAccuracyThresholdMeters,
        allowedRadiusMeters: values.allowedRadiusMeters,
        requireGps: values.requireGps,
        requireSelfie: values.requireSelfie,
        requireHighAccuracy: values.requireHighAccuracy,
        enableGeofence: values.enableGeofence,
      },
    });
  },
};
