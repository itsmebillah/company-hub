import { CalendarDays, Phone, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmployeeStatusBadge } from "@/features/employees/ui/employee-status-badge";
import type { EmployeeUiRecord } from "@/features/employees/ui/employee-management.types";
import { RoleBadge } from "@/features/employees/ui/role-badge";

type EmployeeDrawerProps = {
  employee: EmployeeUiRecord | null;
  onClose: () => void;
};

export function EmployeeDrawer({ employee, onClose }: EmployeeDrawerProps) {
  if (!employee) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close employee details"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-md overflow-y-auto border-l bg-background shadow-soft">
        <div className="flex h-14 items-center justify-between border-b px-5">
          <h2 className="font-semibold">Employee Details</h2>
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close">
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="p-5">
          <div className="flex flex-col items-center rounded-xl border bg-card p-6 text-center">
            {employee.photoUrl ? (
              <img
                src={employee.photoUrl}
                alt=""
                className="size-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                <UserRound className="size-9 text-muted-foreground" aria-hidden="true" />
              </div>
            )}
            <h3 className="mt-4 text-xl font-semibold">{employee.name}</h3>
            <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <RoleBadge role={employee.role} />
              <EmployeeStatusBadge status={employee.status} />
            </div>
          </div>

          <dl className="mt-5 space-y-3 rounded-xl border bg-card p-5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Manager</dt>
              <dd className="font-medium">{employee.reportsTo || "None"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Direct Reports</dt>
              <dd className="font-medium">{employee.directReportsCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4" aria-hidden="true" />
                Phone
              </dt>
              <dd className="font-medium">{employee.phone}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden="true" />
                Joining Date
              </dt>
              <dd className="font-medium">{employee.joiningDate}</dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
