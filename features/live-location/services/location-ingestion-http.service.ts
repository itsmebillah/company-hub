import "server-only";

import {
  LocationIngestionValidationError,
  LocationIngestionValidationService,
} from "@/features/live-location/services/location-ingestion-validation.service";
import type {
  LocationIngestionIdentity,
  LocationIngestionPayload,
  LocationIngestionResult,
} from "@/features/live-location/types/location-ingestion.types";
import {
  LocationRateLimitExceededError,
  LocationRateLimitUnavailableError,
} from "@/features/live-location/services/location-rate-limit.service";

export type LocationRouteEmployee = LocationIngestionIdentity & {
  status: "active" | "inactive" | "archived";
};

export type LocationRouteDependencies = {
  getEmployee: () => Promise<LocationRouteEmployee | null>;
  isFeatureEnabled: (
    companyId: string,
    featureKey: "attendance",
  ) => Promise<boolean>;
  ingest: (
    identity: LocationIngestionIdentity,
    payload: LocationIngestionPayload,
  ) => Promise<LocationIngestionResult>;
};

export async function handleLocationIngestionRequest(
  request: Request,
  dependencies: LocationRouteDependencies,
) {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength) {
      LocationIngestionValidationService.assertRequestSize(
        Number.parseInt(contentLength, 10),
      );
    }
    const employee = await dependencies.getEmployee();
    if (!employee) {
      throw new LocationIngestionValidationError(
        "Authentication is required.",
        "authentication_required",
        401,
      );
    }
    if (employee.status !== "active") {
      throw new LocationIngestionValidationError(
        "An active employee account is required.",
        "active_employee_required",
        403,
      );
    }
    if (
      !(await dependencies.isFeatureEnabled(employee.companyId, "attendance"))
    ) {
      throw new LocationIngestionValidationError(
        "Location ingestion is unavailable.",
        "feature_unavailable",
        403,
      );
    }

    const rawBody = await request.text();
    LocationIngestionValidationService.assertRequestSize(
      Buffer.byteLength(rawBody, "utf8"),
    );
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new LocationIngestionValidationError(
        "The location payload is invalid.",
        "invalid_json",
      );
    }
    const payload = LocationIngestionValidationService.parsePayload(parsed);
    const result = await dependencies.ingest(
      { companyId: employee.companyId, employeeId: employee.employeeId },
      payload,
    );

    return Response.json(result, { status: 202 });
  } catch (error) {
    if (error instanceof LocationIngestionValidationError) {
      return Response.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }
    if (error instanceof LocationRateLimitExceededError) {
      return Response.json(
        {
          code: "location_rate_limited",
          message: error.message,
          retryAfterSeconds: error.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    }
    if (error instanceof LocationRateLimitUnavailableError) {
      return Response.json(
        {
          code: "location_rate_limit_unavailable",
          message: error.message,
        },
        { status: 503, headers: { "Retry-After": "30" } },
      );
    }
    console.error("[LocationIngestion] Request rejected.", {
      errorType: error instanceof Error ? error.name : "unknown_error",
    });
    return Response.json(
      {
        code: "location_ingestion_failed",
        message: "Location points were not accepted.",
      },
      { status: 500 },
    );
  }
}
