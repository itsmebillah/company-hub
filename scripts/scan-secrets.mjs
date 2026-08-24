import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";

const trackedChanges = execFileSync(
  "git",
  ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"],
  { encoding: "utf8" },
);
const untracked = execFileSync(
  "git",
  ["ls-files", "--others", "--exclude-standard"],
  { encoding: "utf8" },
);
const files = [...new Set(`${trackedChanges}\n${untracked}`.split(/\r?\n/))]
  .filter(Boolean)
  .filter((file) => file !== "scripts/scan-secrets.mjs")
  .filter((file) => existsSync(file) && statSync(file).isFile());

const patterns = [
  [
    "private_key",
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]{0,500}?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  ],
  ["google_api_key", /AIza[0-9A-Za-z_-]{30,}/],
  ["google_oauth_refresh", /1\/\/[0-9A-Za-z_-]{20,}/],
  ["github_token", /gh[pousr]_[0-9A-Za-z]{30,}/],
  ["jwt", /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/],
  ["database_uri", /postgres(?:ql)?:\/\/[^\s:'"]+:[^\s@'"]+@[^\s'"]+/],
];
const safeFixture = /synthetic|placeholder|your-|replace|example|changeme/i;
const findings = [];

for (const file of files) {
  let contents;
  try {
    contents = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const [category, pattern] of patterns) {
    const match = contents.match(pattern);
    if (match && !safeFixture.test(match[0])) findings.push({ file, category });
  }
}

for (const finding of findings) {
  console.error(`SECRET_PATTERN ${finding.category} ${finding.file}`);
}
console.log(findings.length === 0 ? "secret_scan=PASS" : "secret_scan=FAIL");
if (findings.length > 0) process.exitCode = 1;
