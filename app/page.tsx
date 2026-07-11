import { redirect } from "next/navigation";

import { hasBootstrapAdmin } from "@/features/auth/services/bootstrap.service";
import { getPostLoginRedirectPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await getCurrentSessionProfile();

  if (profile?.status === "active") {
    redirect(getPostLoginRedirectPath(profile.roleName));
  }

  if (await hasBootstrapAdmin()) {
    redirect("/login");
  }

  redirect("/setup");
}
