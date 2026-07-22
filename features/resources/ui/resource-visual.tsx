"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";

import { getResourceIconComponent } from "@/features/resources/constants/resource-icons";
import {
  getPublicStorageUrl,
  getRenderableImageSrc,
  RESOURCE_ICONS_BUCKET,
} from "@/lib/media";
import { cn } from "@/lib/utils";

type ResourceVisualProps = {
  icon?: string | null;
  customImage?: string | null;
  url?: string | null;
  title: string;
  className?: string;
  imageClassName?: string;
};

function looksLikeImageReference(value: string) {
  return (
    value.includes("/") ||
    /\.(?:png|jpe?g|svg|webp)(?:[?#].*)?$/i.test(value) ||
    /^https?:/i.test(value)
  );
}

function getCustomImageSource(customImage: string, icon: string) {
  const candidate = customImage || (looksLikeImageReference(icon) ? icon : "");

  return (
    getRenderableImageSrc(candidate) ??
    getPublicStorageUrl(RESOURCE_ICONS_BUCKET, candidate)
  );
}

const faviconUrlCache = new Map<string, string | null>();

function getFaviconUrl(value: string) {
  try {
    const parsed = new URL(value);
    const cached = faviconUrlCache.get(parsed.origin);

    if (cached !== undefined) {
      return cached;
    }

    const faviconUrl =
      parsed.protocol === "http:" || parsed.protocol === "https:"
        ? `${parsed.origin}/favicon.ico`
        : null;

    faviconUrlCache.set(parsed.origin, faviconUrl);
    return faviconUrl;
  } catch {
    return null;
  }
}

export function ResourceVisual({
  icon = "",
  customImage = "",
  url = "",
  title,
  className,
  imageClassName,
}: ResourceVisualProps) {
  const normalizedIcon = icon ?? "";
  const customImageSrc = getCustomImageSource(
    customImage ?? "",
    normalizedIcon,
  );
  const faviconSrc = getFaviconUrl(url ?? "");
  const imageSources = [customImageSrc, faviconSrc].filter(
    (value, index, values): value is string =>
      Boolean(value) && values.indexOf(value) === index,
  );
  const [imageIndex, setImageIndex] = useState(0);
  const imageSrc = imageSources[imageIndex] ?? null;
  const Icon = getResourceIconComponent(normalizedIcon);
  const visualSource = imageSrc
    ? imageIndex === 0 && customImageSrc
      ? "custom-image"
      : "favicon"
    : Icon
      ? "built-in-icon"
      : "placeholder";

  useEffect(() => {
    setImageIndex(0);
  }, [customImageSrc, faviconSrc]);

  return (
    <span
      data-resource-visual
      data-visual-source={visualSource}
      className={cn(
        "dark:bg-background/85 relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white/90 text-current shadow-sm dark:border-white/15",
        className,
      )}
    >
      {imageSrc ? (
        // Public resource artwork may use an existing external URL, so a native
        // image preserves backward compatibility beyond configured image hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={cn("size-full object-cover object-center", imageClassName)}
          onError={() => setImageIndex((current) => current + 1)}
        />
      ) : Icon ? (
        <Icon className="size-[48%]" aria-hidden="true" />
      ) : (
        <Link2 className="size-[48%]" aria-hidden="true" />
      )}
      <span className="sr-only">{title} icon</span>
    </span>
  );
}
