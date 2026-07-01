import { MoreHorizontal, Pencil, Power, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmployeeCard } from "@/features/employees/ui/employee-card";
import { EmployeeStatusBadge } from "@/features/employees/ui/employee-status-badge";
import type { EmployeeUiRecord } from "@/features/employees/ui/employee-management.types";
import type { EmployeeActionState } from "@/features/employees/types/employee.types";
import { RoleBadge } from "@/features/employees/ui/role-badge";

type EmployeeTableProps = {
  employees: EmployeeUiRecord[];
  onView: (employee: EmployeeUiRecord) => void;
  onEdit: (employee: EmployeeUiRecord) => void;
  onActivate: (id: string) => Promise<EmployeeActionState>;
  onDeactivate: (id: string) => Promise<EmployeeActionState>;
};

export function EmployeeTable({
  employees,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
}: EmployeeTableProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Profile</th>
                <th className="px-4 py-3 font-medium">Employee ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Reports To</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Joining Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    {employee.photoUrl ? (
                      <img
                        src={employee.photoUrl}
                        alt=""
                        className="size-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                        <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{employee.employeeId}</td>
                  <td className="px-4 py-3">{employee.name}</td>
                  <td className="px-4 py-3"><RoleBadge role={employee.role} /></td>
                  <td className="px-4 py-3">{employee.reportsTo || "None"}</td>
                  <td className="px-4 py-3">{employee.phone}</td>
                  <td className="px-4 py-3">{employee.joiningDate}</td>
                  <td className="px-4 py-3"><EmployeeStatusBadge status={employee.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => onView(employee)}>
                        View
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => onEdit(employee)} aria-label="Edit employee">
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={
                          employee.status === "active"
                            ? "Deactivate employee"
                            : "Activate employee"
                        }
                        onClick={() =>
                          employee.status === "active"
                            ? onDeactivate(employee.id)
                            : onActivate(employee.id)
                        }
                      >
                        <Power className="size-4" aria-hidden="true" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" aria-label="More actions">
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 lg:hidden">
        {employees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onView={onView}
            onEdit={onEdit}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
          />
        ))}
      </div>
    </>
  );
}
