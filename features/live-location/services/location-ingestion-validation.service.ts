import { LOCATION_INGESTION_LIMITS } from "@/features/live-location/constants/location-ingestion.constants";
import type {
  ActiveTrackingSession,
  LocationIngestionPayload,
  LocationPointInput,
} from "@/features/live-location/types/location-ingestion.types";

export class LocationIngestionValidationError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = "LocationIngestionValidationError";
  }
}

const forbiddenIdentityKeys = new Set([
  "company_id",
  "companyId",
  "employee_id",
  "employeeId",
  "attendance_id",
  "attendanceId",
  "session_id",
  "sessionId",
  "tracking_session_id",
  "trackingSessionId",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireFiniteNumber(
  value: unknown,
  name: string,
  minimum: number,
  maximum: number,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new LocationIngestionValidationError(
      `${name} is outside the accepted technical bounds.`,
      `invalid_${name}`,
    );
  }
  return value;
}

function rejectClientIdentity(value: Record<string, unknown>) {
  if (Object.keys(value).some((key) => forbiddenIdentityKeys.has(key))) {
    throw new LocationIngestionValidationError(
      "Tracking identity must be derived by the server.",
      "client_identity_forbidden",
    );
  }
}

function parsePoint(value: unknown): LocationPointInput {
  if (!isRecord(value)) {
    throw new LocationIngestionValidationError(
      "Each location point must be an object.",
      "invalid_point",
    );
  }
  rejectClientIdentity(value);

  const idempotencyKey = value.idempotencyKey;
  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.length < LOCATION_INGESTION_LIMITS.minIdempotencyKeyLength ||
    idempotencyKey.length > LOCATION_INGESTION_LIMITS.maxIdempotencyKeyLength ||
    !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey)
  ) {
    throw new LocationIngestionValidationError(
      "The point idempotency key is invalid.",
      "invalid_idempotency_key",
    );
  }

  if (typeof value.observedAt !== "string") {
    throw new LocationIngestionValidationError(
      "The observation timestamp is invalid.",
      "invalid_timestamp",
    );
  }
  const observedAt = new Date(value.observedAt);
  if (Number.isNaN(observedAt.getTime())) {
    throw new LocationIngestionValidationError(
      "The observation timestamp is invalid.",
      "invalid_timestamp",
    );
  }

  const point: LocationPointInput = {
    idempotencyKey,
    observedAt: observedAt.toISOString(),
    latitude: requireFiniteNumber(value.latitude, "latitude", -90, 90),
    longitude: requireFiniteNumber(value.longitude, "longitude", -180, 180),
    accuracyMeters: requireFiniteNumber(
      value.accuracyMeters,
      "accuracy",
      0,
      LOCATION_INGESTION_LIMITS.maxAccuracyMeters,
    ),
  };

  if (value.speedMetersPerSecond !== undefined) {
    point.speedMetersPerSecond = requireFiniteNumber(
      value.speedMetersPerSecond,
      "speed",
      0,
      LOCATION_INGESTION_LIMITS.maxSpeedMetersPerSecond,
    );
  }
  if (value.headingDegrees !== undefined) {
    point.headingDegrees = requireFiniteNumber(
      value.headingDegrees,
      "heading",
      0,
      360,
    );
  }
  if (value.batteryPercent !== undefined) {
    point.batteryPercent = requireFiniteNumber(
      value.batteryPercent,
      "battery",
      0,
      100,
    );
  }
  if (value.isMockLocation !== undefined) {
    if (typeof value.isMockLocation !== "boolean") {
      throw new LocationIngestionValidationError(
        "The mock-location signal is invalid.",
        "invalid_mock_location",
      );
    }
    point.isMockLocation = value.isMockLocation;
  }

  return point;
}

export const LocationIngestionValidationService = {
  assertRequestSize(byteLength: number) {
    if (byteLength > LOCATION_INGESTION_LIMITS.maxRequestBytes) {
      throw new LocationIngestionValidationError(
        "The location payload exceeds the technical request limit.",
        "payload_too_large",
        413,
      );
    }
  },

  parsePayload(value: unknown): LocationIngestionPayload {
    if (!isRecord(value)) {
      throw new LocationIngestionValidationError(
        "The location payload is invalid.",
        "invalid_payload",
      );
    }
    rejectClientIdentity(value);
    if (!Array.isArray(value.points) || value.points.length === 0) {
      throw new LocationIngestionValidationError(
        "At least one location point is required.",
        "empty_batch",
      );
    }
    if (value.points.length > LOCATION_INGESTION_LIMITS.maxBatchSize) {
      throw new LocationIngestionValidationError(
        "The location batch exceeds the technical point limit.",
        "batch_too_large",
        413,
      );
    }
    const points = value.points.map(parsePoint);
    const keys = new Set<string>();
    let previousTimestamp = Number.NEGATIVE_INFINITY;
    for (const point of points) {
      if (keys.has(point.idempotencyKey)) {
        throw new LocationIngestionValidationError(
          "A location batch cannot repeat an idempotency key.",
          "duplicate_batch_key",
        );
      }
      keys.add(point.idempotencyKey);
      const timestamp = Date.parse(point.observedAt);
      if (timestamp < previousTimestamp) {
        throw new LocationIngestionValidationError(
          "Location points must be ordered by observation time.",
          "batch_out_of_order",
        );
      }
      previousTimestamp = timestamp;
    }
    return { points };
  },

  assertSessionTimeBounds(
    payload: LocationIngestionPayload,
    session: ActiveTrackingSession,
    now: Date,
  ) {
    const sessionStart = Date.parse(session.startedAt);
    const latestAllowed =
      now.getTime() + LOCATION_INGESTION_LIMITS.maxFutureClockSkewMs;
    for (const point of payload.points) {
      const timestamp = Date.parse(point.observedAt);
      if (timestamp < sessionStart || timestamp > latestAllowed) {
        throw new LocationIngestionValidationError(
          "A location timestamp is outside the active duty bounds.",
          "timestamp_outside_session",
        );
      }
    }
  },
};
