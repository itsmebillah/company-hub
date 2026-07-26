"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useCompanyBranding } from "@/features/company-settings/components/company-branding-provider";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  className?: string;
};

export function Logo({ href = "/", className }: LogoProps) {
  const branding = useCompanyBranding();
  const [logoAvailable, setLogoAvailable] = useState(Boolean(branding?.logo));
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    setLogoAvailable(Boolean(branding?.logo));
    setLogoLoaded(false);
  }, [branding?.logo]);
  return (
    <Link
      href={href}
      className={cn(
        "text-foreground inline-flex min-w-0 items-center gap-3 text-sm font-semibold",
        className,
      )}
    >
      <span className="app-icon-wrap text-primary relative size-10 shrink-0 overflow-hidden rounded-2xl shadow-[var(--shadow-soft)]">
        <Building2 className="size-5" aria-hidden="true" />
        {branding?.logo && logoAvailable ? (
          // Company logos may come from an existing external URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logo}
            alt=""
            className={cn(
              "bg-background absolute inset-0 size-full object-contain p-1 transition-opacity",
              logoLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setLogoLoaded(true)}
            onError={() => {
              setLogoAvailable(false);
              setLogoLoaded(false);
            }}
          />
        ) : null}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold tracking-tight">
          {branding?.shortName || branding?.companyName || "Company Hub"}
        </span>
        <span className="text-muted-foreground block text-[0.7rem] font-medium tracking-[0.22em] uppercase">
          Workspace
        </span>
      </span>
    </Link>
  );
}
