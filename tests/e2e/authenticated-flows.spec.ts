import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.setTimeout(120_000);

type TestAccounts = {
  adminEmployeeId: string;
  employeeEmployeeId: string;
};

type EmployeeCredentialRow = {
  employee_id: string;
  role_id: string;
};

const adminRoutes = [
  "/admin/dashboard",
  "/admin/users",
  "/admin/users/hierarchy",
  "/admin/users/import",
  "/admin/attendance",
  "/admin/attendance/reports",
  "/admin/leave/requests",
  "/admin/leave/types",
  "/admin/resources",
  "/admin/resources/categories",
  "/admin/resources/permissions",
  "/admin/announcements",
  "/admin/calendar",
  "/admin/company",
  "/admin/company/locations",
  "/admin/roles",
  "/admin/settings",
  "/admin/settings/attendance",
] as const;

const employeeRoutes = [
  "/dashboard",
  "/attendance",
  "/leave",
  "/announcements",
  "/calendar",
  "/resources",
  "/profile",
  "/settings",
] as const;

const responsiveWidths = [320, 360, 375, 390, 414, 768, 1024] as const;

let supabase: SupabaseClient;
let accounts: TestAccounts;

async function signIn(page: Page, employeeId: string) {
  await page.goto("/login");
  await page.locator("#employee-id").fill(employeeId);
  await page.locator("#password").fill(employeeId);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).not.toHaveURL(/\/login$/);
  await dismissOnboarding(page);
}

async function dismissOnboarding(page: Page) {
  const closeOnboarding = page.getByRole("button", {
    name: "Close permission onboarding",
  });

  if (await closeOnboarding.isVisible()) {
    await closeOnboarding.click();
  }
}

test.beforeAll(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase test environment is not configured.");
  }

  supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const [
    { data: employees, error: employeeError },
    { data: roles, error: roleError },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("employee_id, role_id")
      .eq("status", "active")
      .not("auth_user_id", "is", null),
    supabase.from("roles").select("id, name").eq("status", "active"),
  ]);

  if (employeeError || roleError) {
    throw new Error("Unable to load QA login accounts.");
  }

  const rows = (employees ?? []) as EmployeeCredentialRow[];
  const adminRoleIds = new Set(
    (roles ?? [])
      .filter((role) => role.name === "Admin")
      .map((role) => role.id),
  );
  const admin = rows.find((row) => adminRoleIds.has(row.role_id));
  const employee = rows.find((row) => !adminRoleIds.has(row.role_id));

  if (!admin || !employee) {
    throw new Error("Admin and employee QA accounts are required.");
  }

  accounts = {
    adminEmployeeId: admin.employee_id,
    employeeEmployeeId: employee.employee_id,
  };
});

test("admin login, session restore, routes, and authorization work", async ({
  page,
}) => {
  await signIn(page, accounts.adminEmployeeId);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await page.reload();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);

  for (const route of adminRoutes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("body"), route).not.toContainText(
      "Application error",
    );
  }

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/admin\/dashboard$/);

  const exportStatus = await page.evaluate(async () => {
    const response = await fetch("/admin/users/export");
    return {
      status: response.status,
      contentType: response.headers.get("content-type"),
    };
  });
  expect(exportStatus.status).toBe(200);
  expect(exportStatus.contentType).toContain("text/csv");
});

test("employee login, session restore, routes, and authorization work", async ({
  page,
}) => {
  await signIn(page, accounts.employeeEmployeeId);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);

  for (const route of employeeRoutes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("body"), route).not.toContainText(
      "Application error",
    );
  }

  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await dismissOnboarding(page);
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("admin and employee layouts do not overflow at supported widths", async ({
  browser,
}) => {
  const adminContext = await browser.newContext();
  const employeeContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  const employeePage = await employeeContext.newPage();

  try {
    await signIn(adminPage, accounts.adminEmployeeId);
    await signIn(employeePage, accounts.employeeEmployeeId);

    for (const width of responsiveWidths) {
      const height = width < 768 ? 844 : 900;
      await Promise.all([
        adminPage.setViewportSize({ width, height }),
        employeePage.setViewportSize({ width, height }),
      ]);
      await Promise.all([
        adminPage.goto("/admin/users", { waitUntil: "domcontentloaded" }),
        employeePage.goto("/attendance", { waitUntil: "domcontentloaded" }),
      ]);

      for (const page of [adminPage, employeePage]) {
        const metrics = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(metrics.scrollWidth, `${width}px`).toBeLessThanOrEqual(
          metrics.clientWidth + 1,
        );
      }
    }
  } finally {
    await Promise.all([adminContext.close(), employeeContext.close()]);
  }
});

test("attendance accepts a phone-sized image and rejects oversized files", async ({
  page,
}) => {
  await signIn(page, accounts.employeeEmployeeId);
  await page.goto("/attendance");
  const input = page.locator('input[type="file"][capture="user"]');

  await input.setInputFiles({
    name: "attendance-selfie.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(2 * 1024 * 1024, 1),
  });
  await expect(page.getByAltText("Attendance selfie preview")).toBeVisible();

  await input.setInputFiles({
    name: "attendance-selfie-too-large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 1),
  });
  await expect(
    page.getByText("Selfie image must be 5 MB or smaller."),
  ).toBeVisible();
});

test("attendance storage accepts and removes a real image object", async () => {
  const objectPath = `__qa__/${crypto.randomUUID()}.png`;

  try {
    const { data: bucket, error: bucketError } =
      await supabase.storage.getBucket("attendance-selfies");
    expect(bucketError).toBeNull();
    expect(bucket?.public).toBe(false);

    const { error: uploadError } = await supabase.storage
      .from("attendance-selfies")
      .upload(objectPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), {
        contentType: "image/png",
        upsert: false,
      });
    expect(uploadError).toBeNull();

    const { data, error: downloadError } = await supabase.storage
      .from("attendance-selfies")
      .download(objectPath);
    expect(downloadError).toBeNull();
    expect(data?.size).toBe(8);
  } finally {
    const { error: removeError } = await supabase.storage
      .from("attendance-selfies")
      .remove([objectPath]);
    expect(removeError).toBeNull();
  }
});

test("Supabase Realtime accepts a channel subscription", async () => {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      void supabase.removeChannel(channel);
      reject(new Error("Realtime subscription timed out."));
    }, 10_000);
    const channel = supabase.channel(`qa-${crypto.randomUUID()}`);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timeout);
        void supabase.removeChannel(channel).then(() => resolve());
      }
    });
  });
});

test("primary authenticated pages have no automated WCAG A/AA violations", async ({
  browser,
}) => {
  const adminContext = await browser.newContext();
  const employeeContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  const employeePage = await employeeContext.newPage();

  try {
    await signIn(adminPage, accounts.adminEmployeeId);
    await signIn(employeePage, accounts.employeeEmployeeId);

    for (const page of [adminPage, employeePage]) {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    }

    await employeePage.goto("/attendance", { waitUntil: "networkidle" });
    await dismissOnboarding(employeePage);
    const attendanceResults = await new AxeBuilder({ page: employeePage })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(attendanceResults.violations).toEqual([]);
  } finally {
    await Promise.all([adminContext.close(), employeeContext.close()]);
  }
});
