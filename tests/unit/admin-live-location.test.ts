import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  getLocationFreshness,
  mapAdminLiveLocations,
} from "@/features/live-location/services/admin-live-location.mapper";

const now = new Date("2026-08-26T12:00:00.000Z");

function queryResult() {
  return {
    locations: [
      {
        employee_id: "employee-a",
        observed_at: "2026-08-26T11:58:00.000Z",
        received_at: "2026-08-26T11:58:01.000Z",
        updated_at: "2026-08-26T11:58:01.000Z",
        accuracy_meters: 12,
        latitude: 23.81,
        longitude: 90.41,
      },
    ],
    employees: [
      {
        id: "employee-a",
        employee_id: "EMP-001",
        name: "Synthetic Employee",
        role_id: "role-a",
        company_id: "company-a",
      },
    ],
    roles: [{ id: "role-a", name: "Field Employee", company_id: "company-a" }],
  };
}

test("location freshness uses bounded latest-point semantics", () => {
  assert.equal(getLocationFreshness("2026-08-26T11:58:00.000Z", now), "fresh");
  assert.equal(getLocationFreshness("2026-08-26T11:45:00.000Z", now), "recent");
  assert.equal(getLocationFreshness("2026-08-26T11:20:00.000Z", now), "stale");
});

test("latest locations are mapped with employee and role labels", () => {
  const locations = mapAdminLiveLocations(queryResult(), now);
  assert.deepEqual(locations[0], {
    employeeId: "employee-a",
    employeeCode: "EMP-001",
    employeeName: "Synthetic Employee",
    roleName: "Field Employee",
    observedAt: "2026-08-26T11:58:00.000Z",
    receivedAt: "2026-08-26T11:58:01.000Z",
    updatedAt: "2026-08-26T11:58:01.000Z",
    freshness: "fresh",
    accuracyMeters: 12,
    latitude: 23.81,
    longitude: 90.41,
  });
});

test("database authorization keeps company, self, and direct-manager boundaries", () => {
  const migration = readFileSync(
    join(
      process.cwd(),
      "supabase/migrations/0045_duty_bound_live_location_core.sql",
    ),
    "utf8",
  );
  assert.match(migration, /caller\.company_id = target\.company_id/);
  assert.match(migration, /caller\.id = target\.id/);
  assert.match(migration, /target\.manager_id = caller\.id/);
  assert.match(migration, /public\.is_company_admin\(auth\.uid\(\)\)/);
  assert.match(
    migration,
    /public\.can_access_employee_location\(company_id, employee_id\)/,
  );
});
test("missing current-location rows produce an empty state", () => {
  assert.deepEqual(
    mapAdminLiveLocations({ locations: [], employees: [], roles: [] }, now),
    [],
  );
});
