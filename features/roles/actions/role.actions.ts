"use server";

import { revalidatePath } from "next/cache";

import { RoleService } from "@/features/roles/services/role.service";
import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";
import type {
  RoleActionState,
  RoleFormValues,
} from "@/features/roles/types/role.types";

const ROLES_PATH = "/admin/roles";
const EMPLOYEES_PATH = "/admin/users";

export async function createRoleAction(
  values: RoleFormValues,
): Promise<RoleActionState> {
  try {
    await requireCompanyAdmin("role_management");
    await RoleService.create(values);
    revalidatePath(ROLES_PATH);
    revalidatePath(EMPLOYEES_PATH);

    return { ok: true, message: "Role created." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to create role.",
    };
  }
}

export async function updateRoleAction(
  id: string,
  values: RoleFormValues,
): Promise<RoleActionState> {
  try {
    await requireCompanyAdmin("role_management");
    await RoleService.update(id, values);
    revalidatePath(ROLES_PATH);
    revalidatePath(EMPLOYEES_PATH);

    return { ok: true, message: "Role updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to update role.",
    };
  }
}

export async function activateRoleAction(id: string): Promise<RoleActionState> {
  try {
    await requireCompanyAdmin("role_management");
    await RoleService.setStatus(id, "active");
    revalidatePath(ROLES_PATH);
    revalidatePath(EMPLOYEES_PATH);

    return { ok: true, message: "Role activated." };
  } catch {
    return { ok: false, message: "Unable to activate role." };
  }
}

export async function deactivateRoleAction(
  id: string,
): Promise<RoleActionState> {
  try {
    await requireCompanyAdmin("role_management");
    await RoleService.setStatus(id, "inactive");
    revalidatePath(ROLES_PATH);
    revalidatePath(EMPLOYEES_PATH);

    return { ok: true, message: "Role deactivated." };
  } catch {
    return { ok: false, message: "Unable to deactivate role." };
  }
}
