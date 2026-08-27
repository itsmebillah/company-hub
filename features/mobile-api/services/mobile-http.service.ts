import "server-only";

import { MobileAttendanceService } from "@/features/mobile-api/services/mobile-attendance.service";
import { MobileAuthService } from "@/features/mobile-api/services/mobile-auth.service";
import { MobileDashboardService } from "@/features/mobile-api/services/mobile-dashboard.service";
import { MobileProfileService } from "@/features/mobile-api/services/mobile-profile.service";
import { mobileErrorResponse } from "@/features/mobile-api/services/mobile-api-error";
import { MobileRequestService } from "@/features/mobile-api/services/mobile-request.service";
import { MobileApiError } from "@/features/mobile-api/services/mobile-api-error";
import type { AttendanceCheckInput } from "@/features/attendance/types/attendance.types";

export const MobileHttpService = {
  async login(request: Request) {
    try {
      const input = await MobileRequestService.parseLogin(request);
      return Response.json(
        await MobileAuthService.createSession(input.employeeId, input.password),
      );
    } catch (error) {
      return mobileErrorResponse(error);
    }
  },

  async refresh(request: Request) {
    try {
      const refreshToken = await MobileRequestService.parseRefresh(request);
      return Response.json(
        await MobileAuthService.refreshSession(refreshToken),
      );
    } catch (error) {
      return mobileErrorResponse(error);
    }
  },

  async logout(request: Request) {
    try {
      await MobileAuthService.revoke(request);
      return new Response(null, { status: 204 });
    } catch (error) {
      return mobileErrorResponse(error);
    }
  },

  async dashboard(request: Request) {
    try {
      const dashboard = await MobileAuthService.runAuthenticated(
        request,
        MobileDashboardService.getDashboard,
      );
      return Response.json(dashboard);
    } catch (error) {
      return mobileErrorResponse(error);
    }
  },
  async profile(request: Request) {
    try {
      return Response.json(await MobileAuthService.runAuthenticated(request, MobileProfileService.getProfile));
    } catch (error) { return mobileErrorResponse(error); }
  },
  async updateProfile(request: Request) {
    try {
      const input = await MobileRequestService.parseProfile(request);
      return Response.json(await MobileAuthService.runAuthenticated(request, (context) => MobileProfileService.updateProfile(context, input)));
    } catch (error) { return mobileErrorResponse(error); }
  },
  async uploadProfilePhoto(request: Request) {
    try {
      const form = await request.formData();
      const file = form.get("photo");
      if (!(file instanceof File)) throw new MobileApiError(400, "photo_required", "A profile photo is required.");
      if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new MobileApiError(400, "invalid_photo", "Profile photo must be a JPG, PNG, or WebP image up to 5 MB.");
      return Response.json(await MobileAuthService.runAuthenticated(request, async (context) => {
        const admin = (await import("@/lib/supabase/admin")).createSupabaseAdminClient();
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = `${context.user.id}/avatar.${extension}`;
        const upload = await admin.storage.from("profile-photos").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true, cacheControl: "3600" });
        if (upload.error) throw new MobileApiError(503, "photo_upload_failed", "Unable to upload profile photo.", 30);
        const { error } = await admin.from("employees").update({ photo_url: path, updated_at: new Date().toISOString(), updated_by: context.employee.id }).eq("id", context.employee.id).eq("company_id", context.employee.companyId);
        if (error) throw new MobileApiError(503, "profile_unavailable", "Unable to update profile photo.", 30);
        const { MobileProfileService } = await import("@/features/mobile-api/services/mobile-profile.service");
        return MobileProfileService.getProfile(context);
      }));
    } catch (error) { return mobileErrorResponse(error); }
  },
  async uploadAttendanceSelfie(request: Request) {
    try {
      const form = await request.formData();
      const file = form.get("file");
      const phase = form.get("phase");
      const attendanceDate = form.get("attendanceDate");
      if (!(file instanceof File)) throw new MobileApiError(400, "selfie_required", "An attendance selfie is required.");
      if (phase !== "checkin" && phase !== "checkout") throw new MobileApiError(400, "invalid_selfie_phase", "The attendance selfie phase is invalid.");
      if (typeof attendanceDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) throw new MobileApiError(400, "invalid_attendance_date", "The attendance date is invalid.");
      const { AttendanceSelfieService } = await import("@/features/attendance/services/attendance-selfie.service");
      const stored = await MobileAuthService.runAuthenticated(request, () => AttendanceSelfieService.upload({ file, phase, attendanceDate }));
      return Response.json({ path: stored.objectPath });
    } catch (error) { return mobileErrorResponse(error); }
  },  async registerNotificationDevice(request: Request) {
    try {
      const input = await MobileRequestService.parseNotificationDevice(request);
      const { MobileNotificationDeviceService } = await import("@/features/mobile-api/services/mobile-notification-device.service");
      return Response.json(await MobileAuthService.runAuthenticated(request, (context) => MobileNotificationDeviceService.register(context, input)));
    } catch (error) { return mobileErrorResponse(error); }
  },

  async removeNotificationDevice(request: Request) {
    try {
      const input = await MobileRequestService.parseNotificationDevice(request);
      const { MobileNotificationDeviceService } = await import("@/features/mobile-api/services/mobile-notification-device.service");
      return Response.json(await MobileAuthService.runAuthenticated(request, (context) => MobileNotificationDeviceService.remove(context, input)));
    } catch (error) { return mobileErrorResponse(error); }
  },
  async markNotificationRead(request: Request, id: string) {
    try {
      await MobileAuthService.runAuthenticated(request, async (context) => {
        const { NotificationRepository } = await import("@/features/notifications/repositories/notification.repository");
        await NotificationRepository.markOpenedForEmployee(id, context.employee.id, context.employee.companyId);
      });
      return new Response(null, { status: 204 });
    } catch (error) { return mobileErrorResponse(error); }
  },

  async attendanceState(request: Request) {
    try {
      const state = await MobileAuthService.runAuthenticated(
        request,
        MobileAttendanceService.getState,
      );
      return Response.json(state);
    } catch (error) {
      return mobileErrorResponse(error);
    }
  },

  async checkIn(request: Request) {
    try {
      const input = (await MobileRequestService.parseAttendance(
        request,
      )) as AttendanceCheckInput;
      const state = await MobileAuthService.runAuthenticated(
        request,
        (context) => MobileAttendanceService.checkIn(context, input),
      );
      return Response.json(state, { status: 201 });
    } catch (error) {
      return mobileErrorResponse(error);
    }
  },

  async checkOut(request: Request) {
    try {
      const input = (await MobileRequestService.parseAttendance(
        request,
      )) as AttendanceCheckInput;
      const state = await MobileAuthService.runAuthenticated(
        request,
        (context) => MobileAttendanceService.checkOut(context, input),
      );
      return Response.json(state);
    } catch (error) {
      return mobileErrorResponse(error);
    }
  },
};
