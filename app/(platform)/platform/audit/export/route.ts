import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { FEATURE_KEYS } from "@/features/platform-control/constants/feature-catalog";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";
import type {
  AuditCategory,
  FeatureKey,
} from "@/features/platform-control/types/platform.types";

const categories: AuditCategory[] = [
  "audit",
  "activity",
  "login",
  "security",
  "feature_usage",
  "error",
];

function spreadsheetCell(value: unknown) {
  const text = String(value ?? "");
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function csvCell(value: unknown) {
  return `"${spreadsheetCell(value).replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const category = query.get("category") ?? "";
  const feature = query.get("feature") ?? "";
  const format = query.get("format") === "xlsx" ? "xlsx" : "csv";
  const filters = {
    companyId: query.get("company") || undefined,
    category: categories.includes(category as AuditCategory)
      ? (category as AuditCategory)
      : undefined,
    featureKey: FEATURE_KEYS.includes(feature as FeatureKey)
      ? (feature as FeatureKey)
      : undefined,
    status: query.get("status") || undefined,
    search: query.get("search") || undefined,
    employee: query.get("employee") || undefined,
    role: query.get("role") || undefined,
    action: query.get("action") || undefined,
    fromDate: query.get("from") || undefined,
    toDate: query.get("to") || undefined,
  };
  const [logs, companies] = await Promise.all([
    PlatformControlService.listAuditLogs(filters, 5_000),
    PlatformControlService.listCompanies(),
  ]);
  const companyMap = new Map(
    companies.map((company) => [company.id, company.name]),
  );
  const rows = logs.items.map((event) => ({
    Timestamp: event.created_at,
    Category: event.category,
    Status: event.status,
    Company: companyMap.get(event.company_id) ?? "Platform",
    Employee: event.actorName ?? "System",
    "Employee ID": event.actorEmployeeId ?? "",
    Role: event.actorRole ?? "",
    Feature: event.feature_key ?? "",
    Action: event.action,
    "Entity type": event.entity_type,
    "Entity ID": event.entity_id ?? "",
    Description: event.description,
    "IP address": event.ip_address ?? "",
    Device: event.user_agent ?? "",
  }));
  const filename = `company-hub-audit-${new Date().toISOString().slice(0, 10)}`;

  if (format === "xlsx") {
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            spreadsheetCell(value),
          ]),
        ),
      ),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
    const body = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return new NextResponse(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "X-Export-Truncated": String(logs.count > logs.items.length),
      },
    });
  }

  const headings = Object.keys(
    rows[0] ?? {
      Timestamp: "",
      Category: "",
      Status: "",
      Company: "",
      Employee: "",
      "Employee ID": "",
      Role: "",
      Feature: "",
      Action: "",
      "Entity type": "",
      "Entity ID": "",
      Description: "",
      "IP address": "",
      Device: "",
    },
  );
  const csv = [
    headings.map(csvCell).join(","),
    ...rows.map((row) =>
      headings
        .map((heading) => csvCell(row[heading as keyof typeof row]))
        .join(","),
    ),
  ].join("\r\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Export-Truncated": String(logs.count > logs.items.length),
    },
  });
}
