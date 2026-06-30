import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-muted">
        <Inbox className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
