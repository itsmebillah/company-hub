"use client";

import { Megaphone } from "lucide-react";

import type { AnnouncementListItem } from "@/features/announcements/types/announcement.types";
import { getRenderableImageSrc } from "@/lib/media";
import { cn } from "@/lib/utils";

type AnnouncementTickerProps = {
  announcements: AnnouncementListItem[];
};

const urlPattern = /(https?:\/\/[^\s]+)/g;

function renderLinkedText(text: string) {
  const parts = text.split(urlPattern);

  return parts.map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={`${part}-${index}`}
          href={part}
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium underline underline-offset-4"
        >
          {part}
        </a>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function TickerItem({ announcement }: { announcement: AnnouncementListItem }) {
  const imageSrc = getRenderableImageSrc(announcement.bannerUrl);
  const text = [announcement.title, announcement.description]
    .filter(Boolean)
    .join(" - ");

  return (
    <article className="inline-flex max-w-[min(34rem,80vw)] items-center gap-3 whitespace-normal rounded-lg border bg-background px-3 py-2 shadow-sm">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          className="h-10 w-14 shrink-0 rounded-md border object-cover"
        />
      ) : (
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            announcement.priority === "urgent"
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground",
          )}
        >
          <Megaphone className="size-4" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 text-sm leading-5 text-foreground">
        {renderLinkedText(text)}
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
