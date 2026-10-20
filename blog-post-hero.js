// Initializes a direct-loaded post page's hero signal canvas — the popup
// equivalent (blog-public.js) does this itself when it builds the overlay;
// this is the plain-page-load counterpart for /blog/:slug.
(function () {
  const canvas = document.querySelector('.post-card .hero canvas[data-sig]');
  if (canvas && window.BlogSignals) window.BlogSignals.init(canvas, canvas.dataset.sig, canvas.dataset.seed);
})();
