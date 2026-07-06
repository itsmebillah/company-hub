"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Megaphone } from "lucide-react";

import { getAnnouncementImageSrc } from "@/lib/media";
import { cn } from "@/lib/utils";

type AnnouncementImageProps = {
  src?: string | null;
  className?: string;
  fallbackClassName?: string;
  compact?: boolean;
};

export function AnnouncementImage({
  src,
  className,
  fallbackClassName,
  compact = false,
}: AnnouncementImageProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const imageSrc = useMemo(() => getAnnouncementImageSrc(src), [src]);

  useEffect(() => {
    setHasImageError(false);
  }, [imageSrc]);

  if (imageSrc && !hasImageError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt=""
        className={cn("shrink-0 object-cover", className)}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border bg-secondary text-secondary-foreground",
        className,
        fallbackClassName,
      )}
    >
      {compact ? (
        <Megaphone className="size-5" aria-hidden="true" />
      ) : (
        <ImageIcon className="size-7" aria-hidden="true" />
      )}
    </div>
  );
}
