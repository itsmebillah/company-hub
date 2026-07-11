import { Building2, CalendarDays, ShieldCheck } from "lucide-react";

import { ProfilePhoto } from "@/components/common/profile-photo";
import { getRenderableImageSrc } from "@/lib/media";

type DashboardHeaderProps = {
  companyName: string;
  companyLogo?: string | null;
  userName: string;
  employeeId: string;
  roleName: string;
  photoUrl?: string | null;
  currentDate: string;
};

export function DashboardHeader({
  companyName,
  companyLogo,
  userName,
  employeeId,
  roleName,
  photoUrl,
  currentDate,
}: DashboardHeaderProps) {
  const logoSrc = getRenderableImageSrc(companyLogo);

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 rounded-xl border bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <ProfilePhoto
              src={photoUrl}
              name={userName}
              className="size-14 border shadow-sm"
              fallbackClassName="bg-primary text-lg text-primary-foreground"
              iconClassName="size-7 text-primary-foreground"
            />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Welcome</p>
              <h1 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">
                {userName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>ID {employeeId}</span>
                <span>{roleName}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:justify-items-end">
            <div className="flex w-fit flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
              <CalendarDays
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="font-medium">{currentDate}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-4">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt=""
                className="size-12 shrink-0 rounded-xl border object-cover shadow-sm"
              />
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Building2 className="size-6" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Company
              </p>
              <p className="break-words text-base font-semibold">{companyName}</p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Workspace
              </p>
              <p className="break-words text-sm text-muted-foreground">
                Monitor company operations and jump into the most important admin flows.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
