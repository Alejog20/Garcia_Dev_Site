const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');

// Markdown allows raw HTML passthrough, and posts can come from an AI agent
// holding the shared admin token — sanitizing on every render (not just on
// save) means a compromised/misbehaving agent, or a leaked token, can't
// stored-XSS every visitor. Explicit allowlist, not a blocklist.
// No h1: the post page renders its own <h1> from the title column, and a
// second h1 inside the body would duplicate the top of the document outline
// — the exact heading-hierarchy problem fixed elsewhere on this site. A
// stray "# Heading" in a post just degrades to plain text instead.
const ALLOWED_TAGS = [
  'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'strong', 'em', 'del', 'a', 'img', 'hr', 'br',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ALLOWED_ATTRIBUTES = {
  a: ['href', 'title', 'rel'],
  img: ['src', 'alt', 'title'],
};

function renderMarkdown(markdown) {
  const html = marked.parse(markdown, { gfm: true, breaks: false });
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}

module.exports = { renderMarkdown };
