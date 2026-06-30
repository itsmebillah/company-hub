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
        "inline-flex items-center gap-2 text-sm font-semibold text-foreground",
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-md border bg-card">
        <Building2 className="size-4" aria-hidden="true" />
      </span>
      <span>Company Hub</span>
    </Link>
  );
}
