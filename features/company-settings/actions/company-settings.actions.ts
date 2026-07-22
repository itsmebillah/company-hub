"use server";

import { revalidatePath } from "next/cache";

import { updateCompanySettings } from "@/features/company-settings/services/company-settings.service";
import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";
import type {
  CompanySettingsActionState,
  CompanySettingsValues,
} from "@/features/company-settings/types/company-settings.types";

export async function updateCompanySettingsAction(
  values: CompanySettingsValues,
): Promise<CompanySettingsActionState> {
  try {
    await requireCompanyAdmin("company_settings");
    await updateCompanySettings(values);
    revalidatePath("/admin/company");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/settings");

    return { ok: true, message: "Company settings saved." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to save company settings.",
    };
  }
}
