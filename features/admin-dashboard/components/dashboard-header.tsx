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
    <section className="relative overflow-hidden rounded-[1.6rem] border bg-card/95 p-3.5 shadow-[var(--shadow-card)] sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/10" />
      <div className="relative flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <ProfilePhoto
            src={photoUrl}
            name={userName}
            className="size-[4.25rem] border-2 border-white/60 shadow-[var(--shadow-card)]"
            fallbackClassName="bg-primary/90 text-xl text-primary-foreground"
            iconClassName="size-8 text-primary-foreground"
          />
          <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-card bg-emerald-500 text-white shadow-sm">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Welcome
          </p>
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
            {userName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm">
            <span className="rounded-full bg-background/75 px-2 py-0.5 font-medium">
              {employeeId}
            </span>
            <span className="rounded-full bg-background/75 px-2 py-0.5 font-medium">
              {roleName}
            </span>
          </div>
          <div className="mt-2 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{currentDate}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt=""
                  className="size-4 shrink-0 rounded-md object-cover"
                />
              ) : (
                <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{companyName}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
