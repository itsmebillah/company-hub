import { EmployeeManagementPage } from "@/features/employees/ui";
import {
  activateEmployeeAction,
  createEmployeeAction,
  deactivateEmployeeAction,
  updateEmployeeAction,
} from "@/features/employees/actions/employee.actions";
import {
  getEmployeeManagerOptions,
  getEmployeeRoles,
  listEmployees,
} from "@/features/employees/services/employee.service";
import type {
  EmployeeListResult,
  EmployeeListSort,
  EmployeeManagerOption,
  EmployeeRoleOption,
  EmployeeStatus,
  EmployeeWorkMode,
} from "@/features/employees/types/employee.types";

export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    roleId?: string;
    managerId?: string;
    workMode?: string;
    sort?: string;
    page?: string;
    pageSize?: string;
  }>;
};

function parseStatus(status: string | undefined): EmployeeStatus | "all" {
  if (status === "active" || status === "inactive" || status === "archived") {
    return status;
  }

  return "all";
}

function parseWorkMode(workMode: string | undefined): EmployeeWorkMode | "all" {
  if (workMode === "office" || workMode === "field" || workMode === "hybrid") {
    return workMode;
  }

  return "all";
}

function parseSort(sort: string | undefined): EmployeeListSort {
  if (
    sort === "employee_id" ||
    sort === "name" ||
    sort === "work_mode"
  ) {
    return sort;
  }

  return "newest";
}

function emptyEmployeeResult(
  page: number,
  pageSize: number,
): EmployeeListResult {
  return {
    employees: [],
    total: 0,
    page,
    pageSize,
    totalPages: 1,
  };
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const pageSize = Number(params.pageSize ?? "10");
  const normalizedPage = Number.isFinite(page) ? page : 1;
  const normalizedPageSize = Number.isFinite(pageSize) ? pageSize : 10;
  let loadError = "";
  let roles: EmployeeRoleOption[] = [];
  let managers: EmployeeManagerOption[] = [];
  let result = emptyEmployeeResult(normalizedPage, normalizedPageSize);

  try {
    [roles, managers, result] = await Promise.all([
      getEmployeeRoles(),
      getEmployeeManagerOptions(),
      listEmployees({
        search: params.search,
        status: parseStatus(params.status),
        roleId: params.roleId,
        managerId: params.managerId,
        workMode: parseWorkMode(params.workMode),
        sort: parseSort(params.sort),
        page: normalizedPage,
        pageSize: normalizedPageSize,
      }),
    ]);
  } catch (error) {
    console.error("[AdminUsersPage] Unable to load employee data.", error);
    loadError = "Unable to load employees right now. Please try again.";
  }

  return (
    <EmployeeManagementPage
      result={result}
      roles={roles}
      managers={managers}
      loadError={loadError}
      filters={{
        search: params.search ?? "",
        roleId: params.roleId ?? "",
        status: params.status ?? "",
        managerId: params.managerId ?? "",
        workMode: params.workMode ?? "",
        sort: parseSort(params.sort),
      }}
      onCreate={createEmployeeAction}
      onUpdate={updateEmployeeAction}
      onActivate={activateEmployeeAction}
      onDeactivate={deactivateEmployeeAction}
    />
  );
}
