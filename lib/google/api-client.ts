import "server-only";

import {
  getGoogleDriveAccessToken,
  getGoogleSheetsAccessToken,
} from "@/lib/google/auth";

export type GoogleAuthenticationProvider =
  "drive-oauth" | "sheets-service-account";

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

export class GoogleApiError extends Error {
  constructor(
    public readonly safeCode:
      "google_authentication_failed" | "google_api_failed",
  ) {
    super(safeCode);
    this.name = "GoogleApiError";
  }
}

function getOperationName(input: string, method: string) {
  const url = new URL(input);

  if (
    url.hostname === "www.googleapis.com" &&
    url.pathname.startsWith("/upload/drive/")
  ) {
    return `drive.upload:${method}`;
  }

  if (
    url.hostname === "www.googleapis.com" &&
    url.pathname.startsWith("/drive/")
  ) {
    return `drive.files:${method}`;
  }

  if (url.hostname === "sheets.googleapis.com") {
    return `sheets:${method}`;
  }

  return `google:${method}`;
}

async function getGoogleErrorReason(response: Response) {
  try {
    const body = (await response.clone().json()) as {
      error?: { errors?: Array<{ reason?: string }>; status?: string };
    };
    return body.error?.errors?.[0]?.reason ?? body.error?.status ?? "unknown";
  } catch {
    return "unparseable";
  }
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function googleApiFetch(
  input: string,
  init: RequestInit = {},
  authenticationProvider: GoogleAuthenticationProvider,
): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let token: string;
    try {
      token =
        authenticationProvider === "drive-oauth"
          ? await getGoogleDriveAccessToken()
          : await getGoogleSheetsAccessToken();
    } catch {
      console.error("[GoogleApiClient] Google authentication failed.", {
        provider: authenticationProvider,
      });
      throw new GoogleApiError("google_authentication_failed");
    }
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(input, {
      ...init,
      headers,
      cache: "no-store",
    });

    if (response.ok) {
      return response;
    }

    if (
      !RETRYABLE_STATUS_CODES.has(response.status) ||
      attempt === MAX_ATTEMPTS
    ) {
      const method = init.method ?? "GET";
      console.error("[GoogleApiClient] Google API request failed.", {
        status: response.status,
        operation: getOperationName(input, method),
        reason: await getGoogleErrorReason(response),
      });
      throw new GoogleApiError("google_api_failed");
    }

    await wait(250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 100));
  }

  throw new GoogleApiError("google_api_failed");
}
