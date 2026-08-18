import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { OAuth2Client } from "google-auth-library";

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const FULL_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
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
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
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

function pickerPage(input: {
  accessToken: string;
  apiKey: string;
  appId: string;
  state: string;
}) {
  const pickerConfig = JSON.stringify(input).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Authorize Company Hub Selfies folder</title></head>
<body style="font-family:system-ui;max-width:700px;margin:48px auto;padding:0 20px">
<h1>Authorize the existing Selfies folder</h1>
<p>Select the existing Company Hub <strong>Selfies</strong> folder. No replacement folder will be created.</p>
<button id="select" disabled>Select existing Selfies folder</button><p id="status">Loading Google Picker…</p>
<script>const config=${pickerConfig};
function pickerReady(){document.getElementById('select').disabled=false;document.getElementById('status').textContent='Ready.'}
function openPicker(){const view=new google.picker.DocsView(google.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes('${FOLDER_MIME_TYPE}');const picker=new google.picker.PickerBuilder().setAppId(config.appId).setOAuthToken(config.accessToken).setDeveloperKey(config.apiKey).addView(view).setCallback(async data=>{if(data.action!==google.picker.Action.PICKED)return;const doc=data.docs&&data.docs[0];if(!doc)return;document.getElementById('status').textContent='Verifying selection…';const response=await fetch('/oauth2/folder',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({state:config.state,folderId:doc.id})});document.body.innerHTML=await response.text()}).build();picker.setVisible(true)}
document.getElementById('select').addEventListener('click',openPicker);</script>
<script async src="https://apis.google.com/js/api.js" onload="gapi.load('picker',{callback:pickerReady})"></script>
</body></html>`;
}

async function main() {
  const {
    getGoogleDriveOAuthClientConfig,
    getGoogleDrivePickerConfig,
    getGoogleDriveStorageConfig,
  } = await import("@/lib/google/config");
  const config = getGoogleDriveOAuthClientConfig();
  const picker = getGoogleDrivePickerConfig();
  const { driveSelfiesFolderId } = getGoogleDriveStorageConfig();
  const oauthClient = new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
  });
  const state = randomBytes(32).toString("hex");
  const authorizationUrl = oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [DRIVE_FILE_SCOPE],
    state,
  });

  if (process.argv.includes("--preflight")) {
    console.log(`drive_scope=${DRIVE_FILE_SCOPE}`);
    console.log("incremental_scope_inheritance=disabled");
    console.log("existing_selfies_folder=preserved");
    console.log("google_picker=configuration_present");
    console.log("authorization_preflight=passed");
    return;
  }

  console.log(
    "Opening Google authorization for Company Hub's drive.file scope.",
  );
  console.log(
    "After consent, select the existing Selfies folder in Google Picker.",
  );
  openDefaultBrowser(authorizationUrl);
  console.log(
    "Waiting for authorization and folder selection (up to 10 minutes)...",
  );

  await new Promise<void>((resolve, reject) => {
    let refreshToken: string | null = null;
    let accessToken: string | null = null;
    const server = createServer(async (request, response) => {
      try {
        const requestUrl = new URL(request.url ?? "/", config.redirectUri);
        if (
          requestUrl.pathname === "/oauth2/callback" &&
          request.method === "GET"
        ) {
          if (requestUrl.searchParams.get("state") !== state) {
            throw new Error("OAuth callback state validation failed.");
          }
          const providerError = requestUrl.searchParams.get("error");
          const code = requestUrl.searchParams.get("code");
          if (providerError || !code) {
            throw new Error("Google OAuth authorization was not completed.");
          }
          const tokenResponse = await oauthClient.getToken(code);
          refreshToken = tokenResponse.tokens.refresh_token ?? null;
          accessToken = tokenResponse.tokens.access_token ?? null;
          if (!refreshToken || !accessToken) {
            throw new Error(
              "Google did not return the required offline authorization.",
            );
          }
          const tokenInfo = await oauthClient.getTokenInfo(accessToken);
          if (
            !tokenInfo.scopes.includes(DRIVE_FILE_SCOPE) ||
            tokenInfo.scopes.includes(FULL_DRIVE_SCOPE)
          ) {
            throw new Error(
              "Authorization is not a clean drive.file-only grant; nothing was stored.",
            );
          }
          response.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
          });
          response.end(
            pickerPage({
              accessToken,
              apiKey: picker.apiKey,
              appId: picker.appId,
              state,
            }),
          );
          return;
        }

        if (
          requestUrl.pathname === "/oauth2/folder" &&
          request.method === "POST"
        ) {
          let body = "";
          for await (const chunk of request) body += chunk;
          const selection = JSON.parse(body) as {
            state?: string;
            folderId?: string;
          };
          if (selection.state !== state || !selection.folderId) {
            throw new Error("Folder selection state validation failed.");
          }
          if (selection.folderId !== driveSelfiesFolderId) {
            throw new Error(
              "The selected folder is not the configured Selfies folder.",
            );
          }
          const folderResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(selection.folderId)}?supportsAllDrives=true&fields=id,mimeType,isAppAuthorized,capabilities(canAddChildren,canEdit)`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          if (!folderResponse.ok)
            throw new Error("Selected folder could not be verified.");
          const folder = (await folderResponse.json()) as {
            id?: string;
            mimeType?: string;
            isAppAuthorized?: boolean;
            capabilities?: { canAddChildren?: boolean; canEdit?: boolean };
          };
          if (
            folder.id !== driveSelfiesFolderId ||
            folder.mimeType !== FOLDER_MIME_TYPE ||
            folder.isAppAuthorized !== true ||
            folder.capabilities?.canAddChildren !== true ||
            folder.capabilities?.canEdit !== true
          ) {
            throw new Error(
              "Selected Selfies folder is not app-authorized and writable.",
            );
          }
          await storeAuthorizationConfiguration(refreshToken as string);
          response.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
          });
          response.end(
            "<h1>Company Hub Drive authorization completed.</h1><p>The existing Selfies folder was preserved and authorized. You may close this tab.</p>",
          );
          console.log(`drive_scope=${DRIVE_FILE_SCOPE}`);
          console.log("selfies_folder=app_authorized");
          console.log(`refresh_token=stored_in_${ENV_FILE_NAME}`);
          server.close(() => resolve());
          return;
        }

        response.writeHead(404).end("Not found");
      } catch (error) {
        response.writeHead(400, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end(
          "Company Hub Drive authorization failed. Return to the terminal.",
        );
        server.close(() => reject(error));
      }
    });

    server.on("error", reject);
    server.listen(53682, "127.0.0.1");
    const timeout = setTimeout(() => {
      server.close(() =>
        reject(new Error("OAuth or Picker authorization timed out.")),
      );
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
