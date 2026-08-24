import { test, expect } from "./fixtures.js";

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

// A fixed delay between clicks is a bad idea on a runner whose speed
// varies wildly (a loaded CI box can take far longer than a fixed guess
// for the click's React state update + smooth-scroll + the 90ms
// scroll-debounce in watchProj() to land). Instead, click and then wait
// — with a generous timeout — for the resulting state to actually show
// up before moving on, so each step is self-paced rather than guessed.
async function clickAndWaitForTick(page, locator, expectedProjectNumber) {
  await locator.click();
  await expect(activeTickFill(page, expectedProjectNumber)).toHaveCSS(
    "background-color",
    ACTIVE_TICK_COLOR,
    { timeout: 15_000 }
  );
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
      await clickAndWaitForTick(page, next, i);
    }

    // clamped at the last project — one more click should not move past it
    await clickAndWaitForTick(page, next, PROJECT_COUNT);

    for (let i = PROJECT_COUNT - 1; i >= 1; i--) {
      await clickAndWaitForTick(page, prev, i);
    }
  });

  test("tick navigation jumps directly to a project", async ({ page }) => {
    await page.goto("/");
    await page.locator("#proyectos").scrollIntoViewIfNeeded();

    await clickAndWaitForTick(page, page.getByRole("button", { name: "Project 4" }), 4);
  });

  test("per-project screenshot gallery navigates", async ({ page }) => {
    await page.goto("/");
    await page.locator("#proyectos").scrollIntoViewIfNeeded();

    const gallery = page.locator('[data-gal="0"]');
    const galNext = gallery.locator('[data-gal-next="0"]');
    const galPrev = gallery.locator('[data-gal-prev="0"]');
    await expect(galNext).toBeVisible();

    await expect(gallery.locator('[data-shot="0"]')).toHaveCSS("opacity", "1");
    await galNext.click();
    await expect(gallery.locator('[data-shot="1"]')).toHaveCSS("opacity", "1", { timeout: 15_000 });
    await galPrev.click();
    await expect(gallery.locator('[data-shot="0"]')).toHaveCSS("opacity", "1", { timeout: 15_000 });
  });
});
