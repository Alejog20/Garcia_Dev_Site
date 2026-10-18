const { marked } = require('marked');
const { FilterXSS } = require('xss');

// Markdown allows raw HTML passthrough, and posts can come from an AI agent
// holding the shared admin token — sanitizing on every render (not just on
// save) means a compromised/misbehaving agent, or a leaked token, can't
// stored-XSS every visitor. Explicit allowlist, not a blocklist.
//
// No h1: the post page renders its own <h1> from the title column, and a
// second h1 inside the body would duplicate the top of the document outline
// — the exact heading-hierarchy problem fixed elsewhere on this site. A
// stray "# Heading" in a post just degrades to plain text instead.
//
// Uses `xss` rather than `sanitize-html` — the latter pulls in htmlparser2
// as a pure-ESM transitive dependency with no "require" export condition,
// which resolves fine under a plain local `node` process but fails at
// runtime on Vercel's bundled serverless functions (ERR_REQUIRE_ESM),
// confirmed by deploying and testing directly. `xss` is plain CJS, no
// bundler hazard.
const ALLOWED_URL_SCHEMES = /^(https?:|mailto:|\/|#)/i;

// `xss`'s own default URI safety check only runs when onTagAttr falls
// through to default handling (returns undefined) — returning a custom
// string here, as an earlier version of this code did to inject
// rel="noopener noreferrer", bypasses that check entirely and lets
// javascript:/data: URIs straight through. Confirmed by testing with an
// actual javascript: payload before and after this fix — explicit scheme
// validation below, not xss's defaults, is what makes this safe.
function isSafeUrl(value) {
  return ALLOWED_URL_SCHEMES.test(value.trim());
}

const filter = new FilterXSS({
  whiteList: {
    h2: [], h3: [], h4: [],
    p: [], ul: [], ol: [], li: [],
    blockquote: [], pre: [], code: [],
    strong: [], em: [], del: [],
    a: ['href', 'title', 'rel'],
    img: ['src', 'alt', 'title'],
    hr: [], br: [],
    table: [], thead: [], tbody: [], tr: [], th: [], td: [],
  },
  onTagAttr(tag, name, value, isWhiteAttr) {
    if (!isWhiteAttr) return undefined;
    if ((tag === 'a' && name === 'href') || (tag === 'img' && name === 'src')) {
      if (!isSafeUrl(value)) return ''; // drop the attribute entirely
      if (tag === 'a' && name === 'href') return `href="${value}" rel="noopener noreferrer"`;
    }
    return undefined; // fall through to default handling for everything else
  },
});

function renderMarkdown(markdown) {
  const html = marked.parse(markdown, { gfm: true, breaks: false });
  return filter.process(html);
}

module.exports = { renderMarkdown };
