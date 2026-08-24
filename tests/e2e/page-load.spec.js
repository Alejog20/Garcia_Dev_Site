import { test, expect } from "./fixtures.js";

const SECTION_LABELS = [
  "Hero — black hole",
  "About",
  "Projects",
  "Skills",
  "Experience",
  "Contact",
];

test.describe("page load", () => {
  test("loads with no console or page errors", async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/Alejandro García/);

    // let React mount, the black hole boot, and the particle field spin up
    await page.waitForTimeout(1500);

    expect(pageErrors, `page errors:\n${pageErrors.join("\n")}`).toEqual([]);
    expect(consoleErrors, `console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("renders every main section", async ({ page }) => {
    await page.goto("/");
    for (const label of SECTION_LABELS) {
      await expect(page.locator(`[data-screen-label="${label}"]`)).toBeAttached();
    }
  });

  test.describe("responsive breakpoints", () => {
    for (const width of [360, 2560]) {
      test(`renders without horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/");
        await page.waitForTimeout(500);

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));

        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
      });
    }
  });
});
