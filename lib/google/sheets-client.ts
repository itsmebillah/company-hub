import "server-only";

import { googleApiFetch } from "@/lib/google/api-client";
import { getGoogleSheetsConfig } from "@/lib/google/config";

function spreadsheetUrl(path = "", spreadsheetId?: string) {
  const { reportingSpreadsheetId } = getGoogleSheetsConfig();
  return `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId ?? reportingSpreadsheetId)}${path}`;
}

export const GoogleSheetsClient = {
  async getSpreadsheet(spreadsheetId?: string) {
    const response = await googleApiFetch(
      spreadsheetUrl(
        "?fields=spreadsheetId,properties(title,timeZone),sheets(properties(sheetId,title,index))",
        spreadsheetId,
      ),
      {},
      "sheets-service-account",
    );
    return (await response.json()) as {
      spreadsheetId: string;
      properties?: { title?: string; timeZone?: string };
      sheets?: Array<{
        properties?: { sheetId?: number; title?: string; index?: number };
      }>;
    };
  },

  async addSheet(title: string, spreadsheetId?: string) {
    const response = await googleApiFetch(
      spreadsheetUrl(":batchUpdate", spreadsheetId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title } } }],
        }),
      },
      "sheets-service-account",
    );
    const result = (await response.json()) as {
      replies?: Array<{
        addSheet?: { properties?: { sheetId?: number; title?: string } };
      }>;
    };
    const properties = result.replies?.[0]?.addSheet?.properties;

    if (typeof properties?.sheetId !== "number") {
      throw new Error("Google Sheets did not create the verification tab.");
    }

    return { sheetId: properties.sheetId, title: properties.title ?? title };
  },

  async writeValues(
    range: string,
    values: unknown[][],
    spreadsheetId?: string,
  ) {
    await googleApiFetch(
      spreadsheetUrl(
        `/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
        spreadsheetId,
      ),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range, majorDimension: "ROWS", values }),
      },
      "sheets-service-account",
    );
  },

  async readValues(range: string, spreadsheetId?: string) {
    const response = await googleApiFetch(
      spreadsheetUrl(
        `/values/${encodeURIComponent(range)}?majorDimension=ROWS`,
        spreadsheetId,
      ),
      {},
      "sheets-service-account",
    );
    return (await response.json()) as { range?: string; values?: unknown[][] };
  },

  async clearValues(range: string, spreadsheetId?: string) {
    await googleApiFetch(
      spreadsheetUrl(
        `/values/${encodeURIComponent(range)}:clear`,
        spreadsheetId,
      ),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      },
      "sheets-service-account",
    );
  },

  async batchWriteValues(
    data: Array<{ range: string; values: unknown[][] }>,
    spreadsheetId?: string,
  ) {
    if (data.length === 0) return;
    await googleApiFetch(
      spreadsheetUrl("/values:batchUpdate", spreadsheetId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valueInputOption: "RAW", data }),
      },
      "sheets-service-account",
    );
  },

  async batchClearValues(ranges: string[], spreadsheetId?: string) {
    if (ranges.length === 0) return;
    await googleApiFetch(
      spreadsheetUrl("/values:batchClear", spreadsheetId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ranges }),
      },
      "sheets-service-account",
    );
  },

  async batchUpdate(
    requests: Array<Record<string, unknown>>,
    spreadsheetId?: string,
  ) {
    if (requests.length === 0) return;
    await googleApiFetch(
      spreadsheetUrl(":batchUpdate", spreadsheetId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
      },
      "sheets-service-account",
    );
  },

  async removeSheet(sheetId: number, spreadsheetId?: string) {
    await googleApiFetch(
      spreadsheetUrl(":batchUpdate", spreadsheetId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: [{ deleteSheet: { sheetId } }] }),
      },
      "sheets-service-account",
    );
  },
};
