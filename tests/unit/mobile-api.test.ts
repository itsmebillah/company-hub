import assert from "node:assert/strict";
import test from "node:test";

import { RequestAuthContextService } from "@/features/auth/services/request-auth-context.service";
import {
  MobileApiError,
  mobileErrorResponse,
} from "@/features/mobile-api/services/mobile-api-error";
import { MobileRequestService } from "@/features/mobile-api/services/mobile-request.service";
import type { User } from "@supabase/supabase-js";

function jsonRequest(path: string, body: unknown, headers?: HeadersInit) {
  return new Request(`https://qa.company-hub.invalid${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

test("login accepts only Employee ID and password", async () => {
  const parsed = await MobileRequestService.parseLogin(
    jsonRequest("/api/mobile/v1/auth/session", {
      employeeId: " QA-001 ",
      password: "private-value",
    }),
  );
  assert.deepEqual(parsed, { employeeId: "QA-001", password: "private-value" });
});

test("login rejects missing credentials and client-supplied identity", async () => {
  await assert.rejects(
    MobileRequestService.parseLogin(
      jsonRequest("/login", { employeeId: "QA-001" }),
    ),
    (error: unknown) =>
      error instanceof MobileApiError && error.code === "password_required",
  );
  await assert.rejects(
    MobileRequestService.parseLogin(
      jsonRequest("/login", {
        employeeId: "QA-001",
        password: "value",
        companyId: "forged",
      }),
    ),
    (error: unknown) =>
      error instanceof MobileApiError && error.code === "unsupported_field",
  );
});

test("refresh accepts only one non-empty refresh token", async () => {
  assert.equal(
    await MobileRequestService.parseRefresh(
      jsonRequest("/refresh", { refreshToken: "token-value" }),
    ),
    "token-value",
  );
  await assert.rejects(
    MobileRequestService.parseRefresh(
      jsonRequest("/refresh", {
        refreshToken: "token-value",
        employeeId: "forged",
      }),
    ),
    (error: unknown) =>
      error instanceof MobileApiError && error.code === "unsupported_field",
  );
});

test("attendance rejects forged identity and session fields", async () => {
  for (const field of [
    "employeeId",
    "companyId",
    "attendanceId",
    "trackingSessionId",
  ]) {
    await assert.rejects(
      MobileRequestService.parseAttendance(
        jsonRequest("/attendance", { [field]: "forged" }),
      ),
      (error: unknown) =>
        error instanceof MobileApiError && error.code === "unsupported_field",
    );
  }
});

test("attendance accepts the existing GPS and device input shape", async () => {
  const parsed = await MobileRequestService.parseAttendance(
    jsonRequest("/attendance", {
      notes: "QA",
      gps: { latitude: 23.81, longitude: 90.41, accuracy: 10 },
      deviceInfo: { browser: "Company Hub Android", platform: "Android" },
    }),
  );
  assert.equal((parsed.gps as { accuracy: number }).accuracy, 10);
});

test("attendance rejects malformed GPS and device input", async () => {
  await assert.rejects(
    MobileRequestService.parseAttendance(
      jsonRequest("/attendance", {
        gps: { latitude: "23", longitude: 90, accuracy: 10 },
      }),
    ),
    (error: unknown) =>
      error instanceof MobileApiError &&
      error.code === "invalid_attendance_input",
  );
  await assert.rejects(
    MobileRequestService.parseAttendance(
      jsonRequest("/attendance", { deviceInfo: { browser: "x" } }),
    ),
    (error: unknown) =>
      error instanceof MobileApiError &&
      error.code === "invalid_attendance_input",
  );
});

test("request bodies are bounded before parsing", async () => {
  await assert.rejects(
    MobileRequestService.parseLogin(
      jsonRequest(
        "/login",
        { employeeId: "QA", password: "x" },
        { "content-length": "9000" },
      ),
    ),
    (error: unknown) =>
      error instanceof MobileApiError && error.code === "payload_too_large",
  );
});

test("typed errors expose only safe code and message", async () => {
  const secret = "never-return-this-token";
  const response = mobileErrorResponse(
    new MobileApiError(401, "session_expired", "Sign in again."),
  );
  assert.equal(response.status, 401);
  assert.doesNotMatch(await response.text(), new RegExp(secret));
});

test("unexpected errors redact provider details from response and logs", async () => {
  const secret = "provider-secret-value";
  const captured: unknown[][] = [];
  const original = console.error;
  console.error = (...values: unknown[]) => captured.push(values);
  try {
    const response = mobileErrorResponse(new Error(secret));
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), new RegExp(secret));
    assert.doesNotMatch(JSON.stringify(captured), new RegExp(secret));
  } finally {
    console.error = original;
  }
});

test("bearer request context is isolated and removed after completion", async () => {
  const user = { id: "auth-user-a" } as User;
  assert.equal(RequestAuthContextService.getAuthUser(), null);
  const id = await RequestAuthContextService.runWithAuthUser(
    user,
    async () => RequestAuthContextService.getAuthUser()?.id,
  );
  assert.equal(id, "auth-user-a");
  assert.equal(RequestAuthContextService.getAuthUser(), null);
});

test("concurrent bearer request contexts do not cross identities", async () => {
  const ids = await Promise.all(
    ["auth-a", "auth-b"].map((id) =>
      RequestAuthContextService.runWithAuthUser({ id } as User, async () => {
        await new Promise((resolve) =>
          setTimeout(resolve, id === "auth-a" ? 5 : 1),
        );
        return RequestAuthContextService.getAuthUser()?.id;
      }),
    ),
  );
  assert.deepEqual(ids, ["auth-a", "auth-b"]);
});
