import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type IconBadgeProps = {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
};

export function IconBadge({
  icon: Icon,
  className,
  iconClassName,
}: IconBadgeProps) {
  return (
    <span
      className={cn(
        "app-icon-wrap size-11 rounded-2xl text-primary shadow-[0_18px_30px_-24px_rgba(37,99,235,0.7)]",
        className,
      )}
    >
      <Icon className={cn("size-5", iconClassName)} aria-hidden="true" />
    </span>
  );
}
