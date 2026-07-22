"use client";

import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PremiumCard } from "@/components/common/premium-card";
import type { EmployeePortalResource } from "@/features/employee-resources/types/employee-resource.types";
import {
  getOpenModeLabel,
  getResourceTypeLabel,
} from "@/features/resources/constants/resource-options";
import { ResourceVisual } from "@/features/resources/ui/resource-visual";

type EmployeeResourceCardProps = {
  resource: EmployeePortalResource;
  categoryName: string;
  primaryAction?: ReactNode;
  footer?: ReactNode;
  extraBadges?: ReactNode;
};

function getTarget(resource: EmployeePortalResource) {
  return resource.openMode === "same_tab" ? undefined : "_blank";
}

function getRel(resource: EmployeePortalResource) {
  return resource.openMode === "same_tab" ? undefined : "noreferrer noopener";
}

function CompactBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <span
      className={
        tone === "accent"
          ? "inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
          : "border-border/60 bg-background/80 text-muted-foreground inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium"
      }
    >
      {children}
    </span>
  );
}

function getUrlLabel(resource: EmployeePortalResource) {
  return resource.url || "Internal page";
}

export function EmployeeResourceCard({
  resource,
  categoryName,
  primaryAction,
  footer,
  extraBadges,
}: EmployeeResourceCardProps) {
  const urlLabel = getUrlLabel(resource);
  const typeLabel = getResourceTypeLabel(resource.resourceType);
  const openModeLabel = getOpenModeLabel(resource.openMode);

  return (
    <PremiumCard tone="cyan" className="overflow-hidden p-3">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <ResourceVisual
            icon={resource.icon}
            customImage={resource.thumbnail}
            url={resource.url}
            title={resource.title}
            className="size-11"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm leading-5 font-semibold">
                  {resource.title}
                </h3>
                <p className="text-muted-foreground truncate text-[11px]">
                  {categoryName}
                </p>
              </div>
              {resource.isFeatured ? (
                <CompactBadge tone="accent">Featured</CompactBadge>
              ) : null}
            </div>
            <p
              className="text-muted-foreground mt-1 truncate text-[11px]"
              title={urlLabel}
            >
              {urlLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <CompactBadge>{typeLabel}</CompactBadge>
        <CompactBadge>{openModeLabel}</CompactBadge>
        {resource.thumbnail ? <CompactBadge>Custom image</CompactBadge> : null}
        {extraBadges}
      </div>

      <div className="mt-3 space-y-2">
        {primaryAction ?? (
          <>
            {resource.url ? (
              <Button asChild size="sm" className="h-8 w-full rounded-xl">
                <a
                  href={resource.url}
                  target={getTarget(resource)}
                  rel={getRel(resource)}
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  Open Resource
                </a>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-8 w-full rounded-xl"
                disabled
              >
                Internal Resource
              </Button>
            )}
          </>
        )}
        {footer}
      </div>
    </PremiumCard>
  );
}
