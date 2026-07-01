import {
  updatePasswordAction,
  updateProfileAction,
} from "@/features/profile/actions/profile.actions";
import { ProfilePage } from "@/features/profile/components";
import { ProfileService } from "@/features/profile/services/profile.service";

export const dynamic = "force-dynamic";

export default async function EmployeeProfilePage() {
  const profile = await ProfileService.getProfile();

  return (
    <ProfilePage
      profile={profile}
      onProfileSave={updateProfileAction}
      onPasswordSave={updatePasswordAction}
    />
  );
}
