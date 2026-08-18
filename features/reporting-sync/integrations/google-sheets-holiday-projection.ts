import "server-only";

import {
  holidayProjectionToRow,
  indexSheetRows,
  quoteSheetName,
  rowsEqual,
} from "@/features/reporting-sync/services/holiday-reporting-projection";
import {
  HOLIDAY_SHEET_HEADERS,
  type HolidayProjection,
} from "@/features/reporting-sync/types/reporting-sync.types";
import { getGoogleSheetsConfig } from "@/lib/google/config";
import { GoogleSheetsClient } from "@/lib/google/sheets-client";

type Destination = { spreadsheetId: string; sheetName: string };
type ProjectionChange = {
  recordId: string;
  projection: HolidayProjection | null;
};

const initializedDestinations = new Set<string>();

function destinationKey(destination: Destination) {
  return `${destination.spreadsheetId}:${destination.sheetName}`;
}

function rowRange(sheetName: string, rowNumber: number) {
  return `${quoteSheetName(sheetName)}!A${rowNumber}:J${rowNumber}`;
}

async function ensureSheet(destination: Destination) {
  const key = destinationKey(destination);
  if (initializedDestinations.has(key)) return;

  const spreadsheet = await GoogleSheetsClient.getSpreadsheet(
    destination.spreadsheetId,
  );
  let properties = spreadsheet.sheets?.find(
    (sheet) => sheet.properties?.title === destination.sheetName,
  )?.properties;
  let created = false;

  if (typeof properties?.sheetId !== "number") {
    properties = await GoogleSheetsClient.addSheet(
      destination.sheetName,
      destination.spreadsheetId,
    );
    created = true;
  }

  const headerRange = `${quoteSheetName(destination.sheetName)}!A1:J1`;
  const existingHeader = (
    await GoogleSheetsClient.readValues(headerRange, destination.spreadsheetId)
  ).values?.[0];

  if (existingHeader?.some((value) => String(value).length > 0)) {
    if (!rowsEqual(existingHeader, [...HOLIDAY_SHEET_HEADERS])) {
      throw new Error("sheets_schema_mismatch");
    }
  } else {
    await GoogleSheetsClient.writeValues(
      headerRange,
      [[...HOLIDAY_SHEET_HEADERS]],
      destination.spreadsheetId,
    );
    created = true;
  }

  if (created && typeof properties.sheetId === "number") {
    const { serviceAccountEmail } = getGoogleSheetsConfig();
    await GoogleSheetsClient.batchUpdate(
      [
        {
          updateSheetProperties: {
            properties: {
              sheetId: properties.sheetId,
              gridProperties: { frozenRowCount: 1 },
            },
            fields: "gridProperties.frozenRowCount",
          },
        },
        {
          addProtectedRange: {
            protectedRange: {
              range: {
                sheetId: properties.sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: HOLIDAY_SHEET_HEADERS.length,
              },
              description: "Company Hub machine-owned reporting schema",
              warningOnly: false,
              editors: { users: [serviceAccountEmail] },
            },
          },
        },
      ],
      destination.spreadsheetId,
    );
  }

  initializedDestinations.add(key);
}

async function readRows(destination: Destination) {
  await ensureSheet(destination);
  const range = `${quoteSheetName(destination.sheetName)}!A2:J`;
  return (
    (await GoogleSheetsClient.readValues(range, destination.spreadsheetId))
      .values ?? []
  );
}

async function applyChanges(
  destination: Destination,
  changes: ProjectionChange[],
) {
  const deduplicatedChanges = [
    ...new Map(changes.map((change) => [change.recordId, change])).values(),
  ];
  const rows = await readRows(destination);
  const positions = indexSheetRows(rows);
  const writes: Array<{ range: string; values: unknown[][] }> = [];
  const clears = new Set<string>();
  let nextRow = rows.length + 2;

  for (const change of deduplicatedChanges) {
    const existing = positions.get(change.recordId) ?? [];
    if (!change.projection) {
      existing.forEach((row) =>
        clears.add(rowRange(destination.sheetName, row)),
      );
      continue;
    }

    const targetRow = existing[0] ?? nextRow++;
    const projectedRow = holidayProjectionToRow(change.projection);
    const currentRow = existing[0] ? rows[existing[0] - 2] : undefined;
    if (!currentRow || !rowsEqual(currentRow, projectedRow)) {
      writes.push({
        range: rowRange(destination.sheetName, targetRow),
        values: [projectedRow],
      });
    }
    existing
      .slice(1)
      .forEach((row) => clears.add(rowRange(destination.sheetName, row)));
  }

  await GoogleSheetsClient.batchWriteValues(writes, destination.spreadsheetId);
  await GoogleSheetsClient.batchClearValues(
    [...clears],
    destination.spreadsheetId,
  );
  return { writes: writes.length, cleared: clears.size };
}

export const GoogleSheetsHolidayProjection = {
  apply: applyChanges,

  async reconcile(destination: Destination, projections: HolidayProjection[]) {
    const rows = await readRows(destination);
    const sourceIds = new Set(
      projections.map((projection) => projection.recordId),
    );
    const changes: ProjectionChange[] = projections.map((projection) => ({
      recordId: projection.recordId,
      projection,
    }));

    for (const recordId of indexSheetRows(rows).keys()) {
      if (!sourceIds.has(recordId))
        changes.push({ recordId, projection: null });
    }

    const result = await applyChanges(destination, changes);
    return {
      ...result,
      sourceRowCount: projections.length,
      destinationRowCount: projections.length,
      driftCount: result.writes + result.cleared,
    };
  },
};
