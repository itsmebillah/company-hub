export type LocationPointInput = {
  idempotencyKey: string;
  observedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  speedMetersPerSecond?: number;
  headingDegrees?: number;
  batteryPercent?: number;
  isMockLocation?: boolean;
};

export type LocationIngestionPayload = {
  points: LocationPointInput[];
};

export type LocationIngestionIdentity = {
  employeeId: string;
  companyId: string;
};

export type ActiveTrackingSession = {
  id: string;
  companyId: string;
  employeeId: string;
  attendanceRecordId: string;
  startedAt: string;
};

export type LocationIngestionResult = {
  accepted: number;
  duplicates: number;
  results: Array<{
    idempotencyKey: string;
    status: "accepted" | "duplicate";
  }>;
};
