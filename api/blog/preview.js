const { isAuthenticated } = require('../_lib/auth');
const { renderMarkdown } = require('../_lib/render-markdown');

// Used by the admin editor's live preview pane — same renderMarkdown call
// the real post pages use, so the preview is never out of sync with what
// actually ships.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  if (!isAuthenticated(req)) {
    res.status(401).json({ ok: false, error: 'Unauthorized' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  if (typeof body.body_markdown !== 'string') {
    res.status(400).json({ ok: false, error: 'body_markdown must be a string' });
    return;
  }

  res.status(200).json({ ok: true, html: renderMarkdown(body.body_markdown) });
};
