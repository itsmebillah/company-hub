"use server";

import { revalidatePath } from "next/cache";

import { PermissionService } from "@/features/resource-permissions/services/permission.service";
import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";
import type {
  ResourcePermissionActionState,
  ResourcePermissionUpdateInput,
} from "@/features/resource-permissions/types/resource-permission.types";

export async function replaceResourcePermissionsAction(
  resourceId: string,
  input: ResourcePermissionUpdateInput,
): Promise<ResourcePermissionActionState> {
  try {
    await requireCompanyAdmin("resources");
    await PermissionService.replacePermissions(resourceId, input);
    revalidatePath("/admin/resources/permissions");
    revalidatePath("/dashboard");
    revalidatePath("/resources");

    return { ok: true, message: "Permissions saved." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to save permissions.",
    };
  }
}
