const SITE_OG_IMAGE = 'https://www.garcia-dev.co/assets/og-image.jpg';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Shared document shell for every public blog page — same color tokens,
// type system and inline-<style> approach as privacy.html, extended with
// styles for rendered markdown content (code blocks, blockquotes, lists).
function renderShell({ title, description, canonical, bodyHtml, robots }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
${robots ? `<meta name="robots" content="${escapeHtml(robots)}">` : ''}
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${SITE_OG_IMAGE}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${SITE_OG_IMAGE}">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/jetbrains-mono-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #050506;
    color: #F2EFEA;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 16px;
    line-height: 1.7;
  }
  main {
    max-width: 680px;
    margin: 0 auto;
    padding: clamp(56px, 8vh, 96px) clamp(20px, 3.2vw, 44px) clamp(70px, 9vh, 120px);
  }
  a { color: #FF8C4A; text-decoration: none; }
  a:hover { color: #FF9257; }
  .eyebrow {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: .24em;
    text-transform: uppercase;
    color: #6E6862;
    margin-bottom: 18px;
  }
  h1 {
    margin: 0 0 18px;
    font-size: clamp(30px, 4vw, 44px);
    line-height: 1.08;
    font-weight: 500;
    letter-spacing: -.03em;
  }
  .post-date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #6E6862;
    margin-bottom: 44px;
  }
  .post-body h2 {
    margin: 44px 0 14px;
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -.01em;
  }
  .post-body h3 {
    margin: 34px 0 12px;
    font-size: 18px;
    font-weight: 500;
  }
  .post-body p { margin: 0 0 16px; color: #A8A29A; }
  .post-body p strong, .post-body li strong { color: #F2EFEA; font-weight: 500; }
  .post-body ul, .post-body ol { margin: 0 0 16px; padding-left: 22px; color: #A8A29A; }
  .post-body li { margin-bottom: 6px; }
  .post-body blockquote {
    margin: 0 0 16px;
    padding-left: 18px;
    border-left: 2px solid rgba(255, 106, 31, .4);
    color: #A8A29A;
    font-style: italic;
  }
  .post-body code {
    font-family: 'JetBrains Mono', monospace;
    font-size: .88em;
    background: rgba(242, 239, 234, .06);
    padding: .1em .35em;
    border-radius: 3px;
  }
  .post-body pre {
    margin: 0 0 20px;
    padding: 18px 20px;
    background: rgba(242, 239, 234, .04);
    border: 1px solid rgba(242, 239, 234, .1);
    border-radius: 3px;
    overflow-x: auto;
  }
  .post-body pre code {
    background: none;
    padding: 0;
    font-size: .85em;
    line-height: 1.6;
  }
  .post-body img { max-width: 100%; height: auto; border-radius: 2px; }
  .post-body hr { border: 0; border-top: 1px solid rgba(242, 239, 234, .1); margin: 40px 0; }
  .index-list { list-style: none; margin: 0; padding: 0; }
  .index-item {
    padding: 28px 0;
    border-bottom: 1px solid rgba(242, 239, 234, .1);
  }
  .index-item:first-child { padding-top: 0; }
  .index-item h2 {
    margin: 0 0 8px;
    font-size: 21px;
    font-weight: 500;
    letter-spacing: -.01em;
  }
  .index-item .post-date { margin-bottom: 10px; }
  .index-item p { margin: 0; color: #A8A29A; }
  .empty-state { color: #6E6862; }
  .back {
    display: inline-block;
    margin-top: 48px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: .14em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(255, 140, 74, .4);
    padding-bottom: 2px;
  }
</style>
</head>
<body>
<main>
${bodyHtml}
</main>
</body>
</html>
`;
}

module.exports = { renderShell, escapeHtml, SITE_OG_IMAGE };
