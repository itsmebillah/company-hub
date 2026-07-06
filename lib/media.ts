export function getRenderableImageSrc(value: string | null | undefined) {
  const src = value?.trim();

  if (!src) {
    return null;
  }

  if (
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:image/") ||
    src.startsWith("blob:")
  ) {
    return src;
  }

  return null;
}

export const PROFILE_PHOTOS_BUCKET = "profile-photos";

function encodeStoragePath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function normalizeStorageObjectPath(bucket: string, value: string) {
  const trimmedValue = value.trim();
  const publicPathMarker = `/storage/v1/object/public/${bucket}/`;
  const publicPathIndex = trimmedValue.indexOf(publicPathMarker);

  if (publicPathIndex >= 0) {
    return trimmedValue.slice(publicPathIndex + publicPathMarker.length);
  }

  const path = trimmedValue.replace(/^\/+/, "");

  if (path.startsWith(`${bucket}/`)) {
    return path.slice(bucket.length + 1);
  }

  return path;
}

export function getPublicStorageUrl(
  bucket: string,
  value: string | null | undefined,
) {
  const src = value?.trim();

  if (!src) {
    return null;
  }

  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:image/") ||
    src.startsWith("blob:")
  ) {
    return src;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const objectPath = normalizeStorageObjectPath(bucket, src);

  if (!supabaseUrl || !objectPath) {
    return null;
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeStoragePath(objectPath)}`;
}

export function getProfilePhotoSrc(value: string | null | undefined) {
  return getPublicStorageUrl(PROFILE_PHOTOS_BUCKET, value);
}
