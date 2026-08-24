import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  QA_CONFIGURATION_KEYS,
  getOAuthProjectNumber,
  isActualValue,
  mergeKnownConfiguration,
  parseDotEnv,
} from "../../scripts/local-config-core";
import {
  PORTABLE_BUNDLE_FORMAT,
  PORTABLE_BUNDLE_VERSION,
  QA_API_ORIGIN,
  QA_SUPABASE_PROJECT_REF,
  createPortableBundle,
  parsePortableBundle,
  validateQaIsolation,
} from "../../scripts/portable-config-core";

test("recognizes missing and placeholder configuration without exposing it", () => {
  assert.equal(isActualValue(undefined), false);
  assert.equal(isActualValue("your-google-oauth-client-id"), false);
  assert.equal(isActualValue("<replace-me>"), false);
  assert.equal(
    isActualValue(
      "postgresql://postgres:your-password@your-host:5432/postgres",
    ),
    false,
  );
  assert.equal(isActualValue("configured-value"), true);
});

test("imports only explicitly allowlisted configuration", () => {
  const parsed = parseDotEnv(
    [
      "GOOGLE_DRIVE_SELFIES_FOLDER_ID=folder-value",
      "UNRELATED_PRIVATE_VALUE=must-not-copy",
      "export NEXT_PUBLIC_APP_URL=http://localhost:3000",
    ].join("\n"),
  );

  assert.deepEqual(parsed, {
    GOOGLE_DRIVE_SELFIES_FOLDER_ID: "folder-value",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  });
  assert.equal("UNRELATED_PRIVATE_VALUE" in parsed, false);
});

test("preserves configured destination values and fills only missing values", () => {
  const merged = mergeKnownConfiguration(
    [
      "GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN='existing-token-value'",
      "GOOGLE_DRIVE_SELFIES_FOLDER_ID=your-google-drive-folder-id",
      "CUSTOM_LOCAL_SETTING=preserved",
    ].join("\n"),
    {
      GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN: "source-token-value",
      GOOGLE_DRIVE_SELFIES_FOLDER_ID: "existing-selfies-folder",
    },
  );

  assert.match(merged, /existing-token-value/);
  assert.doesNotMatch(merged, /source-token-value/);
  assert.match(merged, /existing-selfies-folder/);
  assert.match(merged, /CUSTOM_LOCAL_SETTING=preserved/);
});

test("requires an explicit replacement flag to replace configured values", () => {
  const merged = mergeKnownConfiguration(
    "GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=old-token\n",
    { GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN: "new-token" },
    true,
  );

  assert.doesNotMatch(merged, /old-token/);
  assert.match(merged, /new-token/);
});

test("derives the Google project number without retaining credential details", () => {
  assert.equal(
    getOAuthProjectNumber("123456789012-example.apps.googleusercontent.com"),
    "123456789012",
  );
  assert.equal(getOAuthProjectNumber("invalid-client-id"), null);
});

test("parses only allowlisted QA configuration", () => {
  const parsed = parseDotEnv(
    [
      `PLAYWRIGHT_QA_PROJECT_REF=${QA_SUPABASE_PROJECT_REF}`,
      "PLAYWRIGHT_QA_EMPLOYEE_ID=QA-EMPLOYEE",
      "UNRELATED_SECRET=must-not-import",
    ].join("\n"),
    QA_CONFIGURATION_KEYS,
  );
  assert.equal(parsed.PLAYWRIGHT_QA_PROJECT_REF, QA_SUPABASE_PROJECT_REF);
  assert.equal(parsed.PLAYWRIGHT_QA_EMPLOYEE_ID, "QA-EMPLOYEE");
  assert.equal("UNRELATED_SECRET" in parsed, false);
});

test("portable bundle rejects unknown and placeholder values", () => {
  const bundle = parsePortableBundle(
    JSON.stringify({
      format: PORTABLE_BUNDLE_FORMAT,
      version: PORTABLE_BUNDLE_VERSION,
      development: {
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        UNKNOWN_SECRET: "must-not-import",
      },
      test: {
        PLAYWRIGHT_QA_PROJECT_REF: QA_SUPABASE_PROJECT_REF,
        SUPABASE_SERVICE_ROLE_KEY: "placeholder",
      },
      credentials: {},
    }),
  );
  assert.equal(bundle.development.NEXT_PUBLIC_APP_URL, "http://localhost:3000");
  assert.equal("UNKNOWN_SECRET" in bundle.development, false);
  assert.equal(bundle.test.SUPABASE_SERVICE_ROLE_KEY, undefined);
});

test("QA isolation accepts only the approved Supabase and API targets", () => {
  const valid = validateQaIsolation({
    test: {
      NEXT_PUBLIC_SUPABASE_URL: `https://${QA_SUPABASE_PROJECT_REF}.supabase.co`,
      PLAYWRIGHT_QA_PROJECT_REF: QA_SUPABASE_PROJECT_REF,
    },
    flutterQa: { APP_FLAVOR: "qa", API_BASE_URL: QA_API_ORIGIN },
  });
  assert.deepEqual(valid, []);

  const invalid = validateQaIsolation({
    test: {
      NEXT_PUBLIC_SUPABASE_URL: "https://jjfktbgfwvekhlvyjlww.supabase.co",
      PLAYWRIGHT_QA_PROJECT_REF: "jjfktbgfwvekhlvyjlww",
    },
    flutterQa: {
      APP_FLAVOR: "qa",
      API_BASE_URL: QA_API_ORIGIN,
      SUPABASE_SERVICE_ROLE_KEY: "forbidden",
    },
  });
  assert.ok(invalid.length >= 3);
});

test("portable bundle rebuilds profiles from a disposable workstation fixture", async () => {
  const fixture = await mkdtemp(
    path.join(os.tmpdir(), "company-hub-portable-test-"),
  );
  const credentials = path.join(fixture, "external-credentials");
  await mkdir(credentials);
  const oauthPath = path.join(credentials, "oauth.json");
  const serviceAccountPath = path.join(credentials, "service-account.json");
  await writeFile(
    oauthPath,
    JSON.stringify({
      installed: { client_id: "synthetic", client_secret: "synthetic" },
    }),
  );
  await writeFile(
    serviceAccountPath,
    JSON.stringify({ type: "service_account", private_key: "synthetic" }),
  );
  await writeFile(
    path.join(fixture, ".env.local"),
    [
      "NEXT_PUBLIC_APP_URL=http://localhost:3000",
      "NEXT_PUBLIC_SUPABASE_URL=https://development-ref.supabase.co",
      "SUPABASE_SERVICE_ROLE_KEY=synthetic-development-service-role",
    ].join("\n"),
  );
  await writeFile(
    path.join(fixture, ".env.development.local"),
    [
      `GOOGLE_DRIVE_OAUTH_CLIENT_FILE=${oauthPath}`,
      `GOOGLE_SERVICE_ACCOUNT_KEY_FILE=${serviceAccountPath}`,
      "UNRELATED_SECRET=must-not-port",
    ].join("\n"),
  );
  await writeFile(
    path.join(fixture, ".env.test.local"),
    [
      `NEXT_PUBLIC_SUPABASE_URL=https://${QA_SUPABASE_PROJECT_REF}.supabase.co`,
      `PLAYWRIGHT_QA_PROJECT_REF=${QA_SUPABASE_PROJECT_REF}`,
    ].join("\n"),
  );

  try {
    const bundle = parsePortableBundle(
      JSON.stringify(createPortableBundle(fixture)),
    );
    assert.equal("UNRELATED_SECRET" in bundle.development, false);
    assert.equal(bundle.development.GOOGLE_DRIVE_OAUTH_CLIENT_FILE, undefined);
    assert.equal(bundle.development.GOOGLE_SERVICE_ACCOUNT_KEY_FILE, undefined);
    assert.equal(
      bundle.test.PLAYWRIGHT_QA_PROJECT_REF,
      QA_SUPABASE_PROJECT_REF,
    );
    assert.equal(
      bundle.credentials.googleDriveOAuthClient?.installed instanceof Object,
      true,
    );
    assert.equal(
      bundle.credentials.googleServiceAccount?.type,
      "service_account",
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
