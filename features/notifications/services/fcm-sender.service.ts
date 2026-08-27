import "server-only";

import { JWT } from "google-auth-library";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getFcmServerConfig } from "@/features/notifications/services/fcm-config.service";
import type { NotificationItem } from "@/features/notifications/types/notification.types";

export type FcmSendResult = { sent: number; invalidTokens: string[]; transientFailure: boolean };

let authClient: JWT | null = null;
function getAuthClient() {
  const config = getFcmServerConfig();
  if (!config) return null;
  authClient ??= new JWT({ email: config.clientEmail, key: config.privateKey, scopes: ["https://www.googleapis.com/auth/firebase.messaging"] });
  return { config, authClient };
}

export async function sendNotificationToEmployee(notification: NotificationItem, employeeId: string, companyId: string): Promise<FcmSendResult> {
  const auth = getAuthClient();
  if (!auth) throw new Error("fcm_unconfigured");
  const admin = createSupabaseAdminClient();
  const { data: devices, error } = await admin.from("employee_notification_devices").select("token").eq("employee_id", employeeId).eq("company_id", companyId).eq("active", true);
  if (error) throw new Error("Unable to resolve notification devices.");
  let sent = 0; const invalidTokens: string[] = []; let transientFailure = false;
  const accessToken = await auth.authClient.getAccessToken();
  if (!accessToken.token) throw new Error("FCM authorization unavailable.");
  for (const device of devices ?? []) {
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(auth.config.projectId)}/messages:send`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken.token}`, "content-type": "application/json" },
      body: JSON.stringify({ message: { token: device.token, notification: { title: notification.title, body: notification.message }, data: { notification_id: notification.id, notification_type: notification.type, ...(notification.actionUrl ? { action_url: notification.actionUrl } : {}) }, android: { notification: { channel_id: "company_hub_push", sound: "default" } } } }),
    });
    if (response.ok) { sent++; continue; }
    const body = await response.json().catch(() => ({})) as { error?: { status?: string; details?: Array<{ errorCode?: string }> } };
    const code = body.error?.details?.[0]?.errorCode ?? body.error?.status;
    if (code === "UNREGISTERED" || code === "INVALID_ARGUMENT") invalidTokens.push(device.token);
    else transientFailure = response.status >= 500 || response.status === 429;
  }
  if (invalidTokens.length) await admin.from("employee_notification_devices").update({ active: false, updated_at: new Date().toISOString() }).in("token", invalidTokens);
  return { sent, invalidTokens, transientFailure };
}