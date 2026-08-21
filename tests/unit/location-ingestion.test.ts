import assert from "node:assert/strict";
import test from "node:test";

import { LOCATION_INGESTION_LIMITS } from "@/features/live-location/constants/location-ingestion.constants";
import { handleLocationIngestionRequest } from "@/features/live-location/services/location-ingestion-http.service";
import {
  ingestLocationPoints,
  type LocationIngestionDependencies,
} from "@/features/live-location/services/location-ingestion.service";
import {
  LocationIngestionValidationError,
  LocationIngestionValidationService,
} from "@/features/live-location/services/location-ingestion-validation.service";
import {
  LocationRateLimitExceededError,
  LocationRateLimitUnavailableError,
} from "@/features/live-location/services/location-rate-limit.service";
import type {
  ActiveTrackingSession,
  LocationIngestionPayload,
  LocationPointInput,
} from "@/features/live-location/types/location-ingestion.types";

const now = new Date("2026-08-21T10:00:00.000Z");
const session: ActiveTrackingSession = {
  id: "session-a",
  companyId: "company-a",
  employeeId: "employee-a",
  attendanceRecordId: "attendance-a",
  startedAt: "2026-08-21T09:00:00.000Z",
};

function point(
  idempotencyKey: string,
  observedAt = "2026-08-21T09:30:00.000Z",
): LocationPointInput {
  return {
    idempotencyKey,
    observedAt,
    latitude: 23.8103,
    longitude: 90.4125,
    accuracyMeters: 12,
  };
}

function payload(...points: LocationPointInput[]): LocationIngestionPayload {
  return { points };
}

function createRepositoryHarness(
  activeSession: ActiveTrackingSession | null = session,
) {
  const stored = new Map<string, Set<string>>();
  const dependencies: LocationIngestionDependencies = {
    async findActiveSession() {
      return activeSession;
    },
    async findExistingKeys(sessionId, keys) {
      const sessionKeys = stored.get(sessionId) ?? new Set<string>();
      return new Set(keys.filter((key) => sessionKeys.has(key)));
    },
    async insertPoints(targetSession, points) {
      const sessionKeys = stored.get(targetSession.id) ?? new Set<string>();
      points.forEach((item) => sessionKeys.add(item.idempotencyKey));
      stored.set(targetSession.id, sessionKeys);
    },
    async consumeRateLimit() {},
    now: () => now,
  };
  return { dependencies, stored };
}

function expectValidationCode(callback: () => unknown, code: string) {
  assert.throws(callback, (error: unknown) => {
    return (
      error instanceof LocationIngestionValidationError && error.code === code
    );
  });
}

test("accepts a valid first submission and verifies persistence", async () => {
  const harness = createRepositoryHarness();
  const result = await ingestLocationPoints(
    { companyId: "company-a", employeeId: "employee-a" },
    payload(point("point-0001")),
    harness.dependencies,
  );
  assert.deepEqual(result, {
    accepted: 1,
    duplicates: 0,
    results: [{ idempotencyKey: "point-0001", status: "accepted" }],
  });
});

test("replaying the same point and batch is deterministic", async () => {
  const harness = createRepositoryHarness();
  const batch = payload(point("point-0001"), point("point-0002"));
  await ingestLocationPoints(
    { companyId: "company-a", employeeId: "employee-a" },
    batch,
    harness.dependencies,
  );
  const replay = await ingestLocationPoints(
    { companyId: "company-a", employeeId: "employee-a" },
    batch,
    harness.dependencies,
  );
  assert.equal(replay.accepted, 0);
  assert.equal(replay.duplicates, 2);
  assert.ok(replay.results.every((item) => item.status === "duplicate"));
});

test("partial retry inserts only previously missing points", async () => {
  const harness = createRepositoryHarness();
  await ingestLocationPoints(
    { companyId: "company-a", employeeId: "employee-a" },
    payload(point("point-0001")),
    harness.dependencies,
  );
  const result = await ingestLocationPoints(
    { companyId: "company-a", employeeId: "employee-a" },
    payload(point("point-0001"), point("point-0002")),
    harness.dependencies,
  );
  assert.equal(result.accepted, 1);
  assert.equal(result.duplicates, 1);
});

test("the same idempotency key remains independent across sessions", async () => {
  const first = createRepositoryHarness(session);
  const sharedStored = first.stored;
  await ingestLocationPoints(
    { companyId: "company-a", employeeId: "employee-a" },
    payload(point("shared-key")),
    first.dependencies,
  );
  const secondSession = {
    ...session,
    id: "session-b",
    attendanceRecordId: "attendance-b",
  };
  const second = createRepositoryHarness(secondSession);
  second.dependencies.findExistingKeys = async (sessionId, keys) => {
    const values = sharedStored.get(sessionId) ?? new Set<string>();
    return new Set(keys.filter((key) => values.has(key)));
  };
  second.dependencies.insertPoints = async (targetSession, points) => {
    sharedStored.set(
      targetSession.id,
      new Set(points.map((item) => item.idempotencyKey)),
    );
  };
  const result = await ingestLocationPoints(
    { companyId: "company-a", employeeId: "employee-a" },
    payload(point("shared-key")),
    second.dependencies,
  );
  assert.equal(result.accepted, 1);
});

test("rejects missing, checked-out, or inactive sessions", async () => {
  const harness = createRepositoryHarness(null);
  await assert.rejects(
    ingestLocationPoints(
      { companyId: "company-a", employeeId: "employee-a" },
      payload(point("point-0001")),
      harness.dependencies,
    ),
    (error: unknown) =>
      error instanceof LocationIngestionValidationError &&
      error.code === "active_session_required",
  );
});

test("rejects cross-company or employee/session ownership mismatch", async () => {
  const harness = createRepositoryHarness(session);
  await assert.rejects(
    ingestLocationPoints(
      { companyId: "company-b", employeeId: "employee-a" },
      payload(point("point-0001")),
      harness.dependencies,
    ),
    (error: unknown) =>
      error instanceof LocationIngestionValidationError &&
      error.code === "session_not_authorized",
  );
});

test("rejects client-supplied identity fields", () => {
  expectValidationCode(
    () =>
      LocationIngestionValidationService.parsePayload({
        sessionId: "client-session",
        points: [point("point-0001")],
      }),
    "client_identity_forbidden",
  );
});

test("rejects invalid coordinate and accuracy bounds", () => {
  for (const [field, value] of [
    ["latitude", 91],
    ["longitude", -181],
    ["accuracyMeters", LOCATION_INGESTION_LIMITS.maxAccuracyMeters + 1],
  ] as const) {
    expectValidationCode(
      () =>
        LocationIngestionValidationService.parsePayload({
          points: [{ ...point("point-0001"), [field]: value }],
        }),
      field === "accuracyMeters" ? "invalid_accuracy" : `invalid_${field}`,
    );
  }
});

test("rejects invalid timestamps and excessive clock skew", () => {
  expectValidationCode(
    () =>
      LocationIngestionValidationService.parsePayload({
        points: [{ ...point("point-0001"), observedAt: "not-a-date" }],
      }),
    "invalid_timestamp",
  );
  expectValidationCode(
    () =>
      LocationIngestionValidationService.assertSessionTimeBounds(
        payload(point("point-0001", "2026-08-21T10:05:00.001Z")),
        session,
        now,
      ),
    "timestamp_outside_session",
  );
  expectValidationCode(
    () =>
      LocationIngestionValidationService.assertSessionTimeBounds(
        payload(point("point-0001", "2026-08-21T08:59:59.999Z")),
        session,
        now,
      ),
    "timestamp_outside_session",
  );
});

test("rejects oversized payloads and batches", () => {
  expectValidationCode(
    () =>
      LocationIngestionValidationService.assertRequestSize(
        LOCATION_INGESTION_LIMITS.maxRequestBytes + 1,
      ),
    "payload_too_large",
  );
  expectValidationCode(
    () =>
      LocationIngestionValidationService.parsePayload({
        points: Array.from(
          { length: LOCATION_INGESTION_LIMITS.maxBatchSize + 1 },
          (_, index) => point(`point-${String(index).padStart(4, "0")}`),
        ),
      }),
    "batch_too_large",
  );
});

test("rejects reordered points and duplicate keys inside one batch", () => {
  expectValidationCode(
    () =>
      LocationIngestionValidationService.parsePayload({
        points: [
          point("point-0001", "2026-08-21T09:31:00.000Z"),
          point("point-0002", "2026-08-21T09:30:00.000Z"),
        ],
      }),
    "batch_out_of_order",
  );
  expectValidationCode(
    () =>
      LocationIngestionValidationService.parsePayload({
        points: [point("point-0001"), point("point-0001")],
      }),
    "duplicate_batch_key",
  );
});

test("route rejects unauthenticated, inactive, and feature-denied callers", async () => {
  const body = JSON.stringify(payload(point("point-0001")));
  const baseDependencies = {
    getEmployee: async () => null,
    isFeatureEnabled: async () => true,
    ingest: async () => ({ accepted: 1, duplicates: 0, results: [] }),
  };
  const unauthenticated = await handleLocationIngestionRequest(
    new Request("http://localhost/api/location/points", {
      method: "POST",
      body,
    }),
    baseDependencies,
  );
  assert.equal(unauthenticated.status, 401);

  const employee = {
    employeeId: "employee-a",
    companyId: "company-a",
    status: "inactive" as const,
  };
  const inactive = await handleLocationIngestionRequest(
    new Request("http://localhost/api/location/points", {
      method: "POST",
      body,
    }),
    { ...baseDependencies, getEmployee: async () => employee },
  );
  assert.equal(inactive.status, 403);

  const denied = await handleLocationIngestionRequest(
    new Request("http://localhost/api/location/points", {
      method: "POST",
      body,
    }),
    {
      ...baseDependencies,
      getEmployee: async () => ({ ...employee, status: "active" as const }),
      isFeatureEnabled: async () => false,
    },
  );
  assert.equal(denied.status, 403);
});

test("route passes only server-derived identity to ingestion", async () => {
  let receivedIdentity: unknown;
  const response = await handleLocationIngestionRequest(
    new Request("http://localhost/api/location/points", {
      method: "POST",
      body: JSON.stringify(payload(point("point-0001"))),
    }),
    {
      getEmployee: async () => ({
        employeeId: "employee-a",
        companyId: "company-a",
        status: "active",
      }),
      isFeatureEnabled: async () => true,
      ingest: async (identity) => {
        receivedIdentity = identity;
        return { accepted: 1, duplicates: 0, results: [] };
      },
    },
  );
  assert.equal(response.status, 202);
  assert.deepEqual(receivedIdentity, {
    companyId: "company-a",
    employeeId: "employee-a",
  });
});

test("validation and route errors never include coordinates", async () => {
  const latitude = "91.123456";
  const response = await handleLocationIngestionRequest(
    new Request("http://localhost/api/location/points", {
      method: "POST",
      body: JSON.stringify({
        points: [{ ...point("point-0001"), latitude: Number(latitude) }],
      }),
    }),
    {
      getEmployee: async () => ({
        employeeId: "employee-a",
        companyId: "company-a",
        status: "active",
      }),
      isFeatureEnabled: async () => true,
      ingest: async () => ({ accepted: 0, duplicates: 0, results: [] }),
    },
  );
  assert.equal(response.status, 400);
  assert.doesNotMatch(await response.text(), new RegExp(latitude));
});

test("unexpected provider errors do not leak coordinates to logs or responses", async () => {
  const coordinate = "23.810300";
  const captured: unknown[][] = [];
  const originalConsoleError = console.error;
  console.error = (...values: unknown[]) => captured.push(values);
  try {
    const response = await handleLocationIngestionRequest(
      new Request("http://localhost/api/location/points", {
        method: "POST",
        body: JSON.stringify(payload(point("point-0001"))),
      }),
      {
        getEmployee: async () => ({
          employeeId: "employee-a",
          companyId: "company-a",
          status: "active",
        }),
        isFeatureEnabled: async () => true,
        ingest: async () => {
          throw new Error(`provider rejected coordinate ${coordinate}`);
        },
      },
    );
    assert.equal(response.status, 500);
    assert.doesNotMatch(await response.text(), new RegExp(coordinate));
    assert.doesNotMatch(JSON.stringify(captured), new RegExp(coordinate));
  } finally {
    console.error = originalConsoleError;
  }
});

test("rate-limit denial returns retry guidance without ingesting points", async () => {
  const harness = createRepositoryHarness();
  let inserted = false;
  harness.dependencies.consumeRateLimit = async () => {
    throw new LocationRateLimitExceededError(17);
  };
  harness.dependencies.insertPoints = async () => {
    inserted = true;
  };

  const response = await handleLocationIngestionRequest(
    new Request("http://localhost/api/location/points", {
      method: "POST",
      body: JSON.stringify(payload(point("point-0001"))),
    }),
    {
      getEmployee: async () => ({
        employeeId: "employee-a",
        companyId: "company-a",
        status: "active",
      }),
      isFeatureEnabled: async () => true,
      ingest: (identity, points) =>
        ingestLocationPoints(identity, points, harness.dependencies),
    },
  );
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "17");
  assert.equal(inserted, false);
});

test("rate-limit backend failure fails closed with a retryable response", async () => {
  const response = await handleLocationIngestionRequest(
    new Request("http://localhost/api/location/points", {
      method: "POST",
      body: JSON.stringify(payload(point("point-0001"))),
    }),
    {
      getEmployee: async () => ({
        employeeId: "employee-a",
        companyId: "company-a",
        status: "active",
      }),
      isFeatureEnabled: async () => true,
      ingest: async () => {
        throw new LocationRateLimitUnavailableError();
      },
    },
  );
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Retry-After"), "30");
});
