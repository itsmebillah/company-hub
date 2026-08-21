import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/0046_location_ingestion_rate_limits.sql",
  ),
  "utf8",
);

test("0046 uses distributed transactional coordination", () => {
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /on conflict \(scope_key, window_started_at\) do update/);
  assert.match(migration, /location-company:/);
  assert.match(migration, /location-session:/);
});

test("0046 keeps counters private and coordinate-free", () => {
  assert.match(
    migration,
    /alter table public\.location_ingestion_rate_limits enable row level security/,
  );
  assert.match(
    migration,
    /revoke all on table public\.location_ingestion_rate_limits[\s\S]*authenticated/,
  );
  assert.doesNotMatch(migration, /latitude|longitude|accuracy_meters/);
});

test("0046 validates active attendance and cleans closed sessions", () => {
  assert.match(migration, /attendance\.check_out is null/);
  assert.match(migration, /tracking_session\.status = 'active'/);
  assert.match(migration, /cleanup_closed_location_session_rate_limits_trigger/);
});
