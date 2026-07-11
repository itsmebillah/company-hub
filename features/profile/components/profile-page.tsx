import { CalendarDays, ShieldCheck } from "lucide-react";

import { IconBadge } from "@/components/common/icon-badge";
import { PageHeader } from "@/components/common/page-header";
import { PasswordSection } from "@/features/profile/components/password-section";
import { PreferencesSection } from "@/features/profile/components/preferences-section";
import { ProfileDetailsForm } from "@/features/profile/components/profile-details-form";
import type {
  PasswordFormValues,
  ProfileActionState,
  ProfileData,
  ProfileFormValues,
} from "@/features/profile/types/profile.types";

type ProfilePageProps = {
  profile: ProfileData;
  onProfileSave: (values: ProfileFormValues) => Promise<ProfileActionState>;
  onPasswordSave: (values: PasswordFormValues) => Promise<ProfileActionState>;
};

function formatDate(value: string) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function ProfilePage({
  profile,
  onProfileSave,
  onPasswordSave,
}: ProfilePageProps) {
  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="My Workspace"
        title={profile.fullName}
        description={`${profile.employeeId} · ${profile.roleName}`}
        aside={<IconBadge icon={ShieldCheck} className="mx-auto lg:mx-0" />}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="app-card app-card-subtle flex items-center gap-3 px-4 py-4">
          <IconBadge icon={CalendarDays} className="size-10 rounded-2xl" />
          <div>
            <p className="text-xs text-muted-foreground">Joined</p>
            <p className="text-sm font-medium">{formatDate(profile.joiningDate)}</p>
          </div>
        </div>
        <div className="app-card app-card-subtle flex items-center gap-3 px-4 py-4">
          <IconBadge icon={ShieldCheck} className="size-10 rounded-2xl" />
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-medium capitalize">{profile.status}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ProfileDetailsForm profile={profile} onSave={onProfileSave} />
        <div className="space-y-6">
          <PasswordSection onSave={onPasswordSave} />
          <PreferencesSection />
        </div>
      </div>
    </section>
  );
}
