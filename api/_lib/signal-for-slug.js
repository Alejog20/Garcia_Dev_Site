const TYPES = ['wave', 'scan', 'swarm', 'matrix'];

// Deterministic per-post signal assignment, by slug rather than list
// position — a post's visual identity shouldn't shift just because new
// posts get published around it. The same algorithm is duplicated in
// blog-public.js (browser context, can't share a CommonJS module there);
// keep both in sync if this changes.
function signalForSlug(slug) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  return TYPES[Math.abs(hash) % TYPES.length];
}

module.exports = { signalForSlug, TYPES };
