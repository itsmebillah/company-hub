import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ActivityLogInput } from "@/features/activity/types/activity.types";

export const ActivityRepository = {
  async create(input: ActivityLogInput) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("activity_logs").insert({
      company_id: input.companyId,
      employee_id: input.employeeId ?? null,
      module: input.module,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      description: input.description,
      metadata: input.metadata ?? {},
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    });

    if (error) {
      console.error("[ActivityRepository] Unable to create activity log.", error);
      throw new Error("Unable to create activity log.");
    }
  },
};
