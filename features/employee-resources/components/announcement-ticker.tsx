"use client";

import { AlertTriangle, Info, Megaphone } from "lucide-react";

import { AnnouncementImage } from "@/features/announcements/components/announcement-image";
import type { AnnouncementListItem } from "@/features/announcements/types/announcement.types";
import { cn } from "@/lib/utils";

type AnnouncementTickerProps = {
  announcements: AnnouncementListItem[];
};

const urlPattern = /(https?:\/\/[^\s]+)/g;

const priorityStyles = {
  urgent: {
    card: "border-red-300 bg-red-50 text-red-950 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-100",
    icon: "bg-red-600 text-white",
    link: "text-red-700 dark:text-red-200",
    Icon: AlertTriangle,
  },
  high: {
    card: "border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-900/70 dark:bg-orange-950/30 dark:text-orange-100",
    icon: "bg-orange-500 text-white",
    link: "text-orange-700 dark:text-orange-200",
    Icon: AlertTriangle,
  },
  normal: {
    card: "border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-100",
    icon: "bg-blue-600 text-white",
    link: "text-blue-700 dark:text-blue-200",
    Icon: Megaphone,
  },
  low: {
    card: "border-border bg-background text-foreground",
    icon: "bg-secondary text-secondary-foreground",
    link: "text-foreground",
    Icon: Info,
  },
} as const;

function renderLinkedText(text: string, linkClassName: string) {
  const parts = text.split(urlPattern);

  return parts.map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noreferrer noopener"
          className={cn("font-medium underline underline-offset-4", linkClassName)}
        >
          {part}
        </a>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function TickerItem({ announcement }: { announcement: AnnouncementListItem }) {
  const style = priorityStyles[announcement.priority];
  const Icon = style.Icon;
  const text = [announcement.title, announcement.description]
    .filter(Boolean)
    .join(" - ");

  return (
    <article
      className={cn(
        "inline-flex max-w-[min(38rem,84vw)] items-center gap-3 whitespace-normal rounded-xl border px-3 py-2 shadow-sm",
        style.card,
      )}
    >
      {announcement.bannerUrl ? (
        <AnnouncementImage
          src={announcement.bannerUrl}
          className="h-12 w-16 rounded-lg"
          compact
        />
      ) : (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            style.icon,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 whitespace-pre-wrap text-sm leading-5">
        {renderLinkedText(text, style.link)}
      </span>
    </article>
  );
}

export function AnnouncementTicker({ announcements }: AnnouncementTickerProps) {
  if (announcements.length === 0) {
    return null;
  }

  return (
    <section
      className="overflow-hidden rounded-xl border bg-card py-2 shadow-sm"
      aria-label="Latest announcements"
    >
      <div className="min-w-0 overflow-hidden">
        <div
          className="announcement-ticker-track flex w-max gap-3 px-3"
          tabIndex={0}
          aria-live="polite"
        >
          {[...announcements, ...announcements].map((announcement, index) => (
            <TickerItem
              key={`${announcement.id}-${index}`}
              announcement={announcement}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
