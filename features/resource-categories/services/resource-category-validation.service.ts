import "server-only";

import type {
  ResourceCategoryFormValues,
  ResourceCategoryStatus,
} from "@/features/resource-categories/types/resource-category.types";

function assertStatus(status: string): asserts status is ResourceCategoryStatus {
  if (!["active", "inactive", "archived"].includes(status)) {
    throw new Error("Status is invalid.");
  }
}

export const ResourceCategoryValidationService = {
  validate(values: ResourceCategoryFormValues) {
    if (!values.name.trim()) {
      throw new Error("Category name is required.");
    }

    assertStatus(values.status);

    const displayOrder = Number(values.displayOrder);

    if (!Number.isInteger(displayOrder) || displayOrder <= 0) {
      throw new Error("Display order must be a positive number.");
    }

    return {
      name: values.name.trim(),
      icon: values.icon.trim(),
      color: values.color.trim() || "#2563EB",
      displayOrder,
      status: values.status,
    };
  },
};
