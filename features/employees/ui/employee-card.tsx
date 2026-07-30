import { Pencil, Power } from "lucide-react";

import { ProfilePhoto } from "@/components/common/profile-photo";
import { Button } from "@/components/ui/button";
import { EmployeeStatusBadge } from "@/features/employees/ui/employee-status-badge";
import { EmployeeWorkModeBadge } from "@/features/employees/ui/employee-work-mode-badge";
import type { EmployeeUiRecord } from "@/features/employees/ui/employee-management.types";
import { RoleBadge } from "@/features/employees/ui/role-badge";

type EmployeeCardProps = {
  employee: EmployeeUiRecord;
  onView: (employee: EmployeeUiRecord) => void;
  onEdit: (employee: EmployeeUiRecord) => void;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  isStatusPending: boolean;
};

export function EmployeeCard({
  employee,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
  isStatusPending,
}: EmployeeCardProps) {
  return (
    <article className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <ProfilePhoto
          src={employee.photoUrl}
          name={employee.name}
          className="size-11"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{employee.name}</h3>
          <p className="text-muted-foreground text-sm">{employee.employeeId}</p>
        </div>
        <EmployeeStatusBadge status={employee.status} />
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Role</span>
          <RoleBadge role={employee.role} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Reports To</span>
          <span>{employee.reportsTo || "None"}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Work Mode</span>
          <EmployeeWorkModeBadge workMode={employee.workMode} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Phone</span>
          <span>{employee.phone}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Direct Reports</span>
          <span>{employee.directReportsCount}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          className="col-span-2"
          onClick={() => onView(employee)}
        >
          View
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => onEdit(employee)}
          aria-label="Edit employee"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="col-span-3"
          disabled={isStatusPending}
          onClick={() =>
            employee.status === "active"
              ? onDeactivate(employee.id)
              : onActivate(employee.id)
          }
        >
          <Power className="size-4" aria-hidden="true" />
          {employee.status === "active" ? "Deactivate" : "Activate"}
        </Button>
      </div>
    </article>
  );
}
