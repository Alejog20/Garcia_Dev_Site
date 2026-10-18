const { neon } = require('@neondatabase/serverless');
const { Resend } = require('resend');
const { checkRateLimit } = require('./_lib/rate-limit');

const RECIPIENT = 'garciaalejandro2552@gmail.com';
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const allowed = await checkRateLimit(req, {
      prefix: 'contact:rl',
      max: RATE_LIMIT_MAX,
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    });
    if (!allowed) {
      res.status(429).json({ ok: false, error: 'Too many requests. Try again later.' });
      return;
    }

    const sql = neon(process.env.DATABASE_URL);
    await sql`
      insert into leads (name, email, message)
      values (${name.trim()}, ${email.trim()}, ${message.trim()})
    `;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error: sendError } = await resend.emails.send({
        from: 'Garcia Dev Site <contact@garcia-dev.co>',
        to: RECIPIENT,
        replyTo: email.trim(),
        subject: `New enquiry from ${name.trim()}`,
        text: message.trim(),
      });
      // The lead is already in Postgres by this point — a failed email
      // notification shouldn't tell the visitor their message was lost.
      // Resend's SDK returns { error } instead of throwing, so this has
      // to be checked explicitly or it fails silently.
      if (sendError) console.error('contact form email error', sendError);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact form error', err);
    res.status(500).json({ ok: false, error: 'Something went wrong. Try again shortly.' });
  }
};
