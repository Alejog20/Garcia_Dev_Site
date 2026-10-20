const { neon } = require('@neondatabase/serverless');
const { isAuthenticated } = require('../../_lib/auth');
const { validatePost } = require('../../_lib/validate-post');
const { renderMarkdown } = require('../../_lib/render-markdown');

module.exports = async function handler(req, res) {
  const { slug } = req.query;
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    const rows = await sql`select * from posts where slug = ${slug} limit 1`;
    const post = rows[0];
    const authed = isAuthenticated(req);
    // A draft is invisible to unauthenticated callers — don't even reveal
    // that a post with this slug exists.
    if (!post || (!post.published && !authed)) {
      res.status(404).json({ ok: false, error: 'Not found' });
      return;
    }
    // Pre-rendered so the public /blog popup script can drop it straight
    // into the DOM instead of shipping a markdown parser to the browser.
    res.status(200).json({ ok: true, post: { ...post, body_html: renderMarkdown(post.body_markdown) } });
    return;
  }

  if (!isAuthenticated(req)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  if (req.method === 'PATCH') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const errors = validatePost(body, { partial: true });
    if (errors.length) {
      res.status(400).json({ ok: false, error: errors.join('; ') });
      return;
    }

    try {
      // `published` is deliberately not settable here — only
      // /api/blog/posts/[slug]/publish and .../unpublish change it, so a
      // content edit can never accidentally take a live post down (or
      // sneak a publish through what should just be a copy fix).
      const rows = await sql`
        update posts set
          slug = coalesce(${body.slug ?? null}, slug),
          title = coalesce(${body.title?.trim() ?? null}, title),
          excerpt = coalesce(${body.excerpt ?? null}, excerpt),
          body_markdown = coalesce(${body.body_markdown ?? null}, body_markdown),
          featured_image_url = coalesce(${body.featured_image_url ?? null}, featured_image_url),
          category = coalesce(${body.category ?? null}, category),
          updated_at = now()
        where slug = ${slug}
        returning *
      `;
      if (!rows.length) {
        res.status(404).json({ ok: false, error: 'Not found' });
        return;
      }
      res.status(200).json({ ok: true, post: rows[0] });
    } catch (err) {
      if (err && err.code === '23505') {
        res.status(409).json({ ok: false, error: 'A post with that slug already exists' });
        return;
      }
      console.error('blog post update error', err);
      res.status(500).json({ ok: false, error: 'Something went wrong' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const rows = await sql`delete from posts where slug = ${slug} returning id`;
    if (!rows.length) {
      res.status(404).json({ ok: false, error: 'Not found' });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
};
