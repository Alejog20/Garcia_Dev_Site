const { neon } = require('@neondatabase/serverless');
const { Redis } = require('@upstash/redis');
const { Resend } = require('resend');

const RECIPIENT = 'garciaalejandro2552@gmail.com';
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress || 'unknown';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { name, email, message, company } = body;

  // Honeypot: real visitors never fill this hidden field. Bots that
  // autofill every input do. Return success without doing any work so
  // the bot doesn't learn it was caught.
  if (typeof company === 'string' && company.trim() !== '') {
    res.status(200).json({ ok: true });
    return;
  }

  if (
    typeof name !== 'string' || name.trim().length < 1 || name.length > 200 ||
    typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 320 ||
    typeof message !== 'string' || message.trim().length < 1 || message.length > 5000
  ) {
    res.status(400).json({ ok: false, error: 'Invalid input' });
    return;
  }

  try {
    const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (redisUrl && redisToken) {
      const redis = new Redis({ url: redisUrl, token: redisToken });
      const ip = getClientIp(req);
      const bucket = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
      const key = `contact:rl:${ip}:${bucket}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
      if (count > RATE_LIMIT_MAX) {
        res.status(429).json({ ok: false, error: 'Too many requests. Try again later.' });
        return;
      }
    }

    const sql = neon(process.env.DATABASE_URL);
    await sql`
      insert into leads (name, email, message)
      values (${name.trim()}, ${email.trim()}, ${message.trim()})
    `;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Garcia Dev Site <contact@garcia-dev.co>',
        to: RECIPIENT,
        replyTo: email.trim(),
        subject: `New enquiry from ${name.trim()}`,
        text: message.trim(),
      });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact form error', err);
    res.status(500).json({ ok: false, error: 'Something went wrong. Try again shortly.' });
  }
};
