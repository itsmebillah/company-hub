import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components";
import { loginAction } from "@/features/auth/actions/login.action";
import { hasBootstrapAdmin } from "@/features/auth/services/bootstrap.service";
import { getPostLoginRedirectPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!(await hasBootstrapAdmin())) {
    redirect("/setup");
  }

  const profile = await getCurrentSessionProfile();

  if (profile?.status === "active") {
    redirect(getPostLoginRedirectPath(profile.roleName));
  }

  return <LoginForm onLogin={loginAction} />;
}
