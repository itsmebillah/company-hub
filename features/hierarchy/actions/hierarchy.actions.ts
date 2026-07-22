"use server";

import { revalidatePath } from "next/cache";

import {
  bulkReassignEmployees,
  changeEmployeeManager,
} from "@/features/hierarchy/services/hierarchy.service";
import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";
import type {
  BulkReassignInput,
  ChangeManagerInput,
  HierarchyActionState,
} from "@/features/hierarchy/types/hierarchy.types";

const HIERARCHY_PATH = "/admin/users/hierarchy";

export async function changeManagerAction(
  input: ChangeManagerInput,
): Promise<HierarchyActionState> {
  try {
    await requireCompanyAdmin("employee_directory");
    await changeEmployeeManager(input);
    revalidatePath(HIERARCHY_PATH);
    revalidatePath("/admin/users");

    return { ok: true, message: "Manager updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to update manager.",
    };
  }
}

export async function bulkReassignAction(
  input: BulkReassignInput,
): Promise<HierarchyActionState> {
  try {
    await requireCompanyAdmin("employee_directory");
    await bulkReassignEmployees(input);
    revalidatePath(HIERARCHY_PATH);
    revalidatePath("/admin/users");

    return { ok: true, message: "Employees reassigned." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to reassign employees.",
    };
  }
}
