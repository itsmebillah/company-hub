"use server";

import { revalidatePath } from "next/cache";

import { updateCompanySettings } from "@/features/company-settings/services/company-settings.service";
import type {
  CompanySettingsActionState,
  CompanySettingsValues,
} from "@/features/company-settings/types/company-settings.types";

export async function updateCompanySettingsAction(
  values: CompanySettingsValues,
): Promise<CompanySettingsActionState> {
  try {
    await updateCompanySettings(values);
    revalidatePath("/admin/company");
    revalidatePath("/admin/dashboard");

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
