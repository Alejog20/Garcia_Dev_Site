import { test, expect } from "./fixtures.js";

test.describe("contact form", () => {
  test("accepts typed input in name, email and message", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("#contacto");
    await form.scrollIntoViewIfNeeded();

    const name = form.locator('input[name="name"]');
    const email = form.locator('input[name="email"]');
    const message = form.locator('textarea[name="message"]');

    await name.fill("Jordan Rivera");
    await email.fill("jordan@example.com");
    await message.fill("Hi Alejandro, I'd like to talk about a dashboard project.");

    await expect(name).toHaveValue("Jordan Rivera");
    await expect(email).toHaveValue("jordan@example.com");
    await expect(message).toHaveValue("Hi Alejandro, I'd like to talk about a dashboard project.");
  });

  test("pauses its self-typing placeholder demo on focus", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("#contacto");
    await form.scrollIntoViewIfNeeded();

    const name = form.locator('input[name="name"]');
    await name.focus();

    const placeholderAfterFocus = await name.getAttribute("placeholder");
    await page.waitForTimeout(700);
    const placeholderLater = await name.getAttribute("placeholder");

    expect(placeholderLater).toBe(placeholderAfterFocus);
  });

  test("submits to /api/contact and shows a confirmation on success", async ({ page }) => {
    await page.route("**/api/contact", async (route) => {
      const body = JSON.parse(route.request().postData() || "{}");
      expect(body.name).toBe("Jordan Rivera");
      expect(body.email).toBe("jordan@example.com");
      expect(body.company).toBe("");
      // Long enough that both pending-state assertions below reliably land
      // inside the window, even under load — see the flakiness notes in
      // fixtures.js and this session's other specs.
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({ status: 200, json: { ok: true } });
    });

    await page.goto("/");
    const section = page.locator("#contacto");
    await section.scrollIntoViewIfNeeded();

    await section.locator('input[name="name"]').fill("Jordan Rivera");
    await section.locator('input[name="email"]').fill("jordan@example.com");
    await section
      .locator('textarea[name="message"]')
      .fill("Hi Alejandro, I'd like to talk about a dashboard project.");

    // A role+name locator would stop matching once the label flips to
    // "Sending…" mid-submit — pin to the element itself instead.
    const submit = section.locator('form button[type="submit"]');
    await submit.click();

    await expect(submit).toBeDisabled();
    await expect(submit).toHaveText("Sending…");
    await expect(section.getByText("Got it — I'll reply from")).toBeVisible();
    await expect(section.locator("form")).toHaveCount(0);
  });

  test("shows an inline error and keeps the form when the API call fails", async ({ page }) => {
    await page.route("**/api/contact", async (route) => {
      await route.fulfill({
        status: 429,
        json: { ok: false, error: "Too many requests. Try again later." },
      });
    });

    await page.goto("/");
    const section = page.locator("#contacto");
    await section.scrollIntoViewIfNeeded();

    await section.locator('input[name="name"]').fill("Jordan Rivera");
    await section.locator('input[name="email"]').fill("jordan@example.com");
    await section.locator('textarea[name="message"]').fill("Testing the error path.");
    await section.getByRole("button", { name: "Send message" }).click();

    await expect(section.getByRole("alert")).toContainText("Too many requests");
    await expect(section.locator("form")).toHaveCount(1);
  });

  test("carries a honeypot field that stays empty and invisible", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#contacto");
    await section.scrollIntoViewIfNeeded();

    // Positioned off-screen via an ancestor's overflow:hidden rather than
    // display:none/visibility:hidden, so unsophisticated bots that only
    // check those two properties still see a normal-looking field. That
    // means Playwright's own toBeHidden() (which doesn't walk ancestor
    // clipping) reports it as "visible" too — assert on the actual
    // off-screen position instead, which is what makes it invisible to a
    // human.
    const honeypot = section.locator('input[name="company"]');
    await expect(honeypot).toHaveValue("");
    const box = await honeypot.boundingBox();
    expect(box && box.x).toBeLessThan(0);
  });
});
