import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.setTimeout(120_000);

type TestAccounts = {
  adminEmployeeId: string;
  adminAuthUserId: string;
  employeeEmployeeId: string;
  companyId: string;
};

type EmployeeCredentialRow = {
  employee_id: string;
  role_id: string;
  company_id: string;
  auth_user_id: string;
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
  "/admin/settings/features",
  "/admin/audit",
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
      .select("employee_id, role_id, company_id, auth_user_id")
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
    adminAuthUserId: admin.auth_user_id,
    employeeEmployeeId: employee.employee_id,
    companyId: employee.company_id,
  };
});

test("explicit System Admin can use responsive platform routes", async ({
  page,
}) => {
  const { data: existing } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("auth_user_id", accounts.adminAuthUserId)
    .maybeSingle();
  let createdId: string | null = null;

  try {
    if (!existing) {
      const { data, error } = await supabase
        .from("platform_admins")
        .insert({
          auth_user_id: accounts.adminAuthUserId,
          display_name: "Platform QA Administrator",
        })
        .select("id")
        .single();
      expect(error).toBeNull();
      createdId = data?.id ?? null;
    }

    await signIn(page, accounts.adminEmployeeId);
    await expect(page).toHaveURL(/\/platform\/dashboard$/);

    for (const width of responsiveWidths) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      for (const route of [
        "/platform/dashboard",
        "/platform/companies",
        "/platform/features",
        "/platform/audit",
      ] as const) {
        const response = await page.goto(route, {
          waitUntil: "domcontentloaded",
        });
        expect(response?.status(), `${route} at ${width}px`).toBe(200);
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
        await expect(page.locator("body")).not.toContainText(
          "Application error",
        );
      }
    }

    const [csvExport, excelExport] = await Promise.all([
      page.request.get("/platform/audit/export?format=csv"),
      page.request.get("/platform/audit/export?format=xlsx"),
    ]);
    expect(csvExport.status()).toBe(200);
    expect(csvExport.headers()["content-type"]).toContain("text/csv");
    expect(excelExport.status()).toBe(200);
    expect(excelExport.headers()["content-type"]).toContain(
      "spreadsheetml.sheet",
    );
  } finally {
    if (createdId) {
      await supabase.from("platform_admins").delete().eq("id", createdId);
    }
  }
});

test("Quick Links render custom images, favicons, built-in icons, and clickable cards", async ({
  page,
}) => {
  const suffix = crypto.randomUUID();
  const categoryId = crypto.randomUUID();
  const customResourceId = crypto.randomUUID();
  const faviconResourceId = crypto.randomUUID();
  const fallbackResourceId = crypto.randomUUID();
  const placeholderResourceId = crypto.randomUUID();
  const imagePath = `${accounts.companyId}/resources/__qa__-${suffix}.png`;
  const resourceIds = [
    customResourceId,
    faviconResourceId,
    fallbackResourceId,
    placeholderResourceId,
  ];
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const faviconSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="#2563eb"/></svg>';

  try {
    const { data: categories, error: categoryLoadError } = await supabase
      .from("resource_categories")
      .select("display_order")
      .eq("company_id", accounts.companyId)
      .order("display_order", { ascending: false })
      .limit(1);
    expect(categoryLoadError).toBeNull();
    const categoryOrder = (categories?.[0]?.display_order ?? 0) + 100;

    const { error: uploadError } = await supabase.storage
      .from("resource-icons")
      .upload(imagePath, png, { contentType: "image/png", upsert: false });
    expect(uploadError).toBeNull();

    const { error: categoryError } = await supabase
      .from("resource_categories")
      .insert({
        id: categoryId,
        company_id: accounts.companyId,
        name: `QA Quick Links ${suffix}`,
        display_order: categoryOrder,
        status: "active",
      });
    expect(categoryError).toBeNull();

    const { error: resourceError } = await supabase.from("resources").insert([
      {
        id: customResourceId,
        company_id: accounts.companyId,
        category_id: categoryId,
        title: "QA custom visual",
        resource_type: "website",
        url: "/resources",
        icon: "book-open",
        thumbnail: imagePath,
        open_mode: "same_tab",
        display_order: 1,
        status: "active",
      },
      {
        id: faviconResourceId,
        company_id: accounts.companyId,
        category_id: categoryId,
        title: "QA favicon visual",
        resource_type: "website",
        url: "https://favicon.test/tool",
        icon: "globe-2",
        thumbnail: null,
        open_mode: "new_tab",
        display_order: 2,
        status: "active",
      },
      {
        id: fallbackResourceId,
        company_id: accounts.companyId,
        category_id: categoryId,
        title: "QA fallback visual",
        resource_type: "website",
        url: "/resources",
        icon: "shield-check",
        thumbnail: `${accounts.companyId}/resources/missing-${suffix}.png`,
        open_mode: "same_tab",
        display_order: 3,
        status: "active",
      },
      {
        id: placeholderResourceId,
        company_id: accounts.companyId,
        category_id: categoryId,
        title: "QA placeholder visual",
        resource_type: "website",
        url: "/resources",
        icon: null,
        thumbnail: null,
        open_mode: "same_tab",
        display_order: 4,
        status: "active",
      },
    ]);
    expect(resourceError).toBeNull();

    const { error: permissionError } = await supabase
      .from("resource_permissions")
      .insert(
        resourceIds.map((resourceId) => ({
          company_id: accounts.companyId,
          resource_id: resourceId,
          permission_type: "public",
          status: "active",
        })),
      );
    expect(permissionError).toBeNull();

    await page.route("https://favicon.test/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: faviconSvg,
      });
    });
    await signIn(page, accounts.employeeEmployeeId);
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await dismissOnboarding(page);

    const customLink = page.getByRole("link", {
      name: "Open QA custom visual",
    });
    const faviconLink = page.getByRole("link", {
      name: "Open QA favicon visual",
    });
    const fallbackLink = page.getByRole("link", {
      name: "Open QA fallback visual",
    });
    const placeholderLink = page.getByRole("link", {
      name: "Open QA placeholder visual",
    });

    await expect(customLink).toBeVisible();
    await expect(customLink.locator("[data-resource-visual]")).toHaveAttribute(
      "data-visual-source",
      "custom-image",
    );
    await expect(faviconLink.locator("[data-resource-visual]")).toHaveAttribute(
      "data-visual-source",
      "favicon",
    );
    await expect(
      fallbackLink.locator("[data-resource-visual]"),
    ).toHaveAttribute("data-visual-source", "built-in-icon");
    await expect(
      placeholderLink.locator("[data-resource-visual]"),
    ).toHaveAttribute("data-visual-source", "placeholder");

    for (const width of responsiveWidths) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      const layout = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(
        layout.scrollWidth,
        `${width}px Quick Links overflow`,
      ).toBeLessThanOrEqual(layout.clientWidth + 1);
      const visualBox = await customLink
        .locator("[data-resource-visual]")
        .boundingBox();
      expect(visualBox, `${width}px custom visual`).not.toBeNull();
      expect(Math.abs(visualBox!.width - visualBox!.height)).toBeLessThan(1);
    }

    await customLink.locator("[data-resource-visual]").click();
    await expect(page).toHaveURL(/\/resources$/);
  } finally {
    await supabase.from("resources").delete().in("id", resourceIds);
    await supabase.from("resource_categories").delete().eq("id", categoryId);
    await supabase.storage.from("resource-icons").remove([imagePath]);
  }
});

test("Admin Quick Link image upload is retrievable and canceled uploads are cleaned", async ({
  page,
}) => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  let uploadedPath = "";

  try {
    await signIn(page, accounts.adminEmployeeId);
    await page.goto("/admin/resources", { waitUntil: "networkidle" });
    await dismissOnboarding(page);
    await page.getByRole("button", { name: "New Resource" }).click();

    const imageInput = page.locator(
      'input[type="file"][accept*="image/svg+xml"]',
    );
    await imageInput.setInputFiles({
      name: "too-large.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
    });
    await expect(
      page.getByText("Quick Link images must be 2 MB or smaller."),
    ).toBeVisible();

    await imageInput.setInputFiles({
      name: "quick-link.png",
      mimeType: "image/png",
      buffer: png,
    });

    const formDialog = page.getByRole("dialog", {
      name: /Create Resource/,
    });
    const preview = formDialog.locator(
      '[data-resource-visual][data-visual-source="custom-image"]',
    );
    await expect(preview).toBeVisible();
    const src = await preview.locator("img").getAttribute("src");
    const marker = "/storage/v1/object/public/resource-icons/";
    expect(src).toContain(marker);
    uploadedPath = decodeURIComponent(src!.split(marker)[1]);

    const uploadedResponse = await page.request.get(src!, { timeout: 10_000 });
    expect(uploadedResponse.status()).toBe(200);

    await formDialog.getByRole("button", { name: "Close" }).click();
    await expect(formDialog).not.toBeVisible();
    const { error: removedError } = await supabase.storage
      .from("resource-icons")
      .download(uploadedPath);
    expect(removedError).not.toBeNull();
    uploadedPath = "";
  } finally {
    if (uploadedPath) {
      await supabase.storage.from("resource-icons").remove([uploadedPath]);
    }
  }
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

  await page.goto("/admin/settings/features");
  await expect(page.getByText("Future Modules", { exact: true })).toHaveCount(
    0,
  );

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

test("company feature disable hides navigation and rejects direct access", async ({
  page,
}) => {
  const { data: previous } = await supabase
    .from("company_features")
    .select("state")
    .eq("company_id", accounts.companyId)
    .eq("feature_key", "attendance")
    .maybeSingle();

  try {
    const { error } = await supabase.from("company_features").upsert(
      {
        company_id: accounts.companyId,
        feature_key: "attendance",
        state: "disabled",
      },
      { onConflict: "company_id,feature_key" },
    );
    expect(error).toBeNull();

    await signIn(page, accounts.employeeEmployeeId);
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", { name: "Attendance", exact: true }),
    ).toHaveCount(0);

    const response = await page.goto("/attendance", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(404);
  } finally {
    if (previous) {
      const { error: restoreError } = await supabase
        .from("company_features")
        .update({ state: previous.state })
        .eq("company_id", accounts.companyId)
        .eq("feature_key", "attendance");
      expect(restoreError).toBeNull();
    } else {
      const { error: cleanupError } = await supabase
        .from("company_features")
        .delete()
        .eq("company_id", accounts.companyId)
        .eq("feature_key", "attendance");
      expect(cleanupError).toBeNull();
    }
  }
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
