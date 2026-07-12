import "server-only";

import { logActivity } from "@/features/activity/utils/activity-log";
import { AttendancePolicyRepository } from "@/features/attendance/repositories/attendance-policy.repository";
import type { AttendanceSettingsValues } from "@/features/attendance/types/attendance.types";
import {
  isValidTimeValue,
  parseTimeValueToMinutes,
} from "@/features/attendance/utils/working-hours";
import { CurrentCompanyContextService } from "@/features/auth/services/current-company-context.service";
import { NotificationService } from "@/features/notifications/services/notification.service";

function validateAttendanceSettings(values: AttendanceSettingsValues) {
  if (!isValidTimeValue(values.officeStartTime)) {
    throw new Error("Office start time is invalid.");
  }

  if (!isValidTimeValue(values.officeEndTime)) {
    throw new Error("Office end time is invalid.");
  }

  const officeStartMinutes = parseTimeValueToMinutes(values.officeStartTime);
  const officeEndMinutes = parseTimeValueToMinutes(values.officeEndTime);

  if (
    officeStartMinutes === null ||
    officeEndMinutes === null ||
    officeEndMinutes <= officeStartMinutes
  ) {
    throw new Error("Office end time must be after office start time.");
  }

  if (
    !Number.isInteger(values.officeGracePeriodMinutes) ||
    values.officeGracePeriodMinutes < 0 ||
    values.officeGracePeriodMinutes > 120
  ) {
    throw new Error("Grace period must be between 0 and 120 minutes.");
  }

  if (values.gpsAccuracyThresholdMeters <= 0) {
    throw new Error("GPS accuracy threshold must be greater than 0.");
  }

  if (values.allowedRadiusMeters <= 0) {
    throw new Error("Allowed radius must be greater than 0.");
  }

  if (
    !Number.isInteger(values.allowEarlyCheckInMinutes) ||
    values.allowEarlyCheckInMinutes < 0 ||
    values.allowEarlyCheckInMinutes > 180
  ) {
    throw new Error("Early check-in minutes must be between 0 and 180.");
  }
}

async function getActiveCompany() {
  return CurrentCompanyContextService.requireCurrentCompanyContext();
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
        officeStartTime: values.officeStartTime,
        officeEndTime: values.officeEndTime,
        officeGracePeriodMinutes: values.officeGracePeriodMinutes,
        gpsAccuracyThresholdMeters: values.gpsAccuracyThresholdMeters,
        allowedRadiusMeters: values.allowedRadiusMeters,
        allowEarlyCheckInMinutes: values.allowEarlyCheckInMinutes,
        allowLateCheckOut: values.allowLateCheckOut,
        weekendWorkingEnabled: values.weekendWorkingEnabled,
        requireGps: values.requireGps,
        requireSelfie: values.requireSelfie,
        requireHighAccuracy: values.requireHighAccuracy,
        enableGeofence: values.enableGeofence,
      },
    });
  },
};
