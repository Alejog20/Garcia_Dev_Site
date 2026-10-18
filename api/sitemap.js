const { neon } = require('@neondatabase/serverless');

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

module.exports = async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  const posts = await sql`
    select slug, updated_at from posts where published = true order by published_at desc
  `;

  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    urlEntry('https://www.garcia-dev.co/', today, 'monthly', '1.0'),
    urlEntry('https://www.garcia-dev.co/blog', today, 'weekly', '0.7'),
    ...posts.map(p => urlEntry(
      `https://www.garcia-dev.co/blog/${p.slug}`,
      new Date(p.updated_at).toISOString().slice(0, 10),
      'monthly',
      '0.6'
    )),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.status(200).send(xml);
};
