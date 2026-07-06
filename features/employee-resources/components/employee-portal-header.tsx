import { CalendarDays, UserRound } from "lucide-react";

import type { EmployeeResourceProfile } from "@/features/employee-resources/types/employee-resource.types";

type EmployeePortalHeaderProps = {
  profile: EmployeeResourceProfile;
  currentDate: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function EmployeePortalHeader({
  profile,
  currentDate,
}: EmployeePortalHeaderProps) {
  const initials = getInitials(profile.employeeName);

  return (
    <section className="rounded-xl border bg-card px-3 py-2.5 shadow-sm sm:px-4">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full border bg-primary text-lg font-semibold text-primary-foreground shadow-sm">
            {initials ? (
              <span>{initials}</span>
            ) : (
              <UserRound className="size-7" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-5">
              Welcome, {profile.employeeName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.companyName}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground sm:hidden">
              ID {profile.employeeId}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground sm:block">
          <p className="truncate">ID {profile.employeeId}</p>
        </div>

        <div className="flex max-w-[7.5rem] shrink-0 flex-col items-end gap-1 rounded-lg border bg-background px-2.5 py-2 text-xs sm:max-w-none">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" />
            <span className="truncate">{currentDate}</span>
          </div>
          <span className="max-w-full truncate font-medium text-foreground">
            {profile.roleName}
          </span>
        </div>
      </div>
    </section>
  );
}
