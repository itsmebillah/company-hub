import "server-only";

import { ActivityService } from "@/features/activity/services/activity.service";
import type { ActivityLogInput } from "@/features/activity/types/activity.types";

export async function logActivity(
  event: Omit<
    ActivityLogInput,
    "companyId" | "employeeId" | "ipAddress" | "userAgent"
  > & {
    companyId?: string | null;
  },
) {
  try {
    await ActivityService.log(event);
  } catch (error) {
    console.error("[Activity] Unable to write activity log.", error);
  }
}
