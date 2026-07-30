import "server-only";

import { googleApiFetch } from "@/lib/google/api-client";
import { getGoogleIntegrationConfig } from "@/lib/google/config";

export type GoogleDriveFileMetadata = {
  id: string;
  name: string;
  mimeType?: string;
  parents?: string[];
  size?: string;
  md5Checksum?: string;
};

export type GoogleDriveAccessMetadata = GoogleDriveFileMetadata & {
  owners?: Array<{ emailAddress?: string }>;
  permissions?: Array<{
    type?: string;
    role?: string;
    emailAddress?: string;
  }>;
};

function createMultipartBody(input: {
  metadata: Record<string, unknown>;
  data: ArrayBuffer;
  contentType: string;
}) {
  const boundary = `company-hub-${crypto.randomUUID()}`;
  const encoder = new TextEncoder();
  const prefix = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(input.metadata)}\r\n--${boundary}\r\nContent-Type: ${input.contentType}\r\n\r\n`,
  );
  const media = new Uint8Array(input.data);
  const suffix = encoder.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(prefix.length + media.length + suffix.length);
  body.set(prefix, 0);
  body.set(media, prefix.length);
  body.set(suffix, prefix.length + media.length);

  return { boundary, body };
}

export const GoogleDriveClient = {
  async getFileAccess(fileId: string) {
    const response = await googleApiFetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,name,mimeType,owners(emailAddress),permissions(type,role,emailAddress),capabilities(canAddChildren,canEdit)`,
      {},
      "drive-oauth",
    );
    return (await response.json()) as GoogleDriveAccessMetadata & {
      capabilities?: { canAddChildren?: boolean; canEdit?: boolean };
    };
  },

  async getSelfiesFolder() {
    const { driveSelfiesFolderId } = getGoogleIntegrationConfig();
    return this.getFileAccess(driveSelfiesFolderId);
  },

  async uploadSelfie(input: {
    objectPath: string;
    data: ArrayBuffer;
    contentType: string;
  }) {
    const { driveSelfiesFolderId } = getGoogleIntegrationConfig();
    const fileName = input.objectPath.split("/").filter(Boolean).join("__");
    const { boundary, body } = createMultipartBody({
      metadata: {
        name: fileName,
        parents: [driveSelfiesFolderId],
        appProperties: {
          companyHubObjectPath: input.objectPath,
          companyHubDomain: "attendance_selfie",
        },
      },
      data: input.data,
      contentType: input.contentType,
    });
    const response = await googleApiFetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,parents,size,md5Checksum",
      {
        method: "POST",
        headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
        body,
      },
      "drive-oauth",
    );
    return (await response.json()) as GoogleDriveFileMetadata;
  },

  async getFile(fileId: string) {
    const response = await googleApiFetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,name,mimeType,parents,size,md5Checksum`,
      {},
      "drive-oauth",
    );
    return (await response.json()) as GoogleDriveFileMetadata;
  },

  async removeFile(fileId: string) {
    await googleApiFetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
      { method: "DELETE" },
      "drive-oauth",
    );
  },
};
