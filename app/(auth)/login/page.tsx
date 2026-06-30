import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components";
import { loginAction } from "@/features/auth/actions/login.action";
import { hasBootstrapAdmin } from "@/features/auth/services/bootstrap.service";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!(await hasBootstrapAdmin())) {
    redirect("/setup");
  }

  return <LoginForm onLogin={loginAction} />;
}
