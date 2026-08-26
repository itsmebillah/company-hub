import type { FeatureDefinition } from "@/features/platform-control/types/platform.types";
import { getProfilePhotoSrc } from "@/lib/media";
import type {
  MobileAuthContext,
  MobileDashboard,
  MobileDashboardFeature,
  MobileDashboardProfile,
} from "@/features/mobile-api/types/mobile-api.types";

export type MobileDashboardEmployeeRow = {
  id: string;
  employee_id: string;
  name: string;
  company_id: string;
  status: string;
  photo_url: string | null;
};

export type MobileDashboardCompanySettingsRow = {
  company_name: string | null;
};

export function toMobileDashboardFeatures(
  features: FeatureDefinition[],
): MobileDashboardFeature[] {
  return features.map((feature) => ({
    key: feature.key,
    enabled: feature.effectiveState === "enabled",
  }));
}

export function toMobileDashboardProfile(input: {
  context: MobileAuthContext;
  employee: MobileDashboardEmployeeRow;
  settings: MobileDashboardCompanySettingsRow | null;
}): MobileDashboardProfile {
  return {
    employeeId: input.context.employee.employeeId,
    name: input.context.employee.name,
    companyId: input.context.employee.companyId,
    roleName: input.context.employee.roleName,
    companyName: input.settings?.company_name?.trim() || "Company Hub",
    photoUrl: getProfilePhotoSrc(input.employee.photo_url),
  };
}

export function toMobileDashboard(input: {
  context: MobileAuthContext;
  employee: MobileDashboardEmployeeRow;
  settings: MobileDashboardCompanySettingsRow | null;
  features: FeatureDefinition[];
}): MobileDashboard {
  const features = toMobileDashboardFeatures(input.features);

  return {
    profile: toMobileDashboardProfile(input),
    features,
    enabledFeatureKeys: features
      .filter((feature) => feature.enabled)
      .map((feature) => feature.key),
  };
}
