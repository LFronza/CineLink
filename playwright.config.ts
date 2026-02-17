import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  retries: 1,
  use: {
    baseURL: process.env.CINELINK_CLIENT_BASE_URL || "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  reporter: [["list"], ["html", { outputFolder: "tests/artifacts/playwright-report", open: "never" }]]
});

