const { neon } = require('@neondatabase/serverless');
const { isAuthenticated } = require('../../../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  if (!isAuthenticated(req)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  const { slug } = req.query;
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    update posts set published = false, updated_at = now()
    where slug = ${slug}
    returning *
  `;
  if (!rows.length) {
    res.status(404).json({ ok: false, error: 'Not found' });
    return;
  }
  res.status(200).json({ ok: true, post: rows[0] });
};
