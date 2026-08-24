import { test as base, expect } from "@playwright/test";

// reducedMotion: 'reduce' (playwright.config.js) only affects JS-level
// matchMedia checks — index.html's quality() reads it to pick the cheap
// WebGL tier, but it does nothing to the site's own CSS `transition`
// rules (tick fill, screenshot gallery opacity). On a slow CI runner those
// 300ms transitions can still be mid-flight when an assertion samples the
// computed style, producing flaky in-between values like
// "rgba(255, 106, 31, 0.98)" instead of the settled "rgb(255, 106, 31)".
// Killing all transitions/animations at the page level removes that
// entirely, independent of how fast the machine is.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const inject = () => {
        const style = document.createElement("style");
        style.textContent =
          "*, *::before, *::after { transition-duration: 0s !important; transition-delay: 0s !important; animation-duration: 0s !important; animation-delay: 0s !important; }";
        document.documentElement.appendChild(style);
      };
      // addInitScript runs before the document exists in some navigation
      // timings — document.documentElement can still be null here.
      if (document.documentElement) inject();
      else document.addEventListener("DOMContentLoaded", inject, { once: true });
    });
    await use(page);
  },
});

export { expect };
