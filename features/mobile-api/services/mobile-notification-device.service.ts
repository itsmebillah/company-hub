import "server-only";

import { MobileApiError } from "@/features/mobile-api/services/mobile-api-error";
import type { MobileAuthContext } from "@/features/mobile-api/types/mobile-api.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_TOKEN_LENGTH = 4096;

export type MobileNotificationDeviceInput = {
  token: string;
  platform: "android";
};

function validate(input: MobileNotificationDeviceInput) {
  const token = input.token.trim();
  if (token.length < 20 || token.length > MAX_TOKEN_LENGTH) {
    throw new MobileApiError(400, "invalid_device_token", "The notification device token is invalid.");
  }
  return token;
}

export const MobileNotificationDeviceService = {
  async register(context: MobileAuthContext, input: MobileNotificationDeviceInput) {
    const token = validate(input);
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const { error } = await admin.from("employee_notification_devices").upsert(
      {
        token,
        platform: input.platform,
        employee_id: context.employee.id,
        company_id: context.employee.companyId,
        active: true,
        updated_at: now,
        last_seen_at: now,
      },
      { onConflict: "token" },
    );
    if (error) {
      console.error("[MobileNotificationDeviceService] Unable to register device token.");
      throw new MobileApiError(503, "notification_registration_unavailable", "Notifications are temporarily unavailable.", 30);
    }
    return { registered: true };
  },

  async remove(context: MobileAuthContext, input: MobileNotificationDeviceInput) {
    const token = validate(input);
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("employee_notification_devices")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("token", token)
      .eq("employee_id", context.employee.id)
      .eq("company_id", context.employee.companyId);
    if (error) {
      console.error("[MobileNotificationDeviceService] Unable to deactivate device token.");
      throw new MobileApiError(503, "notification_removal_unavailable", "Notifications are temporarily unavailable.", 30);
    }
    return { removed: true };
  },
};