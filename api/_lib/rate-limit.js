const { Redis } = require('@upstash/redis');

const DEFAULT_WINDOW_SECONDS = 60 * 60;

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Returns true if the request is within limits. No-ops to "always allow" when
// Upstash env vars aren't configured, so every caller degrades gracefully.
async function checkRateLimit(req, { prefix, max, windowSeconds = DEFAULT_WINDOW_SECONDS }) {
  const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return true;

  const redis = new Redis({ url: redisUrl, token: redisToken });
  const ip = getClientIp(req);
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `${prefix}:${ip}:${bucket}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);
  return count <= max;
}

module.exports = { checkRateLimit, getClientIp };
