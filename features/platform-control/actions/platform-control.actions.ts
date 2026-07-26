"use server";

import { revalidatePath } from "next/cache";
import { isFeatureKey } from "@/features/platform-control/constants/feature-catalog";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";
import type {
  CompanyFeatureState,
  FeatureState,
  PlatformCompanyStatus,
} from "@/features/platform-control/types/platform.types";

export async function createCompanyAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) throw new Error("Company name is required.");
  await PlatformControlService.createCompany(name);
  revalidatePath("/platform/companies");
}

export async function updateCompanyStatusAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const status = String(formData.get("status") ?? "") as PlatformCompanyStatus;
  const confirmation = String(formData.get("confirmation") ?? "");
  if (
    !companyId ||
    !["active", "inactive", "suspended", "archived", "deleted"].includes(status)
  )
    throw new Error("Invalid company status request.");
  await PlatformControlService.updateCompanyStatus(
    companyId,
    status,
    confirmation,
  );
  revalidatePath("/platform");
}

export async function updateCompanyNameAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!companyId || name.length < 2)
    throw new Error("A valid company and name are required.");
  await PlatformControlService.updateCompanyName(companyId, name);
  revalidatePath("/platform/companies");
}

export async function updatePlatformFeatureAction(formData: FormData) {
  const featureKey = String(formData.get("featureKey") ?? "");
  const state = String(formData.get("state") ?? "") as FeatureState;
  const allowCompanyOverride = formData.get("allowCompanyOverride") === "on";
  if (!isFeatureKey(featureKey) || !["enabled", "disabled"].includes(state))
    throw new Error("Invalid feature request.");
  await PlatformControlService.updatePlatformFeature(
    featureKey,
    state,
    allowCompanyOverride,
  );
  revalidatePath("/platform/features");
}

export async function updateCompanyFeatureAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const featureKey = String(formData.get("featureKey") ?? "");
  const state = String(formData.get("state") ?? "") as CompanyFeatureState;
  if (
    !companyId ||
    !isFeatureKey(featureKey) ||
    !["inherit", "enabled", "disabled"].includes(state)
  )
    throw new Error("Invalid company feature request.");
  await PlatformControlService.updateCompanyFeature(
    companyId,
    featureKey,
    state,
  );
  revalidatePath("/platform/features");
}

export async function updateOwnCompanyFeatureAction(formData: FormData) {
  const featureKey = String(formData.get("featureKey") ?? "");
  const state = String(formData.get("state") ?? "") as CompanyFeatureState;
  if (
    !isFeatureKey(featureKey) ||
    !["inherit", "enabled", "disabled"].includes(state)
  )
    throw new Error("Invalid feature request.");
  await PlatformControlService.updateOwnCompanyFeature(featureKey, state);
  revalidatePath("/admin/settings/features");
}

export async function resetPlatformEmployeePasswordAction(formData: FormData) {
  const employeeId = String(formData.get("employeeId") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (!employeeId || !confirmation.trim()) {
    throw new Error("Employee and confirmation are required.");
  }
  await PlatformControlService.resetEmployeePassword(employeeId, confirmation);
  revalidatePath("/platform/people");
}

export async function updatePlatformSettingsAction(formData: FormData) {
  await PlatformControlService.updateSettings({
    platformName: String(formData.get("platformName") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? ""),
    faviconUrl: String(formData.get("faviconUrl") ?? ""),
    primaryColor: String(formData.get("primaryColor") ?? ""),
    supportEmail: String(formData.get("supportEmail") ?? ""),
    defaultTimezone: String(formData.get("defaultTimezone") ?? ""),
    maintenanceMessage: String(formData.get("maintenanceMessage") ?? ""),
    maintenanceMode: formData.get("maintenanceMode") === "on",
    allowCompanyCreation: formData.get("allowCompanyCreation") === "on",
  });
  revalidatePath("/platform");
}
