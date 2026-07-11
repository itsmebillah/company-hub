import { NextRequest, NextResponse } from "next/server";

import { AttendanceReportService } from "@/features/attendance-reports/services/attendance-report.service";

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const employeeId = request.nextUrl.searchParams.get("employeeId");

  if (!employeeId) {
    return NextResponse.json(
      { message: "Employee is required." },
      { status: 400 },
    );
  }

  const details = await AttendanceReportService.getDetails(
    searchParams,
    employeeId,
  );

  if (!details) {
    return NextResponse.json(
      { message: "Attendance report access denied." },
      { status: 403 },
    );
  }

  return NextResponse.json(details);
}
