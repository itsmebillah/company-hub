import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  aside,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("app-page-header", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="space-y-2">
          {eyebrow ? <p className="app-page-eyebrow">{eyebrow}</p> : null}
          <div className="space-y-2">
            <h1 className="app-page-title">{title}</h1>
            {description ? (
              <p className="app-page-description max-w-3xl">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
      {aside ? <div className="w-full lg:w-auto">{aside}</div> : null}
    </header>
  );
}
