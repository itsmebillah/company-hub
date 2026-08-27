import { NextRequest, NextResponse } from "next/server";

import { AttendanceExportService } from "@/features/attendance-reports/services/attendance-export.service";
import { AttendanceReportService } from "@/features/attendance-reports/services/attendance-report.service";
import type { AttendanceReportExportFormat } from "@/features/attendance-reports/types/attendance-report.types";

function isValidFormat(
  value: string | null,
): value is AttendanceReportExportFormat {
  return value === "csv" || value === "xlsx" || value === "pdf";
}

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");

  if (!isValidFormat(format)) {
    return NextResponse.json(
      { message: "Export format is invalid." },
      { status: 400 },
    );
  }

  const searchParams = Object.fromEntries(
    request.nextUrl.searchParams.entries(),
  );
  const selectedDate = searchParams.date;
  if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    searchParams.startDate = selectedDate;
    searchParams.endDate = selectedDate;
  }

  const dataset = await AttendanceReportService.getExportDataset(searchParams);

  if (!dataset) {
    return NextResponse.json(
      { message: "Attendance report access denied." },
      { status: 403 },
    );
  }

  const file =
    format === "csv"
      ? AttendanceExportService.buildCsv(
          dataset.pageData,
          dataset.detailsByEmployeeId,
        )
      : format === "xlsx"
        ? AttendanceExportService.buildWorkbook(
            dataset.pageData,
            dataset.detailsByEmployeeId,
          )
        : AttendanceExportService.buildPdf(
            dataset.pageData,
            dataset.detailsByEmployeeId,
            dataset.companyLogo,
          );

  return new NextResponse(file.buffer, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
