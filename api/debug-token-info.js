const crypto = require('crypto');

// Temporary diagnostic — reveals only a length and a hash prefix, never the
// actual secret, so it's safe to deploy and safe to compare against what's
// typed into the login form without exposing BLOG_ADMIN_TOKEN itself.
module.exports = async function handler(req, res) {
  const raw = process.env.BLOG_ADMIN_TOKEN || '';
  const trimmed = raw.trim();
  res.status(200).json({
    rawLength: raw.length,
    trimmedLength: trimmed.length,
    sha256Prefix: crypto.createHash('sha256').update(trimmed).digest('hex').slice(0, 12),
  });
};
