import "server-only";

import { headers } from "next/headers";

import { getCurrentAuthUser } from "@/features/auth/services/auth.service";
import { ActivityRepository } from "@/features/activity/repositories/activity.repository";
import type { ActivityLogInput } from "@/features/activity/types/activity.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ActivityLogEvent = Omit<
  ActivityLogInput,
  "companyId" | "employeeId" | "ipAddress" | "userAgent"
> & {
  companyId?: string | null;
};

async function getActor() {
  const user = await getCurrentAuthUser();

  if (!user) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, company_id, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[ActivityService] Unable to resolve actor.", error);
    return null;
  }

  if (!data || data.status !== "active") {
    return null;
  }

  return {
    employeeId: data.id,
    companyId: data.company_id,
  };
}

async function getRequestInfo() {
  try {
    const headerStore = await headers();

    return {
      ipAddress:
        headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headerStore.get("x-real-ip"),
      userAgent: headerStore.get("user-agent"),
    };
  } catch {
    return {
      ipAddress: null,
      userAgent: null,
    };
  }
}

export const ActivityService = {
  async log(event: ActivityLogEvent) {
    const actor = await getActor();
    const companyId = event.companyId ?? actor?.companyId;

    if (!companyId) {
      return;
    }

    const requestInfo = await getRequestInfo();

    await ActivityRepository.create({
      companyId,
      employeeId: actor?.employeeId ?? null,
      module: event.module,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      description: event.description,
      metadata: event.metadata,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });
  },
};
