import "server-only";

import { requireCompanyAdmin } from "@/features/auth/services/authorization.service";
import { getStorageObjectPath, RESOURCE_ICONS_BUCKET } from "@/lib/media";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const RESOURCE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

const imageTypes = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
} as const;

function assertImageSignature(
  bytes: Uint8Array,
  mimeType: keyof typeof imageTypes,
) {
  if (
    mimeType === "image/png" &&
    ![137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    )
  ) {
    throw new Error("The selected PNG file is invalid.");
  }

  if (
    mimeType === "image/jpeg" &&
    !(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
  ) {
    throw new Error("The selected JPG file is invalid.");
  }

  if (
    mimeType === "image/webp" &&
    !(
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    )
  ) {
    throw new Error("The selected WebP file is invalid.");
  }

  if (mimeType === "image/svg+xml") {
    const svg = new TextDecoder().decode(bytes);

    if (
      !/<svg[\s>]/i.test(svg) ||
      /<!doctype/i.test(svg) ||
      /<(?:script|foreignObject|iframe|object|embed)[\s>]/i.test(svg) ||
      /\son\w+\s*=/i.test(svg) ||
      /(?:href|src)\s*=\s*["']\s*(?:javascript:|data:)/i.test(svg)
    ) {
      throw new Error("The selected SVG contains unsupported content.");
    }
  }
}

function getManagedPath(companyId: string, value: string | null | undefined) {
  if (!value || /^https?:/i.test(value)) {
    return null;
  }

  const path = getStorageObjectPath(RESOURCE_ICONS_BUCKET, value);
  const prefix = `${companyId}/resources/`;

  return path?.startsWith(prefix) ? path : null;
}

async function removeIfUnused(
  companyId: string,
  value: string,
  exceptId?: string,
) {
  const path = getManagedPath(companyId, value);

  if (!path) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("resources")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("thumbnail", path);

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  const { count, error: referenceError } = await query;

  if (referenceError) {
    console.error(
      "[ResourceImageService] Unable to check image references.",
      referenceError,
    );
    return;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { error } = await supabase.storage
    .from(RESOURCE_ICONS_BUCKET)
    .remove([path]);

  if (error) {
    console.error(
      "[ResourceImageService] Unable to remove unused image.",
      error,
    );
  }
}

export const ResourceImageService = {
  async upload(file: File) {
    const admin = await requireCompanyAdmin("quick_links");

    if (!(file.type in imageTypes)) {
      throw new Error("Choose a PNG, JPG, SVG, or WebP image.");
    }

    if (file.size === 0 || file.size > RESOURCE_IMAGE_MAX_BYTES) {
      throw new Error("Quick Link images must be 2 MB or smaller.");
    }

    const mimeType = file.type as keyof typeof imageTypes;
    const bytes = new Uint8Array(await file.arrayBuffer());
    assertImageSignature(bytes, mimeType);

    const path = `${admin.companyId}/resources/${crypto.randomUUID()}.${imageTypes[mimeType]}`;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage
      .from(RESOURCE_ICONS_BUCKET)
      .upload(path, bytes, {
        cacheControl: "31536000",
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error("[ResourceImageService] Unable to upload image.", error);
      throw new Error("Unable to upload the Quick Link image.");
    }

    return path;
  },

  async removeUploaded(value: string) {
    const admin = await requireCompanyAdmin("quick_links");
    await removeIfUnused(admin.companyId, value);
  },

  async cleanupReplaced(companyId: string, value: string, resourceId?: string) {
    await removeIfUnused(companyId, value, resourceId);
  },
};
