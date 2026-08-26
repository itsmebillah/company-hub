import { MobileHttpService } from "@/features/mobile-api/services/mobile-http.service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = MobileHttpService.profile;
export const PATCH = MobileHttpService.updateProfile;
export const POST = MobileHttpService.uploadProfilePhoto;
