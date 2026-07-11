import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type QuickActionCardProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-36 min-w-0 flex-col justify-between rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-ring/60 hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <ArrowRight
          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
      <div>
        <h2 className="break-words text-base font-semibold">{title}</h2>
        <p className="mt-1 break-words text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
