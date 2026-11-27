import { test, expect } from "@playwright/test";

const PROJECT_NAMES = [
  "Obsidian Agent",
  "Upwork Ulysses Agent",
  "Multi-Platform Scraper",
  "Invoice Generator",
  "Samay Store",
  "Reddit Comment Extractor",
];

test.describe("noscript fallback", () => {
  test.use({ javaScriptEnabled: false });

  test("renders the h1, bio and all six projects with JS disabled", async ({ page }) => {
    await page.goto("/");
    const fallback = page.locator("main");

    await expect(fallback.locator("h1")).toContainText("Alejandro García");
    await expect(fallback).toContainText("Full Stack Analyst");

    for (const name of PROJECT_NAMES) {
      await expect(fallback).toContainText(name);
    }
  });
});
