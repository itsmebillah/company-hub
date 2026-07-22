import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const protectedRoutes = [
  "/dashboard",
  "/attendance",
  "/leave",
  "/announcements",
  "/calendar",
  "/resources",
  "/profile",
  "/settings",
  "/admin/dashboard",
  "/admin/users",
  "/admin/attendance",
  "/admin/leave/requests",
  "/admin/resources",
  "/admin/announcements",
  "/admin/calendar",
  "/admin/company",
  "/admin/roles",
  "/admin/settings",
  "/admin/audit",
  "/admin/settings/features",
  "/platform/dashboard",
  "/platform/companies",
  "/platform/features",
  "/platform/audit",
] as const;

const mobileWidths = [320, 360, 375, 390, 414, 768, 1024] as const;

function collectRuntimeFailures(page: Page) {
  const failures: string[] = [];

  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") {
      failures.push(`console: ${message.text()}`);
    }
  });

  return failures;
}

test("public entry points render without runtime errors", async ({ page }) => {
  const failures = collectRuntimeFailures(page);

  for (const route of ["/", "/login", "/setup"] as const) {
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("body"), route).toBeVisible();
    await expect(page.locator("body"), route).not.toContainText(
      "Application error",
    );
  }

  expect(failures).toEqual([]);
});

test("protected routes redirect signed-out users to login", async ({
  page,
}) => {
  for (const route of protectedRoutes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page, route).toHaveURL(/\/login$/);
  }
});

for (const width of mobileWidths) {
  test(`login remains usable without horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    const failures = collectRuntimeFailures(page);
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.goto("/login", { waitUntil: "networkidle" });

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
    expect(failures).toEqual([]);
  });
}

test("PWA assets load and the worker does not cache authenticated pages", async ({
  request,
}) => {
  const [manifest, worker] = await Promise.all([
    request.get("/manifest.webmanifest"),
    request.get("/sw.js"),
  ]);

  expect(manifest.ok()).toBeTruthy();
  expect(worker.ok()).toBeTruthy();
  const source = await worker.text();
  expect(source).not.toContain("company-hub-pages");
  expect(source).not.toContain("isCacheablePage");
});

test("notification tracking rejects signed-out requests", async ({
  request,
}) => {
  const response = await request.post("/api/notifications/track", {
    data: {
      notificationId: crypto.randomUUID(),
      event: "opened",
    },
  });

  expect(response.status()).toBe(401);
});

test("login has no automated WCAG A/AA violations", async ({ page }) => {
  await page.goto("/login", { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});
