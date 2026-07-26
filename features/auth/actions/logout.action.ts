"use server";

import { redirect } from "next/navigation";

import {
  getLogoutRedirectPath,
  logout,
} from "@/features/auth/services/logout.service";

export async function logoutAction() {
  await logout();
  redirect(getLogoutRedirectPath());
}
