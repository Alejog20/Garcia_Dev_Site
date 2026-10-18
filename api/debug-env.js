module.exports = async function handler(req, res) {
  res.status(200).json({
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    vercelEnv: process.env.VERCEL_ENV || null,
  });
};
