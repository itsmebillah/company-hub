import type { AttendanceRecord } from "@/features/attendance/types/attendance.types";

type AttendanceEventBase = {
  eventId: string;
  occurredAt: string;
  companyId: string;
  employeeId: string;
  attendanceId: string;
  attendanceDate: string;
  record: AttendanceRecord;
};

export type AttendanceCreatedEvent = AttendanceEventBase & {
  type: "attendance.created";
};

export type AttendanceUpdatedEvent = AttendanceEventBase & {
  type: "attendance.updated";
  changedFields: readonly ["checkOut", "workingMinutes", "status"];
};

export type AttendanceCompletedEvent = AttendanceEventBase & {
  type: "attendance.completed";
};

export type AttendanceAutomationEvent =
  AttendanceCreatedEvent | AttendanceUpdatedEvent | AttendanceCompletedEvent;

export type AttendanceSyncPreparation = {
  status: "not_queued" | "pending" | "processing" | "synced" | "failed";
  provider: "google_sheets" | "google_drive" | null;
  externalFileId: string | null;
  retryCount: number;
  lastSyncAt: string | null;
};
