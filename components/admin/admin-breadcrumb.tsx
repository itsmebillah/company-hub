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
    { title: "Admin", href: "/admin/dashboard" },
    ...(currentItem
      ? [{ title: currentItem.title, href: currentItem.href }]
      : segments.map((segment, index) => ({
          title: humanizeSegment(segment),
          href: `/admin/${segments.slice(0, index + 1).join("/")}`,
        }))),
  ];

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <div key={`${crumb.href}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <ChevronRight className="size-4" aria-hidden="true" /> : null}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.title}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground">
                {crumb.title}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
