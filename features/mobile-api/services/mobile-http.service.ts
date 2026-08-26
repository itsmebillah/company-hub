import "server-only";

import { MobileAttendanceService } from "@/features/mobile-api/services/mobile-attendance.service";
import { MobileAuthService } from "@/features/mobile-api/services/mobile-auth.service";
import { MobileDashboardService } from "@/features/mobile-api/services/mobile-dashboard.service";
import { MobileProfileService } from "@/features/mobile-api/services/mobile-profile.service";
import { mobileErrorResponse } from "@/features/mobile-api/services/mobile-api-error";
import { MobileRequestService } from "@/features/mobile-api/services/mobile-request.service";
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
