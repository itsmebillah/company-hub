import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  EmployeeListResult,
  EmployeeRoleOption,
  EmployeeStatus,
} from "@/features/employees/types/employee.types";

type EmployeeListProps = {
  result: EmployeeListResult;
  roles: EmployeeRoleOption[];
  searchParams: {
    search?: string;
    status?: string;
    roleId?: string;
  };
};

function buildPageHref(page: number, searchParams: EmployeeListProps["searchParams"]) {
  const params = new URLSearchParams();

  if (searchParams.search) params.set("search", searchParams.search);
  if (searchParams.status) params.set("status", searchParams.status);
  if (searchParams.roleId) params.set("roleId", searchParams.roleId);
  params.set("page", String(page));

  return `/admin/users?${params.toString()}`;
}

function statusLabel(status: EmployeeStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function EmployeeList({ result, roles, searchParams }: EmployeeListProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Manage employee records, roles, and reporting lines.
          </p>
        </div>
        <Button asChild className="h-10">
          <Link href="/admin/users/new">
            <Plus className="size-4" aria-hidden="true" />
            Create Employee
          </Link>
        </Button>
      </div>

      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_180px_220px_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
          <input
            name="search"
            defaultValue={searchParams.search}
            placeholder="Search by name or Employee ID"
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <select
          name="status"
          defaultValue={searchParams.status ?? "all"}
          className="h-10 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
        <select
          name="roleId"
          defaultValue={searchParams.roleId ?? ""}
          className="h-10 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All roles</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" className="h-10">
          Filter
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Reports To</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.employees.map((employee) => (
                <tr key={employee.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-muted-foreground">{employee.employeeId}</div>
                  </td>
                  <td className="px-4 py-3">{employee.roleName}</td>
                  <td className="px-4 py-3">{employee.managerName ?? "None"}</td>
                  <td className="px-4 py-3">{employee.phone ?? "None"}</td>
                  <td className="px-4 py-3">{statusLabel(employee.status)}</td>
                  <td className="px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/users/${employee.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {result.employees.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>
                    No employees found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {result.page} of {result.totalPages} · {result.total} employees
        </span>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" disabled={result.page <= 1}>
            <Link href={buildPageHref(Math.max(result.page - 1, 1), searchParams)}>
              Previous
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            disabled={result.page >= result.totalPages}
          >
            <Link
              href={buildPageHref(
                Math.min(result.page + 1, result.totalPages),
                searchParams,
              )}
            >
              Next
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
