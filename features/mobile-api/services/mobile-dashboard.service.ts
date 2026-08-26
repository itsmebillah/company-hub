import "server-only";

import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";
import { EmployeeResourceService } from "@/features/employee-resources/services/employee-resource.service";
import { AnnouncementService } from "@/features/announcements/services/announcement.service";
import { NotificationRepository } from "@/features/notifications/repositories/notification.repository";
import { CelebrationService } from "@/features/celebrations/services/celebration.service";
import { CalendarService } from "@/features/company-calendar/services/calendar.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MobileApiError } from "@/features/mobile-api/services/mobile-api-error";
import {
  mobileDashboardSection,
  toMobileAnnouncements,
  toMobileDashboard,
  toMobileNotifications,
  toMobileQuickLinks,
  toMobileToday,
} from "@/features/mobile-api/services/mobile-dashboard.mapper";
import type {
  MobileAuthContext,
  MobileDashboard,
  MobileDashboardSection,
} from "@/features/mobile-api/types/mobile-api.types";
import type { FeatureKey } from "@/features/platform-control/types/platform.types";

async function loadSection<T>(input: {
  enabled: boolean;
  empty: T;
  label: string;
  load: () => Promise<T>;
}): Promise<MobileDashboardSection<T>> {
  if (!input.enabled) {
    return mobileDashboardSection({ enabled: false, data: input.empty });
  }
  try {
    return mobileDashboardSection({ enabled: true, data: await input.load() });
  } catch {
    console.error(`[MobileDashboardService] ${input.label} unavailable.`);
    return mobileDashboardSection({
      enabled: true,
      failed: true,
      data: input.empty,
    });
  }
}

export const MobileDashboardService = {
  async getDashboard(context: MobileAuthContext): Promise<MobileDashboard> {
    const admin = createSupabaseAdminClient();
    const [employeeResult, settingsResult, features] = await Promise.all([
      admin
        .from("employees")
        .select("id, employee_id, name, company_id, status, photo_url")
        .eq("id", context.employee.id)
        .eq("company_id", context.employee.companyId)
        .maybeSingle(),
      admin
        .from("company_settings")
        .select("company_name")
        .eq("company_id", context.employee.companyId)
        .maybeSingle(),
      FeatureAccessService.listForCompany(context.employee.companyId),
    ]);

    if (employeeResult.error || settingsResult.error) {
      throw new MobileApiError(
        503,
        "dashboard_unavailable",
        "Dashboard information is temporarily unavailable.",
        30,
      );
    }

    if (!employeeResult.data || employeeResult.data.status !== "active") {
      throw new MobileApiError(
        403,
        "active_employee_required",
        "An active employee account is required.",
      );
    }

    const enabled = new Set<FeatureKey>(
      features
        .filter((feature) => feature.effectiveState === "enabled")
        .map((feature) => feature.key),
    );
    const [quickLinks, notifications, announcements, today] = await Promise.all(
      [
        loadSection({
          enabled: enabled.has("quick_links"),
          empty: [],
          label: "Quick Links",
          load: async () =>
            toMobileQuickLinks(
              (await EmployeeResourceService.getPortalData()).categories,
            ),
        }),
        loadSection({
          enabled: enabled.has("notifications"),
          empty: { unreadCount: 0, items: [] },
          label: "notifications",
          load: async () =>
            toMobileNotifications({
              latest: await NotificationRepository.listForEmployee(
                context.employee.id,
                context.employee.companyId,
              ),
              unreadCount: await NotificationRepository.countUnreadForEmployee(
                context.employee.id,
                context.employee.companyId,
              ),
            }),
        }),
        loadSection({
          enabled: enabled.has("announcements"),
          empty: [],
          label: "announcements",
          load: async () =>
            toMobileAnnouncements(
              (await AnnouncementService.listForEmployee()).announcements,
            ),
        }),
        loadSection({
          enabled: enabled.has("calendar"),
          empty: null,
          label: "today's calendar and celebrations",
          load: async () => {
            const [calendar, celebrations] = await Promise.all([
              CalendarService.getEmployeePageData(),
              CelebrationService.getEmployeeDashboardCelebrations(),
            ]);
            return toMobileToday({
              day: calendar.today,
              celebrations,
              employeeCode: context.employee.employeeId,
            });
          },
        }),
      ],
    );

    return toMobileDashboard({
      context,
      employee: employeeResult.data,
      settings: settingsResult.data,
      features,
      content: { quickLinks, notifications, announcements, today },
    });
  },
};
