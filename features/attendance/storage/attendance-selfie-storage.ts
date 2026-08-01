import "server-only";

export type AttendanceSelfieStorageProvider = "supabase" | "google_drive";

export type StoredAttendanceSelfie = {
  provider: AttendanceSelfieStorageProvider;
  objectPath: string;
  externalFileId: string | null;
};

export interface AttendanceSelfieStorage {
  readonly provider: AttendanceSelfieStorageProvider;

  upload(input: {
    objectPath: string;
    data: ArrayBuffer;
    contentType: string;
  }): Promise<StoredAttendanceSelfie>;

  exists(objectPath: string): Promise<boolean>;

  download(objectPath: string): Promise<{
    data: ArrayBuffer;
    contentType: string;
  }>;

  createReadUrl(
    objectPath: string,
    expiresInSeconds: number,
  ): Promise<string | null>;

  remove(objectPath: string): Promise<void>;
}
