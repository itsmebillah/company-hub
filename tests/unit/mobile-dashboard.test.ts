import assert from "node:assert/strict";
import test from "node:test";

import {
  toMobileDashboard,
  toMobileDashboardFeatures,
} from "@/features/mobile-api/services/mobile-dashboard.mapper";
import type { MobileAuthContext } from "@/features/mobile-api/types/mobile-api.types";
import type { FeatureDefinition } from "@/features/platform-control/types/platform.types";
import type { User } from "@supabase/supabase-js";

const context: MobileAuthContext = {
  user: { id: "auth-user" } as User,
  employee: {
    id: "employee-row-id",
    employeeId: "EMP-1001",
    name: "Mobile Tester",
    companyId: "company-row-id",
    roleId: "role-row-id",
    roleName: "Employee",
    managerId: null,
    status: "active",
  },
};

function feature(
  key: FeatureDefinition["key"],
  effectiveState: FeatureDefinition["effectiveState"],
): FeatureDefinition {
  return {
    key,
    name: key,
    description: "Test feature",
    state: "enabled",
    companyState: "inherit",
    allowCompanyOverride: true,
    companyConfigurable: true,
    effectiveState,
    displayOrder: 1,
  };
}

test("mobile dashboard feature flags expose effective availability only", () => {
  assert.deepEqual(
    toMobileDashboardFeatures([
      feature("attendance", "enabled"),
      feature("quick_links", "disabled"),
      feature("notifications", "enabled"),
    ]),
    [
      { key: "attendance", enabled: true },
      { key: "quick_links", enabled: false },
      { key: "notifications", enabled: true },
    ],
  );
});

test("mobile dashboard response contains only safe profile and feature fields", () => {
  const previousSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

  try {
    const dashboard = toMobileDashboard({
      context,
      employee: {
        id: "employee-row-id",
        employee_id: "EMP-1001",
        name: "Mobile Tester",
        company_id: "company-row-id",
        status: "active",
        photo_url: "company/EMP-1001/avatar.png",
      },
      settings: { company_name: "Company Hub QA" },
      features: [
        feature("attendance", "enabled"),
        feature("announcements", "disabled"),
      ],
    });

    assert.deepEqual(dashboard.enabledFeatureKeys, ["attendance"]);
    assert.deepEqual(dashboard.profile, {
      employeeId: "EMP-1001",
      name: "Mobile Tester",
      companyId: "company-row-id",
      roleName: "Employee",
      companyName: "Company Hub QA",
      photoUrl:
        "https://example.supabase.co/storage/v1/object/public/profile-photos/company/EMP-1001/avatar.png",
    });
    assert.deepEqual(dashboard.features, [
      { key: "attendance", enabled: true },
      { key: "announcements", enabled: false },
    ]);
    assert.equal("accessToken" in dashboard, false);
    assert.equal("refreshToken" in dashboard, false);
    assert.equal("roleId" in dashboard.profile, false);
    assert.equal("authUserId" in dashboard.profile, false);
  } finally {
    if (previousSupabaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousSupabaseUrl;
    }
  }
});

test("mobile dashboard profile falls back to Company Hub without settings", () => {
  const dashboard = toMobileDashboard({
    context,
    employee: {
      id: "employee-row-id",
      employee_id: "EMP-1001",
      name: "Mobile Tester",
      company_id: "company-row-id",
      status: "active",
      photo_url: null,
    },
    settings: null,
    features: [],
  });

  assert.equal(dashboard.profile.companyName, "Company Hub");
  assert.equal(dashboard.profile.photoUrl, null);
});
