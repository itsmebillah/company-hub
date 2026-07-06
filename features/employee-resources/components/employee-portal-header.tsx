import { Building2, CalendarDays } from "lucide-react";

import type { EmployeeResourceProfile } from "@/features/employee-resources/types/employee-resource.types";
import { getRenderableImageSrc } from "@/lib/media";

type EmployeePortalHeaderProps = {
  profile: EmployeeResourceProfile;
  currentDate: string;
};

export function EmployeePortalHeader({
  profile,
  currentDate,
}: EmployeePortalHeaderProps) {
  const companyLogo = getRenderableImageSrc(profile.companyLogo);

  return (
    <section className="rounded-xl border bg-card px-3 py-3 shadow-sm sm:px-4">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt=""
              className="size-11 shrink-0 rounded-xl border object-cover"
            />
          ) : (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="size-5" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-5">
              Welcome, {profile.employeeName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.companyName}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground sm:flex">
          <span className="font-medium text-foreground">{profile.roleName}</span>
          <span aria-hidden="true">/</span>
          <span>{profile.employeeId}</span>
        </div>

        <div className="flex max-w-[9.5rem] shrink-0 items-center gap-2 rounded-lg border bg-background px-2.5 py-2 text-xs text-muted-foreground sm:max-w-none">
            <CalendarDays className="size-4 shrink-0" />
            <span className="truncate">{currentDate}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground sm:hidden">
        <span className="rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground">
          {profile.roleName}
        </span>
        <span className="truncate">ID {profile.employeeId}</span>
      </div>
    </section>
  );
}
