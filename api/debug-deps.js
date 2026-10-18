module.exports = async function handler(req, res) {
  const result = {};
  try { require('marked'); result.marked = 'ok'; } catch (e) { result.marked = String(e); }
  try { require('sanitize-html'); result.sanitizeHtml = 'ok'; } catch (e) { result.sanitizeHtml = String(e); }
  try { require('./_lib/render-markdown'); result.renderMarkdownModule = 'ok'; } catch (e) { result.renderMarkdownModule = String(e); }
  res.status(200).json(result);
};
