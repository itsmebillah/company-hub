import "server-only";

import type { ResourcePermissionDraft } from "@/features/resource-permissions/types/resource-permission.types";

function hasDuplicates(values: string[]) {
  return new Set(values).size !== values.length;
}

export const PermissionValidationService = {
  validateDraft(draft: ResourcePermissionDraft) {
    if (draft.isPublic && (draft.roleIds.length > 0 || draft.employeeIds.length > 0)) {
      throw new Error("Public access cannot be combined with role or employee access.");
    }

    if (hasDuplicates(draft.roleIds)) {
      throw new Error("Duplicate role permissions are not allowed.");
    }

    if (hasDuplicates(draft.employeeIds)) {
      throw new Error("Duplicate employee permissions are not allowed.");
    }
  },
};
