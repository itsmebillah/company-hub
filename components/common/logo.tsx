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

  useEffect(() => setLogoAvailable(Boolean(branding?.logo)), [branding?.logo]);
  return (
    <Link
      href={href}
      className={cn(
        "text-foreground inline-flex min-w-0 items-center gap-3 text-sm font-semibold",
        className,
      )}
    >
      <span className="app-icon-wrap text-primary size-10 overflow-hidden rounded-2xl shadow-[var(--shadow-soft)]">
        {branding?.logo && logoAvailable ? (
          // Company logos may come from an existing external URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logo}
            alt=""
            className="size-full object-contain p-1"
            onError={() => {
              setLogoAvailable(false);
            }}
          />
        ) : null}
        {!logoAvailable ? (
          <Building2 className="size-5" aria-hidden="true" />
        ) : null}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-semibold tracking-tight">
          {branding?.shortName || branding?.companyName || "Company Hub"}
        </span>
        <span className="text-muted-foreground block text-[0.7rem] font-medium tracking-[0.22em] uppercase">
          Workspace
        </span>
      </span>
    </Link>
  );
}
