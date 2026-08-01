import { chromium } from "@playwright/test";

const executablePath =
  process.env.BRAVE_EXECUTABLE_PATH ??
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";
const baseUrl = process.env.BRAVE_BASE_URL ?? "http://127.0.0.1:3000";

const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
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

  console.log("brave_browser=verified");
  console.log("attendance_authorization=verified");
  console.log("attendance_media_authorization=verified");
  console.log("mobile_overflow=verified");
} finally {
  await browser.close();
}
