import { notFound } from "next/navigation";

import { EmployeeDetails } from "@/features/employees/components";
import {
  activateEmployeeAction,
  deactivateEmployeeAction,
} from "@/features/employees/actions/employee.actions";
import { getEmployeeDetails } from "@/features/employees/services/employee.service";

export const dynamic = "force-dynamic";

type EmployeeDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    createdEmployeeId?: string;
  }>;
};

export default async function EmployeeDetailsPage({
  params,
  searchParams,
}: EmployeeDetailsPageProps) {
  const { id } = await params;
  const { createdEmployeeId } = await searchParams;
  const employee = await getEmployeeDetails(id);

  if (!employee) {
    notFound();
  }

  return (
    <EmployeeDetails
      employee={employee}
      onActivate={activateEmployeeAction}
      onDeactivate={deactivateEmployeeAction}
      createdEmployeeId={createdEmployeeId}
    />
  );
}
