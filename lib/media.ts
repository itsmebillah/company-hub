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
export const ANNOUNCEMENT_IMAGES_BUCKET = "announcement-images";
export const ATTENDANCE_SELFIES_BUCKET = "attendance-selfies";
export const RESOURCE_ICONS_BUCKET = "resource-icons";

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

export function getStorageObjectPath(
  bucket: string,
  value: string | null | undefined,
) {
  const src = value?.trim();

  if (!src) {
    return null;
  }

  return normalizeStorageObjectPath(bucket, src);
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

export function getAnnouncementImageSrc(value: string | null | undefined) {
  return getPublicStorageUrl(ANNOUNCEMENT_IMAGES_BUCKET, value);
}

export function buildAttendanceSelfiePath(input: {
  companyId: string;
  employeeId: string;
  attendanceDate: string;
  phase: "checkin" | "checkout";
  objectId?: string;
  extension?: string;
}) {
  const [year, month, day] = input.attendanceDate.split("-");
  const extension = input.extension?.replace(/^\.+/, "") || "jpg";

  return [
    input.companyId,
    input.employeeId,
    year,
    month,
    day,
    `${input.phase}${input.objectId ? `-${input.objectId}` : ""}.${extension}`,
  ].join("/");
}
