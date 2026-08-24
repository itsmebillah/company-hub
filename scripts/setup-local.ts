import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  LOCAL_CONFIGURATION_KEYS,
  mergeKnownConfiguration,
  parseDotEnv,
} from "./local-config-core";
import { runDoctor } from "./local-config-doctor";
import { materializePortableBundle } from "./portable-config-io";
import {
  isPathInside,
  parsePortableBundle,
  resolvePortableExecutable,
} from "./portable-config-core";

const DESTINATION = path.join(process.cwd(), ".env.development.local");

function argumentValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function decryptWithSops(filePath: string, outputType: "dotenv" | "json") {
  const result = spawnSync(
    resolvePortableExecutable("sops"),
    ["--decrypt", "--output-type", outputType, filePath],
    { encoding: "utf8", windowsHide: true },
  );
  if (result.status !== 0 || !result.stdout) {
    throw new Error(
      "SOPS decryption failed. Install sops and configure its external age/KMS unlock credential.",
    );
  }
  return result.stdout;
}

async function readSource() {
  const sourcePath = argumentValue("--source");
  const sopsPath = argumentValue("--sops");
  const bundlePath = argumentValue("--bundle");
  if ([sourcePath, sopsPath, bundlePath].filter(Boolean).length > 1) {
    throw new Error("Choose one of --source, --sops, or --bundle.");
  }
  if (sourcePath) {
    if (!existsSync(sourcePath))
      throw new Error("The local config source is missing.");
    return {
      kind: "dotenv" as const,
      contents: await readFile(sourcePath, "utf8"),
    };
  }
  if (sopsPath) {
    if (!existsSync(sopsPath))
      throw new Error("The encrypted config source is missing.");
    return {
      kind: "dotenv" as const,
      contents: decryptWithSops(sopsPath, "dotenv"),
    };
  }
  if (bundlePath) {
    if (!existsSync(bundlePath))
      throw new Error("The encrypted portable bundle is missing.");
    if (isPathInside(process.cwd(), bundlePath)) {
      throw new Error(
        "The encrypted portable bundle must remain outside the repository.",
      );
    }
    return {
      kind: "bundle" as const,
      bundle: parsePortableBundle(decryptWithSops(bundlePath, "json")),
    };
  }
  return null;
}

function defaultCredentialsDirectory() {
  return path.join(
    process.env.LOCALAPPDATA ?? path.join(os.homedir(), ".company-hub"),
    "CompanyHub",
    "credentials",
  );
}

async function writeEnvironmentFile(
  destination: string,
  source: Record<string, string | undefined>,
  keys: readonly string[],
) {
  const existing = existsSync(destination)
    ? await readFile(destination, "utf8")
    : "";
  await writeFile(
    destination,
    mergeKnownConfiguration(
      existing,
      source,
      process.argv.includes("--replace"),
      keys,
    ),
    { encoding: "utf8", mode: 0o600 },
  );
}

async function main() {
  const source = await readSource();
  if (source !== null) {
    if (source.kind === "bundle") {
      await materializePortableBundle({
        bundle: source.bundle,
        repositoryRoot: process.cwd(),
        credentialsDirectory:
          argumentValue("--credentials-dir") ?? defaultCredentialsDirectory(),
        replaceExisting: process.argv.includes("--replace"),
      });
    } else {
      await writeEnvironmentFile(
        DESTINATION,
        parseDotEnv(source.contents),
        LOCAL_CONFIGURATION_KEYS,
      );
    }
    console.log("CONFIGURED local.ignored_environment");
    console.log(
      "Imported allowlisted configuration without displaying values.",
    );
  }
  const result = await runDoctor();
  if (!result.configured) process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Local setup failed safely.",
  );
  process.exitCode = 1;
});
