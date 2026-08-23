import assert from "node:assert/strict";

import { getAppDateString } from "@/lib/datetime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const QA_PROJECT_REF = "xbdyvhlhubvuzhdzkadj";
const QA_API_ORIGINS = new Set([
  "http://127.0.0.1:3101",
  "https://company-hub-qa.onrender.com",
]);
const baseUrl = (
  process.env.MOBILE_API_QA_BASE_URL ?? "http://127.0.0.1:3101"
)
  .trim()
  .replace(/\/+$/, "");
let verificationStage = "bootstrap";

const MobileHttpService = {
  login: fetch,
  refresh: fetch,
  logout: fetch,
  attendanceState: fetch,
  checkIn: fetch,
  checkOut: fetch,
};

function requireQaEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const employeeId = process.env.PLAYWRIGHT_QA_EMPLOYEE_ID;
  if (!QA_API_ORIGINS.has(baseUrl)) {
    throw new Error("Mobile API verification requires an approved QA origin.");
  }
  if (!url || new URL(url).hostname.split(".")[0] !== QA_PROJECT_REF) {
    throw new Error(
      "Mobile API verification requires the isolated QA project.",
    );
  }
  if (!employeeId || process.env.PLAYWRIGHT_ALLOW_QA_MUTATIONS !== "true") {
    throw new Error("Synthetic QA identity and mutation opt-in are required.");
  }
  return employeeId;
}

function jsonRequest(
  path: string,
  method: string,
  body?: unknown,
  token?: string,
) {
  return new Request(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

async function removeDisposableAttendance(employeeUuid: string, date: string) {
  const admin = createSupabaseAdminClient();
  const { data: records, error } = await admin
    .from("attendance_records")
    .select("id")
    .eq("employee_id", employeeUuid)
    .eq("attendance_date", date);
  if (error) throw new Error("Unable to inspect disposable QA attendance.");
  for (const record of records) {
    const { data: sessions, error: sessionError } = await admin
      .from("location_tracking_sessions")
      .select("id")
      .eq("attendance_record_id", record.id);
    if (sessionError)
      throw new Error("Unable to inspect disposable QA tracking sessions.");
    for (const session of sessions) {
      await admin
        .from("employee_current_locations")
        .delete()
        .eq("tracking_session_id", session.id);
      await admin
        .from("location_history")
        .delete()
        .eq("tracking_session_id", session.id);
    }
    if (sessions.length > 0) {
      const { error: deleteSessionError } = await admin
        .from("location_tracking_sessions")
        .delete()
        .in(
          "id",
          sessions.map((session) => session.id),
        );
      if (deleteSessionError)
        throw new Error("Unable to clean disposable QA tracking sessions.");
    }
    const { error: deleteAttendanceError } = await admin
      .from("attendance_records")
      .delete()
      .eq("id", record.id);
    if (deleteAttendanceError)
      throw new Error("Unable to clean disposable QA attendance.");
  }
}

async function main() {
  verificationStage = "environment";
  const employeeCode = requireQaEnvironment();
  const admin = createSupabaseAdminClient();
  verificationStage = "employee lookup";
  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select("id, company_id, status")
    .eq("employee_id", employeeCode)
    .single();
  assert.equal(employeeError, null);
  assert.equal(employee.status, "active");

  verificationStage = "settings snapshot";
  const { data: settings, error: settingsError } = await admin
    .from("company_settings")
    .select(
      "attendance_mode, require_selfie, require_gps, require_high_accuracy, enable_geofence, office_start_time, office_end_time, allow_early_check_in_minutes, allow_late_check_out, weekend_working_enabled, working_days",
    )
    .eq("company_id", employee.company_id)
    .single();
  assert.equal(settingsError, null);

  const today = getAppDateString();
  let accessToken = "";
  let refreshToken = "";
  try {
    verificationStage = "cleanup before test";
    await removeDisposableAttendance(employee.id, today);
    verificationStage = "temporary settings";
    const { error: updateError } = await admin
      .from("company_settings")
      .update({
        attendance_mode: "remote",
        require_selfie: false,
        require_gps: false,
        require_high_accuracy: false,
        enable_geofence: false,
        office_start_time: "00:00",
        office_end_time: "23:59",
        allow_early_check_in_minutes: 180,
        allow_late_check_out: true,
        weekend_working_enabled: true,
        working_days: [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ],
      })
      .eq("company_id", employee.company_id);
    if (updateError)
      verificationStage = `temporary settings (${updateError.code})`;
    assert.equal(updateError, null);

    verificationStage = "inactive employee denial";
    const { error: deactivateError } = await admin
      .from("employees")
      .update({ status: "inactive" })
      .eq("id", employee.id);
    assert.equal(deactivateError, null);
    const inactive = await MobileHttpService.login(
      jsonRequest("/api/mobile/v1/auth/session", "POST", {
        employeeId: employeeCode,
        password: employeeCode,
      }),
    );
    assert.equal(inactive.status, 401);
    const { error: reactivateError } = await admin
      .from("employees")
      .update({ status: "active" })
      .eq("id", employee.id);
    assert.equal(reactivateError, null);

    verificationStage = "invalid and unknown login";
    const invalid = await MobileHttpService.login(
      jsonRequest("/api/mobile/v1/auth/session", "POST", {
        employeeId: employeeCode,
        password: "definitely-invalid",
      }),
    );
    assert.equal(invalid.status, 401);
    const unknown = await MobileHttpService.login(
      jsonRequest("/api/mobile/v1/auth/session", "POST", {
        employeeId: "COMPANY-HUB-QA-UNKNOWN",
        password: "invalid",
      }),
    );
    assert.equal(unknown.status, 401);
    assert.equal((await json(invalid)).code, (await json(unknown)).code);

    verificationStage = "valid login";
    const login = await MobileHttpService.login(
      jsonRequest("/api/mobile/v1/auth/session", "POST", {
        employeeId: employeeCode,
        password: employeeCode,
      }),
    );
    assert.equal(login.status, 200);
    const session = await json(login);
    accessToken = String(session.accessToken);
    refreshToken = String(session.refreshToken);
    assert.ok(accessToken && refreshToken);
    assert.equal(
      JSON.stringify(session).includes("internal_auth_email"),
      false,
    );

    verificationStage = "signed-out state";
    const signedOutState = await MobileHttpService.attendanceState(
      jsonRequest("/api/mobile/v1/attendance/state", "GET"),
    );
    assert.equal(signedOutState.status, 401);
    const expiredState = await MobileHttpService.attendanceState(
      jsonRequest(
        "/api/mobile/v1/attendance/state",
        "GET",
        undefined,
        "expired-or-forged-token",
      ),
    );
    assert.equal(expiredState.status, 401);

    verificationStage = "initial reconciliation";
    const initialState = await MobileHttpService.attendanceState(
      jsonRequest(
        "/api/mobile/v1/attendance/state",
        "GET",
        undefined,
        accessToken,
      ),
    );
    assert.equal(initialState.status, 200);
    assert.equal((await json(initialState)).attendance, null);

    verificationStage = "check-in";
    const checkIn = await MobileHttpService.checkIn(
      jsonRequest(
        "/api/mobile/v1/attendance/check-in",
        "POST",
        {},
        accessToken,
      ),
    );
    assert.equal(checkIn.status, 201);
    const checkedInState = await json(checkIn);
    assert.equal(
      (checkedInState.tracking as Record<string, unknown>).status,
      "active",
    );
    const attendanceId = String(
      (checkedInState.attendance as Record<string, unknown>).id,
    );
    const { data: activeTrackingSession, error: activeTrackingError } =
      await admin
        .from("location_tracking_sessions")
        .select("id, status, ended_at")
        .eq("attendance_record_id", attendanceId)
        .single();
    assert.equal(activeTrackingError, null);
    assert.equal(activeTrackingSession.status, "active");
    assert.equal(activeTrackingSession.ended_at, null);

    verificationStage = "duplicate check-in";
    const duplicateCheckIn = await MobileHttpService.checkIn(
      jsonRequest(
        "/api/mobile/v1/attendance/check-in",
        "POST",
        {},
        accessToken,
      ),
    );
    assert.equal(duplicateCheckIn.status, 409);

    verificationStage = "refresh";
    const refresh = await MobileHttpService.refresh(
      jsonRequest("/api/mobile/v1/auth/session/refresh", "POST", {
        refreshToken,
      }),
    );
    assert.equal(refresh.status, 200);
    const refreshed = await json(refresh);
    accessToken = String(refreshed.accessToken);
    refreshToken = String(refreshed.refreshToken);

    verificationStage = "check-out";
    const checkOut = await MobileHttpService.checkOut(
      jsonRequest(
        "/api/mobile/v1/attendance/check-out",
        "POST",
        {},
        accessToken,
      ),
    );
    assert.equal(checkOut.status, 200);
    const checkedOutState = await json(checkOut);
    assert.equal(
      (checkedOutState.tracking as Record<string, unknown>).status,
      "completed",
    );
    const { data: completedTrackingSession, error: completedTrackingError } =
      await admin
        .from("location_tracking_sessions")
        .select("id, status, ended_at")
        .eq("attendance_record_id", attendanceId)
        .single();
    assert.equal(completedTrackingError, null);
    assert.equal(completedTrackingSession.status, "completed");
    assert.ok(completedTrackingSession.ended_at);

    verificationStage = "duplicate check-out";
    const duplicateCheckOut = await MobileHttpService.checkOut(
      jsonRequest(
        "/api/mobile/v1/attendance/check-out",
        "POST",
        {},
        accessToken,
      ),
    );
    assert.equal(duplicateCheckOut.status, 409);

    verificationStage = "logout and revocation";
    const logout = await MobileHttpService.logout(
      jsonRequest(
        "/api/mobile/v1/auth/session",
        "DELETE",
        undefined,
        accessToken,
      ),
    );
    assert.equal(logout.status, 204);
    const revokedRefresh = await MobileHttpService.refresh(
      jsonRequest("/api/mobile/v1/auth/session/refresh", "POST", {
        refreshToken,
      }),
    );
    assert.equal(revokedRefresh.status, 401);

    console.log("Mobile API isolated QA verification: PASS");
  } finally {
    await removeDisposableAttendance(employee.id, today);
    await admin
      .from("employees")
      .update({ status: "active" })
      .eq("id", employee.id);
    await admin
      .from("company_settings")
      .update(settings)
      .eq("company_id", employee.company_id);
  }
}

main().catch((error: unknown) => {
  const cause =
    error instanceof Error && "cause" in error
      ? (error.cause as { code?: unknown; name?: unknown } | undefined)
      : undefined;
  console.error("Mobile API isolated QA verification: FAIL", {
    stage: verificationStage,
    errorType: error instanceof Error ? error.name : "unknown_error",
    errorMessage: error instanceof Error ? error.message : "unknown_error",
    causeType: typeof cause?.name === "string" ? cause.name : undefined,
    causeCode: typeof cause?.code === "string" ? cause.code : undefined,
  });
  process.exitCode = 1;
});
