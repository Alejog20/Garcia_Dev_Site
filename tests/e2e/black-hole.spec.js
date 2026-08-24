import { test, expect } from "@playwright/test";

const HERO = 'section[data-screen-label="Hero — black hole"]';

test.describe("black hole hero", () => {
  test("initializes a WebGL2 context on the hero canvas", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator(`${HERO} canvas`);
    await expect(canvas).toBeAttached();

    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);

    const hasWebgl2 = await canvas.evaluate((el) => !!el.getContext("webgl2"));
    expect(hasWebgl2).toBe(true);
  });

  test("survives a drag-to-orbit interaction", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator(`${HERO} canvas`);
    const box = await canvas.boundingBox();
    if (!box) throw new Error("hero canvas has no bounding box");

    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 120, cy - 40, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    expect(pageErrors).toEqual([]);
    await expect(canvas).toBeAttached();
  });

  test("scroll pulls the camera in without throwing", async ({ page }) => {
    await page.goto("/");
    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);

    expect(pageErrors).toEqual([]);
  });
});
