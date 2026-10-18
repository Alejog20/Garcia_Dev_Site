const { verifyToken, setAuthCookie } = require('../_lib/auth');
const { checkRateLimit } = require('../_lib/rate-limit');

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const allowed = await checkRateLimit(req, {
    prefix: 'blog-login:rl',
    max: RATE_LIMIT_MAX,
    windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
  });
  if (!allowed) {
    res.status(429).json({ ok: false, error: 'Too many attempts. Try again later.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  if (!verifyToken(body.token)) {
    res.status(401).json({ ok: false, error: 'Invalid token' });
    return;
  }

  setAuthCookie(res, String(body.token).trim());
  res.status(200).json({ ok: true });
};
