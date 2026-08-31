import { test, expect } from "./fixtures.js";

// Six rows: index 0/1 are case-study tier (Obsidian Agent, Upwork Ulysses Agent —
// both carry a screenshot gallery), 2-5 are compact utility rows. Only Samay
// Store (row 4) also carries a gallery among the utility rows; see index.html's
// PROJECTS array for the full lineup.
const PROJECT_COUNT = 6;

function rowTrigger(page, name) {
  return page.getByRole("button", { name: new RegExp(name) });
}

test.describe("projects section", () => {
  test("rows are collapsed on load", async ({ page }) => {
    await page.goto("/");
    await page.locator("#proyectos").scrollIntoViewIfNeeded();

    const triggers = page.locator("#proyectos button[aria-expanded]");
    await expect(triggers).toHaveCount(PROJECT_COUNT);
    for (let i = 0; i < PROJECT_COUNT; i++) {
      await expect(triggers.nth(i)).toHaveAttribute("aria-expanded", "false");
    }
  });

  test("clicking a row opens it and closes whichever was open", async ({ page }) => {
    await page.goto("/");
    await page.locator("#proyectos").scrollIntoViewIfNeeded();

    const obsidian = rowTrigger(page, "Obsidian Agent");
    const ulysses = rowTrigger(page, "Upwork Ulysses Agent");

    await obsidian.click();
    await expect(obsidian).toHaveAttribute("aria-expanded", "true");

    await ulysses.click();
    await expect(ulysses).toHaveAttribute("aria-expanded", "true");
    await expect(obsidian).toHaveAttribute("aria-expanded", "false");
  });

  test("clicking an open row's own trigger closes it", async ({ page }) => {
    await page.goto("/");
    await page.locator("#proyectos").scrollIntoViewIfNeeded();

    const scraper = rowTrigger(page, "Multi-Platform Scraper");
    await scraper.click();
    await expect(scraper).toHaveAttribute("aria-expanded", "true");

    await scraper.click();
    await expect(scraper).toHaveAttribute("aria-expanded", "false");
  });

  test("a case-study row's screenshot gallery navigates", async ({ page }) => {
    // Two gallery clicks (next, then prev) instead of one — on a loaded
    // runner this can edge past the default 30s alongside everything else
    // this component has going on (WebGL frame loop, up to six image-slot
    // galleries). More headroom, not a different assertion.
    test.setTimeout(60_000);
    await page.goto("/");
    await page.locator("#proyectos").scrollIntoViewIfNeeded();

    await rowTrigger(page, "Obsidian Agent").click();

    const gallery = page.locator('[data-gal="0"]');
    const galNext = gallery.locator('[data-gal-next="0"]');
    const galPrev = gallery.locator('[data-gal-prev="0"]');
    await expect(galNext).toBeVisible();

    await expect(gallery.locator('[data-shot="0"]')).toHaveCSS("opacity", "1");
    await galNext.click();
    await expect(gallery.locator('[data-shot="1"]')).toHaveCSS("opacity", "1");
    await galPrev.click();
    await expect(gallery.locator('[data-shot="0"]')).toHaveCSS("opacity", "1");
  });

  test("a utility row with a gallery (Samay Store) also navigates", async ({ page }) => {
    await page.goto("/");
    await page.locator("#proyectos").scrollIntoViewIfNeeded();

    await rowTrigger(page, "Samay Store").click();

    const gallery = page.locator('[data-gal="2"]');
    const galNext = gallery.locator('[data-gal-next="2"]');
    await expect(galNext).toBeVisible();
    await expect(gallery.locator('[data-shot="0"]')).toHaveCSS("opacity", "1");
    await galNext.click();
    await expect(gallery.locator('[data-shot="1"]')).toHaveCSS("opacity", "1");
  });

  test("every GitHub link points somewhere real", async ({ page }) => {
    // The panel markup stays in the DOM (clipped via max-height) even while
    // collapsed, so every row's link is present without opening it first.
    await page.goto("/");
    await page.locator("#proyectos").scrollIntoViewIfNeeded();

    const links = page.locator('#proyectos a[href*="github.com"]');
    await expect(links).toHaveCount(PROJECT_COUNT);
    const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    for (const href of hrefs) {
      expect(href).toMatch(/^https:\/\/github\.com\//);
    }
  });
});
