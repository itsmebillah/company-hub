import {
  HOLIDAY_SHEET_HEADERS,
  type HolidayProjection,
} from "@/features/reporting-sync/types/reporting-sync.types";

export function quoteSheetName(sheetName: string) {
  return `'${sheetName.replaceAll("'", "''")}'`;
}

export function holidayProjectionToRow(
  projection: HolidayProjection,
): unknown[] {
  return [
    projection.recordId,
    projection.calendarName,
    projection.calendarStatus,
    projection.holidayDate,
    projection.title,
    projection.holidayType,
    projection.isWorkingDay,
    projection.description,
    projection.eventStatus,
    projection.sourceUpdatedAt,
  ];
}

export function normalizeSheetRow(row: unknown[]) {
  return HOLIDAY_SHEET_HEADERS.map((_, index) => {
    const value = row[index];
    if (value === undefined || value === null) return "";
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    return String(value);
  });
}

export function rowsEqual(left: unknown[], right: unknown[]) {
  return (
    JSON.stringify(normalizeSheetRow(left)) ===
    JSON.stringify(normalizeSheetRow(right))
  );
}

export function indexSheetRows(rows: unknown[][]) {
  const positions = new Map<string, number[]>();

  rows.forEach((row, index) => {
    const recordId = typeof row[0] === "string" ? row[0].trim() : "";
    if (!recordId) return;
    positions.set(recordId, [...(positions.get(recordId) ?? []), index + 2]);
  });

  return positions;
}
