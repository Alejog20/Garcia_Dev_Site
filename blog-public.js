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

  function buildCard(post) {
    const hero = post.featured_image_url
      ? `<img class="hero-image" src="${escapeHtml(post.featured_image_url)}" alt="">`
      : '';
    return `
      <button type="button" class="popup-close" aria-label="Close">&times;</button>
      ${hero}
      <span class="post-date">${formatDate(post.published_at)}</span>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="post-body">${post.body_html}</div>
    `;
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

    if (push) history.pushState({ slug: post.slug }, '', `/blog/${post.slug}`);
  }

  async function loadAndOpen(slug, push) {
    try {
      const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error('not found');
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
})();
