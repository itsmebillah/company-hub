import { NextResponse } from "next/server";

import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";
import { getEmployeeWorkModeLabel } from "@/features/employees/constants/employee-work-mode.config";
import { listEmployees } from "@/features/employees/services/employee.service";
import type {
  EmployeeListSort,
  EmployeeStatus,
  EmployeeWorkMode,
} from "@/features/employees/types/employee.types";

function parseStatus(status: string | null): EmployeeStatus | "all" {
  if (status === "active" || status === "inactive" || status === "archived") {
    return status;
  }

  return "all";
}

function parseWorkMode(workMode: string | null): EmployeeWorkMode | "all" {
  if (workMode === "office" || workMode === "field" || workMode === "hybrid") {
    return workMode;
  }

  return "all";
}

function parseSort(sort: string | null): EmployeeListSort {
  if (sort === "employee_id" || sort === "name" || sort === "work_mode") {
    return sort;
  }

  return "newest";
}

function escapeCsv(value: string | number | null) {
  if (value === null) {
    return "";
  }

  const stringValue = String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export async function GET(request: Request) {
  const profile = await requireCompanyAdmin("employee_directory").catch(
    () => null,
  );

  if (!profile) {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }

  const url = new URL(request.url);
  const result = await listEmployees({
    search: url.searchParams.get("search") ?? undefined,
    status: parseStatus(url.searchParams.get("status")),
    roleId: url.searchParams.get("roleId") ?? undefined,
    managerId: url.searchParams.get("managerId") ?? undefined,
    workMode: parseWorkMode(url.searchParams.get("workMode")),
    sort: parseSort(url.searchParams.get("sort")),
    page: 1,
    pageSize: 10000,
  });
  const headers = [
    "Employee ID",
    "Name",
    "Role",
    "Work Mode",
    "Reports To",
    "Phone",
    "Email",
    "Joining Date",
    "Status",
  ];
  const rows = result.employees.map((employee) => [
    employee.employeeId,
    employee.name,
    employee.roleName,
    getEmployeeWorkModeLabel(employee.workMode),
    employee.managerName ?? "",
    employee.phone ?? "",
    employee.email ?? "",
    employee.joiningDate ?? "",
    employee.status,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => escapeCsv(value)).join(","))
    .join("\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="employees.csv"',
    },
  });
}
