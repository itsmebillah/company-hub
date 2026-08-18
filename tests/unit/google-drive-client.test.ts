import assert from "node:assert/strict";
import test from "node:test";

import { createGoogleDriveClient } from "../../lib/google/drive-client";

const folderId = "selfies-folder";
const file = {
  id: "drive-file-1",
  name: "selfie.png",
  mimeType: "image/png",
  parents: [folderId],
  isAppAuthorized: true,
  appProperties: { companyHubAttachmentId: "attachment-1" },
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

test("verifies the configured app-authorized writable Selfies folder", async () => {
  const client = createGoogleDriveClient({
    getFolderId: () => folderId,
    request: async () =>
      jsonResponse({
        id: folderId,
        name: "Selfies",
        mimeType: "application/vnd.google-apps.folder",
        isAppAuthorized: true,
        capabilities: { canAddChildren: true, canEdit: true },
      }),
  });
  assert.equal((await client.getSelfiesFolder()).id, folderId);
});

test("denies a folder or file that is not app-authorized", async () => {
  const requests: string[] = [];
  const client = createGoogleDriveClient({
    getFolderId: () => folderId,
    request: async (url) => {
      requests.push(url);
      return jsonResponse({ ...file, isAppAuthorized: false });
    },
  });
  await assert.rejects(client.getFile("unrelated"), /not authorized/);
  await assert.rejects(client.downloadFile("unrelated"), /not authorized/);
  await assert.rejects(client.removeFile("unrelated"), /not authorized/);
  assert.equal(requests.length, 3, "no media fetch or DELETE should occur");
});

test("uploads into the configured folder and requires app authorization", async () => {
  let requestBody = "";
  const client = createGoogleDriveClient({
    getFolderId: () => folderId,
    request: async (url, init) => {
      assert.match(url, /upload\/drive\/v3\/files/);
      assert.equal(init.method, "POST");
      requestBody = new TextDecoder().decode(init.body as Uint8Array);
      return jsonResponse(file);
    },
  });
  const uploaded = await client.uploadSelfie({
    attachmentId: "attachment-1",
    objectPath: "company/attendance/selfie.png",
    data: new Uint8Array([1, 2, 3]).buffer,
    contentType: "image/png",
  });
  assert.equal(uploaded.id, file.id);
  assert.match(requestBody, /"parents":\["selfies-folder"\]/);
  assert.match(requestBody, /"companyHubAttachmentId":"attachment-1"/);
});

test("performs app-authorized metadata lookup and idempotent recovery lookup", async () => {
  const urls: string[] = [];
  const client = createGoogleDriveClient({
    getFolderId: () => folderId,
    request: async (url) => {
      urls.push(url);
      return url.includes("?q=")
        ? jsonResponse({ files: [file] })
        : jsonResponse(file);
    },
  });
  assert.equal((await client.getFile(file.id)).id, file.id);
  assert.equal(
    (await client.findAttendanceAttachment("attachment-1"))?.id,
    file.id,
  );
  assert.match(decodeURIComponent(urls[1]), /companyHubAttachmentId/);
  assert.match(decodeURIComponent(urls[1]), /selfies-folder/);
});

test("checks metadata before media download", async () => {
  const calls: Array<{ url: string; method?: string }> = [];
  const client = createGoogleDriveClient({
    request: async (url, init) => {
      calls.push({ url, method: init.method });
      return url.includes("alt=media")
        ? new Response(new Uint8Array([7, 8]), {
            headers: { "content-type": "image/png" },
          })
        : jsonResponse(file);
    },
  });
  const downloaded = await client.downloadFile(file.id);
  assert.deepEqual([...new Uint8Array(downloaded.data)], [7, 8]);
  assert.equal(downloaded.contentType, "image/png");
  assert.equal(calls.length, 2);
  assert.doesNotMatch(calls[0].url, /alt=media/);
  assert.match(calls[1].url, /alt=media/);
});

test("checks app authorization before deleting a temporary verifier file", async () => {
  const methods: Array<string | undefined> = [];
  const client = createGoogleDriveClient({
    request: async (_url, init) => {
      methods.push(init.method);
      return init.method === "DELETE"
        ? new Response(null, { status: 204 })
        : jsonResponse(file);
    },
  });
  await client.removeFile(file.id);
  assert.deepEqual(methods, [undefined, "DELETE"]);
});
