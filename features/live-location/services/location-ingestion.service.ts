import "server-only";

import { LocationIngestionRepository } from "@/features/live-location/repositories/location-ingestion.repository";
import {
  LocationIngestionValidationError,
  LocationIngestionValidationService,
} from "@/features/live-location/services/location-ingestion-validation.service";
import type {
  LocationIngestionIdentity,
  LocationIngestionPayload,
  LocationIngestionResult,
} from "@/features/live-location/types/location-ingestion.types";
import { LocationRateLimitService } from "@/features/live-location/services/location-rate-limit.service";

export type LocationIngestionDependencies = {
  findActiveSession: typeof LocationIngestionRepository.findActiveSession;
  findExistingKeys: typeof LocationIngestionRepository.findExistingKeys;
  insertPoints: typeof LocationIngestionRepository.insertPoints;
  consumeRateLimit: typeof LocationRateLimitService.consume;
  now: () => Date;
};

const defaultDependencies: LocationIngestionDependencies = {
  findActiveSession: LocationIngestionRepository.findActiveSession,
  findExistingKeys: LocationIngestionRepository.findExistingKeys,
  insertPoints: LocationIngestionRepository.insertPoints,
  consumeRateLimit: LocationRateLimitService.consume,
  now: () => new Date(),
};

export async function ingestLocationPoints(
  identity: LocationIngestionIdentity,
  payload: LocationIngestionPayload,
  dependencies: LocationIngestionDependencies = defaultDependencies,
): Promise<LocationIngestionResult> {
  const session = await dependencies.findActiveSession(identity);
  if (!session) {
    throw new LocationIngestionValidationError(
      "An active attendance duty session is required.",
      "active_session_required",
      409,
    );
  }
  if (
    session.companyId !== identity.companyId ||
    session.employeeId !== identity.employeeId
  ) {
    throw new LocationIngestionValidationError(
      "The active tracking session is not authorized.",
      "session_not_authorized",
      403,
    );
  }

  LocationIngestionValidationService.assertSessionTimeBounds(
    payload,
    session,
    dependencies.now(),
  );

  const requestedKeys = payload.points.map((point) => point.idempotencyKey);
  const existingBefore = await dependencies.findExistingKeys(
    session.id,
    requestedKeys,
  );
  const missingPoints = payload.points.filter(
    (point) => !existingBefore.has(point.idempotencyKey),
  );
  await dependencies.consumeRateLimit(session, missingPoints.length);
  await dependencies.insertPoints(session, missingPoints);
  const existingAfter = await dependencies.findExistingKeys(
    session.id,
    missingPoints.map((point) => point.idempotencyKey),
  );

  if (missingPoints.some((point) => !existingAfter.has(point.idempotencyKey))) {
    throw new Error("Location point persistence could not be verified.");
  }

  return {
    accepted: missingPoints.length,
    duplicates: existingBefore.size,
    results: payload.points.map((point) => ({
      idempotencyKey: point.idempotencyKey,
      status: existingBefore.has(point.idempotencyKey)
        ? "duplicate"
        : "accepted",
    })),
  };
}

export const LocationIngestionService = { ingest: ingestLocationPoints };
