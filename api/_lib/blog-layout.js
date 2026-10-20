const SITE_OG_IMAGE = 'https://www.garcia-dev.co/assets/og-image.jpg';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Shared document shell for every public blog page — "Control Room": an
// asymmetric panel grid on /blog, each entry carrying its own generative
// signal (blog-signals.js) instead of stock photography, with the same
// signal echoed in the article you land on when it has no real photo of
// its own. `.post-card` is styled to work unmodified in two places:
// sitting plainly in <main> for a direct page load (so direct links and
// crawlers get a real article page), and as the visible content of an
// overlay blog-public.js builds client-side on top of a blurred /blog —
// same markup, same classes, one definition to keep in sync.
function renderShell({ title, description, canonical, bodyHtml, robots, mainMaxWidth }) {
  const maxWidth = mainMaxWidth || '680px';
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
    line-height: 1.6;
  }
  main {
    max-width: ${maxWidth};
    margin: 0 auto;
    padding: clamp(40px, 6vh, 72px) clamp(20px, 3.2vw, 44px) clamp(70px, 9vh, 120px);
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
  .mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
  h1 {
    margin: 0 0 14px;
    font-size: clamp(30px, 4vw, 46px);
    line-height: 1.04;
    font-weight: 500;
    letter-spacing: -.035em;
  }
  .post-date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #6E6862;
  }
  .back {
    display: inline-block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #6E6862;
    border-bottom: 1px solid rgba(255, 140, 74, 0);
    padding-bottom: 2px;
    transition: color .15s ease, border-color .15s ease;
  }
  .back:hover { color: #FF9257; border-color: rgba(255, 140, 74, .4); }

  /* ---- article body (rendered markdown) ---- */
  .post-body { margin-top: 28px; }
  .post-body h2 { margin: 44px 0 14px; font-size: 22px; font-weight: 500; letter-spacing: -.01em; }
  .post-body h3 { margin: 34px 0 12px; font-size: 18px; font-weight: 500; }
  .post-body p { margin: 0 0 16px; color: #A8A29A; }
  .post-body p strong, .post-body li strong { color: #F2EFEA; font-weight: 500; }
  .post-body ul, .post-body ol { margin: 0 0 16px; padding-left: 22px; color: #A8A29A; }
  .post-body li { margin-bottom: 6px; }
  .post-body blockquote {
    margin: 0 0 16px; padding-left: 18px;
    border-left: 2px solid rgba(255, 106, 31, .4);
    color: #A8A29A; font-style: italic;
  }
  .post-body code {
    font-family: 'JetBrains Mono', monospace; font-size: .88em;
    background: rgba(242, 239, 234, .06); padding: .1em .35em; border-radius: 3px;
  }
  .post-body pre {
    margin: 0 0 20px; padding: 18px 20px;
    background: rgba(242, 239, 234, .04);
    border: 1px solid rgba(242, 239, 234, .1);
    border-radius: 3px; overflow-x: auto;
  }
  .post-body pre code { background: none; padding: 0; font-size: .85em; line-height: 1.6; }
  .post-body img { max-width: 100%; height: auto; border-radius: 2px; }
  .post-body hr { border: 0; border-top: 1px solid rgba(242, 239, 234, .1); margin: 40px 0; }

  /* ---- post card / article hero: shared by a direct page load and the
         popup overlay built by blog-public.js ---- */
  .post-card { max-width: 720px; margin: 0 auto; }
  .post-card .hero {
    position: relative;
    width: 100%; aspect-ratio: 16/7;
    border-radius: 2px; margin-bottom: 30px; overflow: hidden;
    background: #0A0911;
  }
  .post-card .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .post-card .hero canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  .post-card .cat {
    display: inline-block; margin-bottom: 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .18em;
    text-transform: uppercase; color: #FF8C4A;
  }
  .post-card h1 { margin-bottom: 10px; }

  /* ---- /blog: the Control Room panel grid ---- */
  .grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    border-top: 1px solid rgba(242,239,234,.12);
    border-left: 1px solid rgba(242,239,234,.12);
  }
  .panel {
    position: relative;
    border-right: 1px solid rgba(242,239,234,.12);
    border-bottom: 1px solid rgba(242,239,234,.12);
    padding: clamp(20px, 2.2vw, 30px);
    display: flex; flex-direction: column; justify-content: flex-end;
    min-height: 210px;
    overflow: hidden;
    transition: background-color .25s ease;
  }
  .panel:hover { background: rgba(255,106,31,.035); }
  .panel .signal { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .panel .signal img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .panel .inner { position: relative; z-index: 1; }
  .panel .cat {
    display: block; margin-bottom: 10px;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .16em;
    text-transform: uppercase; color: #FF8C4A;
  }
  .panel h2, .panel h3 { margin: 0 0 10px; font-weight: 500; letter-spacing: -.02em; line-height: 1.18; color: #F2EFEA; }
  .panel p { margin: 0; color: #A8A29A; font-size: 14px; max-width: 46ch; }
  .panel .date {
    position: absolute; top: clamp(20px, 2.2vw, 30px); right: clamp(20px, 2.2vw, 30px);
    font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .12em;
    text-transform: uppercase; color: #6E6862; z-index: 1;
  }
  .panel.featured h2 { font-size: clamp(25px, 2.7vw, 35px); max-width: 15ch; }
  .panel.featured p { font-size: 16px; max-width: 48ch; }
  .panel h3 { font-size: 19px; }
  .empty-state { color: #6E6862; padding: 48px 0; }

  @media (max-width: 860px) {
    .grid { grid-template-columns: 1fr; }
    .panel { grid-column: 1 / -1 !important; grid-row: auto !important; min-height: 220px; }
  }

  /* ---- popup overlay (built by blog-public.js, styled here so both
         source files share one definition) ---- */
  .popup-overlay {
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: flex-start; justify-content: center;
    overflow-y: auto; padding: clamp(24px, 6vh, 80px) 20px;
  }
  .popup-backdrop {
    position: fixed; inset: 0;
    background: rgba(5, 5, 6, .72);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }
  .popup-overlay .post-card {
    position: relative; z-index: 1;
    background: #050506;
    border: 1px solid rgba(242, 239, 234, .12);
    border-radius: 3px;
    padding: clamp(28px, 4vw, 52px);
    width: 100%;
  }
  .popup-close {
    position: absolute; top: 14px; right: 14px; z-index: 2;
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    background: #050506; border: 1px solid rgba(242, 239, 234, .18);
    border-radius: 2px; color: #A8A29A; cursor: pointer;
    font-family: 'Space Grotesk', sans-serif; font-size: 18px; line-height: 1;
  }
  .popup-close:hover { color: #F2EFEA; border-color: rgba(242, 239, 234, .4); }
  body.popup-open { overflow: hidden; }

  @media (prefers-reduced-motion: reduce) {
    .panel .signal canvas, .post-card .hero canvas { animation: none !important; }
  }
</style>
</head>
<body>
<script src="/star-field.js" defer></script>
<script src="/blog-signals.js" defer></script>
<main>
${bodyHtml}
</main>
<script src="/analytics-init.js"></script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
}

module.exports = { renderShell, escapeHtml, SITE_OG_IMAGE };
