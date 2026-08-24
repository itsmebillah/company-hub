import { spawnSync } from "node:child_process";

function argumentValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function run(command: string, args: string[], label: string, cwd?: string) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    windowsHide: true,
    cwd,
  });
  if (result.status !== 0) throw new Error(`${label} failed.`);
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function main() {
  const bundle = argumentValue("--bundle");
  if (!bundle) {
    throw new Error(
      "Provide the externally stored encrypted bundle with --bundle.",
    );
  }
  const setupArguments = ["run", "setup:local", "--", "--bundle", bundle];
  const credentialsDirectory = argumentValue("--credentials-dir");
  if (credentialsDirectory) {
    setupArguments.push("--credentials-dir", credentialsDirectory);
  }
  if (process.argv.includes("--replace")) setupArguments.push("--replace");

  run(npmCommand(), setupArguments, "Local secret import");
  run(npmCommand(), ["run", "validate:environment"], "Environment validation");
  run(
    "flutter",
    ["pub", "get"],
    "Flutter dependency installation",
    "clients/employee_android",
  );
  console.log("workstation_bootstrap=PASS");
  console.log("secrets_printed=NO");
}

try {
  main();
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Workstation bootstrap failed safely.",
  );
  process.exitCode = 1;
}
