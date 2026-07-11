import { CalendarDays, ShieldCheck } from "lucide-react";

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
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">My Profile</p>
          <h1 className="mt-1 break-words text-2xl font-semibold">
            {profile.fullName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.employeeId} · {profile.roleName}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="text-sm font-medium">
                {formatDate(profile.joiningDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <ShieldCheck className="size-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium capitalize">{profile.status}</p>
            </div>
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
