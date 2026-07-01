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
    };
  },
};
