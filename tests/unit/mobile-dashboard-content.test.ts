import assert from "node:assert/strict";
import test from "node:test";

import { isAnnouncementVisibleToEmployee } from "@/features/announcements/services/announcement-audience.service";
import { isAllowedResource } from "@/features/employee-resources/services/employee-resource-visibility";
import {
  mobileDashboardSection,
  toMobileAnnouncements,
  toMobileNotifications,
  toMobileQuickLinks,
  toMobileToday,
} from "@/features/mobile-api/services/mobile-dashboard.mapper";

test("Quick Links preserve featured order and reject non-HTTP destinations", () => {
  const previousSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  try {
    const links = toMobileQuickLinks([
      {
        id: "category-a",
        name: "Tools",
        icon: "link",
        color: "#2563EB",
        resources: [
          {
            id: "regular",
            title: "Regular",
            description: "Regular tool",
            resourceType: "website",
            url: "mailto:test@example.com",
            icon: "link",
            thumbnail: "",
            openMode: "same_tab",
            isFeatured: false,
          },
          {
            id: "featured",
            title: "Featured",
            description: "Featured tool",
            resourceType: "website",
            url: "https://tools.example.com",
            icon: "star",
            thumbnail: "company/tool.png",
            openMode: "new_tab",
            isFeatured: true,
          },
        ],
      },
    ]);

    assert.deepEqual(
      links.map((link) => link.id),
      ["featured", "regular"],
    );
    assert.equal(links[0]?.url, "https://tools.example.com");
    assert.equal(
      links[0]?.thumbnailUrl,
      "https://example.supabase.co/storage/v1/object/public/resource-icons/company/tool.png",
    );
    assert.equal(links[1]?.url, null);
  } finally {
    if (previousSupabaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousSupabaseUrl;
    }
  }
});

test("resource permissions preserve public, role, and employee visibility", () => {
  const employee = { id: "employee-a", role_id: "role-a" };
  assert.equal(
    isAllowedResource(
      "resource-a",
      [
        {
          resource_id: "resource-a",
          permission_type: "public",
          role_id: null,
          employee_id: null,
        },
      ],
      employee,
    ),
    true,
  );
  assert.equal(
    isAllowedResource(
      "resource-a",
      [
        {
          resource_id: "resource-a",
          permission_type: "role",
          role_id: "role-b",
          employee_id: null,
        },
      ],
      employee,
    ),
    false,
  );
  assert.equal(
    isAllowedResource(
      "resource-a",
      [
        {
          resource_id: "resource-a",
          permission_type: "employee",
          role_id: null,
          employee_id: "employee-a",
        },
      ],
      employee,
    ),
    true,
  );
});

test("announcement visibility preserves company, role, and employee targeting", () => {
  const employee = { id: "employee-a", role_id: "role-a" };
  assert.equal(
    isAnnouncementVisibleToEmployee(
      "company",
      { roleIds: [], employeeIds: [] },
      employee,
    ),
    true,
  );
  assert.equal(
    isAnnouncementVisibleToEmployee(
      "roles",
      { roleIds: ["role-b"], employeeIds: [] },
      employee,
    ),
    false,
  );
  assert.equal(
    isAnnouncementVisibleToEmployee(
      "employees",
      { roleIds: [], employeeIds: ["employee-a"] },
      employee,
    ),
    true,
  );
});

test("announcement preview is bounded and excludes audience identifiers", () => {
  const announcements = Array.from({ length: 6 }, (_, index) => ({
    id: `announcement-${index}`,
    title: `Announcement ${index}`,
    description: "Visible update",
    bannerUrl: "",
    priority: "normal" as const,
    publishFrom: "2026-08-26T08:00:00.000Z",
    publishUntil: "",
    status: "active" as const,
    targetAudience: "employees" as const,
    roleIds: ["private-role"],
    employeeIds: ["private-employee"],
    createdAt: "2026-08-26T08:00:00.000Z",
    updatedAt: "2026-08-26T08:00:00.000Z",
  }));
  const result = toMobileAnnouncements(announcements);
  assert.equal(result.length, 5);
  assert.equal("roleIds" in result[0]!, false);
  assert.equal("employeeIds" in result[0]!, false);
});

test("notification summary preserves unread state without exposing scope identifiers", () => {
  const result = toMobileNotifications({
    unreadCount: 1,
    latest: [
      {
        id: "notification-a",
        type: "system",
        priority: "normal",
        title: "Update",
        message: "Visible to the authenticated employee.",
        actionUrl: null,
        isRead: false,
        browserEnabled: true,
        realtimeEnabled: true,
        nativeEnabled: false,
        deliveryStatus: "queued",
        deliveredAt: null,
        openedAt: null,
        createdAt: "2026-08-26T08:00:00.000Z",
      },
    ],
  });
  assert.equal(result.unreadCount, 1);
  assert.equal(result.items[0]?.isRead, false);
  assert.equal("employeeId" in result.items[0]!, false);
  assert.equal("companyId" in result.items[0]!, false);
  assert.equal("actionUrl" in result.items[0]!, false);
});

test("today content includes only the authenticated employee celebration", () => {
  const result = toMobileToday({
    day: {
      date: "2026-08-26",
      status: "holiday",
      title: "Company Holiday",
      events: [],
    },
    employeeCode: "EMP-001",
    celebrations: {
      birthdays: [
        {
          employeeId: "row-a",
          employeeCode: "EMP-001",
          employeeName: "Current Employee",
          eventType: "birthday",
          sourceDate: "2000-08-26",
          yearsCompleted: null,
        },
        {
          employeeId: "row-b",
          employeeCode: "EMP-002",
          employeeName: "Other Employee",
          eventType: "birthday",
          sourceDate: "2000-08-26",
          yearsCompleted: null,
        },
      ],
      workAnniversaries: [],
    },
  });
  assert.equal(result.status, "holiday");
  assert.equal(result.celebrations.length, 1);
  assert.equal(result.celebrations[0]?.title, "Happy birthday!");
});

test("section state distinguishes disabled, empty, and failed data", () => {
  assert.equal(
    mobileDashboardSection({ enabled: false, data: [] }).status,
    "disabled",
  );
  assert.equal(
    mobileDashboardSection({ enabled: true, data: [] }).status,
    "ready",
  );
  assert.equal(
    mobileDashboardSection({ enabled: true, failed: true, data: [] }).status,
    "error",
  );
});
