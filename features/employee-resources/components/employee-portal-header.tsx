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
    <section className="rounded-xl border bg-card px-3 py-2.5 shadow-sm sm:px-4">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ProfilePhoto
            src={profile.photoUrl}
            name={profile.employeeName}
            className="size-16 border shadow-sm"
            fallbackClassName="bg-primary text-lg text-primary-foreground"
            iconClassName="size-7 text-primary-foreground"
          />
          <div className="min-w-0">
            <p className="break-words text-sm font-semibold leading-5">
              Welcome, {profile.employeeName}
            </p>
            <p className="break-words text-xs text-muted-foreground">
              {profile.companyName}
            </p>
            <p className="mt-1 break-words text-xs text-muted-foreground sm:hidden">
              ID {profile.employeeId}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground sm:block">
          <p className="break-words">ID {profile.employeeId}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 rounded-lg border bg-background px-2.5 py-2 text-xs sm:max-w-none">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" />
            <span>{currentDate}</span>
          </div>
          <span className="break-words text-right font-medium text-foreground">
            {profile.roleName}
          </span>
        </div>
      </div>
    </section>
  );
}
