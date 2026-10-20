const { neon } = require('@neondatabase/serverless');
const { renderShell, escapeHtml } = require('./_lib/blog-layout');
const { signalForSlug } = require('./_lib/signal-for-slug');

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Grid position for a post at `index` out of `total`. The most recent post
// (index 0) is always the featured panel, paired with however many
// neighbors actually exist so the top of the grid never leaves an empty
// gap for a 1-, 2- or 3-post blog. Posts beyond the first 5 flow into a
// plain 3-column archive row below — the bento treatment is for "what's
// current," not an infinitely repeating pattern.
function panelLayout(index, total) {
  if (index === 0) {
    if (total === 1) return { gridColumn: '1 / 13', gridRow: '1 / 2', featured: true, minHeight: 320 };
    return { gridColumn: '1 / 8', gridRow: '1 / 3', featured: true, minHeight: 440 };
  }
  if (index === 1) {
    return { gridColumn: '8 / 13', gridRow: total === 2 ? '1 / 3' : '1 / 2', minHeight: total === 2 ? 440 : 210 };
  }
  if (index === 2) {
    return { gridColumn: '8 / 13', gridRow: '2 / 3', minHeight: 210 };
  }
  if (index === 3) {
    if (total === 4) return { gridColumn: '1 / 13', gridRow: '3 / 4', minHeight: 210 };
    return { gridColumn: '1 / 7', gridRow: '3 / 4', minHeight: 210 };
  }
  if (index === 4) {
    return { gridColumn: '7 / 13', gridRow: '3 / 4', minHeight: 210 };
  }
  const col = (index - 5) % 3;
  return { gridColumn: `${col * 4 + 1} / ${col * 4 + 5}`, gridRow: 'auto', minHeight: 210, archive: true };
}

module.exports = async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  const posts = await sql`
    select slug, title, excerpt, featured_image_url, category, published_at
    from posts
    where published = true
    order by published_at desc
  `;

  let bodyHtml;
  if (!posts.length) {
    bodyHtml = `
      <span class="eyebrow">Writing</span>
      <h1>Notes on automation, data engineering and the tools I build</h1>
      <p class="empty-state">No posts yet — check back soon.</p>
      <a class="back" href="/">&larr; Back to garcia-dev.co</a>
    `;
  } else {
    const panelsHtml = posts.map((post, i) => {
      const layout = panelLayout(i, posts.length);
      // "orbit" marks the current, most-recent post — a live marker, not a
      // fixed identity, so it's tied to position (index 0), not to the
      // slug like every other signal is.
      const sig = i === 0 ? 'orbit' : signalForSlug(post.slug);
      const visual = post.featured_image_url
        ? `<div class="signal"><img src="${escapeHtml(post.featured_image_url)}" alt=""></div>`
        : `<div class="signal"><canvas data-sig="${sig}" data-seed="${escapeHtml(post.slug)}"></canvas></div>`;
      const Htag = layout.featured ? 'h2' : 'h3';
      const style = `grid-column:${layout.gridColumn};grid-row:${layout.gridRow};min-height:${layout.minHeight}px`;
      return `
        <a class="panel${layout.featured ? ' featured' : ''}" style="${style}" href="/blog/${escapeHtml(post.slug)}">
          ${visual}
          <span class="date mono">${formatDate(post.published_at)}</span>
          <div class="inner">
            ${post.category ? `<span class="cat">${escapeHtml(post.category)}</span>` : ''}
            <${Htag}>${escapeHtml(post.title)}</${Htag}>
            ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}
          </div>
        </a>
      `;
    }).join('');

    bodyHtml = `
      <span class="eyebrow">Writing</span>
      <h1 style="margin-bottom:34px;max-width:16ch">Notes from building the quiet machinery</h1>
      <div class="grid">${panelsHtml}</div>
      <a class="back" style="margin-top:40px;display:inline-block" href="/">&larr; Back to garcia-dev.co</a>
    `;
  }

  const html = renderShell({
    title: 'Writing — Alejandro García',
    description: 'Technical write-ups on Python automation, data engineering and the tools I build, from Alejandro García.',
    canonical: 'https://www.garcia-dev.co/blog',
    mainMaxWidth: '1200px',
    bodyHtml: `${bodyHtml}\n<script src="/blog-public.js" defer></script>`,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};
