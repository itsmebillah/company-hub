import { MobileHttpService } from "@/features/mobile-api/services/mobile-http.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return MobileHttpService.registerNotificationDevice(request);
}

export async function DELETE(request: Request) {
  return MobileHttpService.removeNotificationDevice(request);
}