"use client";

import { useEffect, useMemo, useState } from "react";
import { UserRound } from "lucide-react";

import { getProfilePhotoSrc } from "@/lib/media";
import { cn } from "@/lib/utils";

type ProfilePhotoProps = {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
};

function getInitials(name: string | null | undefined) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ?? ""
  );
}

export function ProfilePhoto({
  src,
  name,
  className,
  fallbackClassName,
  iconClassName,
}: ProfilePhotoProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const imageSrc = useMemo(() => getProfilePhotoSrc(src), [src]);
  const initials = useMemo(() => getInitials(name), [name]);

  useEffect(() => {
    setHasImageError(false);
  }, [imageSrc]);

  if (imageSrc && !hasImageError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", className)}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground",
        className,
        fallbackClassName,
      )}
    >
      {initials ? (
        <span>{initials}</span>
      ) : (
        <UserRound
          className={cn("size-5 text-muted-foreground", iconClassName)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
