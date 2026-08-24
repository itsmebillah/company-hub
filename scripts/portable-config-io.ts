import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  LOCAL_CONFIGURATION_KEYS,
  QA_CONFIGURATION_KEYS,
  mergeKnownConfiguration,
} from "./local-config-core";
import { isPathInside, type PortableBundle } from "./portable-config-core";

async function writeEnvironmentFile(
  destination: string,
  source: Record<string, string | undefined>,
  keys: readonly string[],
  replaceExisting: boolean,
) {
  const existing = existsSync(destination)
    ? await readFile(destination, "utf8")
    : "";
  const merged = mergeKnownConfiguration(
    existing,
    source,
    replaceExisting,
    keys,
  );
  await writeFile(destination, merged, { encoding: "utf8", mode: 0o600 });
}

export async function materializePortableBundle(input: {
  bundle: PortableBundle;
  repositoryRoot: string;
  credentialsDirectory: string;
  replaceExisting?: boolean;
}) {
  const repositoryRoot = path.resolve(input.repositoryRoot);
  const credentialsDirectory = path.resolve(input.credentialsDirectory);
  if (isPathInside(repositoryRoot, credentialsDirectory)) {
    throw new Error("Credential files must be stored outside the repository.");
  }
  await mkdir(credentialsDirectory, { recursive: true });
  const development = { ...input.bundle.development };
  if (input.bundle.credentials.googleDriveOAuthClient) {
    const oauthPath = path.join(
      credentialsDirectory,
      "google-drive-oauth-client.json",
    );
    await writeFile(
      oauthPath,
      JSON.stringify(input.bundle.credentials.googleDriveOAuthClient, null, 2),
      { encoding: "utf8", mode: 0o600 },
    );
    development.GOOGLE_DRIVE_OAUTH_CLIENT_FILE = oauthPath;
  }
  if (input.bundle.credentials.googleServiceAccount) {
    const serviceAccountPath = path.join(
      credentialsDirectory,
      "google-service-account.json",
    );
    await writeFile(
      serviceAccountPath,
      JSON.stringify(input.bundle.credentials.googleServiceAccount, null, 2),
      { encoding: "utf8", mode: 0o600 },
    );
    development.GOOGLE_SERVICE_ACCOUNT_KEY_FILE = serviceAccountPath;
  }

  await writeEnvironmentFile(
    path.join(repositoryRoot, ".env.local"),
    development,
    LOCAL_CONFIGURATION_KEYS,
    input.replaceExisting ?? false,
  );
  await writeEnvironmentFile(
    path.join(repositoryRoot, ".env.test.local"),
    input.bundle.test,
    QA_CONFIGURATION_KEYS,
    input.replaceExisting ?? false,
  );
}
