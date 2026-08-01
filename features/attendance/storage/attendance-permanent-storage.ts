import "server-only";

export type PermanentAttendanceSelfie = {
  provider: "google_drive";
  externalFileId: string;
  folderId: string;
  viewUrl: string;
  contentType: string;
  size: number | null;
  checksum: string | null;
};

export interface AttendancePermanentStorage {
  readonly provider: "google_drive";

  find(attachmentId: string): Promise<PermanentAttendanceSelfie | null>;
  upload(input: {
    attachmentId: string;
    objectPath: string;
    data: ArrayBuffer;
    contentType: string;
  }): Promise<PermanentAttendanceSelfie>;
  verify(externalFileId: string): Promise<PermanentAttendanceSelfie>;
  download(externalFileId: string): Promise<{
    data: ArrayBuffer;
    contentType: string;
  }>;
}
