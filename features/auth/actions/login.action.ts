"use server";

import { loginWithEmployeeId } from "@/features/auth/services/login.service";
import { getPostLoginRedirectPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";

export type LoginActionState =
  | {
      ok: true;
      redirectTo: string;
      message: string;
    }
  | {
      ok: false;
      message: string;
    };

type LoginActionInput = {
  employeeId: string;
  password: string;
  rememberMe: boolean;
};

const FRIENDLY_ERRORS = {
  employeeIdRequired: "Employee ID is required.",
  passwordRequired: "Password is required.",
  notFound: "Employee account was not found.",
  inactive: "Employee account is inactive.",
  wrongPassword: "Employee ID or password is incorrect.",
  network: "Network error. Please try again.",
  unexpected: "Unable to sign in right now. Please try again.",
} as const;

export async function loginAction(
  input: LoginActionInput,
): Promise<LoginActionState> {
  const employeeId = input.employeeId.trim();
  const password = input.password.trim();

  if (!employeeId) {
    return { ok: false, message: FRIENDLY_ERRORS.employeeIdRequired };
  }

  if (!password) {
    return { ok: false, message: FRIENDLY_ERRORS.passwordRequired };
  }

  try {
    await loginWithEmployeeId({
      employeeId,
      password,
      rememberMe: input.rememberMe,
    });

    const profile = await getCurrentSessionProfile();

    if (!profile || profile.status !== "active") {
      return { ok: false, message: FRIENDLY_ERRORS.unexpected };
    }


    return {
      ok: true,
      message: "Login successful.",
      redirectTo: getPostLoginRedirectPath(
        profile.roleName,
        profile.isSystemAdmin,
      ),
    };
  } catch (error) {
    if (!(error instanceof Error)) {
      return { ok: false, message: FRIENDLY_ERRORS.unexpected };
    }

    if (error.message === "Employee account was not found.") {
      return { ok: false, message: FRIENDLY_ERRORS.notFound };
    }

    if (error.message === "Employee account is not active.") {
      return { ok: false, message: FRIENDLY_ERRORS.inactive };
    }

    if (error.message === "Invalid employee ID or password.") {
      return { ok: false, message: FRIENDLY_ERRORS.wrongPassword };
    }

    if (error.message.toLowerCase().includes("fetch")) {
      return { ok: false, message: FRIENDLY_ERRORS.network };
    }

    return { ok: false, message: FRIENDLY_ERRORS.unexpected };
  }
}
