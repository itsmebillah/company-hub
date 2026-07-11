import { redirect } from "next/navigation";

import {
  updatePasswordAction,
  updateProfileAction,
} from "@/features/profile/actions/profile.actions";
import { getAdminEquivalentPath } from "@/features/auth/services/redirect.service";
import { getCurrentSessionProfile } from "@/features/auth/services/session.service";
import { ProfilePage } from "@/features/profile/components";
import { ProfileService } from "@/features/profile/services/profile.service";
import { ROLE_NAMES } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function EmployeeProfilePage() {
  const sessionProfile = await getCurrentSessionProfile();

  if (
    sessionProfile?.status === "active" &&
    sessionProfile.roleName === ROLE_NAMES.admin
  ) {
    redirect(getAdminEquivalentPath("/profile"));
  }

  const profile = await ProfileService.getProfile();

  return (
    <ProfilePage
      profile={profile}
      onProfileSave={updateProfileAction}
      onPasswordSave={updatePasswordAction}
    />
  );
}
