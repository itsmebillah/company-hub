"use server";

import { revalidatePath } from "next/cache";

import { PermissionService } from "@/features/resource-permissions/services/permission.service";
import type {
  ResourcePermissionActionState,
  ResourcePermissionDraft,
} from "@/features/resource-permissions/types/resource-permission.types";

export async function replaceResourcePermissionsAction(
  resourceId: string,
  draft: ResourcePermissionDraft,
): Promise<ResourcePermissionActionState> {
  try {
    await PermissionService.replacePermissions(resourceId, draft);
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
