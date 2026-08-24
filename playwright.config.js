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
  // The CI runner is a shared box with no GPU; the browser process itself
  // has been observed crashing and needing relaunch mid-run under load.
  // More headroom to ride that out than a local machine ever needs.
  retries: process.env.CI ? 2 : 0,
  // CI runners have no GPU — headless Chromium falls back to software WebGL,
  // and the hero's default 'balanced' shader tier (230 ray-march steps) is
  // expensive enough there that the browser stops responding to Playwright's
  // own commands. The app already ships a cheap 'low' tier that kicks in
  // under prefers-reduced-motion: reduce (quality() in index.html) — use it.
  timeout: process.env.CI ? 60_000 : 30_000,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    reducedMotion: "reduce",
    // Smaller viewport = fewer pixels the hero shader has to ray-march
    // every frame. Cuts the background cost that every test pays for
    // just having the page open, not only the carousel tests.
    viewport: { width: 800, height: 600 },
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
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Headless runs default to the stripped-down "headless shell"
        // binary, which has weaker GPU/WebGL support than full Chromium.
        // Force the full browser in CI, where that gap actually matters.
        channel: process.env.CI ? "chromium" : undefined,
        launchOptions: {
          // GitHub Actions runners have no GPU. Recent Chrome versions no
          // longer fall back to SwiftShader (software WebGL) automatically
          // in that case — without opting in explicitly, GPU-process init
          // hangs/crash-loops instead of failing fast, which is what was
          // timing out every test here regardless of shader cost.
          args: process.env.CI
            ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
            : [],
        },
      },
    },
  ],
});
