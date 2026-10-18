const { neon } = require('@neondatabase/serverless');
const { isAuthenticated } = require('../_lib/auth');
const { validatePost } = require('../_lib/validate-post');

module.exports = async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    const authed = isAuthenticated(req);
    const rows = authed
      ? await sql`select * from posts order by created_at desc`
      : await sql`select * from posts where published = true order by published_at desc`;
    res.status(200).json({ ok: true, authenticated: authed, posts: rows });
    return;
  }

  if (req.method === 'POST') {
    if (!isAuthenticated(req)) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const errors = validatePost(body);
    if (errors.length) {
      res.status(400).json({ ok: false, error: errors.join('; ') });
      return;
    }

    try {
      // Server always forces published = false on create, regardless of
      // what the request sends — new posts are drafts until explicitly
      // published via /api/blog/posts/[slug]/publish.
      const rows = await sql`
        insert into posts (slug, title, excerpt, body_markdown, published)
        values (${body.slug}, ${body.title.trim()}, ${body.excerpt || null}, ${body.body_markdown}, false)
        returning *
      `;
      res.status(201).json({ ok: true, post: rows[0] });
    } catch (err) {
      if (err && err.code === '23505') {
        res.status(409).json({ ok: false, error: 'A post with that slug already exists' });
        return;
      }
      console.error('blog post create error', err);
      res.status(500).json({ ok: false, error: 'Something went wrong' });
    }
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
};
