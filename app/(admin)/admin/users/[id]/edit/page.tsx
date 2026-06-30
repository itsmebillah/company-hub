import { notFound } from "next/navigation";

import { EmployeeForm } from "@/features/employees/components";
import { updateEmployeeAction } from "@/features/employees/actions/employee.actions";
import {
  getEmployeeDetails,
  getEmployeeManagerOptions,
  getEmployeeRoles,
} from "@/features/employees/services/employee.service";

export const dynamic = "force-dynamic";

type EditEmployeePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const { id } = await params;
  const [employee, roles, managers] = await Promise.all([
    getEmployeeDetails(id),
    getEmployeeRoles(),
    getEmployeeManagerOptions(),
  ]);

  if (!employee) {
    notFound();
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Edit Employee</h1>
        <p className="text-sm text-muted-foreground">
          Update employee record and reporting line.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-5">
        <EmployeeForm
          roles={roles}
          managers={managers}
          initialValues={{
            employeeId: employee.employeeId,
            name: employee.name,
            phone: employee.phone ?? "",
            email: employee.email ?? "",
            dateOfBirth: employee.dateOfBirth ?? "",
            joiningDate: employee.joiningDate ?? "",
            roleId: employee.roleId,
            managerId: employee.managerId ?? "",
            status: employee.status,
          }}
          submitLabel="Save Changes"
          onSubmit={updateEmployeeAction.bind(null, id)}
        />
      </div>
    </section>
  );
}
