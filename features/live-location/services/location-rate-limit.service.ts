import "server-only";

import type { ActiveTrackingSession } from "@/features/live-location/types/location-ingestion.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export class LocationRateLimitExceededError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super(
      "Location ingestion is temporarily rate limited. Retry the same batch later.",
    );
    this.name = "LocationRateLimitExceededError";
  }
}

export class LocationRateLimitUnavailableError extends Error {
  constructor() {
    super(
      "Location ingestion is temporarily unavailable. Retry the same batch later.",
    );
    this.name = "LocationRateLimitUnavailableError";
  }
}

export async function consumeLocationRateLimit(
  session: ActiveTrackingSession,
  newPointCount: number,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc(
    "consume_location_ingestion_rate_limit",
    {
      target_company_id: session.companyId,
      target_employee_id: session.employeeId,
      target_session_id: session.id,
      requested_points: newPointCount,
    },
  );

  if (error || !data?.[0]) {
    throw new LocationRateLimitUnavailableError();
  }
  const decision = data[0];
  if (!decision.allowed) {
    if (decision.denial_reason === "inactive_session") {
      throw new LocationRateLimitUnavailableError();
    }
    throw new LocationRateLimitExceededError(
      Math.max(1, decision.retry_after_seconds),
    );
  }
}

export const LocationRateLimitService = { consume: consumeLocationRateLimit };
