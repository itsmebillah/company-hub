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
import type { EmployeeStatus } from "@/features/employees/types/employee.types";

export const dynamic = "force-dynamic";

type AdminUsersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    roleId?: string;
    managerId?: string;
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

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const pageSize = Number(params.pageSize ?? "10");
  const [roles, managers, result] = await Promise.all([
    getEmployeeRoles(),
    getEmployeeManagerOptions(),
    listEmployees({
      search: params.search,
      status: parseStatus(params.status),
      roleId: params.roleId,
      managerId: params.managerId,
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 10,
    }),
  ]);

  return (
    <EmployeeManagementPage
      result={result}
      roles={roles}
      managers={managers}
      filters={{
        search: params.search ?? "",
        roleId: params.roleId ?? "",
        status: params.status ?? "",
        managerId: params.managerId ?? "",
      }}
      onCreate={createEmployeeAction}
      onUpdate={updateEmployeeAction}
      onActivate={activateEmployeeAction}
      onDeactivate={deactivateEmployeeAction}
    />
  );
}
