import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

loadEnvConfig(process.cwd());

const testEnvironmentPath = resolve(process.cwd(), ".env.test.local");

if (existsSync(testEnvironmentPath)) {
  process.loadEnvFile(testEnvironmentPath);
}

const playwrightPort = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${playwrightPort}`;
const nodeExecutable = JSON.stringify(process.execPath);
const nextCli = "node_modules/next/dist/bin/next";
const serverCommand = process.env.PLAYWRIGHT_USE_PRODUCTION
  ? `${nodeExecutable} ${nextCli} start --hostname localhost --port ${playwrightPort}`
  : `${nodeExecutable} ${nextCli} dev --hostname localhost --port ${playwrightPort}`;
const includeEdge = process.env.PLAYWRIGHT_INCLUDE_EDGE === "true";

const projects = [
  {
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
    },
  },
  ...(includeEdge
    ? [
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
              : { channel: "msedge" as const }),
          },
        },
      ]
    : []),
];

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
        url: `${baseURL}/manifest.webmanifest`,
        reuseExistingServer: true,
        timeout: 120_000,
        gracefulShutdown: {
          signal: "SIGINT",
          timeout: 5_000,
        },
        stdout: "pipe",
        stderr: "pipe",
      },
  projects,
});
