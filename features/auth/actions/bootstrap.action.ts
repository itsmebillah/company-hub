"use server";

import { bootstrapFirstAdmin } from "@/features/auth/services/bootstrap.service";

export type BootstrapActionState =
  | {
      ok: true;
      redirectTo: string;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

type BootstrapActionInput = {
  companyName: string;
  shortName: string;
  companyLogo: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  supportPhone: string;
  employeeId: string;
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const ADMIN_DASHBOARD_PATH = "/admin/dashboard";

export async function bootstrapAction(
  input: BootstrapActionInput,
): Promise<BootstrapActionState> {
  const employeeId = input.employeeId.trim();
  const companyName = input.companyName.trim();
  const name = input.name.trim();
  const phone = input.phone.trim();
  const password = input.password.trim();
  const confirmPassword = input.confirmPassword.trim();

  if (!companyName) {
    return { ok: false, message: "Company name is required." };
  }

  if (!employeeId) {
    return { ok: false, message: "Employee ID is required." };
  }

  if (!name) {
    return { ok: false, message: "Full name is required." };
  }

  if (!phone) {
    return { ok: false, message: "Phone is required." };
  }

  if (!password || !confirmPassword) {
    return { ok: false, message: "Password and confirmation are required." };
  }

  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { ok: false, message: "Passwords do not match." };
  }

  try {
    await bootstrapFirstAdmin({
      companyName,
      shortName: input.shortName,
      companyLogo: input.companyLogo,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      supportEmail: input.supportEmail,
      supportPhone: input.supportPhone,
      employeeId,
      name,
      phone,
      password,
    });

    return {
      ok: true,
      message: "Administrator account created.",
      redirectTo: ADMIN_DASHBOARD_PATH,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Bootstrap is already complete."
    ) {
      return {
        ok: false,
        message: "An active Admin already exists. Please sign in.",
      };
    }

    if (
      error instanceof Error &&
      error.message === "Employee ID already exists."
    ) {
      return { ok: false, message: "Employee ID already exists." };
    }

    return {
      ok: false,
      message: "Unable to complete bootstrap setup. Please try again.",
    };
  }
}
