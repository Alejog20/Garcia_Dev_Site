// @ts-check
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "./tests/e2e",
  // The hero is a per-pixel ray-marched WebGL shader — several instances
  // rendering concurrently exhaust the GPU/software-renderer and crash the
  // browser (`session closed`). Run serially rather than chase that flake.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
  },
  webServer: {
    // Not python3 -m http.server: that doesn't send vercel.json's headers,
    // so a CSP regression (e.g. a blocked inline script) would pass here
    // and only break in production. This serves the same headers Vercel does.
    command: `node scripts/static-server.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
