import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/0048_employee_notification_devices.sql"), "utf8");
const service = readFileSync(join(process.cwd(), "features/mobile-api/services/mobile-notification-device.service.ts"), "utf8");
const parser = readFileSync(join(process.cwd(), "features/mobile-api/services/mobile-request.service.ts"), "utf8");

test("FCM device tokens are employee/company scoped and uniquely upsertable", () => {
  assert.match(migration, /employee_id uuid not null/);
  assert.match(migration, /company_id uuid not null/);
  assert.match(migration, /unique \(token\)/);
  assert.match(service, /upsert/);
  assert.match(service, /onConflict: "token"/);
});

test("device token API rejects client-supplied identity and non-Android payloads", () => {
  assert.match(parser, /assertOnlyKeys\(value, \["token", "platform"\]\)/);
  assert.match(parser, /value\.platform !== "android"/);
  assert.doesNotMatch(parser, /employeeId.*companyId/);
});

test("device token RLS permits only the authenticated employee", () => {
  assert.match(migration, /employee\.auth_user_id = auth\.uid\(\)/);
  assert.match(migration, /for all/);
  assert.match(migration, /with check \(public\.can_manage_own_notification_device/);
});