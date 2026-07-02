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
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt=""
              className="size-12 rounded-xl border object-cover"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
              <Building2 className="size-6" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-muted-foreground">
              {profile.companyName}
            </p>
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              Welcome, {profile.employeeName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.roleName} · {profile.employeeId}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
            <CalendarDays className="size-4 text-muted-foreground" />
            {currentDate}
          </div>
        </div>
      </div>
    </section>
  );
}
