import { redirect } from "next/navigation";

import { getAdminEquivalentPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const sessionProfile = await getCurrentSessionProfile();

  if (
    sessionProfile?.status === "active" &&
    sessionProfile.roleName === ROLE_NAMES.admin
  ) {
    redirect(getAdminEquivalentPath("/settings"));
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-2 text-muted-foreground">Placeholder</p>
    </section>
  );
}
