import "server-only";

import {
  OPEN_MODES,
  RESOURCE_TYPES,
} from "@/features/resources/constants/resource-options";
import type {
  ResourceFormValues,
  ResourceOpenMode,
  ResourceStatus,
  ResourceType,
} from "@/features/resources/types/resource.types";

type ValidatedResource = {
  displayOrder: number;
  resourceType: ResourceType;
  openMode: ResourceOpenMode;
  status: ResourceStatus;
};

function assertStatus(status: string): asserts status is ResourceStatus {
  if (!["active", "inactive", "archived"].includes(status)) {
    throw new Error("Invalid resource status.");
  }
}

function assertResourceType(value: string): asserts value is ResourceType {
  if (!RESOURCE_TYPES.some((item) => item.value === value)) {
    throw new Error("Resource type is required.");
  }
}

function assertOpenMode(value: string): asserts value is ResourceOpenMode {
  if (!OPEN_MODES.some((item) => item.value === value)) {
    throw new Error("Open mode is required.");
  }
}

export const ResourceValidationService = {
  validate(values: ResourceFormValues): ValidatedResource {
    if (!values.title.trim()) {
      throw new Error("Title is required.");
    }

    if (!values.categoryId) {
      throw new Error("Category is required.");
    }

    assertResourceType(values.resourceType);
    assertOpenMode(values.openMode);
    assertStatus(values.status);

    if (values.resourceType !== "internal" && !values.url.trim()) {
      throw new Error("URL is required for this resource type.");
    }

    const displayOrder = Number(values.displayOrder);

    if (!Number.isInteger(displayOrder) || displayOrder <= 0) {
      throw new Error("Display order must be a positive number.");
    }

    return {
      displayOrder,
      resourceType: values.resourceType,
      openMode: values.openMode,
      status: values.status,
    };
  },
};
