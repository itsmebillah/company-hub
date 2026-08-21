export const LOCATION_INGESTION_LIMITS = {
  maxRequestBytes: 128 * 1024,
  maxBatchSize: 100,
  maxFutureClockSkewMs: 5 * 60 * 1000,
  maxAccuracyMeters: 10_000,
  maxSpeedMetersPerSecond: 200,
  maxIdempotencyKeyLength: 128,
  minIdempotencyKeyLength: 8,
} as const;
