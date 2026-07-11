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
    <section className="app-card overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="app-card app-card-subtle flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <ProfilePhoto
              src={photoUrl}
              name={userName}
              className="size-14 border border-white/20 shadow-[var(--shadow-card)]"
              fallbackClassName="bg-primary/90 text-lg text-primary-foreground"
              iconClassName="size-7 text-primary-foreground"
            />
            <div className="min-w-0 space-y-1">
              <p className="app-page-eyebrow">Admin Dashboard</p>
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
            <div className="flex w-fit flex-wrap items-center gap-2 rounded-2xl border border-white/20 bg-background/70 px-3 py-2 text-sm shadow-[var(--shadow-soft)]">
              <CalendarDays
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="font-medium">{currentDate}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="app-card app-card-subtle flex min-w-0 items-center gap-3 px-4 py-4">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt=""
                className="size-12 shrink-0 rounded-2xl border border-white/20 object-cover shadow-[var(--shadow-soft)]"
              />
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-raised)]">
                <Building2 className="size-6" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Company
              </p>
              <p className="break-words text-base font-semibold">{companyName}</p>
            </div>
          </div>

          <div className="app-card app-card-subtle flex min-w-0 items-center gap-3 px-4 py-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/80 text-secondary-foreground shadow-[var(--shadow-soft)]">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
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
