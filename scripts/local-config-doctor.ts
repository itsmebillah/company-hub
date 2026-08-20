import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { OAuth2Client } from "google-auth-library";

import {
  checkValue,
  getOAuthProjectNumber,
  isActualValue,
  isUuid,
  type ConfigurationCheck,
} from "./local-config-core";

type JsonObject = Record<string, unknown>;

function readJsonFile(filePath: string | undefined) {
  if (!isActualValue(filePath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(filePath!, "utf8")) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as JsonObject) : null;
  } catch {
    return null;
  }
}

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" ||
      ((url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
        url.protocol === "http:")
    );
  } catch {
    return false;
  }
}

function validSupabaseUrl(value: string) {
  if (!validUrl(value)) return false;
  const hostname = new URL(value).hostname;
  return (
    hostname.endsWith(".supabase.co") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

function checkRuntime() {
  const checks: ConfigurationCheck[] = [];
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const npmMajor = Number(
    process.env.npm_config_user_agent?.match(/\bnpm\/(\d+)/)?.[1],
  );
  checks.push({
    name: "runtime.npm_11",
    status: npmMajor === 11 ? "CONFIGURED" : "INVALID",
    nextStep: npmMajor === 11 ? undefined : "Install and run with npm 11.x.",
  });
  checks.push({
    name: "runtime.node_24",
    status: nodeMajor === 24 ? "CONFIGURED" : "INVALID",
    nextStep: nodeMajor === 24 ? undefined : "Install Node.js 24.x.",
  });
  checks.push({
    name: "runtime.dependencies",
    status: existsSync(path.join(process.cwd(), "node_modules"))
      ? "CONFIGURED"
      : "MISSING",
    nextStep: "Run npm install.",
  });
  return checks;
}

function inspectOAuthClient() {
  const clientFile = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_FILE?.trim();
  const document = readJsonFile(clientFile);
  const installed = document?.installed as JsonObject | undefined;
  const fileValid = Boolean(
    installed &&
    typeof installed.client_id === "string" &&
    typeof installed.client_secret === "string" &&
    typeof installed.project_id === "string",
  );
  const inlineClientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID;
  const inlineValid = Boolean(
    inlineClientId?.match(/^\d+-[0-9a-z]+\.apps\.googleusercontent\.com$/i) &&
    isActualValue(process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET),
  );
  return {
    check: {
      name: "google.drive.desktop_oauth_client",
      status:
        fileValid || inlineValid
          ? "CONFIGURED"
          : clientFile
            ? "INVALID"
            : "MISSING",
      nextStep:
        "Configure a valid Desktop OAuth JSON path or the server-only client ID and secret.",
    } satisfies ConfigurationCheck,
    projectId:
      fileValid && typeof installed?.project_id === "string"
        ? installed.project_id
        : null,
    projectNumber:
      fileValid && typeof installed?.client_id === "string"
        ? getOAuthProjectNumber(installed.client_id)
        : getOAuthProjectNumber(process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID),
    clientId:
      fileValid && typeof installed?.client_id === "string"
        ? installed.client_id
        : process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID,
    clientSecret:
      fileValid && typeof installed?.client_secret === "string"
        ? installed.client_secret
        : process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET,
  };
}

async function checkDriveCredential(input: {
  clientId: string | undefined;
  clientSecret: string | undefined;
}) {
  const refreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN;
  if (
    !isActualValue(input.clientId) ||
    !isActualValue(input.clientSecret) ||
    !isActualValue(refreshToken)
  ) {
    return {
      name: "google.drive.live_authorization",
      status: "MISSING",
      nextStep: "Configure the OAuth client and reusable refresh token.",
    } satisfies ConfigurationCheck;
  }

  try {
    const client = new OAuth2Client({
      clientId: input.clientId,
      clientSecret: input.clientSecret,
    });
    client.setCredentials({ refresh_token: refreshToken });
    const accessToken = await client.getAccessToken();
    if (!accessToken.token) throw new Error("No access token returned.");
    const tokenInfo = await client.getTokenInfo(accessToken.token);
    const hasDriveFile = tokenInfo.scopes.includes(
      "https://www.googleapis.com/auth/drive.file",
    );
    const hasFullDrive = tokenInfo.scopes.includes(
      "https://www.googleapis.com/auth/drive",
    );
    return {
      name: "google.drive.live_authorization",
      status: hasDriveFile && !hasFullDrive ? "CONFIGURED" : "INVALID",
      nextStep:
        hasDriveFile && !hasFullDrive
          ? undefined
          : "Authorization must grant drive.file and must not grant full Drive access.",
    } satisfies ConfigurationCheck;
  } catch {
    return {
      name: "google.drive.live_authorization",
      status: "INVALID",
      nextStep:
        "Check network access and the configured credential; authorize again only if the reusable token is revoked or invalid.",
    } satisfies ConfigurationCheck;
  }
}

function inspectServiceAccount() {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE?.trim();
  const document = readJsonFile(keyFile);
  const fileValid = Boolean(
    document &&
    document.type === "service_account" &&
    typeof document.project_id === "string" &&
    typeof document.client_email === "string" &&
    typeof document.private_key === "string",
  );
  const inlineKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replaceAll(
    "\\n",
    "\n",
  );
  const inlineEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const inlineValid = Boolean(
    inlineEmail?.endsWith(".gserviceaccount.com") &&
    inlineKey?.includes("BEGIN PRIVATE KEY"),
  );
  return {
    check: {
      name: "google.sheets.service_account",
      status:
        fileValid || inlineValid
          ? "CONFIGURED"
          : keyFile
            ? "INVALID"
            : "MISSING",
      nextStep:
        "Configure a readable service-account JSON path or server-only email/private key.",
    } satisfies ConfigurationCheck,
    projectId:
      fileValid && typeof document?.project_id === "string"
        ? document.project_id
        : (inlineEmail?.match(/@([^.]+)\.iam\.gserviceaccount\.com$/)?.[1] ??
          null),
  };
}

export async function runDoctor() {
  loadEnvConfig(process.cwd(), true);
  const checks: ConfigurationCheck[] = [...checkRuntime()];
  const localEnvPresent = [".env.development.local", ".env.local"].some(
    (file) => existsSync(path.join(process.cwd(), file)),
  );
  checks.push({
    name: "local.ignored_environment",
    status: localEnvPresent ? "CONFIGURED" : "MISSING",
    nextStep: "Run npm run setup:local with a secure configuration source.",
  });
  checks.push(
    checkValue(
      "app.url",
      process.env.NEXT_PUBLIC_APP_URL,
      validUrl,
      "Set NEXT_PUBLIC_APP_URL.",
    ),
    checkValue(
      "supabase.url",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      validSupabaseUrl,
      "Set the development Supabase URL.",
    ),
    checkValue(
      "supabase.anon_key",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      (value) => value.length >= 20,
      "Set the development Supabase anonymous key.",
    ),
    checkValue(
      "supabase.service_role",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      (value) => value.length >= 20,
      "Set the server-only development service-role key.",
    ),
    checkValue(
      "cron.secret",
      process.env.CRON_SECRET,
      (value) => value.length >= 24,
      "Generate a local random CRON_SECRET.",
    ),
  );

  const oauth = inspectOAuthClient();
  const serviceAccount = inspectServiceAccount();
  checks.push(oauth.check, serviceAccount.check);
  checks.push(
    checkValue(
      "google.drive.refresh_token",
      process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN,
      (value) => value.length >= 20,
      "Reuse a valid secured refresh token or run authorize:google-drive only if required.",
    ),
    checkValue(
      "google.drive.selfies_folder",
      process.env.GOOGLE_DRIVE_SELFIES_FOLDER_ID,
      (value) => /^[0-9A-Za-z_-]{10,}$/.test(value),
      "Set the existing Selfies folder ID; never create a replacement automatically.",
    ),
    checkValue(
      "google.picker.api_key",
      process.env.GOOGLE_DRIVE_PICKER_API_KEY,
      (value) => /^AIza[0-9A-Za-z_-]{30,}$/.test(value),
      "Set a Google Picker API key from the Company Hub Cloud project.",
    ),
    checkValue(
      "google.picker.app_id",
      process.env.GOOGLE_DRIVE_PICKER_APP_ID,
      (value) => /^\d{6,}$/.test(value),
      "Set the numeric Google Cloud project number.",
    ),
    checkValue(
      "google.sheets.spreadsheet",
      process.env.GOOGLE_SHEETS_REPORTING_SPREADSHEET_ID,
      (value) => /^[0-9A-Za-z_-]{10,}$/.test(value),
      "Set the approved reporting spreadsheet ID.",
    ),
    checkValue(
      "google.sheets.company",
      process.env.GOOGLE_SHEETS_REPORTING_COMPANY_ID,
      isUuid,
      "Set the explicitly approved reporting company UUID.",
    ),
  );

  checks.push(await checkDriveCredential(oauth));

  const pickerAppId = process.env.GOOGLE_DRIVE_PICKER_APP_ID?.trim();
  checks.push({
    name: "google.project.oauth_picker_match",
    status:
      oauth.projectNumber && pickerAppId
        ? oauth.projectNumber === pickerAppId
          ? "CONFIGURED"
          : "INVALID"
        : "MISSING",
    nextStep:
      "Use the project number belonging to the configured OAuth client.",
  });
  checks.push({
    name: "google.project.oauth_service_account_match",
    status:
      oauth.projectId && serviceAccount.projectId
        ? oauth.projectId === serviceAccount.projectId
          ? "CONFIGURED"
          : "INVALID"
        : "MISSING",
    nextStep:
      "Use OAuth and service-account credentials from the same Cloud project.",
  });

  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  let derivedRef: string | null = null;
  try {
    const hostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";
    derivedRef = hostname.endsWith(".supabase.co")
      ? hostname.split(".")[0]
      : null;
  } catch {}
  checks.push({
    name: "database.project_ref",
    status:
      projectRef && derivedRef
        ? projectRef === derivedRef
          ? "CONFIGURED"
          : "INVALID"
        : "MISSING",
    nextStep: "Set SUPABASE_PROJECT_REF to the project used by the local URL.",
  });
  checks.push(
    checkValue(
      "database.connection_url",
      process.env.SUPABASE_DB_URL,
      (value) => /^postgres(?:ql)?:\/\//.test(value),
      "Set SUPABASE_DB_URL only when running database validation or migrations.",
    ),
  );

  for (const check of checks) console.log(`${check.status} ${check.name}`);
  const incomplete = checks.filter((check) => check.status !== "CONFIGURED");
  for (const check of incomplete) {
    if (check.nextStep) console.log(`NEXT ${check.name}: ${check.nextStep}`);
  }
  console.log(
    incomplete.length === 0 ? "doctor=CONFIGURED" : "doctor=INCOMPLETE",
  );
  return { checks, configured: incomplete.length === 0 };
}
