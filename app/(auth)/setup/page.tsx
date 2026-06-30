import { redirect } from "next/navigation";

import { bootstrapAction } from "@/features/auth/actions/bootstrap.action";
import { BootstrapSetupForm } from "@/features/auth/components";
import { hasBootstrapAdmin } from "@/features/auth/services/bootstrap.service";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await hasBootstrapAdmin()) {
    redirect("/login");
  }

  return <BootstrapSetupForm onBootstrap={bootstrapAction} />;
}
