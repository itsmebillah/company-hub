"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { adminNavigationItems } from "@/lib/navigation/admin-navigation";

type AdminBreadcrumbProps = {
  pathname: string;
};

function humanizeSegment(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function AdminBreadcrumb({ pathname }: AdminBreadcrumbProps) {
  const currentItem = adminNavigationItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const crumbs = [
    { title: "Company Admin", href: "/admin/dashboard" },
    ...(currentItem
      ? [{ title: currentItem.title, href: currentItem.href }]
      : segments.map((segment, index) => ({
          title: humanizeSegment(segment),
          href: `/admin/${segments.slice(0, index + 1).join("/")}`,
        }))),
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden flex-wrap items-center gap-1.5 text-sm text-muted-foreground sm:flex"
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <div
            key={`${crumb.href}-${index}`}
            className="flex items-center gap-1.5"
          >
            {index > 0 ? (
              <ChevronRight
                className="size-4 text-muted-foreground/70"
                aria-hidden="true"
              />
            ) : null}
            {isLast ? (
              <span className="rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {crumb.title}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="rounded-full px-2.5 py-1 transition hover:bg-accent hover:text-foreground"
              >
                {crumb.title}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
