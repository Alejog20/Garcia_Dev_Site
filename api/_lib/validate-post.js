const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// `partial` is true for PATCH, where any subset of fields may be present —
// only validates the fields that were actually sent.
function validatePost(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || body.slug !== undefined) {
    if (typeof body.slug !== 'string' || !SLUG_RE.test(body.slug) || body.slug.length > 200) {
      errors.push('slug must be lowercase letters, numbers and hyphens only');
    }
  }
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.length > 300) {
      errors.push('title is required (max 300 characters)');
    }
  }
  if (body.excerpt !== undefined && body.excerpt !== null) {
    if (typeof body.excerpt !== 'string' || body.excerpt.length > 500) {
      errors.push('excerpt must be a string under 500 characters');
    }
  }
  if (body.featured_image_url !== undefined && body.featured_image_url !== null && body.featured_image_url !== '') {
    if (typeof body.featured_image_url !== 'string' || body.featured_image_url.length > 2000 || !/^https?:\/\//i.test(body.featured_image_url)) {
      errors.push('featured_image_url must be an http(s) URL under 2000 characters');
    }
  }
  if (body.category !== undefined && body.category !== null && body.category !== '') {
    if (typeof body.category !== 'string' || body.category.length > 40) {
      errors.push('category must be a string under 40 characters');
    }
  }
  if (!partial || body.body_markdown !== undefined) {
    if (typeof body.body_markdown !== 'string' || body.body_markdown.trim().length < 1 || body.body_markdown.length > 200000) {
      errors.push('body_markdown is required (max 200000 characters)');
    }
  }

  return errors;
}

module.exports = { validatePost };
