import { CalendarDays } from "lucide-react";

import { ProfilePhoto } from "@/components/common/profile-photo";
import type { EmployeeResourceProfile } from "@/features/employee-resources/types/employee-resource.types";

type EmployeePortalHeaderProps = {
  profile: EmployeeResourceProfile;
  currentDate: string;
};

export function EmployeePortalHeader({
  profile,
  currentDate,
}: EmployeePortalHeaderProps) {
  return (
    <section className="app-card px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ProfilePhoto
            src={profile.photoUrl}
            name={profile.employeeName}
            className="size-16 border border-white/20 shadow-[var(--shadow-card)]"
            fallbackClassName="bg-primary text-lg text-primary-foreground"
            iconClassName="size-7 text-primary-foreground"
          />
          <div className="min-w-0">
            <p className="whitespace-nowrap text-[0.7rem] font-semibold tracking-[0.24em] text-primary">
              Employee Workspace
            </p>
            <p className="mt-2 break-words text-sm font-semibold leading-5">
              Welcome, {profile.employeeName}
            </p>
            <p className="break-words text-xs text-muted-foreground">
              {profile.companyName}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 rounded-2xl border border-white/20 bg-background/75 px-3 py-2 text-xs shadow-[var(--shadow-soft)] sm:max-w-none">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" />
            <span>{currentDate}</span>
          </div>
          <span className="break-words text-right font-medium text-foreground">
            {profile.roleName}
          </span>
          <span className="break-words text-right text-muted-foreground">
            ID {profile.employeeId}
          </span>
        </div>
      </div>
    </section>
  );
}
