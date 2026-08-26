import "server-only";

import { FeatureAccessService } from "@/features/platform-control/services/feature-access.service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MobileApiError } from "@/features/mobile-api/services/mobile-api-error";
import { toMobileDashboard } from "@/features/mobile-api/services/mobile-dashboard.mapper";
import type {
  MobileAuthContext,
  MobileDashboard,
} from "@/features/mobile-api/types/mobile-api.types";

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

    return toMobileDashboard({
      context,
      employee: employeeResult.data,
      settings: settingsResult.data,
      features,
    });
  },
};
