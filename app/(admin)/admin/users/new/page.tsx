import { EmployeeForm } from "@/features/employees/components";
import { createEmployeeAction } from "@/features/employees/actions/employee.actions";
import {
  getEmployeeManagerOptions,
  getEmployeeRoles,
} from "@/features/employees/services/employee.service";

export const dynamic = "force-dynamic";

export default async function CreateEmployeePage() {
  const [roles, managers] = await Promise.all([
    getEmployeeRoles(),
    getEmployeeManagerOptions(),
  ]);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Create Employee</h1>
        <p className="text-sm text-muted-foreground">
          Add a new employee record.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-5">
        <EmployeeForm
          roles={roles}
          managers={managers}
          submitLabel="Create Employee"
          onSubmit={createEmployeeAction}
        />
      </div>
    </section>
  );
}
