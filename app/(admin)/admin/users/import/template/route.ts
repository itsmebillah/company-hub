import { NextResponse } from "next/server";

import { requireRole } from "@/features/auth/services/authorization.service";
import { EmployeeImportService } from "@/features/employee-import/services/employee-import.service";

export async function GET() {
  const profile = await requireRole(["Admin"]);

  if (!profile) {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }

  const csv = EmployeeImportService.buildTemplateCsv();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="employee-import-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
