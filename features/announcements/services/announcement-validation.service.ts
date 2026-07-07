import "server-only";

import { ANNOUNCEMENT_PRIORITIES } from "@/features/announcements/constants/announcement-options";
import type {
  AnnouncementFormValues,
  AnnouncementPriority,
  AnnouncementStatus,
} from "@/features/announcements/types/announcement.types";

function assertPriority(value: string): asserts value is AnnouncementPriority {
  if (!ANNOUNCEMENT_PRIORITIES.some((item) => item.value === value)) {
    throw new Error("Priority is invalid.");
  }
}

function assertStatus(value: string): asserts value is AnnouncementStatus {
  if (!["active", "inactive", "archived"].includes(value)) {
    throw new Error("Status is invalid.");
  }
}

export const AnnouncementValidationService = {
  validate(values: AnnouncementFormValues) {
    if (!values.title.trim()) {
      throw new Error("Title is required.");
    }

    assertPriority(values.priority);
    assertStatus(values.status);

    if (values.publishFrom && values.publishUntil) {
      const publishFrom = new Date(values.publishFrom);
      const publishUntil = new Date(values.publishUntil);

      if (publishUntil < publishFrom) {
        throw new Error("Publish Until must be after Publish From.");
      }
    }

    if (
      !["company", "roles", "employees"].includes(values.targetAudience)
    ) {
      throw new Error("Target audience is invalid.");
    }

    const roleIds = Array.from(new Set(values.roleIds.filter(Boolean)));
    const employeeIds = Array.from(new Set(values.employeeIds.filter(Boolean)));

    if (values.targetAudience === "roles" && roleIds.length === 0) {
      throw new Error("Select at least one role.");
    }

    if (values.targetAudience === "employees" && employeeIds.length === 0) {
      throw new Error("Select at least one employee.");
    }

    return {
      title: values.title.trim(),
      description: [values.description.trim(), values.content.trim()]
        .filter(Boolean)
        .join("\n\n"),
      bannerUrl: values.bannerUrl.trim(),
      priority: values.priority,
      publishFrom: values.publishFrom || null,
      publishUntil: values.publishUntil || null,
      status: values.status,
      targetAudience: values.targetAudience,
      roleIds: values.targetAudience === "roles" ? roleIds : [],
      employeeIds: values.targetAudience === "employees" ? employeeIds : [],
    };
  },
};
