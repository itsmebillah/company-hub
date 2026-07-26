import { readFile, writeFile } from "node:fs/promises";

const requiredEnvironment = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RELEASE_COMMIT_SHA",
  "RELEASE_DEPLOYMENT_ID",
];

for (const name of requiredEnvironment) {
  if (!process.env[name])
    throw new Error(`Missing required environment: ${name}`);
}

const packageMetadata = JSON.parse(await readFile("package.json", "utf8"));
const version = packageMetadata.version;
const changelog = await readFile("CHANGELOG.md", "utf8");
const escapedVersion = version.replace(/\./g, "\\.");
const versionMatch = changelog.match(
  new RegExp(`## \\[${escapedVersion}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## \\[|$)`),
);

if (!versionMatch) {
  throw new Error(`CHANGELOG.md has no section for version ${version}.`);
}

const section = versionMatch[1].trim();
const groups = { added: [], fixed: [], improved: [], breaking: [] };
let currentGroup = "improved";

for (const line of section.split(/\r?\n/)) {
  const heading = line.match(/^###\s+(.+)/)?.[1]?.toLowerCase();
  if (heading) {
    currentGroup = heading.includes("add")
      ? "added"
      : heading.includes("fix") || heading.includes("security")
        ? "fixed"
        : heading.includes("break")
          ? "breaking"
          : "improved";
    continue;
  }
  const bullet = line.match(/^[-*]\s+(.+)/)?.[1];
  if (bullet) groups[currentGroup].push(bullet);
}

const [major, minor, patch] = version.split(".").map(Number);
const releaseType =
  process.env.RELEASE_TYPE ||
  (major > 0 && minor === 0 && patch === 0
    ? "major"
    : patch === 0
      ? "minor"
      : "patch");
const title = process.env.RELEASE_TITLE || `Company Hub v${version}`;
const releaseNotes = `# ${title}\n\n${section}\n`;
const notesPath = ".release-notes.md";
await writeFile(notesPath, releaseNotes, "utf8");

const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/platform_releases?on_conflict=version`;
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  },
  body: JSON.stringify({
    version,
    title,
    description:
      process.env.RELEASE_DESCRIPTION ||
      `Production release ${version} passed all automated quality gates.`,
    release_type: releaseType,
    whats_new: groups.added,
    bug_fixes: groups.fixed,
    improvements: groups.improved,
    breaking_changes: groups.breaking,
    requires_update: process.env.RELEASE_REQUIRES_UPDATE === "true",
    show_popup: true,
    published_at: new Date().toISOString(),
    commit_sha: process.env.RELEASE_COMMIT_SHA,
    deployment_id: process.env.RELEASE_DEPLOYMENT_ID,
    status: "published",
    release_notes: section,
  }),
});

if (!response.ok) {
  throw new Error(
    `Release history update failed with HTTP ${response.status}.`,
  );
}

if (process.env.GITHUB_OUTPUT) {
  await writeFile(
    process.env.GITHUB_OUTPUT,
    `version=${version}\ntitle=${title}\nnotes_path=${notesPath}\n`,
    { flag: "a" },
  );
}

console.log(`Published Company Hub release ${version}.`);
