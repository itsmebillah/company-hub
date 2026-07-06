import {
  Bell,
  Building2,
  CalendarCheck,
  FileText,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import type { ActivityLogItem } from "@/features/activity/types/activity.types";
import { cn } from "@/lib/utils";

type ActivityLogItemProps = {
  activity: ActivityLogItem;
};

const moduleIcons = {
  employee: UserRound,
  announcement: Bell,
  resources: FileText,
  company_settings: Building2,
  roles: ShieldCheck,
  permissions: ShieldCheck,
  attendance: CalendarCheck,
  future: FileText,
} as const;

export function ActivityLogItemView({ activity }: ActivityLogItemProps) {
  const Icon = moduleIcons[activity.module];

  return (
    <article className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{activity.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {activity.module} - {activity.action}
        </p>
      </div>
    </article>
  );
}
