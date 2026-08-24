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
});
