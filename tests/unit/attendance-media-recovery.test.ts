import assert from "node:assert/strict";
import test from "node:test";

import { resolvePermanentAttendanceSelfie } from "../../features/attendance/services/attendance-media-sync.service";
import type { AttendancePermanentStorage } from "../../features/attendance/storage/attendance-permanent-storage";
import type { AttendanceSelfieStorage } from "../../features/attendance/storage/attendance-selfie-storage";

const stored = {
  provider: "google_drive" as const,
  externalFileId: "drive-file-1",
  folderId: "selfies-folder",
  viewUrl: "https://drive.google.com/file/d/drive-file-1/view",
  contentType: "image/png",
  size: 3,
  checksum: null,
};

function dependencies() {
  const calls = { find: 0, upload: 0, verify: 0, download: 0 };
  const permanent: AttendancePermanentStorage = {
    provider: "google_drive",
    async find() {
      calls.find += 1;
      return stored;
    },
    async upload() {
      calls.upload += 1;
      return stored;
    },
    async verify() {
      calls.verify += 1;
      return stored;
    },
    async download() {
      throw new Error("unused");
    },
  };
  const cache: AttendanceSelfieStorage = {
    provider: "supabase",
    async upload() {
      throw new Error("unused");
    },
    async exists() {
      return true;
    },
    async download() {
      calls.download += 1;
      return { data: new ArrayBuffer(3), contentType: "image/png" };
    },
    async createReadUrl() {
      return null;
    },
    async remove() {},
  };
  return { calls, permanent, cache };
}

test("idempotent recovery reuses an existing app file without uploading", async () => {
  const { calls, permanent, cache } = dependencies();
  const result = await resolvePermanentAttendanceSelfie(
    {
      attachment_id: "attachment-1",
      source_object_path: "source.png",
      drive_file_id: null,
    },
    permanent,
    cache,
  );
  assert.equal(result.externalFileId, stored.externalFileId);
  assert.deepEqual(calls, { find: 1, upload: 0, verify: 1, download: 0 });
});

test("recovery verifies a stored Drive ID without searching or uploading", async () => {
  const { calls, permanent, cache } = dependencies();
  await resolvePermanentAttendanceSelfie(
    {
      attachment_id: "attachment-1",
      source_object_path: "source.png",
      drive_file_id: stored.externalFileId,
    },
    permanent,
    cache,
  );
  assert.deepEqual(calls, { find: 0, upload: 0, verify: 2, download: 0 });
});
