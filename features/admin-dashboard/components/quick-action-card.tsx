import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

import { IconBadge } from "@/components/common/icon-badge";

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
      className="app-card group flex min-h-36 min-w-0 flex-col justify-between p-5 transition duration-200 hover:-translate-y-1 hover:border-primary/25"
    >
      <div className="flex items-start justify-between gap-3">
        <IconBadge icon={Icon} />
        <ArrowRight
          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
      <div>
        <h2 className="break-words text-base font-semibold">{title}</h2>
        <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </Link>
  );
}
