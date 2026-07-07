import { NextResponse } from "next/server";

import { EmployeeImportService } from "@/features/employee-import/services/employee-import.service";

export async function GET() {
  const csv = EmployeeImportService.buildTemplateCsv();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="employee-import-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
