"use server";

import { revalidatePath } from "next/cache";
import { isFeatureKey } from "@/features/platform-control/constants/feature-catalog";
import { PlatformControlService } from "@/features/platform-control/services/platform-control.service";
import type {
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
  if (
    !companyId ||
    !["active", "inactive", "suspended", "deleted"].includes(status)
  )
    throw new Error("Invalid company status request.");
  await PlatformControlService.updateCompanyStatus(companyId, status);
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
  if (!isFeatureKey(featureKey) || !["enabled", "disabled"].includes(state))
    throw new Error("Invalid feature request.");
  await PlatformControlService.updatePlatformFeature(featureKey, state);
  revalidatePath("/platform/features");
}

export async function updateCompanyFeatureAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const featureKey = String(formData.get("featureKey") ?? "");
  const state = String(formData.get("state") ?? "") as FeatureState;
  if (
    !companyId ||
    !isFeatureKey(featureKey) ||
    !["enabled", "disabled"].includes(state)
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
  const state = String(formData.get("state") ?? "") as FeatureState;
  if (!isFeatureKey(featureKey) || !["enabled", "disabled"].includes(state))
    throw new Error("Invalid feature request.");
  await PlatformControlService.updateOwnCompanyFeature(featureKey, state);
  revalidatePath("/admin/settings/features");
}
