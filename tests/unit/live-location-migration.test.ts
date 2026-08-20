import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/0045_duty_bound_live_location_core.sql",
  ),
  "utf8",
);

test("0045 limits supervisor access to direct reports", () => {
  assert.match(migration, /target\.manager_id = caller\.id/);
  assert.doesNotMatch(migration, /with\s+recursive/i);
  assert.doesNotMatch(migration, /manager_path|descendant/i);
});

test("0045 keeps point writes trusted and history immutable", () => {
  assert.match(
    migration,
    /grant insert, select on table public\.location_history to service_role/,
  );
  assert.doesNotMatch(
    migration,
    /grant\s+insert[^;]*location_history[^;]*authenticated/i,
  );
  assert.match(migration, /Location history is immutable/);
});

test("0045 binds points to active attendance-backed sessions", () => {
  assert.match(
    migration,
    /foreign key \(attendance_record_id, company_id, employee_id\)/,
  );
  assert.match(migration, /target_session\.status <> 'active'/);
  assert.match(migration, /Location point requires an active duty session/);
  assert.match(migration, /location_history_idempotency_unique/);
});

test("0045 enables RLS for every tracking table", () => {
  for (const table of [
    "location_tracking_sessions",
    "location_history",
    "employee_current_locations",
  ]) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${table} enable row level security`),
    );
  }
});
