import "server-only";

import { readFileSync } from "node:fs";

export type GoogleSheetsConfig = {
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
  reportingSpreadsheetId: string;
};

export type GoogleDriveOAuthClientConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type GoogleDriveOAuthConfig = GoogleDriveOAuthClientConfig & {
  refreshToken: string;
};

export type GoogleDrivePickerConfig = {
  apiKey: string;
  appId: string;
};

export type GoogleDriveStorageConfig = {
  driveSelfiesFolderId: string;
};

export const GOOGLE_DRIVE_OAUTH_REDIRECT_URI =
  "http://127.0.0.1:53682/oauth2/callback";

function requireValue(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing Google integration configuration: ${name}.`);
  }

  return value;
}

function readServiceAccountFile(filePath: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    throw new Error("Unable to read the Google service-account key file.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Google service-account key file is invalid.");
  }

  const credentials = parsed as {
    type?: unknown;
    client_email?: unknown;
    private_key?: unknown;
  };

  if (
    credentials.type !== "service_account" ||
    typeof credentials.client_email !== "string" ||
    typeof credentials.private_key !== "string"
  ) {
    throw new Error("Google service-account key file is invalid.");
  }

  return {
    serviceAccountEmail: credentials.client_email.trim(),
    serviceAccountPrivateKey: credentials.private_key,
  };
}

function readOAuthClientFile(filePath: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    throw new Error("Unable to read the Google OAuth client file.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Google OAuth client file is invalid.");
  }

  const document = parsed as {
    installed?: { client_id?: unknown; client_secret?: unknown };
    web?: { client_id?: unknown; client_secret?: unknown };
  };
  const credentials = document.installed ?? document.web;

  if (
    typeof credentials?.client_id !== "string" ||
    typeof credentials.client_secret !== "string"
  ) {
    throw new Error("Google OAuth client file is invalid.");
  }

  return {
    clientId: credentials.client_id.trim(),
    clientSecret: credentials.client_secret.trim(),
  };
}

export function getGoogleDriveOAuthClientConfig(): GoogleDriveOAuthClientConfig {
  const clientFile = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_FILE?.trim();
  const fileCredentials = clientFile ? readOAuthClientFile(clientFile) : null;
  const clientId =
    process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID?.trim() ??
    fileCredentials?.clientId ??
    "";
  const clientSecret =
    process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET?.trim() ??
    fileCredentials?.clientSecret ??
    "";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Google Drive OAuth client configuration. Set GOOGLE_DRIVE_OAUTH_CLIENT_FILE or the server credential variables.",
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri: GOOGLE_DRIVE_OAUTH_REDIRECT_URI,
  };
}

export function getGoogleDriveOAuthConfig(): GoogleDriveOAuthConfig {
  return {
    ...getGoogleDriveOAuthClientConfig(),
    refreshToken: requireValue("GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN"),
  };
}

export function getGoogleDrivePickerConfig(): GoogleDrivePickerConfig {
  return {
    apiKey: requireValue("GOOGLE_DRIVE_PICKER_API_KEY"),
    appId: requireValue("GOOGLE_DRIVE_PICKER_APP_ID"),
  };
}

export function getGoogleDriveStorageConfig(): GoogleDriveStorageConfig {
  return {
    driveSelfiesFolderId: requireValue("GOOGLE_DRIVE_SELFIES_FOLDER_ID"),
  };
}

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE?.trim();
  const fileCredentials = keyFile ? readServiceAccountFile(keyFile) : null;
  const serviceAccountEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ??
    fileCredentials?.serviceAccountEmail ??
    "";
  const serviceAccountPrivateKey = (
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim() ??
    fileCredentials?.serviceAccountPrivateKey ??
    ""
  ).replace(/\\n/g, "\n");
  const reportingSpreadsheetId = requireValue(
    "GOOGLE_SHEETS_REPORTING_SPREADSHEET_ID",
  );

  if (!serviceAccountEmail || !serviceAccountPrivateKey) {
    throw new Error(
      "Missing Google service-account configuration. Set GOOGLE_SERVICE_ACCOUNT_KEY_FILE or the server credential variables.",
    );
  }

  if (!serviceAccountEmail.endsWith(".gserviceaccount.com")) {
    throw new Error("Google service-account email is invalid.");
  }

  if (!serviceAccountPrivateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error("Google service-account private key is invalid.");
  }

  return {
    serviceAccountEmail,
    serviceAccountPrivateKey,
    reportingSpreadsheetId,
  };
}
