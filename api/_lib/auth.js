const crypto = require('crypto');

const COOKIE_NAME = 'blog_admin_token';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return header.split(';').reduce((acc, pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return acc;
    acc[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
    return acc;
  }, {});
}

// Constant-time compare that doesn't leak length via early return — the
// shared BLOG_ADMIN_TOKEN is a single long-lived secret, worth the extra
// care against timing attacks.
function timingSafeEqualStrings(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function getPresentedToken(req) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }
  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME] || null;
}

function isAuthenticated(req) {
  const expected = process.env.BLOG_ADMIN_TOKEN;
  if (!expected) return false;
  const presented = getPresentedToken(req);
  if (!presented) return false;
  return timingSafeEqualStrings(presented, expected);
}

// Used by /api/blog/login, which receives the token in the request body
// rather than a header or cookie.
function verifyToken(token) {
  const expected = process.env.BLOG_ADMIN_TOKEN;
  if (!expected || typeof token !== 'string' || !token) return false;
  return timingSafeEqualStrings(token, expected);
}

function setAuthCookie(res, token) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

module.exports = { isAuthenticated, verifyToken, setAuthCookie, clearAuthCookie };
