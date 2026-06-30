"use server";

import { revalidatePath } from "next/cache";

import {
  createEmployee,
  setEmployeeStatus,
  updateEmployee,
} from "@/features/employees/services/employee.service";
import type {
  EmployeeActionState,
  EmployeeFormValues,
} from "@/features/employees/types/employee.types";

export async function createEmployeeAction(
  values: EmployeeFormValues,
): Promise<EmployeeActionState> {
  try {
    const id = await createEmployee(values);

    revalidatePath("/admin/users");

    return {
      ok: true,
      message: "Employee created.",
      redirectTo: `/admin/users/${id}`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to create employee.",
    };
  }
}

export async function updateEmployeeAction(
  id: string,
  values: EmployeeFormValues,
): Promise<EmployeeActionState> {
  try {
    await updateEmployee(id, values);

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}`);

    return {
      ok: true,
      message: "Employee updated.",
      redirectTo: `/admin/users/${id}`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to update employee.",
    };
  }
}

export async function activateEmployeeAction(id: string): Promise<EmployeeActionState> {
  try {
    await setEmployeeStatus(id, "active");

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}`);

    return { ok: true, message: "Employee activated." };
  } catch {
    return { ok: false, message: "Unable to activate employee." };
  }
}

export async function deactivateEmployeeAction(id: string): Promise<EmployeeActionState> {
  try {
    await setEmployeeStatus(id, "inactive");

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}`);

    return { ok: true, message: "Employee deactivated." };
  } catch {
    return { ok: false, message: "Unable to deactivate employee." };
  }
}
