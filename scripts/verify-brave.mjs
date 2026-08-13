import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig(process.cwd());

const executablePath =
  process.env.BRAVE_EXECUTABLE_PATH ??
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";
const baseUrl = process.env.BRAVE_BASE_URL ?? "http://127.0.0.1:3000";

const browser = await chromium.launch({ executablePath, headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  const manifest = await page.request.get(`${baseUrl}/manifest.webmanifest`);
  if (!manifest.ok()) throw new Error("PWA manifest verification failed.");

  await page.goto(`${baseUrl}/attendance`, { waitUntil: "domcontentloaded" });
  if (!page.url().endsWith("/login")) throw new Error("Attendance authorization boundary failed.");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 1) throw new Error("Mobile layout has horizontal overflow.");

  const media = await page.request.get(
    `${baseUrl}/api/attendance/selfies/00000000-0000-4000-8000-000000000000`,
  );
  if (media.status() !== 403) throw new Error("Attendance media authorization boundary failed.");
  if (runtimeErrors.length > 0) throw new Error("Brave reported a runtime page error.");

  if (process.env.BRAVE_PRODUCTION_AUTH === "true") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const companyId = process.env.GOOGLE_SHEETS_REPORTING_COMPANY_ID;
    if (!supabaseUrl || !serviceRoleKey || !companyId) {
      throw new Error("Production Brave authentication configuration is incomplete.");
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: roles, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("company_id", companyId)
      .eq("name", "Company Admin")
      .eq("status", "active");
    if (roleError || roles.length !== 1) {
      throw new Error("Exactly one active Company Admin role is required.");
    }
    const { data: admins, error: adminError } = await supabase
      .from("employees")
      .select("employee_id")
      .eq("company_id", companyId)
      .eq("role_id", roles[0].id)
      .eq("status", "active")
      .not("auth_user_id", "is", null);
    if (adminError || admins.length === 0) {
      throw new Error("An active Company Admin login is required.");
    }

    let signedIn = false;
    for (const admin of admins) {
      await page.context().clearCookies();
      await page.goto(`${baseUrl}/login`);
      await page.locator("#employee-id").fill(admin.employee_id);
      await page.locator("#password").fill(admin.employee_id);
      await page.getByRole("button", { name: "Login" }).click();
      signedIn = await page
        .waitForURL((url) => !url.pathname.endsWith("/login"), {
          timeout: 8_000,
        })
        .then(() => true)
        .catch(() => false);
      if (signedIn) break;
    }
    if (!signedIn) {
      throw new Error("No Company Admin retained the disposable default QA credential.");
    }
    const onboardingClose = page.getByRole("button", {
      name: "Close permission onboarding",
    });
    if (await onboardingClose.isVisible().catch(() => false)) {
      await onboardingClose.click();
    }

    for (const path of [
      "/admin/dashboard",
      "/admin/calendar",
      "/admin/attendance",
      "/admin/attendance/reports",
    ]) {
      const response = await page.goto(`${baseUrl}${path}`, {
        waitUntil: "domcontentloaded",
      });
      if (response?.status() !== 200) throw new Error(`Admin route failed: ${path}`);
      if ((await page.locator("body").innerText()).includes("Application error")) {
        throw new Error(`Admin route rendered an error: ${path}`);
      }
      const violations = await new AxeBuilder({ page }).analyze();
      if (violations.violations.length > 0) {
        throw new Error(
          `Accessibility verification failed: ${path} (${violations.violations
            .map((violation) => violation.id)
            .join(",")})`,
        );
      }
      const routeOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (routeOverflow > 1) throw new Error(`Responsive overflow failed: ${path}`);
    }
    console.log("brave_admin_routes=verified");
    console.log("brave_reporting_flow=verified");
    console.log("brave_accessibility=verified");
  }

  console.log("brave_browser=verified");
  console.log("attendance_authorization=verified");
  console.log("attendance_media_authorization=verified");
  console.log("mobile_overflow=verified");
} finally {
  await browser.close();
}
