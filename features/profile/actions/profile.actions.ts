"use server";

import { revalidatePath } from "next/cache";

import { PasswordService } from "@/features/profile/services/password.service";
import { ProfileService } from "@/features/profile/services/profile.service";
import type {
  PasswordFormValues,
  ProfileActionState,
  ProfileFormValues,
} from "@/features/profile/types/profile.types";

export async function updateProfileAction(
  values: ProfileFormValues,
): Promise<ProfileActionState> {
  try {
    await ProfileService.updateProfile(values);
    revalidatePath("/profile");

    return { ok: true, message: "Profile updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to update profile.",
    };
  }
}

export async function updatePasswordAction(
  values: PasswordFormValues,
): Promise<ProfileActionState> {
  try {
    await PasswordService.updatePassword(values);

    return { ok: true, message: "Password updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to update password.",
    };
  }
}
