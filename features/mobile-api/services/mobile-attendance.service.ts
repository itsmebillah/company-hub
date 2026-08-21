import "server-only";

import { AttendanceService } from "@/features/attendance/services/attendance.service";
import type {
  AttendanceCheckInput,
  AttendanceRecord,
} from "@/features/attendance/types/attendance.types";
import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";
import { MobileApiError } from "@/features/mobile-api/services/mobile-api-error";
import type {
  MobileAuthContext,
  MobileTrackingState,
} from "@/features/mobile-api/types/mobile-api.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function publicAttendance(record: AttendanceRecord | null) {
  if (!record) return null;
  return {
    id: record.id,
    attendanceDate: record.attendanceDate,
    checkIn: record.checkIn,
    checkOut: record.checkOut,
    status: record.status,
    workingMinutes: record.workingMinutes,
    lateMinutes: record.lateMinutes,
    workMode: record.workMode,
    attendanceType: record.attendanceType,
  };
}

async function getTrackingState(
  attendanceId: string | null,
): Promise<MobileTrackingState> {
  if (!attendanceId) {
    return {
      status: "inactive",
      sessionId: null,
      startedAt: null,
      endedAt: null,
    };
  }
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("location_tracking_sessions")
    .select("id, status, started_at, ended_at")
    .eq("attendance_record_id", attendanceId)
    .maybeSingle();
  if (error) {
    throw new MobileApiError(
      503,
      "tracking_state_unavailable",
      "Attendance state is temporarily unavailable.",
      30,
    );
  }
  if (!data) {
    return {
      status: "inactive",
      sessionId: null,
      startedAt: null,
      endedAt: null,
    };
  }
  return {
    status: data.status,
    sessionId: data.id,
    startedAt: data.started_at,
    endedAt: data.ended_at,
  };
}

async function requireAttendanceFeature(context: MobileAuthContext) {
  if (
    !(await FeatureAccessService.isEnabled(
      context.employee.companyId,
      "attendance",
    ))
  ) {
    throw new MobileApiError(
      403,
      "attendance_unavailable",
      "Attendance is unavailable.",
    );
  }
}

function toAttendanceError(error: unknown): never {
  if (error instanceof MobileApiError) throw error;
  const message = error instanceof Error ? error.message : "";
  if (
    /already checked in|attendance already exists|already checked out/i.test(
      message,
    )
  ) {
    throw new MobileApiError(409, "attendance_conflict", message);
  }
  if (
    /required|invalid|outside|accuracy|holiday|check in before|not configured|not available|too low/i.test(
      message,
    )
  ) {
    throw new MobileApiError(
      400,
      "attendance_rejected",
      message || "Attendance was rejected.",
    );
  }
  throw error;
}

export const MobileAttendanceService = {
  async getState(context: MobileAuthContext) {
    await requireAttendanceFeature(context);
    const today = await AttendanceService.getTodayAttendance();
    return {
      attendanceDate: today.date,
      attendance: publicAttendance(today.record),
      policy: today.policy,
      tracking: await getTrackingState(today.record?.id ?? null),
    };
  },

  async checkIn(context: MobileAuthContext, input: AttendanceCheckInput) {
    await requireAttendanceFeature(context);
    try {
      await AttendanceService.checkIn(input);
      return await this.getState(context);
    } catch (error) {
      toAttendanceError(error);
    }
  },

  async checkOut(context: MobileAuthContext, input: AttendanceCheckInput) {
    await requireAttendanceFeature(context);
    try {
      await AttendanceService.checkOut(input);
      return await this.getState(context);
    } catch (error) {
      toAttendanceError(error);
    }
  },
};
