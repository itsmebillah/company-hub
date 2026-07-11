import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import {
  getPremiumCardClassName,
  PremiumIconContainer,
  type PremiumCardTone,
} from "@/components/common/premium-card";

type QuickActionCardProps = {
  title: string;
  href: string;
  icon: LucideIcon;
  tone?: PremiumCardTone;
};

export function QuickActionCard({
  title,
  href,
  icon: Icon,
  tone = "blue",
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={getPremiumCardClassName(
        tone,
        "group flex aspect-square min-w-0 flex-col items-center justify-center gap-2 rounded-[1.35rem] p-2.5 text-center transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <PremiumIconContainer icon={Icon} className="size-10 sm:size-11" />
      <h2 className="line-clamp-2 min-h-8 text-xs font-semibold leading-4 text-foreground sm:text-sm sm:leading-5">
        {title}
      </h2>
    </Link>
  );
}
