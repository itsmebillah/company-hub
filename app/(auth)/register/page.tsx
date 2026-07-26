import { redirect } from "next/navigation";

import { getPostLoginRedirectPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const profile = await getCurrentSessionProfile();

  if (profile?.status === "active") {
    redirect(getPostLoginRedirectPath(profile.roleName));
  }

  redirect("/login");
}
