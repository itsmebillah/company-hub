import { lookup } from "node:dns/promises";
import { connect } from "node:net";

const rawUrl = process.env.SUPABASE_DB_URL;
const expectedProjectRef = process.env.SUPABASE_PROJECT_REF;

function fail(message) {
  console.error(`Supabase database URL validation failed: ${message}`);
  process.exit(1);
}

if (!rawUrl || !expectedProjectRef) {
  fail("required configuration is missing.");
}

if (rawUrl !== rawUrl.trim()) {
  fail("the secret contains leading or trailing whitespace.");
}

let databaseUrl;

try {
  databaseUrl = new URL(rawUrl);
} catch {
  fail("the secret is not a valid URL.");
}

if (!new Set(["postgres:", "postgresql:"]).has(databaseUrl.protocol)) {
  fail("the URI scheme must be postgres or postgresql.");
}

if (!databaseUrl.hostname.endsWith(".pooler.supabase.com")) {
  fail("use the Supabase Session pooler URI for GitHub-hosted runners.");
}

if (databaseUrl.port !== "5432") {
  fail("the Session pooler must use port 5432.");
}

if (
  decodeURIComponent(databaseUrl.username) !== `postgres.${expectedProjectRef}`
) {
  fail(
    "the pooler username does not match the authoritative project reference.",
  );
}

if (!databaseUrl.password) {
  fail("the database password is missing.");
}

if (
  /your.password|password|\[.*\]/i.test(
    decodeURIComponent(databaseUrl.password),
  )
) {
  fail("the database password still contains a placeholder.");
}

try {
  await lookup(databaseUrl.hostname);
} catch {
  fail("the pooler hostname cannot be resolved from the runner.");
}

await new Promise((resolve, reject) => {
  const socket = connect({ host: databaseUrl.hostname, port: 5432 });
  const timeout = setTimeout(() => {
    socket.destroy();
    reject(new Error("timeout"));
  }, 10_000);

  socket.once("connect", () => {
    clearTimeout(timeout);
    socket.destroy();
    resolve();
  });
  socket.once("error", (error) => {
    clearTimeout(timeout);
    reject(error);
  });
}).catch(() => {
  fail("the Session pooler is not reachable on port 5432.");
});

console.log("Supabase Session pooler configuration and reachability verified.");
