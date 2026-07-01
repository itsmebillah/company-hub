import { redirect } from "next/navigation";

import { bootstrapAction } from "@/features/auth/actions/bootstrap.action";
import { BootstrapSetupForm } from "@/features/auth/components";
import { getPostLoginRedirectPath } from "@/features/auth/services/redirect.service";
import { hasBootstrapAdmin } from "@/features/auth/services/bootstrap.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await hasBootstrapAdmin()) {
    const profile = await getCurrentSessionProfile();

    if (profile?.status === "active") {
      redirect(getPostLoginRedirectPath(profile.roleName));
    }

    redirect("/login");
  }

  return <BootstrapSetupForm onBootstrap={bootstrapAction} />;
}
