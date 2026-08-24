import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  LOCAL_CONFIGURATION_KEYS,
  QA_CONFIGURATION_KEYS,
  isActualValue,
  parseDotEnv,
} from "./local-config-core";

export const PORTABLE_BUNDLE_FORMAT = "company-hub-portable-secrets";
export const PORTABLE_BUNDLE_VERSION = 1;
export const PRODUCTION_SUPABASE_PROJECT_REF = "jjfktbgfwvekhlvyjlww";
export const QA_SUPABASE_PROJECT_REF = "xbdyvhlhubvuzhdzkadj";
export const QA_API_ORIGIN = "https://company-hub-qa.onrender.com";

export type PortableBundle = {
  format: typeof PORTABLE_BUNDLE_FORMAT;
  version: typeof PORTABLE_BUNDLE_VERSION;
  development: Record<string, string>;
  test: Record<string, string>;
  credentials: {
    googleDriveOAuthClient?: Record<string, unknown>;
    googleServiceAccount?: Record<string, unknown>;
  };
};

function configuredEntries(
  source: Record<string, string | undefined>,
  allowedKeys: readonly string[],
) {
  return Object.fromEntries(
    allowedKeys.flatMap((key) => {
      const value = source[key];
      return isActualValue(value) ? [[key, value!]] : [];
    }),
  );
}

export function collectEnvironmentProfile(
  files: string[],
  allowedKeys: readonly string[],
) {
  const profile: Record<string, string | undefined> = {};
  for (const file of files) {
    if (!existsSync(file)) continue;
    Object.assign(
      profile,
      parseDotEnv(readFileSync(file, "utf8"), allowedKeys),
    );
  }
  return configuredEntries(profile, allowedKeys);
}

function readCredentialJson(environment: Record<string, string>, key: string) {
  const filePath = environment[key];
  if (!isActualValue(filePath) || !existsSync(filePath)) return undefined;
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Credential file configured by ${key} is invalid.`);
  }
  return parsed as Record<string, unknown>;
}

export function createPortableBundle(repositoryRoot: string): PortableBundle {
  const development = collectEnvironmentProfile(
    [
      path.join(repositoryRoot, ".env.local"),
      path.join(repositoryRoot, ".env.development.local"),
    ],
    LOCAL_CONFIGURATION_KEYS,
  );
  const test = collectEnvironmentProfile(
    [path.join(repositoryRoot, ".env.test.local")],
    QA_CONFIGURATION_KEYS,
  );
  const googleDriveOAuthClient = readCredentialJson(
    development,
    "GOOGLE_DRIVE_OAUTH_CLIENT_FILE",
  );
  const googleServiceAccount = readCredentialJson(
    development,
    "GOOGLE_SERVICE_ACCOUNT_KEY_FILE",
  );
  delete development.GOOGLE_DRIVE_OAUTH_CLIENT_FILE;
  delete development.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;

  return {
    format: PORTABLE_BUNDLE_FORMAT,
    version: PORTABLE_BUNDLE_VERSION,
    development,
    test,
    credentials: {
      googleDriveOAuthClient,
      googleServiceAccount,
    },
  };
}

export function parsePortableBundle(contents: string): PortableBundle {
  const parsed = JSON.parse(contents) as Partial<PortableBundle>;
  if (
    parsed.format !== PORTABLE_BUNDLE_FORMAT ||
    parsed.version !== PORTABLE_BUNDLE_VERSION ||
    !parsed.development ||
    typeof parsed.development !== "object" ||
    !parsed.test ||
    typeof parsed.test !== "object" ||
    !parsed.credentials ||
    typeof parsed.credentials !== "object"
  ) {
    throw new Error("The portable secret bundle format is invalid.");
  }

  return {
    format: PORTABLE_BUNDLE_FORMAT,
    version: PORTABLE_BUNDLE_VERSION,
    development: configuredEntries(
      parsed.development,
      LOCAL_CONFIGURATION_KEYS,
    ),
    test: configuredEntries(parsed.test, QA_CONFIGURATION_KEYS),
    credentials: parsed.credentials,
  };
}

export function isPathInside(parent: string, candidate: string) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

export function resolvePortableExecutable(name: string) {
  if (process.platform !== "win32") return name;
  const localAppData =
    process.env.LOCALAPPDATA?.trim() ??
    path.join(os.homedir(), "AppData", "Local");
  const wingetAlias = path.join(
    localAppData,
    "Microsoft",
    "WinGet",
    "Links",
    `${name}.exe`,
  );
  return existsSync(wingetAlias) ? wingetAlias : name;
}

export function deriveSupabaseProjectRef(urlValue: string | undefined) {
  try {
    const hostname = new URL(urlValue ?? "").hostname;
    return hostname.endsWith(".supabase.co") ? hostname.split(".")[0] : null;
  } catch {
    return null;
  }
}

export function validateQaIsolation(input: {
  test: Record<string, string | undefined>;
  flutterQa: Record<string, unknown>;
}) {
  const failures: string[] = [];
  const qaRef = deriveSupabaseProjectRef(input.test.NEXT_PUBLIC_SUPABASE_URL);
  if (qaRef !== QA_SUPABASE_PROJECT_REF) {
    failures.push("QA Supabase URL does not use the approved QA project.");
  }
  if (input.test.PLAYWRIGHT_QA_PROJECT_REF !== QA_SUPABASE_PROJECT_REF) {
    failures.push(
      "Playwright QA project reference does not match QA Supabase.",
    );
  }
  if (qaRef === PRODUCTION_SUPABASE_PROJECT_REF) {
    failures.push("QA configuration points to Production Supabase.");
  }
  if (input.flutterQa.APP_FLAVOR !== "qa") {
    failures.push("Flutter QA configuration has the wrong flavor.");
  }
  if (input.flutterQa.API_BASE_URL !== QA_API_ORIGIN) {
    failures.push(
      "Flutter QA API origin does not match the approved QA service.",
    );
  }
  const prohibitedFlutterKeys = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_URL",
    "DATABASE_URL",
    "GOOGLE_DRIVE_OAUTH_CLIENT_SECRET",
    "GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN",
    "SIGNING_KEY",
    "SIGNING_PASSWORD",
  ];
  for (const key of prohibitedFlutterKeys) {
    if (key in input.flutterQa) {
      failures.push(`Flutter QA configuration contains prohibited key ${key}.`);
    }
  }
  return failures;
}
