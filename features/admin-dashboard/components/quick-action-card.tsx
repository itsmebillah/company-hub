import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type QuickActionCardProps = {
  title: string;
  href: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "purple" | "orange" | "red" | "slate";
};

const tones = {
  blue: "from-blue-500/14 to-sky-500/5 text-blue-700 dark:text-blue-300",
  green:
    "from-emerald-500/14 to-green-500/5 text-emerald-700 dark:text-emerald-300",
  purple:
    "from-violet-500/14 to-fuchsia-500/5 text-violet-700 dark:text-violet-300",
  orange:
    "from-orange-500/14 to-amber-500/5 text-orange-700 dark:text-orange-300",
  red: "from-rose-500/14 to-red-500/5 text-rose-700 dark:text-rose-300",
  slate:
    "from-slate-500/14 to-slate-500/5 text-slate-700 dark:text-slate-300",
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
      className={cn(
        "group flex aspect-square min-w-0 flex-col items-center justify-center gap-2 rounded-[1.35rem] border bg-gradient-to-br p-2.5 text-center shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        tones[tone],
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-2xl border border-white/40 bg-background/80 shadow-sm sm:size-11">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="line-clamp-2 min-h-8 text-xs font-semibold leading-4 text-foreground sm:text-sm sm:leading-5">
        {title}
      </h2>
    </Link>
  );
}
