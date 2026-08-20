import assert from "node:assert/strict";
import test from "node:test";

import {
  getOAuthProjectNumber,
  isActualValue,
  mergeKnownConfiguration,
  parseDotEnv,
} from "../../scripts/local-config-core";

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
