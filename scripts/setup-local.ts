import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { mergeKnownConfiguration, parseDotEnv } from "./local-config-core";
import { runDoctor } from "./local-config-doctor";

const DESTINATION = path.join(process.cwd(), ".env.development.local");

function argumentValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function readSource() {
  const sourcePath = argumentValue("--source");
  const sopsPath = argumentValue("--sops");
  if (sourcePath && sopsPath) {
    throw new Error("Choose either --source or --sops, not both.");
  }
  if (sourcePath) {
    if (!existsSync(sourcePath))
      throw new Error("The local config source is missing.");
    return readFile(sourcePath, "utf8");
  }
  if (sopsPath) {
    if (!existsSync(sopsPath))
      throw new Error("The encrypted config source is missing.");
    const result = spawnSync(
      "sops",
      ["--decrypt", "--output-type", "dotenv", sopsPath],
      { encoding: "utf8", windowsHide: true },
    );
    if (result.status !== 0 || !result.stdout) {
      throw new Error(
        "SOPS decryption failed. Install sops and configure its external age/KMS unlock credential.",
      );
    }
    return result.stdout;
  }
  return null;
}

async function main() {
  const source = await readSource();
  if (source !== null) {
    const existing = existsSync(DESTINATION)
      ? await readFile(DESTINATION, "utf8")
      : "";
    const merged = mergeKnownConfiguration(
      existing,
      parseDotEnv(source),
      process.argv.includes("--replace"),
    );
    await writeFile(DESTINATION, merged, { encoding: "utf8", mode: 0o600 });
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
