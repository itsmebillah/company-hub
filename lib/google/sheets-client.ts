import "server-only";

import { googleApiFetch } from "@/lib/google/api-client";
import { getGoogleIntegrationConfig } from "@/lib/google/config";

function spreadsheetUrl(path = "") {
  const { reportingSpreadsheetId } = getGoogleIntegrationConfig();
  return `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(reportingSpreadsheetId)}${path}`;
}

export const GoogleSheetsClient = {
  async getSpreadsheet() {
    const response = await googleApiFetch(
      spreadsheetUrl(
        "?fields=spreadsheetId,properties(title,timeZone),sheets(properties(sheetId,title,index))",
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

  async addSheet(title: string) {
    const response = await googleApiFetch(
      spreadsheetUrl(":batchUpdate"),
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

  async writeValues(range: string, values: unknown[][]) {
    await googleApiFetch(
      spreadsheetUrl(
        `/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      ),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range, majorDimension: "ROWS", values }),
      },
      "sheets-service-account",
    );
  },

  async readValues(range: string) {
    const response = await googleApiFetch(
      spreadsheetUrl(
        `/values/${encodeURIComponent(range)}?majorDimension=ROWS`,
      ),
      {},
      "sheets-service-account",
    );
    return (await response.json()) as { range?: string; values?: unknown[][] };
  },

  async removeSheet(sheetId: number) {
    await googleApiFetch(
      spreadsheetUrl(":batchUpdate"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: [{ deleteSheet: { sheetId } }] }),
      },
      "sheets-service-account",
    );
  },
};
