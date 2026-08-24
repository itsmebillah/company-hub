import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { parseDotEnv } from "./local-config-core";
import { materializePortableBundle } from "./portable-config-io";
import {
  QA_SUPABASE_PROJECT_REF,
  createPortableBundle,
  isPathInside,
  parsePortableBundle,
} from "./portable-config-core";

function executable(name: string) {
  const extension = process.platform === "win32" ? ".exe" : "";
  const localAppData =
    process.env.LOCALAPPDATA?.trim() ??
    path.join(os.homedir(), "AppData", "Local");
  const wingetPath =
    process.platform === "win32"
      ? path.join(
          localAppData,
          "Microsoft",
          "WinGet",
          "Links",
          `${name}${extension}`,
        )
      : null;
  return wingetPath && existsSync(wingetPath) ? wingetPath : name;
}

function run(command: string, args: string[], environment = process.env) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    windowsHide: true,
    env: environment,
  });
  if (result.status !== 0) throw new Error("Portable verifier tool failed.");
  return result.stdout.trim();
}

async function main() {
  const root = await mkdtemp(path.join(os.tmpdir(), "company-hub-roundtrip-"));
  const homeRepository = path.join(root, "home-repository");
  const homeCredentials = path.join(root, "home-credentials");
  const officeRepository = path.join(root, "office-repository");
  const officeCredentials = path.join(root, "office-credentials");
  const plaintextBundle = path.join(root, "portable-plaintext.json");
  const encryptedBundle = path.join(root, "portable.sops.json");
  const ageIdentity = path.join(root, "portable.agekey");
  try {
    await mkdir(homeRepository);
    await mkdir(homeCredentials);
    await mkdir(officeRepository);
    const oauthFile = path.join(homeCredentials, "oauth.json");
    const serviceAccountFile = path.join(
      homeCredentials,
      "service-account.json",
    );
    await writeFile(
      oauthFile,
      JSON.stringify({
        installed: {
          client_id: "synthetic-client",
          client_secret: "synthetic-oauth-secret",
        },
      }),
    );
    await writeFile(
      serviceAccountFile,
      JSON.stringify({
        type: "service_account",
        private_key: "synthetic-private-key",
      }),
    );
    await writeFile(
      path.join(homeRepository, ".env.local"),
      [
        "NEXT_PUBLIC_APP_URL=http://localhost:3000",
        "NEXT_PUBLIC_SUPABASE_URL=https://development-ref.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic-development-anon-key",
        "SUPABASE_SERVICE_ROLE_KEY=synthetic-development-service-role",
      ].join("\n"),
    );
    await writeFile(
      path.join(homeRepository, ".env.development.local"),
      [
        "SUPABASE_PROJECT_REF=development-ref",
        "SUPABASE_DB_URL=postgresql://synthetic:synthetic@localhost:5432/postgres",
        "CRON_SECRET=synthetic-cron-secret-long-value",
        `GOOGLE_DRIVE_OAUTH_CLIENT_FILE=${oauthFile}`,
        `GOOGLE_SERVICE_ACCOUNT_KEY_FILE=${serviceAccountFile}`,
      ].join("\n"),
    );
    await writeFile(
      path.join(homeRepository, ".env.test.local"),
      [
        "NEXT_PUBLIC_APP_URL=http://localhost:3100",
        `NEXT_PUBLIC_SUPABASE_URL=https://${QA_SUPABASE_PROJECT_REF}.supabase.co`,
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic-qa-anon-key",
        "SUPABASE_SERVICE_ROLE_KEY=synthetic-qa-service-role",
        `PLAYWRIGHT_QA_PROJECT_REF=${QA_SUPABASE_PROJECT_REF}`,
        "PLAYWRIGHT_QA_ADMIN_EMPLOYEE_ID=QA-ADMIN",
        "PLAYWRIGHT_QA_EMPLOYEE_ID=QA-EMPLOYEE",
        "PLAYWRIGHT_ALLOW_QA_MUTATIONS=true",
      ].join("\n"),
    );

    const bundle = createPortableBundle(homeRepository);
    await writeFile(plaintextBundle, JSON.stringify(bundle), { mode: 0o600 });
    run(executable("age-keygen"), ["-o", ageIdentity]);
    const recipient = run(executable("age-keygen"), ["-y", ageIdentity]);
    run(executable("sops"), [
      "--encrypt",
      "--input-type",
      "json",
      "--output-type",
      "json",
      "--age",
      recipient,
      "--output",
      encryptedBundle,
      plaintextBundle,
    ]);
    const encryptedContents = readFileSync(encryptedBundle, "utf8");
    assert.doesNotMatch(encryptedContents, /synthetic-oauth-secret/);
    assert.doesNotMatch(encryptedContents, /synthetic-private-key/);
    const decrypted = run(
      executable("sops"),
      ["--decrypt", "--output-type", "json", encryptedBundle],
      { ...process.env, SOPS_AGE_KEY_FILE: ageIdentity },
    );
    await materializePortableBundle({
      bundle: parsePortableBundle(decrypted),
      repositoryRoot: officeRepository,
      credentialsDirectory: officeCredentials,
    });

    const development = parseDotEnv(
      readFileSync(path.join(officeRepository, ".env.local"), "utf8"),
    );
    assert.equal(development.SUPABASE_PROJECT_REF, "development-ref");
    assert.equal(
      isPathInside(
        officeRepository,
        development.GOOGLE_DRIVE_OAUTH_CLIENT_FILE!,
      ),
      false,
    );
    assert.equal(
      isPathInside(
        officeRepository,
        development.GOOGLE_SERVICE_ACCOUNT_KEY_FILE!,
      ),
      false,
    );
    assert.equal(existsSync(development.GOOGLE_DRIVE_OAUTH_CLIENT_FILE!), true);
    assert.equal(
      existsSync(development.GOOGLE_SERVICE_ACCOUNT_KEY_FILE!),
      true,
    );
    assert.equal(
      existsSync(path.join(officeRepository, "google-drive-oauth-client.json")),
      false,
    );
    const testProfile = readFileSync(
      path.join(officeRepository, ".env.test.local"),
      "utf8",
    );
    assert.match(testProfile, new RegExp(QA_SUPABASE_PROJECT_REF));
    console.log("portable_encrypted_roundtrip=PASS");
    console.log("secret_values_printed=NO");
    console.log("disposable_cleanup=PASS");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

main().catch(() => {
  console.error("portable_encrypted_roundtrip=FAIL");
  process.exitCode = 1;
});
