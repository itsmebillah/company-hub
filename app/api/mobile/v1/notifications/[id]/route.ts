import { MobileHttpService } from "@/features/mobile-api/services/mobile-http.service";
export const runtime = "nodejs";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{20,}$/i.test(id)) return Response.json({ code: "invalid_notification", message: "Notification is invalid." }, { status: 400 });
  return MobileHttpService.markNotificationRead(request, id);
}
