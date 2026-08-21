import "server-only";

import type {
  ActiveTrackingSession,
  LocationIngestionIdentity,
  LocationPointInput,
} from "@/features/live-location/types/location-ingestion.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const LocationIngestionRepository = {
  async findActiveSession(
    identity: LocationIngestionIdentity,
  ): Promise<ActiveTrackingSession | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("location_tracking_sessions")
      .select(
        "id, company_id, employee_id, attendance_record_id, started_at, attendance_records!inner(check_in, check_out)",
      )
      .eq("company_id", identity.companyId)
      .eq("employee_id", identity.employeeId)
      .eq("status", "active")
      .is("ended_at", null)
      .not("attendance_records.check_in", "is", null)
      .is("attendance_records.check_out", null)
      .maybeSingle();

    if (error) {
      throw new Error("Unable to resolve the active tracking session.");
    }
    if (!data) return null;

    return {
      id: data.id,
      companyId: data.company_id,
      employeeId: data.employee_id,
      attendanceRecordId: data.attendance_record_id,
      startedAt: data.started_at,
    };
  },

  async findExistingKeys(sessionId: string, keys: string[]) {
    if (keys.length === 0) return new Set<string>();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("location_history")
      .select("idempotency_key")
      .eq("tracking_session_id", sessionId)
      .in("idempotency_key", keys);

    if (error) throw new Error("Unable to verify location replay state.");
    return new Set(data.map((item) => item.idempotency_key));
  },

  async insertPoints(
    session: ActiveTrackingSession,
    points: LocationPointInput[],
  ) {
    if (points.length === 0) return;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("location_history").upsert(
      points.map((point) => ({
        company_id: session.companyId,
        employee_id: session.employeeId,
        tracking_session_id: session.id,
        idempotency_key: point.idempotencyKey,
        observed_at: point.observedAt,
        latitude: point.latitude,
        longitude: point.longitude,
        accuracy_meters: point.accuracyMeters,
        speed_meters_per_second: point.speedMetersPerSecond ?? null,
        heading_degrees: point.headingDegrees ?? null,
        battery_percent: point.batteryPercent ?? null,
        is_mock_location: point.isMockLocation ?? null,
      })),
      {
        onConflict: "tracking_session_id,idempotency_key",
        ignoreDuplicates: true,
      },
    );

    if (error) {
      throw new Error(
        "Location points were not accepted for the active duty session.",
      );
    }
  },
};
