import "server-only";

import { redirect } from "next/navigation";

import { getCurrentAuthUser } from "@/features/auth/services/auth.service";
import { toSupabaseEmployeePassword } from "@/features/auth/utils/employee-password";
import type { PasswordFormValues } from "@/features/profile/types/profile.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function validatePassword(values: PasswordFormValues) {
  if (!values.currentPassword) {
    throw new Error("Current password is required.");
  }

  if (values.newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }

  if (values.newPassword !== values.confirmPassword) {
    throw new Error("New passwords do not match.");
  }

  if (values.currentPassword === values.newPassword) {
    throw new Error("New password must be different from current password.");
  }
}

async function getCurrentEmployeeAuth() {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createSupabaseAdminClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, internal_auth_email, status")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !employee || employee.status !== "active") {
    redirect("/login");
  }

  if (!employee.internal_auth_email) {
    throw new Error("Authentication account could not be resolved.");
  }

  return {
    internalAuthEmail: employee.internal_auth_email,
  };
}

export const PasswordService = {
  async updatePassword(values: PasswordFormValues) {
    validatePassword(values);

    const employee = await getCurrentEmployeeAuth();
    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: employee.internalAuthEmail,
      password: toSupabaseEmployeePassword(values.currentPassword),
    });

    if (signInError) {
      throw new Error("Current password is incorrect.");
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: values.newPassword,
    });

    if (updateError) {
      throw new Error("Unable to update password right now.");
    }
  },
};
