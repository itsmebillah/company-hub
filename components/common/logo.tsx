import Link from "next/link";
import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  className?: string;
};

export function Logo({ href = "/", className }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-w-0 items-center gap-3 text-sm font-semibold text-foreground",
        className,
      )}
    >
      <span className="app-icon-wrap size-10 rounded-2xl text-primary shadow-[var(--shadow-soft)]">
        <Building2 className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-sm font-semibold tracking-tight">
          Company Hub
        </span>
        <span className="block text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Workspace
        </span>
      </span>
    </Link>
  );
}
