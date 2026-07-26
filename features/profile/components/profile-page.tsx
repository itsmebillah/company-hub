import { Cake, CalendarDays, PartyPopper, ShieldCheck } from "lucide-react";

import { IconBadge } from "@/components/common/icon-badge";
import { PageHeader } from "@/components/common/page-header";
import { EmployeeWorkModeBadge } from "@/features/employees/ui/employee-work-mode-badge";
import { PasswordSection } from "@/features/profile/components/password-section";
import { PreferencesSection } from "@/features/profile/components/preferences-section";
import { ProfileDetailsForm } from "@/features/profile/components/profile-details-form";
import { AccountSection } from "@/features/profile/components/account-section";
import type {
  PasswordFormValues,
  ProfileActionState,
  ProfileData,
  ProfileFormValues,
} from "@/features/profile/types/profile.types";
import { formatAppDate, getAppDateString } from "@/lib/datetime";

type ProfilePageProps = {
  profile: ProfileData;
  onProfileSave: (values: ProfileFormValues) => Promise<ProfileActionState>;
  onPasswordSave: (values: PasswordFormValues) => Promise<ProfileActionState>;
};

function formatDate(value: string) {
  if (!value) {
    return "Not set";
  }

  return formatAppDate(value, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatWorkAnniversary(value: string) {
  if (!value) {
    return "Not set";
  }

  const today = getAppDateString();
  const [currentYear, currentMonth, currentDay] = today.split("-").map(Number);
  const [joiningYear, joiningMonth, joiningDay] = value.split("-").map(Number);

  if (
    [
      currentYear,
      currentMonth,
      currentDay,
      joiningYear,
      joiningMonth,
      joiningDay,
    ].some((part) => Number.isNaN(part))
  ) {
    return "Not set";
  }

  let yearsCompleted = currentYear - joiningYear;

  if (
    currentMonth < joiningMonth ||
    (currentMonth === joiningMonth && currentDay < joiningDay)
  ) {
    yearsCompleted -= 1;
  }

  if (yearsCompleted <= 0) {
    return "First anniversary upcoming";
  }

  const yearsLabel = `${yearsCompleted} year${yearsCompleted === 1 ? "" : "s"}`;

  if (currentMonth === joiningMonth && currentDay === joiningDay) {
    return `Celebrating ${yearsLabel} today`;
  }

  return `${yearsLabel} completed`;
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
        description={`${profile.employeeId} - ${profile.roleName}`}
        aside={<IconBadge icon={ShieldCheck} className="mx-auto lg:mx-0" />}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="app-card app-card-subtle flex items-center gap-3 px-4 py-4">
          <IconBadge icon={Cake} className="size-10 rounded-2xl" />
          <div>
            <p className="text-muted-foreground text-xs">Birthday</p>
            <p className="text-sm font-medium">
              {formatDate(profile.dateOfBirth)}
            </p>
          </div>
        </div>
        <div className="app-card app-card-subtle flex items-center gap-3 px-4 py-4">
          <IconBadge icon={CalendarDays} className="size-10 rounded-2xl" />
          <div>
            <p className="text-muted-foreground text-xs">Joined</p>
            <p className="text-sm font-medium">
              {formatDate(profile.joiningDate)}
            </p>
          </div>
        </div>
        <div className="app-card app-card-subtle flex items-center gap-3 px-4 py-4">
          <IconBadge icon={PartyPopper} className="size-10 rounded-2xl" />
          <div>
            <p className="text-muted-foreground text-xs">Work Anniversary</p>
            <p className="text-sm font-medium">
              {formatWorkAnniversary(profile.joiningDate)}
            </p>
          </div>
        </div>
        <div className="app-card app-card-subtle flex items-center gap-3 px-4 py-4">
          <IconBadge icon={ShieldCheck} className="size-10 rounded-2xl" />
          <div>
            <p className="text-muted-foreground text-xs">Status</p>
            <p className="text-sm font-medium capitalize">{profile.status}</p>
          </div>
        </div>
        <div className="app-card app-card-subtle flex items-center gap-3 px-4 py-4 sm:col-span-2">
          <IconBadge icon={ShieldCheck} className="size-10 rounded-2xl" />
          <div>
            <p className="text-muted-foreground text-xs">Work Mode</p>
            <div className="mt-1">
              <EmployeeWorkModeBadge workMode={profile.workMode} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ProfileDetailsForm profile={profile} onSave={onProfileSave} />
        <div className="space-y-6">
          <PasswordSection onSave={onPasswordSave} />
          <PreferencesSection />
          <AccountSection />
        </div>
      </div>
    </section>
  );
}
