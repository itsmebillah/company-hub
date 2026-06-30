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
  employeeId: string;
  name: string;
  password: string;
  confirmPassword: string;
};

const ADMIN_DASHBOARD_PATH = "/admin/dashboard";

export async function bootstrapAction(
  input: BootstrapActionInput,
): Promise<BootstrapActionState> {
  const employeeId = input.employeeId.trim();
  const name = input.name.trim();
  const password = input.password.trim();
  const confirmPassword = input.confirmPassword.trim();

  if (!employeeId || !name || !password || !confirmPassword) {
    return { ok: false, message: "All fields are required." };
  }

  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { ok: false, message: "Passwords do not match." };
  }

  try {
    await bootstrapFirstAdmin({
      employeeId,
      name,
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
      return { ok: false, message: "Bootstrap is already complete." };
    }

    return {
      ok: false,
      message: "Unable to complete bootstrap setup. Please try again.",
    };
  }
}
