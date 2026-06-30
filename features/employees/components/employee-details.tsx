import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmployeeStatusActions } from "@/features/employees/components/employee-status-actions";
import type { EmployeeActionState, EmployeeDetails as EmployeeDetailsType } from "@/features/employees/types/employee.types";

type EmployeeDetailsProps = {
  employee: EmployeeDetailsType;
  onActivate: (id: string) => Promise<EmployeeActionState>;
  onDeactivate: (id: string) => Promise<EmployeeActionState>;
};

function formatValue(value: string | null) {
  return value && value.length > 0 ? value : "None";
}

export function EmployeeDetails({
  employee,
  onActivate,
  onDeactivate,
}: EmployeeDetailsProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link href="/admin/users">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Employees
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">{employee.name}</h1>
          <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/admin/users/${employee.id}/edit`}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold">Employee Details</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Role</dt>
              <dd className="font-medium">{employee.roleName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Reports To</dt>
              <dd className="font-medium">{employee.managerName ?? "None"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Phone</dt>
              <dd className="font-medium">{formatValue(employee.phone)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="font-medium">{formatValue(employee.email)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Date of Birth</dt>
              <dd className="font-medium">{formatValue(employee.dateOfBirth)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Joining Date</dt>
              <dd className="font-medium">{formatValue(employee.joiningDate)}</dd>
            </div>
          </dl>
        </div>

        <aside className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold">Status</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Current status: <span className="font-medium">{employee.status}</span>
          </p>
          <EmployeeStatusActions
            employeeId={employee.id}
            status={employee.status}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
          />
        </aside>
      </div>
    </section>
  );
}
