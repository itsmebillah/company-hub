import { MobileApiError } from "@/features/mobile-api/services/mobile-api-error";

const MAX_AUTH_BODY_BYTES = 8 * 1024;
const MAX_ATTENDANCE_BODY_BYTES = 16 * 1024;

async function parseJsonObject(request: Request, maxBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new MobileApiError(
      400,
      "payload_too_large",
      "The request is too large.",
    );
  }
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new MobileApiError(
      400,
      "payload_too_large",
      "The request is too large.",
    );
  }
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("not_object");
    }
    return value as Record<string, unknown>;
  } catch {
    throw new MobileApiError(
      400,
      "invalid_json",
      "The request body is invalid.",
    );
  }
}

function assertOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new MobileApiError(
      400,
      "unsupported_field",
      "The request contains unsupported fields.",
    );
  }
}

export const MobileRequestService = {
  async parseLogin(request: Request) {
    const value = await parseJsonObject(request, MAX_AUTH_BODY_BYTES);
    assertOnlyKeys(value, ["employeeId", "password"]);
    if (typeof value.employeeId !== "string" || !value.employeeId.trim()) {
      throw new MobileApiError(
        400,
        "employee_id_required",
        "Employee ID is required.",
      );
    }
    if (typeof value.password !== "string" || !value.password) {
      throw new MobileApiError(
        400,
        "password_required",
        "Password is required.",
      );
    }
    return { employeeId: value.employeeId.trim(), password: value.password };
  },

  async parseRefresh(request: Request) {
    const value = await parseJsonObject(request, MAX_AUTH_BODY_BYTES);
    assertOnlyKeys(value, ["refreshToken"]);
    if (typeof value.refreshToken !== "string" || !value.refreshToken.trim()) {
      throw new MobileApiError(
        400,
        "refresh_token_required",
        "A refresh token is required.",
      );
    }
    return value.refreshToken.trim();
  },

  async parseAttendance(request: Request) {
    const value = await parseJsonObject(request, MAX_ATTENDANCE_BODY_BYTES);
    assertOnlyKeys(value, ["notes", "gps", "selfiePath", "deviceInfo"]);
    if (value.notes !== undefined && typeof value.notes !== "string") {
      throw new MobileApiError(
        400,
        "invalid_attendance_input",
        "Attendance input is invalid.",
      );
    }
    if (
      value.selfiePath !== undefined &&
      typeof value.selfiePath !== "string"
    ) {
      throw new MobileApiError(
        400,
        "invalid_attendance_input",
        "Attendance input is invalid.",
      );
    }
    if (value.gps !== undefined) {
      if (
        !value.gps ||
        typeof value.gps !== "object" ||
        Array.isArray(value.gps)
      ) {
        throw new MobileApiError(
          400,
          "invalid_attendance_input",
          "Attendance input is invalid.",
        );
      }
      const gps = value.gps as Record<string, unknown>;
      assertOnlyKeys(gps, [
        "latitude",
        "longitude",
        "accuracy",
        "timestamp",
        "address",
        "source",
      ]);
      if (
        ![gps.latitude, gps.longitude, gps.accuracy].every(
          (item) => typeof item === "number",
        )
      ) {
        throw new MobileApiError(
          400,
          "invalid_attendance_input",
          "Attendance input is invalid.",
        );
      }
    }
    if (value.deviceInfo !== undefined) {
      if (
        !value.deviceInfo ||
        typeof value.deviceInfo !== "object" ||
        Array.isArray(value.deviceInfo)
      ) {
        throw new MobileApiError(
          400,
          "invalid_attendance_input",
          "Attendance input is invalid.",
        );
      }
      const device = value.deviceInfo as Record<string, unknown>;
      assertOnlyKeys(device, ["browser", "platform"]);
      if (
        typeof device.browser !== "string" ||
        typeof device.platform !== "string"
      ) {
        throw new MobileApiError(
          400,
          "invalid_attendance_input",
          "Attendance input is invalid.",
        );
      }
    }
    return value;
  },
};
