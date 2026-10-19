const { neon } = require('@neondatabase/serverless');
const { renderShell, escapeHtml } = require('./_lib/blog-layout');
const { renderMarkdown } = require('./_lib/render-markdown');

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function notFound(res) {
  const html = renderShell({
    title: 'Not found — Alejandro García',
    description: 'This post does not exist or is not published.',
    canonical: 'https://www.garcia-dev.co/blog',
    robots: 'noindex',
    bodyHtml: `
      <span class="eyebrow">404</span>
      <h1>Nothing here</h1>
      <p style="color:#A8A29A">This post doesn't exist, or isn't published yet.</p>
      <a class="back" href="/blog">&larr; Back to Writing</a>
    `,
  });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(404).send(html);
}

module.exports = async function handler(req, res) {
  const { slug } = req.query;
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    select slug, title, excerpt, body_markdown, featured_image_url, published, published_at
    from posts
    where slug = ${slug} and published = true
    limit 1
  `;
  const post = rows[0];

  if (!post) {
    notFound(res);
    return;
  }

  const heroImage = post.featured_image_url
    ? `<img class="hero-image" src="${escapeHtml(post.featured_image_url)}" alt="">`
    : '';

  const bodyHtml = `
    <a class="back" style="margin-top:0;margin-bottom:34px" href="/blog">&larr; Writing</a>
    <article class="post-card">
      ${heroImage}
      <span class="post-date">${formatDate(post.published_at)}</span>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="post-body">${renderMarkdown(post.body_markdown)}</div>
    </article>
  `;

  const canonical = `https://www.garcia-dev.co/blog/${post.slug}`;
  const html = renderShell({
    title: `${post.title} — Alejandro García`,
    description: post.excerpt || post.title,
    canonical,
    bodyHtml,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
