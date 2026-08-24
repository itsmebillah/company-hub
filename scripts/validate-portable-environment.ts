import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  LOCAL_CONFIGURATION_KEYS,
  QA_CONFIGURATION_KEYS,
  isActualValue,
  parseDotEnv,
} from "./local-config-core";
import {
  deriveSupabaseProjectRef,
  isPathInside,
  validateQaIsolation,
} from "./portable-config-core";

type Validation = { name: string; valid: boolean; detail?: string };

function readProfile(files: string[], keys: readonly string[]) {
  const profile: Record<string, string | undefined> = {};
  for (const file of files) {
    if (!existsSync(file)) continue;
    Object.assign(profile, parseDotEnv(readFileSync(file, "utf8"), keys));
  }
  return profile;
}

function commandExists(command: string) {
  const lookup = spawnSync(
    process.platform === "win32" ? "where.exe" : "which",
    [command],
    {
      encoding: "utf8",
      windowsHide: true,
    },
  );
  if (lookup.status === 0) return true;
  if (process.platform === "win32") {
    const localAppData =
      process.env.LOCALAPPDATA?.trim() ??
      path.join(os.homedir(), "AppData", "Local");
    const wingetAlias = path.join(
      localAppData,
      "Microsoft",
      "WinGet",
      "Links",
      `${command}.exe`,
    );
    if (existsSync(wingetAlias)) return true;
  }
  const androidHome = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  if (!androidHome) return false;
  const androidCandidates: Record<string, string[]> = {
    adb: [
      path.join(
        androidHome,
        "platform-tools",
        process.platform === "win32" ? "adb.exe" : "adb",
      ),
    ],
    sdkmanager: [
      path.join(
        androidHome,
        "cmdline-tools",
        "latest",
        "bin",
        process.platform === "win32" ? "sdkmanager.bat" : "sdkmanager",
      ),
    ],
  };
  return (androidCandidates[command] ?? []).some((candidate) =>
    existsSync(candidate),
  );
}

function isGitIgnored(file: string) {
  const result = spawnSync("git", ["check-ignore", "--quiet", file], {
    windowsHide: true,
  });
  return result.status === 0;
}

export function validatePortableEnvironment(repositoryRoot = process.cwd()) {
  const development = readProfile(
    [
      path.join(repositoryRoot, ".env.local"),
      path.join(repositoryRoot, ".env.development.local"),
    ],
    LOCAL_CONFIGURATION_KEYS,
  );
  const test = readProfile(
    [path.join(repositoryRoot, ".env.test.local")],
    QA_CONFIGURATION_KEYS,
  );
  const flutterQaPath = path.join(
    repositoryRoot,
    "clients",
    "employee_android",
    "config",
    "qa.json",
  );
  const flutterQa = JSON.parse(readFileSync(flutterQaPath, "utf8")) as Record<
    string,
    unknown
  >;

  const validations: Validation[] = [];
  for (const command of [
    "git",
    "node",
    "npm",
    "sops",
    "age",
    "age-keygen",
    "supabase",
    "flutter",
    "dart",
    "java",
    "adb",
    "sdkmanager",
  ]) {
    validations.push({
      name: `tool.${command}`,
      valid: commandExists(command),
      detail:
        command === "sops"
          ? "required for encrypted bundle import/export"
          : undefined,
    });
  }

  for (const file of [
    ".env.local",
    ".env.development.local",
    ".env.test.local",
  ]) {
    validations.push({
      name: `git_ignored.${file}`,
      valid: !existsSync(path.join(repositoryRoot, file)) || isGitIgnored(file),
    });
  }

  const requiredDevelopment = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_PROJECT_REF",
    "SUPABASE_DB_URL",
    "CRON_SECRET",
  ];
  for (const key of requiredDevelopment) {
    validations.push({
      name: `development.${key}`,
      valid: isActualValue(development[key]),
    });
  }

  validations.push({
    name: "development.supabase_project_match",
    valid:
      deriveSupabaseProjectRef(development.NEXT_PUBLIC_SUPABASE_URL) ===
      development.SUPABASE_PROJECT_REF,
  });

  const requiredTest = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PLAYWRIGHT_QA_PROJECT_REF",
    "PLAYWRIGHT_QA_ADMIN_EMPLOYEE_ID",
    "PLAYWRIGHT_QA_EMPLOYEE_ID",
    "PLAYWRIGHT_ALLOW_QA_MUTATIONS",
  ];
  for (const key of requiredTest) {
    validations.push({ name: `qa.${key}`, valid: isActualValue(test[key]) });
  }
  for (const failure of validateQaIsolation({ test, flutterQa })) {
    validations.push({ name: `qa.isolation.${failure}`, valid: false });
  }
  if (validateQaIsolation({ test, flutterQa }).length === 0) {
    validations.push({ name: "qa.isolation", valid: true });
  }

  for (const key of [
    "GOOGLE_DRIVE_OAUTH_CLIENT_FILE",
    "GOOGLE_SERVICE_ACCOUNT_KEY_FILE",
  ]) {
    const configuredPath = development[key];
    validations.push({
      name: `external_file.${key}`,
      valid: Boolean(
        isActualValue(configuredPath) &&
        existsSync(configuredPath!) &&
        !isPathInside(repositoryRoot, configuredPath!),
      ),
    });
  }

  const androidHome = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  validations.push({
    name: "machine.JAVA_HOME",
    valid: Boolean(process.env.JAVA_HOME && existsSync(process.env.JAVA_HOME)),
  });
  validations.push({
    name: "machine.ANDROID_SDK",
    valid: Boolean(androidHome && existsSync(androidHome)),
  });

  return validations;
}

function main() {
  const validations = validatePortableEnvironment();
  for (const validation of validations) {
    console.log(`${validation.valid ? "PASS" : "FAIL"} ${validation.name}`);
  }
  const failures = validations.filter((validation) => !validation.valid);
  console.log(
    failures.length === 0
      ? "portable_environment=PASS"
      : "portable_environment=FAIL",
  );
  if (failures.length > 0) process.exitCode = 1;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  main();
}
