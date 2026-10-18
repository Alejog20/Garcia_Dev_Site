const { neon } = require('@neondatabase/serverless');
const { renderShell, escapeHtml } = require('./_lib/blog-layout');

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

module.exports = async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  const posts = await sql`
    select slug, title, excerpt, published_at
    from posts
    where published = true
    order by published_at desc
  `;

  const items = posts.length
    ? posts.map(p => `
      <li class="index-item">
        <h2><a href="/blog/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a></h2>
        <div class="post-date">${formatDate(p.published_at)}</div>
        ${p.excerpt ? `<p>${escapeHtml(p.excerpt)}</p>` : ''}
      </li>
    `).join('')
    : '<li class="index-item empty-state">No posts yet — check back soon.</li>';

  const bodyHtml = `
    <span class="eyebrow">Writing</span>
    <h1>Notes on automation, data engineering and the tools I build</h1>
    <ul class="index-list">${items}</ul>
    <a class="back" href="/">&larr; Back to garcia-dev.co</a>
  `;

  const html = renderShell({
    title: 'Writing — Alejandro García',
    description: 'Technical write-ups on Python automation, data engineering and the tools I build, from Alejandro García.',
    canonical: 'https://www.garcia-dev.co/blog',
    bodyHtml,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
