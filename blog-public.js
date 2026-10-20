(function () {
  // Progressive enhancement only: every link here is a real <a href="/blog/slug">
  // pointing at a real server-rendered page (api/blog-post.js). This script
  // intercepts the click to show the same content as a blurred-backdrop
  // overlay without a full navigation — but a direct load of that URL, or a
  // crawler that never runs this script, gets the exact same article as a
  // plain page. No content or URL exists only inside this script.
  const main = document.querySelector('main');
  let overlay = null;

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Same rule as the grid panels: a real photo if the post has one,
  // otherwise the post's own generative signal — so an article opened from
  // a signal panel shows that same signal as its hero, not a blank gap.
  function buildHero(post) {
    if (post.featured_image_url) {
      return `<div class="hero"><img src="${escapeHtml(post.featured_image_url)}" alt=""></div>`;
    }
    return `<div class="hero"><canvas data-sig="${escapeHtml(post.signal || 'wave')}" data-seed="${escapeHtml(post.slug)}"></canvas></div>`;
  }

  function buildCard(post) {
    return `
      <button type="button" class="popup-close" aria-label="Close">&times;</button>
      ${buildHero(post)}
      <span class="post-date mono">${formatDate(post.published_at)}</span>
      ${post.category ? `<span class="cat">${escapeHtml(post.category)}</span>` : ''}
      <h1>${escapeHtml(post.title)}</h1>
      <div class="post-body">${post.body_html}</div>
    `;
  }

  function initHeroSignal(root) {
    const canvas = root.querySelector('.hero canvas[data-sig]');
    if (canvas && window.BlogSignals) window.BlogSignals.init(canvas, canvas.dataset.sig, canvas.dataset.seed);
  }

  function closeOverlay(push) {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.body.classList.remove('popup-open');
    if (push) history.pushState(null, '', '/blog');
  }

  function openOverlay(post, push) {
    closeOverlay(false);
    overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.innerHTML = `
      <div class="popup-backdrop"></div>
      <article class="post-card">${buildCard(post)}</article>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add('popup-open');

    overlay.querySelector('.popup-backdrop').addEventListener('click', () => closeOverlay(true));
    overlay.querySelector('.popup-close').addEventListener('click', () => closeOverlay(true));
    initHeroSignal(overlay);

    if (push) history.pushState({ slug: post.slug }, '', `/blog/${post.slug}`);
  }

  async function loadAndOpen(slug, push) {
    try {
      const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error('not found');
      // Mirrors api/_lib/signal-for-slug.js exactly — the post JSON doesn't
      // carry its signal, so this derives the same deterministic choice
      // from the slug, keeping the popup's hero in sync with the grid
      // panel it was opened from. Keep both in sync if this changes.
      let hash = 0;
      for (let i = 0; i < json.post.slug.length; i++) hash = (hash * 31 + json.post.slug.charCodeAt(i)) | 0;
      const types = ['wave', 'scan', 'swarm', 'matrix'];
      json.post.signal = types[Math.abs(hash) % types.length];
      openOverlay(json.post, push);
    } catch {
      // Fall back to a real navigation rather than fail silently — the
      // same URL still works as a normal page load.
      location.href = `/blog/${slug}`;
    }
  }

  main.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href^="/blog/"]');
    if (!link) return;
    e.preventDefault();
    const slug = link.getAttribute('href').replace(/^\/blog\//, '');
    loadAndOpen(slug, true);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay) closeOverlay(true);
  });

  window.addEventListener('popstate', () => {
    const match = location.pathname.match(/^\/blog\/(.+)$/);
    if (match) {
      loadAndOpen(decodeURIComponent(match[1]), false);
    } else {
      closeOverlay(false);
    }
  });

  // Wire up the grid's own signal canvases (the ones rendered server-side
  // for posts with no featured image) — separate from the popup's hero,
  // which builds and initializes its own canvas on demand.
  document.querySelectorAll('.panel .signal canvas[data-sig]').forEach(canvas => {
    if (window.BlogSignals) window.BlogSignals.init(canvas, canvas.dataset.sig, canvas.dataset.seed);
  });
})();
