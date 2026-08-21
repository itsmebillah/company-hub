import { MobileHttpService } from "@/features/mobile-api/services/mobile-http.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = MobileHttpService.login;
export const DELETE = MobileHttpService.logout;
