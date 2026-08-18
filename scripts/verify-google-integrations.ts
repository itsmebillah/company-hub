import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=",
  "base64",
);

async function main() {
  const { getGoogleDriveStorageConfig, getGoogleSheetsConfig } =
    await import("@/lib/google/config");
  const { GoogleDriveClient } = await import("@/lib/google/drive-client");
  const { GoogleSheetsClient } = await import("@/lib/google/sheets-client");
  const driveConfig = getGoogleDriveStorageConfig();
  const sheetsConfig = getGoogleSheetsConfig();
  const testId = crypto.randomUUID();
  const sheetTitle = `_Integration_Test_${Date.now()}`;
  let driveFileId: string | null = null;
  let sheetId: number | null = null;

  try {
    const folder = await GoogleDriveClient.getSelfiesFolder();
    const spreadsheet = await GoogleSheetsClient.getSpreadsheet();
    const hasAnonymousPermission = folder.permissions?.some(
      (permission) => permission.type === "anyone",
    );
    const ownerPresent = folder.owners?.some((owner) =>
      Boolean(owner.emailAddress),
    );

    if (
      folder.id !== driveConfig.driveSelfiesFolderId ||
      hasAnonymousPermission ||
      !ownerPresent ||
      folder.isAppAuthorized !== true ||
      folder.capabilities?.canAddChildren !== true ||
      folder.capabilities?.canEdit !== true
    ) {
      throw new Error("Drive folder access verification failed.");
    }

    if (spreadsheet.spreadsheetId !== sheetsConfig.reportingSpreadsheetId) {
      throw new Error("Spreadsheet access verification failed.");
    }

    const createdSheet = await GoogleSheetsClient.addSheet(sheetTitle);
    sheetId = createdSheet.sheetId;
    const range = `'${sheetTitle}'!A1:G2`;
    await GoogleSheetsClient.writeValues(range, [
      [
        "verification_id",
        "provider",
        "file_id",
        "folder_id",
        "mime_type",
        "status",
        "verified_at",
      ],
      [
        testId,
        "google_drive",
        "pending",
        driveConfig.driveSelfiesFolderId,
        "image/png",
        "sheets_verified",
        new Date().toISOString(),
      ],
    ]);
    const sheetsReadback = await GoogleSheetsClient.readValues(range);

    if (sheetsReadback.values?.[1]?.[0] !== testId) {
      throw new Error("Google Sheets access verification did not match.");
    }

    console.log("google_authentication=verified");
    console.log("restricted_permissions=verified");
    console.log("drive_folder_app_authorization=verified");
    console.log("drive_folder_access=verified");
    console.log("sheets_access=verified");
    console.log("sheets_write_readback=verified");

    const uploaded = await GoogleDriveClient.uploadSelfie({
      attachmentId: testId,
      objectPath: `integration-verification/${testId}.png`,
      data: TEST_PNG.buffer.slice(
        TEST_PNG.byteOffset,
        TEST_PNG.byteOffset + TEST_PNG.byteLength,
      ),
      contentType: "image/png",
    });
    driveFileId = uploaded.id;
    const stored = await GoogleDriveClient.getFile(uploaded.id);

    if (!stored.parents?.includes(driveConfig.driveSelfiesFolderId)) {
      throw new Error(
        "Drive verification file is outside the approved folder.",
      );
    }

    await GoogleSheetsClient.writeValues(range, [
      [
        "verification_id",
        "provider",
        "file_id",
        "folder_id",
        "mime_type",
        "status",
        "verified_at",
      ],
      [
        testId,
        "google_drive",
        stored.id,
        driveConfig.driveSelfiesFolderId,
        stored.mimeType,
        "verified",
        new Date().toISOString(),
      ],
    ]);
    const readback = await GoogleSheetsClient.readValues(range);

    if (
      readback.values?.[1]?.[0] !== testId ||
      readback.values?.[1]?.[2] !== stored.id
    ) {
      throw new Error("Google Sheets verification readback did not match.");
    }

    console.log("drive_upload_readback=verified");
    console.log("end_to_end_sync=verified");
  } finally {
    if (sheetId !== null) {
      await GoogleSheetsClient.removeSheet(sheetId);
    }
    if (driveFileId !== null) {
      await GoogleDriveClient.removeFile(driveFileId);
    }
    console.log("temporary_artifacts=removed");
  }
}

main().catch((error) => {
  console.error(
    `google_integration_verification=failed:${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exitCode = 1;
});
