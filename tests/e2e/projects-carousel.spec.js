import { test, expect } from "@playwright/test";

const PROJECT_COUNT = 6;
const ACTIVE_TICK_COLOR = "rgb(255, 106, 31)"; // #FF6A1F

// The hero's WebGL shader has no viewport-based pause — it keeps
// ray-marching at full cost even scrolled fully out of view (see
// black-hole.spec.js notes). A small viewport keeps that background cost
// low enough that clicking through the carousel here doesn't starve the
// browser process while it's still paying for hero frames off-screen.
test.use({ viewport: { width: 640, height: 480 } });

function activeTickFill(page, projectNumber) {
  return page
    .getByRole("button", { name: `Project ${projectNumber}` })
    .locator("span");
}

// Smooth-scroll + the 90ms scroll-debounce in watchProj() need a beat to
// settle before the next click, or clicks queue up faster than the
// carousel's own state can follow.
async function clickAndSettle(locator) {
  await locator.click();
  await locator.page().waitForTimeout(350);
}

test.describe("projects carousel", () => {
  test("next/prev walks through all six projects", async ({ page }) => {
    test.slow();
    await page.goto("/");
    await page.locator("#proyectos").scrollIntoViewIfNeeded();

    await expect(activeTickFill(page, 1)).toHaveCSS("background-color", ACTIVE_TICK_COLOR);

    const next = page.getByRole("button", { name: "Next project" });
    const prev = page.getByRole("button", { name: "Previous project" });

    for (let i = 2; i <= PROJECT_COUNT; i++) {
      await clickAndSettle(next);
      await expect(activeTickFill(page, i)).toHaveCSS("background-color", ACTIVE_TICK_COLOR);
    }

    // clamped at the last project — one more click should not move past it
    await clickAndSettle(next);
    await expect(activeTickFill(page, PROJECT_COUNT)).toHaveCSS("background-color", ACTIVE_TICK_COLOR);

    for (let i = PROJECT_COUNT - 1; i >= 1; i--) {
      await clickAndSettle(prev);
      await expect(activeTickFill(page, i)).toHaveCSS("background-color", ACTIVE_TICK_COLOR);
    }
  });

  test("tick navigation jumps directly to a project", async ({ page }) => {
    await page.goto("/");
    await page.locator("#proyectos").scrollIntoViewIfNeeded();

    await clickAndSettle(page.getByRole("button", { name: "Project 4" }));
    await expect(activeTickFill(page, 4)).toHaveCSS("background-color", ACTIVE_TICK_COLOR);
  });

  test("per-project screenshot gallery navigates", async ({ page }) => {
    await page.goto("/");
    await page.locator("#proyectos").scrollIntoViewIfNeeded();

    const gallery = page.locator('[data-gal="0"]');
    const galNext = gallery.locator('[data-gal-next="0"]');
    const galPrev = gallery.locator('[data-gal-prev="0"]');
    await expect(galNext).toBeVisible();

    await expect(gallery.locator('[data-shot="0"]')).toHaveCSS("opacity", "1");
    await clickAndSettle(galNext);
    await expect(gallery.locator('[data-shot="1"]')).toHaveCSS("opacity", "1");
    await clickAndSettle(galPrev);
    await expect(gallery.locator('[data-shot="0"]')).toHaveCSS("opacity", "1");
  });
});
