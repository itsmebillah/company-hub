import Link from "next/link";
import { ArrowLeft, CheckCircle2, Pencil } from "lucide-react";

import { ProfilePhoto } from "@/components/common/profile-photo";
import { Button } from "@/components/ui/button";
import { EmployeeStatusActions } from "@/features/employees/components/employee-status-actions";
import { EmployeeWorkModeBadge } from "@/features/employees/ui/employee-work-mode-badge";
import type { EmployeeActionState, EmployeeDetails as EmployeeDetailsType } from "@/features/employees/types/employee.types";

type EmployeeDetailsProps = {
  employee: EmployeeDetailsType;
  onActivate: (id: string) => Promise<EmployeeActionState>;
  onDeactivate: (id: string) => Promise<EmployeeActionState>;
  onResetPassword: (
    id: string,
    confirmation: string,
  ) => Promise<EmployeeActionState>;
  createdEmployeeId?: string;
};

function formatValue(value: string | null) {
  return value && value.length > 0 ? value : "None";
}

export function EmployeeDetails({
  employee,
  onActivate,
  onDeactivate,
  onResetPassword,
  createdEmployeeId,
}: EmployeeDetailsProps) {
  return (
    <section className="space-y-5">
      {createdEmployeeId ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Employee created successfully.</p>
            <p>
              Employee ID: <span className="font-semibold">{createdEmployeeId}</span>.
              Default password:{" "}
              <span className="font-semibold">{createdEmployeeId}</span>.
            </p>
          </div>
        </div>
      ) : null}

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
          <div className="mb-5 flex items-center gap-4">
            <ProfilePhoto
              src={employee.photoUrl}
              name={employee.name}
              className="size-16"
              iconClassName="size-7"
            />
            <div>
              <h2 className="text-base font-semibold">Employee Details</h2>
              <p className="text-sm text-muted-foreground">
                Profile and reporting information
              </p>
            </div>
          </div>
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
              <dt className="text-sm text-muted-foreground">Direct Reports</dt>
              <dd className="font-medium">{employee.directReportsCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Work Mode</dt>
              <dd className="mt-1 font-medium">
                <EmployeeWorkModeBadge workMode={employee.workMode} />
              </dd>
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
            onResetPassword={onResetPassword}
          />
        </aside>
      </div>
    </section>
  );
}
