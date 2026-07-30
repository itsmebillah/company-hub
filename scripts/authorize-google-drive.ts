import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { OAuth2Client } from "google-auth-library";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const ENV_FILE_NAME = ".env.development.local";
const CALLBACK_TIMEOUT_MS = 10 * 60 * 1000;

loadEnvConfig(process.cwd(), true);

function encodeEnvironmentValue(value: string) {
  return `'${value.replaceAll("'", "\\'")}'`;
}

function openDefaultBrowser(url: string) {
  const command =
    process.platform === "win32"
      ? { file: "rundll32.exe", args: ["url.dll,FileProtocolHandler", url] }
      : process.platform === "darwin"
        ? { file: "open", args: [url] }
        : { file: "xdg-open", args: [url] };
  const child = spawn(command.file, command.args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
}

function upsertEnvironmentValue(contents: string, name: string, value: string) {
  const line = `${name}=${encodeEnvironmentValue(value)}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");

  return pattern.test(contents)
    ? contents.replace(pattern, line)
    : `${contents.trimEnd()}${contents ? "\n" : ""}${line}\n`;
}

async function storeAuthorizationConfiguration(refreshToken: string) {
  const envPath = path.join(process.cwd(), ENV_FILE_NAME);
  let existing = "";

  try {
    existing = await readFile(envPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  let updated = upsertEnvironmentValue(
    existing,
    "GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN",
    refreshToken,
  );
  const clientFile = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_FILE?.trim();

  if (clientFile) {
    updated = upsertEnvironmentValue(
      updated,
      "GOOGLE_DRIVE_OAUTH_CLIENT_FILE",
      clientFile,
    );
  }

  await writeFile(envPath, updated, { encoding: "utf8", mode: 0o600 });
}

async function main() {
  const { getGoogleDriveOAuthClientConfig } =
    await import("@/lib/google/config");
  const config = getGoogleDriveOAuthClientConfig();
  const oauthClient = new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
  });
  const state = randomBytes(32).toString("hex");
  const authorizationUrl = oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: [DRIVE_SCOPE],
    state,
  });

  console.log("Open this URL and sign in with the operational Google account:");
  console.log(authorizationUrl);
  openDefaultBrowser(authorizationUrl);
  console.log("The authorization URL was opened in the default browser.");
  console.log("Waiting for the local OAuth callback (up to 10 minutes)...");

  await new Promise<void>((resolve, reject) => {
    const server = createServer(async (request, response) => {
      try {
        const requestUrl = new URL(request.url ?? "/", config.redirectUri);

        if (requestUrl.pathname !== "/oauth2/callback") {
          response.writeHead(404).end("Not found");
          return;
        }

        if (requestUrl.searchParams.get("state") !== state) {
          throw new Error("OAuth callback state validation failed.");
        }

        const providerError = requestUrl.searchParams.get("error");
        const code = requestUrl.searchParams.get("code");

        if (providerError || !code) {
          throw new Error("Google OAuth authorization was not completed.");
        }

        const { tokens } = await oauthClient.getToken(code);

        if (!tokens.refresh_token) {
          throw new Error(
            "Google did not return a refresh token. Revoke the prior app grant and authorize again.",
          );
        }

        await storeAuthorizationConfiguration(tokens.refresh_token);
        response
          .writeHead(200, { "Content-Type": "text/plain; charset=utf-8" })
          .end(
            "Company Hub Drive authorization completed. You may close this tab.",
          );
        console.log(`OAuth refresh token stored securely in ${ENV_FILE_NAME}.`);
        server.close(() => resolve());
      } catch (error) {
        response
          .writeHead(400, { "Content-Type": "text/plain; charset=utf-8" })
          .end(
            "Company Hub Drive authorization failed. Return to the terminal.",
          );
        server.close(() => reject(error));
      }
    });

    server.on("error", reject);
    server.listen(53682, "127.0.0.1");

    const timeout = setTimeout(() => {
      server.close(() => reject(new Error("OAuth callback timed out.")));
    }, CALLBACK_TIMEOUT_MS);
    timeout.unref();
    server.on("close", () => clearTimeout(timeout));
  });
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Google Drive authorization failed.",
  );
  process.exitCode = 1;
});
