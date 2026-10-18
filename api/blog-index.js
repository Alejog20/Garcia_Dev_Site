const { neon } = require('@neondatabase/serverless');
const { renderShell, escapeHtml } = require('./_lib/blog-layout');

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

module.exports = async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  const posts = await sql`
    select slug, title, excerpt, featured_image_url, published_at
    from posts
    where published = true
    order by published_at desc
  `;

  let bodyHtml;
  if (!posts.length) {
    bodyHtml = `
      <span class="eyebrow">Writing</span>
      <h1>Notes on automation, data engineering and the tools I build</h1>
      <p class="empty-state" style="margin-top:28px">No posts yet — check back soon.</p>
      <a class="back" href="/">&larr; Back to garcia-dev.co</a>
    `;
  } else {
    const [lead, ...rest] = posts;
    const leadImage = lead.featured_image_url
      ? `<img class="hero-image" src="${escapeHtml(lead.featured_image_url)}" alt="">`
      : '';
    const leadHtml = `
      <a href="/blog/${escapeHtml(lead.slug)}" style="color:inherit">
        <article class="lead-post">
          ${leadImage}
          <span class="post-date">${formatDate(lead.published_at)}</span>
          <h2>${escapeHtml(lead.title)}</h2>
          ${lead.excerpt ? `<p>${escapeHtml(lead.excerpt)}</p>` : ''}
        </article>
      </a>
    `;

    const gridItems = rest.map(p => {
      const thumb = p.featured_image_url
        ? `<img class="thumb" src="${escapeHtml(p.featured_image_url)}" alt="">`
        : '';
      return `
        <li class="index-item">
          <a href="/blog/${escapeHtml(p.slug)}">
            ${thumb}
            <span class="post-date">${formatDate(p.published_at)}</span>
            <h3>${escapeHtml(p.title)}</h3>
            ${p.excerpt ? `<p>${escapeHtml(p.excerpt)}</p>` : ''}
          </a>
        </li>
      `;
    }).join('');

    bodyHtml = `
      <span class="eyebrow">Writing</span>
      <h1 style="margin-bottom:34px">Notes on automation, data engineering and the tools I build</h1>
      ${leadHtml}
      ${gridItems ? `<ul class="index-grid">${gridItems}</ul>` : ''}
      <a class="back" href="/">&larr; Back to garcia-dev.co</a>
    `;
  }

  const html = renderShell({
    title: 'Writing — Alejandro García',
    description: 'Technical write-ups on Python automation, data engineering and the tools I build, from Alejandro García.',
    canonical: 'https://www.garcia-dev.co/blog',
    mainMaxWidth: '1100px',
    bodyHtml: `${bodyHtml}\n<script src="/blog-public.js" defer></script>`,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
