import "server-only";

import { googleApiFetch } from "@/lib/google/api-client";
import { getGoogleDriveStorageConfig } from "@/lib/google/config";

export type GoogleDriveFileMetadata = {
  id: string;
  name: string;
  mimeType?: string;
  parents?: string[];
  size?: string;
  md5Checksum?: string;
  webViewLink?: string;
  trashed?: boolean;
  isAppAuthorized?: boolean;
  appProperties?: Record<string, string>;
};

export type GoogleDriveAccessMetadata = GoogleDriveFileMetadata & {
  owners?: Array<{ emailAddress?: string }>;
  permissions?: Array<{ type?: string; role?: string; emailAddress?: string }>;
  capabilities?: { canAddChildren?: boolean; canEdit?: boolean };
};

type DriveRequest = (
  input: string,
  init: RequestInit,
  authenticationProvider: "drive-oauth",
) => Promise<Response>;

const FILE_FIELDS =
  "id,name,mimeType,parents,size,md5Checksum,webViewLink,trashed,isAppAuthorized,appProperties";
const ACCESS_FIELDS = `${FILE_FIELDS},owners(emailAddress),permissions(type,role,emailAddress),capabilities(canAddChildren,canEdit)`;

function requireAppAuthorized<T extends GoogleDriveFileMetadata>(file: T): T {
  if (file.isAppAuthorized !== true) {
    throw new Error("Google Drive resource is not authorized for Company Hub.");
  }
  return file;
}

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

export function createGoogleDriveClient(
  input: {
    request?: DriveRequest;
    getFolderId?: () => string;
  } = {},
) {
  const request = input.request ?? googleApiFetch;
  const getFolderId =
    input.getFolderId ??
    (() => getGoogleDriveStorageConfig().driveSelfiesFolderId);

  async function getFileAccess(fileId: string) {
    const response = await request(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=${ACCESS_FIELDS}`,
      {},
      "drive-oauth",
    );
    return requireAppAuthorized(
      (await response.json()) as GoogleDriveAccessMetadata,
    );
  }

  async function getFile(fileId: string) {
    const response = await request(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=${FILE_FIELDS}`,
      {},
      "drive-oauth",
    );
    return requireAppAuthorized(
      (await response.json()) as GoogleDriveFileMetadata,
    );
  }

  return {
    getFileAccess,

    async getSelfiesFolder() {
      const folderId = getFolderId();
      const folder = await getFileAccess(folderId);
      if (
        folder.id !== folderId ||
        folder.mimeType !== "application/vnd.google-apps.folder" ||
        folder.capabilities?.canAddChildren !== true ||
        folder.capabilities?.canEdit !== true
      ) {
        throw new Error("Google Drive Selfies folder authorization failed.");
      }
      return folder;
    },

    async uploadSelfie(upload: {
      attachmentId: string;
      objectPath: string;
      data: ArrayBuffer;
      contentType: string;
    }) {
      const driveSelfiesFolderId = getFolderId();
      const fileName = upload.objectPath.split("/").filter(Boolean).join("__");
      const { boundary, body } = createMultipartBody({
        metadata: {
          name: fileName,
          parents: [driveSelfiesFolderId],
          appProperties: {
            companyHubAttachmentId: upload.attachmentId,
            companyHubObjectPath: upload.objectPath,
            companyHubDomain: "attendance_selfie",
          },
        },
        data: upload.data,
        contentType: upload.contentType,
      });
      const response = await request(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=${FILE_FIELDS}`,
        {
          method: "POST",
          headers: {
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body,
        },
        "drive-oauth",
      );
      return requireAppAuthorized(
        (await response.json()) as GoogleDriveFileMetadata,
      );
    },

    getFile,

    async findAttendanceAttachment(attachmentId: string) {
      const driveSelfiesFolderId = getFolderId();
      const escapedAttachmentId = attachmentId.replaceAll("'", "\\'");
      const escapedFolderId = driveSelfiesFolderId.replaceAll("'", "\\'");
      const query = encodeURIComponent(
        `'${escapedFolderId}' in parents and trashed = false and appProperties has { key='companyHubAttachmentId' and value='${escapedAttachmentId}' }`,
      );
      const response = await request(
        `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=2&spaces=drive&fields=files(${FILE_FIELDS})`,
        {},
        "drive-oauth",
      );
      const result = (await response.json()) as {
        files?: GoogleDriveFileMetadata[];
      };
      const file = result.files?.[0];
      return file ? requireAppAuthorized(file) : null;
    },

    async downloadFile(fileId: string) {
      await getFile(fileId);
      const response = await request(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
        {},
        "drive-oauth",
      );
      return {
        data: await response.arrayBuffer(),
        contentType:
          response.headers.get("content-type") ?? "application/octet-stream",
      };
    },

    async removeFile(fileId: string) {
      await getFile(fileId);
      await request(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
        { method: "DELETE" },
        "drive-oauth",
      );
    },
  };
}

export const GoogleDriveClient = createGoogleDriveClient();
