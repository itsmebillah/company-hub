import "server-only";

import type {
  AttendancePermanentStorage,
  PermanentAttendanceSelfie,
} from "@/features/attendance/storage/attendance-permanent-storage";
import type { GoogleDriveFileMetadata } from "@/lib/google/drive-client";
import { GoogleDriveClient } from "@/lib/google/drive-client";
import { getGoogleDriveStorageConfig } from "@/lib/google/config";

function toPermanentSelfie(
  file: GoogleDriveFileMetadata,
): PermanentAttendanceSelfie {
  const { driveSelfiesFolderId } = getGoogleDriveStorageConfig();

  if (
    !file.id ||
    file.trashed ||
    !file.parents?.includes(driveSelfiesFolderId)
  ) {
    throw new Error("Permanent attendance selfie verification failed.");
  }

  return {
    provider: "google_drive",
    externalFileId: file.id,
    folderId: driveSelfiesFolderId,
    viewUrl:
      file.webViewLink ??
      `https://drive.google.com/file/d/${encodeURIComponent(file.id)}/view`,
    contentType: file.mimeType ?? "application/octet-stream",
    size: file.size ? Number(file.size) : null,
    checksum: file.md5Checksum ?? null,
  };
}

export const GoogleDriveAttendancePermanentStorage: AttendancePermanentStorage =
  {
    provider: "google_drive",

    async find(attachmentId) {
      const file =
        await GoogleDriveClient.findAttendanceAttachment(attachmentId);
      return file ? toPermanentSelfie(file) : null;
    },

    async upload(input) {
      const file = await GoogleDriveClient.uploadSelfie(input);
      return toPermanentSelfie(file);
    },

    async verify(externalFileId) {
      return toPermanentSelfie(await GoogleDriveClient.getFile(externalFileId));
    },

    async download(externalFileId) {
      return GoogleDriveClient.downloadFile(externalFileId);
    },
  };
