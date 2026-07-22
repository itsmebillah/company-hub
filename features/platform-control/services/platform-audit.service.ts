import "server-only";

import { headers } from "next/headers";

import { getCurrentAuthUser } from "@/features/auth/services/auth.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AuditEventInput } from "@/features/platform-control/types/platform.types";

async function getRequestContext() {
  try {
    const requestHeaders = await headers();
    return {
      ipAddress:
        requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        requestHeaders.get("x-real-ip"),
      userAgent: requestHeaders.get("user-agent"),
    };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

export const PlatformAuditService = {
  async log(input: AuditEventInput) {
    try {
      const [user, requestContext] = await Promise.all([
        getCurrentAuthUser(),
        getRequestContext(),
      ]);
      const supabase = createSupabaseAdminClient();
      const { data: actor } =
        !input.employeeId && user?.id
          ? await supabase
              .from("employees")
              .select("id, company_id")
              .eq("auth_user_id", user.id)
              .maybeSingle()
          : { data: null };
      const { error } = await supabase.from("platform_audit_logs").insert({
        company_id: input.companyId ?? actor?.company_id ?? null,
        employee_id: input.employeeId ?? actor?.id ?? null,
        platform_admin_id: input.platformAdminId ?? null,
        auth_user_id: input.authUserId ?? user?.id ?? null,
        category: input.category,
        feature_key: input.featureKey ?? null,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        status: input.status ?? "success",
        description: input.description,
        metadata: input.metadata ?? {},
        ip_address: requestContext.ipAddress,
        user_agent: requestContext.userAgent,
      });

      if (error) {
        console.error(
          "[PlatformAuditService] Unable to write audit event.",
          error,
        );
      }
    } catch (error) {
      console.error("[PlatformAuditService] Audit event failed.", error);
    }
  },
};
