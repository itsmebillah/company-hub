import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { isActualValue } from "./local-config-core";
import {
  createPortableBundle,
  isPathInside,
  resolvePortableExecutable,
  validateQaIsolation,
} from "./portable-config-core";

function argumentValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const output = argumentValue("--output");
  const ageRecipient = argumentValue("--age-recipient");
  if (!output || !ageRecipient) {
    throw new Error(
      "Usage: npm run portable:bundle:create -- --output <outside-repo.sops.json> --age-recipient <public-age-recipient>",
    );
  }
  if (isPathInside(process.cwd(), output)) {
    throw new Error(
      "The encrypted bundle must be stored outside the repository.",
    );
  }
  if (existsSync(output)) {
    throw new Error(
      "The encrypted bundle output already exists; choose a new path.",
    );
  }

  const bundle = createPortableBundle(process.cwd());
  const requiredDevelopment = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_PROJECT_REF",
    "SUPABASE_DB_URL",
    "CRON_SECRET",
    "GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN",
  ];
  const requiredTest = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PLAYWRIGHT_QA_PROJECT_REF",
    "PLAYWRIGHT_QA_ADMIN_EMPLOYEE_ID",
    "PLAYWRIGHT_QA_EMPLOYEE_ID",
    "PLAYWRIGHT_ALLOW_QA_MUTATIONS",
  ];
  const missing = [
    ...requiredDevelopment.flatMap((key) =>
      isActualValue(bundle.development[key]) ? [] : [`development.${key}`],
    ),
    ...requiredTest.flatMap((key) =>
      isActualValue(bundle.test[key]) ? [] : [`qa.${key}`],
    ),
  ];
  if (!bundle.credentials.googleDriveOAuthClient) {
    missing.push("credential.google_drive_oauth_client");
  }
  if (!bundle.credentials.googleServiceAccount) {
    missing.push("credential.google_service_account");
  }
  if (missing.length > 0) {
    throw new Error(`Portable bundle is incomplete: ${missing.join(", ")}.`);
  }
  const flutterQa = JSON.parse(
    readFileSync(
      path.join(
        process.cwd(),
        "clients",
        "employee_android",
        "config",
        "qa.json",
      ),
      "utf8",
    ),
  ) as Record<string, unknown>;
  if (validateQaIsolation({ test: bundle.test, flutterQa }).length > 0) {
    throw new Error("Portable bundle QA isolation validation failed.");
  }
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "company-hub-portable-"),
  );
  const plaintextPath = path.join(temporaryDirectory, "bundle.json");
  try {
    await writeFile(plaintextPath, JSON.stringify(bundle), {
      encoding: "utf8",
      mode: 0o600,
    });
    const result = spawnSync(
      resolvePortableExecutable("sops"),
      [
        "--encrypt",
        "--input-type",
        "json",
        "--output-type",
        "json",
        "--age",
        ageRecipient,
        "--output",
        path.resolve(output),
        plaintextPath,
      ],
      { encoding: "utf8", windowsHide: true },
    );
    if (result.status !== 0) {
      throw new Error(
        "SOPS encryption failed. Install SOPS and verify the public age recipient.",
      );
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }

  console.log("portable_bundle=CREATED");
  console.log("secrets_printed=NO");
  console.log("repository_output=NO");
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Portable bundle creation failed safely.",
  );
  process.exitCode = 1;
});
