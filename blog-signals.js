// Shared generative "signal" visuals for the Control Room blog design —
// used both by the /blog panel grid (api/blog-index.js) and by individual
// post heroes (api/blog-post.js direct loads, and blog-public.js's popup)
// when a post has no featured_image_url. One definition, three call sites,
// so the grid panel and the article you land on from it always show the
// exact same signal — the popup/page doesn't invent a different one.
(function (global) {
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TYPES = ['wave', 'scan', 'swarm', 'matrix'];

  // Deterministic per-post RNG — same seed always draws the same swarm
  // layout, so a post's signal doesn't reshuffle between page loads.
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function seedFromString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return h || 1;
  }

  // The orbit signal is reserved for the single most recent post — it
  // marks "this is current," so it's never assigned to anything else.
  function typeForIndex(index) {
    return TYPES[index % TYPES.length];
  }

  function orbit(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.78, cy = h * 0.32, rx = w * 0.34, ry = h * 0.22;
    ctx.strokeStyle = 'rgba(255,106,31,.16)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, -0.3, 0, 6.2832); ctx.stroke();
    const a = t * 0.0006;
    const px = cx + Math.cos(a) * rx * Math.cos(0.3) - Math.sin(a) * ry * Math.sin(0.3) * 0.3;
    const py = cy + Math.sin(a) * ry * Math.cos(0.3);
    const g = ctx.createRadialGradient(px, py, 0, px, py, 7);
    g.addColorStop(0, 'rgba(255,180,120,.9)');
    g.addColorStop(1, 'rgba(255,106,31,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px, py, 7, 0, 6.2832); ctx.fill();
  }

  function wave(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,106,31,.22)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const y = h * 0.6 + Math.sin(x * 0.045 + t * 0.0012) * h * 0.14;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function scan(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.82, cy = h * 0.75, r = Math.max(w, h) * 0.5;
    const a = (t * 0.0004) % 6.2832;
    if (ctx.createConicGradient) {
      const g = ctx.createConicGradient(a, cx, cy);
      g.addColorStop(0, 'rgba(255,106,31,.20)');
      g.addColorStop(0.08, 'rgba(255,106,31,0)');
      g.addColorStop(1, 'rgba(255,106,31,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,106,31,.14)';
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, 6.2832); ctx.stroke();
  }

  function swarm(ctx, w, h, t, pts) {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      const x = (p.x * w + Math.sin(t * 0.0003 + p.ph) * 10) % w;
      const y = (p.y * h + Math.cos(t * 0.0002 + p.ph) * 8 + h) % h;
      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 0.0008 + p.ph);
      ctx.fillStyle = '#FF8C4A';
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }

  function matrix(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    const cols = 10, rows = 6;
    const gx = w / cols, gy = h / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      ctx.fillStyle = 'rgba(255,106,31,.12)';
      ctx.beginPath(); ctx.arc(gx * i + gx / 2, gy * j + gy / 2, 1, 0, 6.2832); ctx.fill();
    }
    const pulse = (Math.sin(t * 0.0012) + 1) / 2;
    const pi = 3, pj = 2;
    const g = ctx.createRadialGradient(gx * pi + gx / 2, gy * pj + gy / 2, 0, gx * pi + gx / 2, gy * pj + gy / 2, 14 + pulse * 6);
    g.addColorStop(0, 'rgba(255,180,120,' + (0.5 + pulse * 0.3) + ')');
    g.addColorStop(1, 'rgba(255,106,31,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(gx * pi + gx / 2, gy * pj + gy / 2, 14 + pulse * 6, 0, 6.2832); ctx.fill();
  }

  // Mounts a signal animation onto `canvas`, sized to its CSS box. Returns a
  // stop() function (not usually needed — these are decorative background
  // loops that just die with the page/element).
  function init(canvas, sig, seedStr) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = canvas.getContext('2d');
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const rand = mulberry32(seedFromString(seedStr || sig));
    const swarmPts = sig === 'swarm'
      ? Array.from({ length: 40 }, () => ({ x: rand(), y: rand(), ph: rand() * 6.283 }))
      : null;

    let stopped = false;
    function frame(t) {
      if (stopped) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (sig === 'orbit') orbit(ctx, w, h, t);
      else if (sig === 'wave') wave(ctx, w, h, t);
      else if (sig === 'scan') scan(ctx, w, h, t);
      else if (sig === 'swarm') swarm(ctx, w, h, t, swarmPts);
      else if (sig === 'matrix') matrix(ctx, w, h, t);
      if (!REDUCED) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return function stop() { stopped = true; };
  }

  global.BlogSignals = { TYPES, typeForIndex, init };
})(window);
