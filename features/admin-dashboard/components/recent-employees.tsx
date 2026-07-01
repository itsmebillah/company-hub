import { Users } from "lucide-react";

import { EmployeeStatusBadge } from "@/features/employees/ui/employee-status-badge";
import { RoleBadge } from "@/features/employees/ui/role-badge";
import type { DashboardEmployee } from "@/features/admin-dashboard/types/dashboard.types";

type RecentEmployeesProps = {
  employees: DashboardEmployee[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function RecentEmployees({ employees }: RecentEmployeesProps) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Recent Employees</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest employee records added to Company Hub.
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Users className="size-5" aria-hidden="true" />
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed bg-background p-6 text-center">
          <Users className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No employees yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            New employees will appear here after they are created.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="py-3 pr-4 font-medium">Employee ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="py-3 pl-4 font-medium">Joining Date</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    {employee.employeeId}
                  </td>
                  <td className="px-4 py-3">{employee.name}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={employee.roleName} />
                  </td>
                  <td className="px-4 py-3">
                    <EmployeeStatusBadge status={employee.status} />
                  </td>
                  <td className="py-3 pl-4">
                    {formatDate(employee.joiningDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
