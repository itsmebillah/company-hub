import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const playwrightPort = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${playwrightPort}`;
const serverCommand = process.env.PLAYWRIGHT_USE_PRODUCTION
  ? `npm.cmd run start -- --hostname localhost --port ${playwrightPort}`
  : `npm.cmd run dev -- --hostname localhost --port ${playwrightPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  // The linked-project suite intentionally reuses two migrated Auth accounts.
  // Serial workers prevent test-induced session/rate-limit contention.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: serverCommand,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
  projects: [
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
    {
      name: "edge",
      use: {
        ...devices["Desktop Edge"],
        ...(process.env.EDGE_EXECUTABLE_PATH
          ? {
              launchOptions: {
                executablePath: process.env.EDGE_EXECUTABLE_PATH,
              },
            }
          : { channel: "msedge" }),
      },
    },
  ],
});
