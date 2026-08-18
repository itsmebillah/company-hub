import "server-only";

import { JWT, OAuth2Client } from "google-auth-library";

import {
  getGoogleDriveOAuthConfig,
  getGoogleSheetsConfig,
} from "@/lib/google/config";

const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

let googleSheetsAuthClient: JWT | null = null;
let googleDriveAuthClient: OAuth2Client | null = null;

function getGoogleSheetsAuthClient() {
  if (!googleSheetsAuthClient) {
    const config = getGoogleSheetsConfig();
    googleSheetsAuthClient = new JWT({
      email: config.serviceAccountEmail,
      key: config.serviceAccountPrivateKey,
      scopes: [GOOGLE_SHEETS_SCOPE],
    });
  }

  return googleSheetsAuthClient;
}

function getGoogleDriveAuthClient() {
  if (!googleDriveAuthClient) {
    const config = getGoogleDriveOAuthConfig();
    googleDriveAuthClient = new OAuth2Client({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
    });
    googleDriveAuthClient.setCredentials({
      refresh_token: config.refreshToken,
    });
  }

  return googleDriveAuthClient;
}

async function requireAccessToken(token: string | null | undefined) {
  if (!token) {
    throw new Error("Google authentication did not return an access token.");
  }

  return token;
}

export async function getGoogleSheetsAccessToken() {
  const token = await getGoogleSheetsAuthClient().getAccessToken();

  return requireAccessToken(token.token);
}

export async function getGoogleDriveAccessToken() {
  const token = await getGoogleDriveAuthClient().getAccessToken();

  return requireAccessToken(token.token);
}
