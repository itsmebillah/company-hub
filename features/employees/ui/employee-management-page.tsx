"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { EmployeeDrawer } from "@/features/employees/ui/employee-drawer";
import { EmployeeFilters } from "@/features/employees/ui/employee-filters";
import { EmployeeForm } from "@/features/employees/ui/employee-form";
import type {
  EmployeeFormMode,
  EmployeeUiRecord,
} from "@/features/employees/ui/employee-management.types";
import { EmployeeTable } from "@/features/employees/ui/employee-table";
import { Pagination } from "@/features/employees/ui/pagination";
import type {
  EmployeeActionState,
  EmployeeFormValues,
  EmployeeListResult,
  EmployeeManagerOption,
  EmployeeRoleOption,
} from "@/features/employees/types/employee.types";

type EmployeeManagementPageProps = {
  result: EmployeeListResult;
  roles: EmployeeRoleOption[];
  managers: EmployeeManagerOption[];
  filters: {
    search: string;
    roleId: string;
    status: string;
    managerId: string;
  };
  loadError?: string;
  onCreate: (values: EmployeeFormValues) => Promise<EmployeeActionState>;
  onUpdate: (id: string, values: EmployeeFormValues) => Promise<EmployeeActionState>;
  onActivate: (id: string) => Promise<EmployeeActionState>;
  onDeactivate: (id: string) => Promise<EmployeeActionState>;
};

function toUiRecord(employee: EmployeeListResult["employees"][number]): EmployeeUiRecord {
  return {
    id: employee.id,
    employeeId: employee.employeeId,
    name: employee.name,
    roleId: employee.roleId,
    role: employee.roleName,
    reportsToId: employee.managerId ?? "",
    reportsTo: employee.managerName ?? "",
    directReportsCount: employee.directReportsCount,
    phone: employee.phone ?? "",
    email: employee.email ?? "",
    photoUrl: employee.photoUrl ?? undefined,
    dateOfBirth: employee.dateOfBirth ?? "",
    joiningDate: employee.joiningDate ?? "",
    status: employee.status,
  };
}

export function EmployeeManagementPage({
  result,
  roles,
  managers,
  filters,
  loadError,
  onCreate,
  onUpdate,
  onActivate,
  onDeactivate,
}: EmployeeManagementPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeUiRecord | null>(null);
  const [formMode, setFormMode] = useState<EmployeeFormMode | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeUiRecord | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const employees = result.employees.map(toUiRecord);

  function updateFilters(nextFilters: Partial<EmployeeManagementPageProps["filters"]> & { page?: number; pageSize?: number }) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...nextFilters };

    if (merged.search) params.set("search", merged.search);
    if (merged.roleId) params.set("roleId", merged.roleId);
    if (merged.status) params.set("status", merged.status);
    if (merged.managerId) params.set("managerId", merged.managerId);
    params.set("page", String(nextFilters.page ?? 1));
    params.set("pageSize", String(nextFilters.pageSize ?? result.pageSize));

    router.replace(`/admin/users?${params.toString()}`);
  }

  function openCreateModal() {
    setEditingEmployee(null);
    setFormMode("create");
  }

  function openEditModal(employee: EmployeeUiRecord) {
    setEditingEmployee(employee);
    setFormMode("edit");
  }

  async function runStatusAction(action: (id: string) => Promise<EmployeeActionState>, id: string) {
    setActionMessage("");
    startTransition(async () => {
      const result = await action(id);
      setActionMessage(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Manage all company employees
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="h-10" onClick={openCreateModal}>
            <Plus className="size-4" aria-hidden="true" />
            New Employee
          </Button>
          <Button type="button" variant="outline" className="h-10">
            <Download className="size-4" aria-hidden="true" />
            Export
          </Button>
        </div>
      </div>

      <EmployeeFilters
        roles={roles}
        managers={managers}
        search={filters.search}
        roleId={filters.roleId}
        status={filters.status}
        managerId={filters.managerId}
        onSearchChange={(value) => updateFilters({ search: value })}
        onRoleChange={(value) => updateFilters({ roleId: value })}
        onStatusChange={(value) => updateFilters({ status: value })}
        onReportsToChange={(value) => updateFilters({ managerId: value })}
        onReset={() => router.replace("/admin/users")}
      />

      {loadError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      {employees.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <EmployeeTable
            employees={employees}
            onView={setSelectedEmployee}
            onEdit={openEditModal}
            onActivate={async (id) => {
              await runStatusAction(onActivate, id);
              return { ok: true, message: "Employee activated." };
            }}
            onDeactivate={async (id) => {
              await runStatusAction(onDeactivate, id);
              return { ok: true, message: "Employee deactivated." };
            }}
          />
          <Pagination
            page={result.page}
            pageCount={result.totalPages}
            rowsPerPage={result.pageSize}
            onPageChange={(page) => updateFilters({ page })}
            onRowsPerPageChange={(pageSize) => updateFilters({ pageSize })}
          />
        </div>
      ) : (
        <EmptyState
          title="No employees found"
          description="Try adjusting filters or create a new employee."
          className="bg-card shadow-sm"
          action={
            <Button type="button" onClick={openCreateModal}>
              <UsersRound className="size-4" aria-hidden="true" />
              Create Employee
            </Button>
          }
        />
      )}

      {isPending ? (
        <p className="text-sm text-muted-foreground">Updating employee status...</p>
      ) : null}
      {actionMessage ? (
        <p className="text-sm text-muted-foreground">{actionMessage}</p>
      ) : null}

      {formMode ? (
        <EmployeeForm
          mode={formMode}
          employee={editingEmployee}
          roles={roles}
          managers={managers}
          onClose={() => setFormMode(null)}
          onSubmit={
            formMode === "create"
              ? onCreate
              : (values) =>
                  editingEmployee
                    ? onUpdate(editingEmployee.id, values)
                    : Promise.resolve({ ok: false, message: "Employee was not selected." })
          }
        />
      ) : null}

      <EmployeeDrawer
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </section>
  );
}
