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
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt=""
              className="size-10 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-5" aria-hidden="true" />
            </div>
          )}
          <div className="grid min-w-0 gap-0.5">
            <p className="truncate text-xs text-muted-foreground">Employee ID</p>
            <p className="truncate text-sm font-semibold">{profile.employeeId}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
          <div className="truncate text-sm font-medium">{profile.roleName}</div>
          <div className="flex h-8 max-w-[11rem] items-center gap-2 rounded-md border bg-background px-2.5 text-xs text-muted-foreground sm:max-w-none sm:text-sm">
            <CalendarDays className="size-4 shrink-0" />
            <span className="truncate">{currentDate}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
