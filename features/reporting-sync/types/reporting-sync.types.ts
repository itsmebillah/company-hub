export const HOLIDAY_SHEET_HEADERS = [
  "record_id",
  "calendar_name",
  "calendar_status",
  "holiday_date",
  "title",
  "holiday_type",
  "is_working_day",
  "description",
  "event_status",
  "source_updated_at",
] as const;

export type HolidayProjection = {
  recordId: string;
  calendarName: string;
  calendarStatus: string;
  holidayDate: string;
  title: string;
  holidayType: string;
  isWorkingDay: boolean;
  description: string;
  eventStatus: string;
  sourceUpdatedAt: string;
};

export type ReportingSyncJob = {
  outboxId: string;
  eventId: string;
  companyId: string;
  destinationId: string;
  spreadsheetId: string;
  sheetName: string;
  attemptCount: number;
};

export type ReportingDestination = {
  id: string;
  companyId: string;
  spreadsheetId: string;
  sheetName: string;
  alertedAt: string | null;
};

export type ReportingRunResult = {
  claimed: number;
  synced: number;
  failed: number;
  terminalFailures: number;
  reconciled: number;
  driftRepaired: number;
};
