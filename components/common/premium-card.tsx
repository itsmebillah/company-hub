import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type PremiumCardTone =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "cyan"
  | "pink"
  | "indigo"
  | "gray"
  | "red";

const premiumCardTones: Record<PremiumCardTone, string> = {
  blue: "from-blue-500/12 via-sky-400/7 to-white/70 text-blue-700 dark:from-blue-400/16 dark:via-sky-400/8 dark:to-blue-950/20 dark:text-blue-300",
  green:
    "from-emerald-500/12 via-green-400/7 to-white/70 text-emerald-700 dark:from-emerald-400/16 dark:via-green-400/8 dark:to-emerald-950/20 dark:text-emerald-300",
  purple:
    "from-violet-500/12 via-fuchsia-400/7 to-white/70 text-violet-700 dark:from-violet-400/16 dark:via-fuchsia-400/8 dark:to-violet-950/20 dark:text-violet-300",
  orange:
    "from-orange-500/12 via-amber-400/7 to-white/70 text-orange-700 dark:from-orange-400/16 dark:via-amber-400/8 dark:to-orange-950/20 dark:text-orange-300",
  cyan: "from-cyan-500/12 via-sky-400/7 to-white/70 text-cyan-700 dark:from-cyan-400/16 dark:via-sky-400/8 dark:to-cyan-950/20 dark:text-cyan-300",
  pink: "from-pink-500/12 via-rose-400/7 to-white/70 text-pink-700 dark:from-pink-400/16 dark:via-rose-400/8 dark:to-pink-950/20 dark:text-pink-300",
  indigo:
    "from-indigo-500/12 via-blue-400/7 to-white/70 text-indigo-700 dark:from-indigo-400/16 dark:via-blue-400/8 dark:to-indigo-950/20 dark:text-indigo-300",
  gray: "from-slate-500/10 via-slate-300/7 to-white/70 text-slate-700 dark:from-slate-400/14 dark:via-slate-400/7 dark:to-slate-950/25 dark:text-slate-300",
  red: "from-rose-500/12 via-red-400/7 to-white/70 text-rose-700 dark:from-rose-400/16 dark:via-red-400/8 dark:to-rose-950/20 dark:text-rose-300",
};

type PremiumCardProps = {
  children: ReactNode;
  className?: string;
  tone?: PremiumCardTone;
};

type PremiumIconContainerProps = {
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
  iconClassName?: string;
};

export function getPremiumCardClassName(
  tone: PremiumCardTone = "blue",
  className?: string,
) {
  return cn(
    "border border-white/50 bg-gradient-to-br shadow-[var(--shadow-soft)]",
    premiumCardTones[tone],
    className,
  );
}

export function PremiumCard({
  children,
  className,
  tone = "blue",
}: PremiumCardProps) {
  return (
    <div className={getPremiumCardClassName(tone, cn("rounded-[1.35rem]", className))}>
      {children}
    </div>
  );
}

export function PremiumIconContainer({
  icon: Icon,
  children,
  className,
  iconClassName,
}: PremiumIconContainerProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/90 text-current shadow-sm dark:border-white/15 dark:bg-background/85",
        className,
      )}
    >
      {Icon ? (
        <Icon
          className={cn("size-5", iconClassName)}
          aria-hidden="true"
        />
      ) : (
        children
      )}
    </span>
  );
}
