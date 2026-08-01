import "server-only";

import type {
  AttendanceSelfieStorage,
  StoredAttendanceSelfie,
} from "@/features/attendance/storage/attendance-selfie-storage";
import { ATTENDANCE_SELFIES_BUCKET } from "@/lib/media";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const SupabaseAttendanceSelfieStorage: AttendanceSelfieStorage = {
  provider: "supabase",

  async upload(input): Promise<StoredAttendanceSelfie> {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage
      .from(ATTENDANCE_SELFIES_BUCKET)
      .upload(input.objectPath, input.data, {
        upsert: false,
        cacheControl: "3600",
        contentType: input.contentType,
      });

    if (error) {
      console.error(
        "[SupabaseAttendanceSelfieStorage] Unable to upload selfie.",
        error,
      );
      throw new Error("Unable to upload attendance selfie.");
    }

    return {
      provider: this.provider,
      objectPath: input.objectPath,
      externalFileId: null,
    };
  },

  async exists(objectPath) {
    const separatorIndex = objectPath.lastIndexOf("/");
    const folder = objectPath.slice(0, separatorIndex);
    const fileName = objectPath.slice(separatorIndex + 1);

    if (!folder || !fileName) {
      return false;
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(ATTENDANCE_SELFIES_BUCKET)
      .list(folder, {
        limit: 2,
        search: fileName,
      });

    if (error) {
      console.error(
        "[SupabaseAttendanceSelfieStorage] Unable to verify selfie.",
        error,
      );
      throw new Error("Unable to verify attendance selfie.");
    }

    return data.some((object) => object.name === fileName);
  },

  async download(objectPath) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(ATTENDANCE_SELFIES_BUCKET)
      .download(objectPath);

    if (error || !data) {
      console.error(
        "[SupabaseAttendanceSelfieStorage] Unable to download selfie.",
        { objectPath, errorCode: error?.name ?? "missing_object" },
      );
      throw new Error("Unable to read attendance selfie cache.");
    }

    return {
      data: await data.arrayBuffer(),
      contentType: data.type || "application/octet-stream",
    };
  },

  async createReadUrl(objectPath, expiresInSeconds) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage
      .from(ATTENDANCE_SELFIES_BUCKET)
      .createSignedUrl(objectPath, expiresInSeconds);

    if (error) {
      console.error(
        "[SupabaseAttendanceSelfieStorage] Unable to sign selfie URL.",
        error,
      );
      return null;
    }

    return data.signedUrl;
  },

  async remove(objectPath) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage
      .from(ATTENDANCE_SELFIES_BUCKET)
      .remove([objectPath]);

    if (error) {
      console.error(
        "[SupabaseAttendanceSelfieStorage] Unable to remove selfie.",
        error,
      );
      throw new Error("Unable to remove attendance selfie.");
    }
  },
};
