import { test, expect } from "./fixtures.js";

// Scope note: the local test server (scripts/static-server.mjs) only serves
// static files — it doesn't run serverless functions or apply vercel.json's
// rewrites, so /blog, /blog/:slug and every /api/blog/* route are
// unreachable here, the same constraint tests/e2e/contact-form.spec.js
// already works around for /api/contact. These tests cover blog-admin.html's
// client-side behavior against mocked API responses; the actual
// server-rendered pages and live API are verified manually against a
// Preview deployment before merge (see the blog feature plan).

const DRAFT_POST = {
  slug: "a-draft-post",
  title: "A Draft Post",
  excerpt: "Not live yet.",
  body_markdown: "Body text.",
  published: false,
  updated_at: "2026-10-18T00:00:00.000Z",
};

async function mockLoggedOut(page) {
  await page.route("**/api/blog/posts", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    route.fulfill({ status: 200, json: { ok: true, authenticated: false, posts: [] } });
  });
}

test.describe("blog admin", () => {
  test("shows the login form when not authenticated", async ({ page }) => {
    await mockLoggedOut(page);
    await page.goto("/blog-admin.html");

    await expect(page.locator("#login-view")).toBeVisible();
    await expect(page.locator("#dashboard-view")).toBeHidden();
  });

  test("rejects an invalid token with an inline error", async ({ page }) => {
    await mockLoggedOut(page);
    await page.route("**/api/blog/login", (route) =>
      route.fulfill({ status: 401, json: { ok: false, error: "Invalid token" } })
    );

    await page.goto("/blog-admin.html");
    await page.locator("#token-input").fill("wrong-token");
    await page.locator("#login-btn").click();

    await expect(page.locator("#login-error")).toBeVisible();
    await expect(page.locator("#login-error")).toContainText("Invalid token");
    await expect(page.locator("#dashboard-view")).toBeHidden();
  });

  test("a valid login shows the dashboard with posts", async ({ page }) => {
    let authenticated = false;
    await page.route("**/api/blog/posts", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      route.fulfill({
        status: 200,
        json: { ok: true, authenticated, posts: authenticated ? [DRAFT_POST] : [] },
      });
    });
    await page.route("**/api/blog/login", (route) => {
      authenticated = true;
      route.fulfill({ status: 200, json: { ok: true } });
    });

    await page.goto("/blog-admin.html");
    await page.locator("#token-input").fill("correct-token");
    await page.locator("#login-btn").click();

    await expect(page.locator("#dashboard-view")).toBeVisible();
    await expect(page.locator(".post-row")).toContainText("A Draft Post");
    await expect(page.locator(".badge")).toHaveText("Draft");
  });

  test("creating a post never sends published:true — the server enforces draft-by-default", async ({ page }) => {
    await page.route("**/api/blog/posts", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, json: { ok: true, authenticated: true, posts: [] } });
      }
      if (route.request().method() === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        expect(body.published).toBeUndefined();
        expect(body.title).toBe("New Post Title");
        return route.fulfill({ status: 201, json: { ok: true, post: { ...DRAFT_POST, ...body } } });
      }
      return route.fallback();
    });

    await page.goto("/blog-admin.html");
    await expect(page.locator("#dashboard-view")).toBeVisible();

    await page.locator("#new-post-btn").click();
    await expect(page.locator("#editor-view")).toBeVisible();
    await page.locator("#field-slug").fill("new-post-title");
    await page.locator("#field-title").fill("New Post Title");
    await page.locator("#field-body").fill("Some markdown body.");
    await page.locator("#save-btn").click();

    await expect(page.locator("#dashboard-view")).toBeVisible();
  });

  test("publish calls the publish endpoint for that slug", async ({ page }) => {
    let published = false;
    await page.route("**/api/blog/posts", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      route.fulfill({
        status: 200,
        json: { ok: true, authenticated: true, posts: [{ ...DRAFT_POST, published }] },
      });
    });
    await page.route(`**/api/blog/posts/${DRAFT_POST.slug}/publish`, (route) => {
      published = true;
      route.fulfill({ status: 200, json: { ok: true, post: { ...DRAFT_POST, published: true } } });
    });

    await page.goto("/blog-admin.html");
    await expect(page.locator(".badge")).toHaveText("Draft");
    await page.locator('[data-action="toggle"]').click();

    await expect(page.locator(".badge")).toHaveText("Published");
  });

  test("delete asks for confirmation before removing a post", async ({ page }) => {
    let deleted = false;
    page.on("dialog", (dialog) => dialog.accept());

    await page.route("**/api/blog/posts", (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      route.fulfill({
        status: 200,
        json: { ok: true, authenticated: true, posts: deleted ? [] : [DRAFT_POST] },
      });
    });
    await page.route(`**/api/blog/posts/${DRAFT_POST.slug}`, (route) => {
      if (route.request().method() !== "DELETE") return route.fallback();
      deleted = true;
      route.fulfill({ status: 200, json: { ok: true } });
    });

    await page.goto("/blog-admin.html");
    await expect(page.locator(".post-row")).toContainText("A Draft Post");
    await page.locator('[data-action="delete"]').click();

    await expect(page.locator(".post-row")).toContainText("No posts yet.");
  });
});
