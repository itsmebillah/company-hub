import { GoogleSheetsClient } from "@/lib/google/sheets-client";
import { attendanceMonthTab, attendanceProjectionToRow, ATTENDANCE_SHEET_HEADERS } from "@/features/reporting-sync/services/attendance-reporting-projection";
import type { AttendanceProjection } from "@/features/reporting-sync/types/attendance-reporting.types";
import { quoteSheetName, rowsEqual, indexSheetRows } from "@/features/reporting-sync/services/holiday-reporting-projection";

type Destination = { spreadsheetId: string; sheetName: string };
type Change = { recordId: string; projection: AttendanceProjection | null };
type SheetClient = Pick<typeof GoogleSheetsClient, "getSpreadsheet" | "addSheet" | "readValues" | "writeValues" | "batchUpdate" | "batchWriteValues">;

function key(destination: Destination, tab: string) { return `${destination.spreadsheetId}:${tab}`; }
function delay(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

export function createAttendanceSheetInitializer(client: SheetClient = GoogleSheetsClient) {
  const initialized = new Set<string>();
  const inFlight = new Map<string, Promise<void>>();

  async function locate(clientDestination: Destination, tab: string) {
    const spreadsheet = await client.getSpreadsheet(clientDestination.spreadsheetId);
    return spreadsheet.sheets?.find((sheet) => sheet.properties?.title === tab)?.properties;
  }

  async function initialize(destination: Destination, tab: string) {
    const cacheKey = key(destination, tab);
    if (initialized.has(cacheKey)) return;
    const existing = await locate(destination, tab);
    let properties = existing;
    let created = false;
    if (typeof properties?.sheetId !== "number") {
      try {
        properties = await client.addSheet(tab, destination.spreadsheetId);
        created = true;
      } catch (error) {
        // Another process may have won the addSheet race. Re-read the spreadsheet
        // and accept the exact expected title; otherwise preserve the failure.
        for (let attempt = 0; attempt < 3; attempt += 1) {
          properties = await locate(destination, tab);
          if (typeof properties?.sheetId === "number") break;
          await delay(100 * (attempt + 1));
        }
        if (typeof properties?.sheetId !== "number") throw error;
      }
    }
    const headerRange = `${quoteSheetName(tab)}!A1:X1`;
    const existingHeader = (await client.readValues(headerRange, destination.spreadsheetId)).values?.[0];
    if (existingHeader?.some((value) => String(value).length > 0)) {
      if (!rowsEqual(existingHeader, [...ATTENDANCE_SHEET_HEADERS])) throw new Error("sheets_schema_mismatch");
    } else {
      await client.writeValues(headerRange, [[...ATTENDANCE_SHEET_HEADERS]], destination.spreadsheetId);
    }
    if (created && typeof properties?.sheetId === "number") {
      await client.batchUpdate([{ updateSheetProperties: { properties: { sheetId: properties.sheetId, gridProperties: { frozenRowCount: 1 } }, fields: "gridProperties.frozenRowCount" } }], destination.spreadsheetId);
    }
    initialized.add(cacheKey);
  }

  async function ensureSheet(destination: Destination, tab: string) {
    const cacheKey = key(destination, tab);
    if (initialized.has(cacheKey)) return;
    const running = inFlight.get(cacheKey);
    if (running) return running;
    const promise = initialize(destination, tab).finally(() => inFlight.delete(cacheKey));
    inFlight.set(cacheKey, promise);
    return promise;
  }

  return { ensureSheet };
}

const defaultInitializer = createAttendanceSheetInitializer();

export const GoogleSheetsAttendanceProjection = {
  async apply(destination: Destination, changes: Change[]) {
    const grouped = new Map<string, Change[]>();
    for (const change of changes) {
      if (!change.projection) continue;
      const tab = attendanceMonthTab(change.projection.attendanceDate);
      grouped.set(tab, [...(grouped.get(tab) ?? []), change]);
    }
    let writes = 0;
    for (const [tab, items] of grouped) {
      await defaultInitializer.ensureSheet(destination, tab);
      const range = `${quoteSheetName(tab)}!A2:X`;
      const rows = (await GoogleSheetsClient.readValues(range, destination.spreadsheetId)).values ?? [];
      const positions = indexSheetRows(rows);
      let nextRow = rows.length + 2;
      const batch: Array<{ range: string; values: unknown[][] }> = [];
      for (const change of [...new Map(items.map((item) => [item.recordId, item])).values()]) {
        const targetRow = positions.get(change.recordId)?.[0] ?? nextRow++;
        const projectedRow = attendanceProjectionToRow(change.projection!);
        const currentRow = positions.get(change.recordId)?.[0] ? rows[positions.get(change.recordId)![0] - 2] : undefined;
        if (!currentRow || !rowsEqual(currentRow, projectedRow)) {
          batch.push({ range: `${quoteSheetName(tab)}!A${targetRow}:X${targetRow}`, values: [projectedRow] });
          writes += 1;
        }
      }
      if (batch.length) await GoogleSheetsClient.batchWriteValues(batch, destination.spreadsheetId);
    }
    return { writes, cleared: 0 };
  },
  async reconcile() { return { sourceRowCount: 0, destinationRowCount: 0, driftCount: 0 }; },
};