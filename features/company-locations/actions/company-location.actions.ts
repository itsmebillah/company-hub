"use server";

import { revalidatePath } from "next/cache";

import {
  archiveCompanyLocation,
  createCompanyLocation,
  setDefaultCompanyLocation,
  updateCompanyLocation,
} from "@/features/company-locations/services/company-location.service";
import type {
  CompanyLocationActionState,
  CompanyLocationFormValues,
} from "@/features/company-locations/types/company-location.types";

const LOCATIONS_PATH = "/admin/company/locations";

export async function createCompanyLocationAction(
  values: CompanyLocationFormValues,
): Promise<CompanyLocationActionState> {
  try {
    await createCompanyLocation(values);
    revalidatePath(LOCATIONS_PATH);

    return { ok: true, message: "Location created." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to create location.",
    };
  }
}

export async function updateCompanyLocationAction(
  id: string,
  values: CompanyLocationFormValues,
): Promise<CompanyLocationActionState> {
  try {
    await updateCompanyLocation(id, values);
    revalidatePath(LOCATIONS_PATH);

    return { ok: true, message: "Location updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to update location.",
    };
  }
}

export async function archiveCompanyLocationAction(
  id: string,
): Promise<CompanyLocationActionState> {
  try {
    await archiveCompanyLocation(id);
    revalidatePath(LOCATIONS_PATH);

    return { ok: true, message: "Location archived." };
  } catch {
    return { ok: false, message: "Unable to archive location." };
  }
}

export async function setDefaultCompanyLocationAction(
  id: string,
): Promise<CompanyLocationActionState> {
  try {
    await setDefaultCompanyLocation(id);
    revalidatePath(LOCATIONS_PATH);

    return { ok: true, message: "Default location updated." };
  } catch {
    return { ok: false, message: "Unable to set default location." };
  }
}
