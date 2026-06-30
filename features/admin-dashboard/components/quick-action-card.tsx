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
      className="group flex min-h-36 flex-col justify-between rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-ring hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <ArrowRight
          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
