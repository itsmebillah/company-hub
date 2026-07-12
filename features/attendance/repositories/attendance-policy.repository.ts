import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AttendanceSettingsValues } from "@/features/attendance/types/attendance.types";

const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettingsValues = {
  attendanceMode: "company_location",
  officeStartTime: "09:30",
  officeEndTime: "18:00",
  officeGracePeriodMinutes: 10,
  gpsAccuracyThresholdMeters: 50,
  allowedRadiusMeters: 100,
  allowEarlyCheckInMinutes: 0,
  allowLateCheckOut: false,
  weekendWorkingEnabled: false,
  requireGps: true,
  requireSelfie: false,
  requireHighAccuracy: true,
  enableGeofence: true,
  faceVerificationEnabled: false,
  wifiValidationEnabled: false,
  bluetoothBeaconEnabled: false,
};

export const AttendancePolicyRepository = {
  async getSettings(companyId: string): Promise<AttendanceSettingsValues> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

    if (error) {
      console.error(
        "[AttendancePolicyRepository.getSettings] Unable to load attendance settings.",
        {
          companyId,
          error,
        },
      );
      throw new Error("Unable to load attendance settings.");
    }

    return {
      attendanceMode:
        data?.attendance_mode ?? DEFAULT_ATTENDANCE_SETTINGS.attendanceMode,
      officeStartTime:
        data?.office_start_time ?? DEFAULT_ATTENDANCE_SETTINGS.officeStartTime,
      officeEndTime:
        data?.office_end_time ?? DEFAULT_ATTENDANCE_SETTINGS.officeEndTime,
      officeGracePeriodMinutes:
        data?.office_grace_period_minutes ??
        DEFAULT_ATTENDANCE_SETTINGS.officeGracePeriodMinutes,
      gpsAccuracyThresholdMeters:
        data?.gps_accuracy_threshold_meters ??
        DEFAULT_ATTENDANCE_SETTINGS.gpsAccuracyThresholdMeters,
      allowedRadiusMeters:
        data?.allowed_radius_meters ??
        DEFAULT_ATTENDANCE_SETTINGS.allowedRadiusMeters,
      allowEarlyCheckInMinutes:
        data?.allow_early_check_in_minutes ??
        DEFAULT_ATTENDANCE_SETTINGS.allowEarlyCheckInMinutes,
      allowLateCheckOut:
        data?.allow_late_check_out ??
        DEFAULT_ATTENDANCE_SETTINGS.allowLateCheckOut,
      weekendWorkingEnabled:
        data?.weekend_working_enabled ??
        DEFAULT_ATTENDANCE_SETTINGS.weekendWorkingEnabled,
      requireGps:
        data?.require_gps ?? DEFAULT_ATTENDANCE_SETTINGS.requireGps,
      requireSelfie:
        data?.require_selfie ?? DEFAULT_ATTENDANCE_SETTINGS.requireSelfie,
      requireHighAccuracy:
        data?.require_high_accuracy ??
        DEFAULT_ATTENDANCE_SETTINGS.requireHighAccuracy,
      enableGeofence:
        data?.enable_geofence ??
        DEFAULT_ATTENDANCE_SETTINGS.enableGeofence,
      faceVerificationEnabled:
        data?.face_verification_enabled ??
        DEFAULT_ATTENDANCE_SETTINGS.faceVerificationEnabled,
      wifiValidationEnabled:
        data?.wifi_validation_enabled ??
        DEFAULT_ATTENDANCE_SETTINGS.wifiValidationEnabled,
      bluetoothBeaconEnabled:
        data?.bluetooth_beacon_enabled ??
        DEFAULT_ATTENDANCE_SETTINGS.bluetoothBeaconEnabled,
    };
  },

  async updateSettings(
    companyId: string,
    companyName: string,
    values: AttendanceSettingsValues,
  ) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("company_settings")
      .upsert(
        {
          company_id: companyId,
          company_name: companyName,
          attendance_mode: values.attendanceMode,
          office_start_time: values.officeStartTime,
          office_end_time: values.officeEndTime,
          office_grace_period_minutes: values.officeGracePeriodMinutes,
          gps_accuracy_threshold_meters: values.gpsAccuracyThresholdMeters,
          allowed_radius_meters: values.allowedRadiusMeters,
          allow_early_check_in_minutes: values.allowEarlyCheckInMinutes,
          allow_late_check_out: values.allowLateCheckOut,
          weekend_working_enabled: values.weekendWorkingEnabled,
          require_gps: values.requireGps,
          require_selfie: values.requireSelfie,
          require_high_accuracy: values.requireHighAccuracy,
          enable_geofence: values.enableGeofence,
          face_verification_enabled: values.faceVerificationEnabled,
          wifi_validation_enabled: values.wifiValidationEnabled,
          bluetooth_beacon_enabled: values.bluetoothBeaconEnabled,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id" },
      );

    if (error) {
      console.error(
        "[AttendancePolicyRepository] Unable to save attendance settings.",
        error,
      );
      throw new Error("Unable to save attendance settings.");
    }
  },
};
