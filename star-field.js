// Standalone port of index.html's particle field (initStars/sizeStars/
// drawStars) — same stars/dust/meteor logic, lifted out of the React
// component since the blog pages don't use support.js or React at all.
// Deliberately excludes the WebGL black hole hero: that's a per-pixel
// ray-marched shader, expensive by design, and only ever meant for the
// hero section. This is the cheap half of the main site's background —
// one requestAnimationFrame loop, throttled on visibilitychange, same as
// the original.
(function () {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;pointer-events:none;z-index:0';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  const t0 = performance.now();
  let visible = document.visibilityState !== 'hidden';
  let dpr = 1;

  const stars = [];
  for (let i = 0; i < 170; i++) stars.push({
    x: Math.random(), y: Math.random(), z: 0.22 + Math.random() * 0.78,
    s: 0.5 + Math.random() * 1.5, ph: Math.random() * 6.283,
    vx: (Math.random() - 0.5) * 0.0000075, vy: -(0.000004 + Math.random() * 0.000012),
  });
  const dust = [];
  for (let i = 0; i < 22; i++) dust.push({
    x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7,
    s: 40 + Math.random() * 150, ph: Math.random() * 6.283,
  });
  const meteors = [];
  let nextMeteor = 2.5;

  function sizeCanvas() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * d), h = Math.floor(canvas.clientHeight * d);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    dpr = d;
  }

  function draw(t) {
    sizeCanvas();
    const W = canvas.width, H = canvas.height, ms = t * 1000;
    ctx.clearRect(0, 0, W, H);
    const sc = window.scrollY || window.pageYOffset || 0;
    ctx.globalCompositeOperation = 'lighter';

    for (const d of dust) {
      let y = (d.y + ms * 0.0000045 * d.z - sc * 0.00012 * d.z) % 1; if (y < 0) y += 1;
      const x = d.x * W, yy = y * H, r = d.s * d.z * dpr;
      const a = (0.020 + 0.016 * Math.sin(ms * 0.00022 + d.ph)) * d.z;
      const g = ctx.createRadialGradient(x, yy, 0, x, yy, r);
      g.addColorStop(0, 'rgba(255,138,66,' + a.toFixed(4) + ')');
      g.addColorStop(1, 'rgba(255,138,66,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, yy, r, 0, 6.2832); ctx.fill();
    }

    for (const p of stars) {
      let x = (p.x + p.vx * ms) % 1; if (x < 0) x += 1;
      let y = (p.y + p.vy * ms - sc * 0.00022 * p.z) % 1; if (y < 0) y += 1;
      const tw = 0.45 + 0.55 * Math.sin(ms * 0.0009 * (0.4 + p.z) + p.ph);
      ctx.globalAlpha = Math.max(0, (0.10 + 0.62 * p.z * p.z) * tw);
      ctx.fillStyle = p.z > 0.82 ? '#FFE7D2' : (p.z > 0.5 ? '#EDEFF5' : '#B9C2D6');
      const s = Math.max(1, p.s * p.z * dpr);
      ctx.fillRect(x * W, y * H, s, s);
    }

    if (t > nextMeteor) {
      nextMeteor = t + 3.5 + Math.random() * 7.5;
      const fromLeft = Math.random() > 0.45;
      const ang = (fromLeft ? 0.36 : 0.62) + Math.random() * 0.18;
      meteors.push({
        x: fromLeft ? -0.06 + Math.random() * 0.35 : 0.55 + Math.random() * 0.5,
        y: -0.05 + Math.random() * 0.35,
        dx: (fromLeft ? 1 : -1) * Math.cos(ang), dy: Math.sin(ang),
        life: 0, dur: 0.85 + Math.random() * 0.75,
        len: 0.10 + Math.random() * 0.16,
        w: 1.0 + Math.random() * 1.6,
        warm: Math.random() > 0.6,
      });
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.life += 1 / 60;
      const k = m.life / m.dur;
      if (k >= 1) { meteors.splice(i, 1); continue; }
      const travel = 1.35 * k;
      const hx = (m.x + m.dx * travel) * W, hy = (m.y + m.dy * travel) * H;
      const L = m.len * Math.max(W, H);
      const tx = hx - m.dx * L, ty = hy - m.dy * L;
      const fade = Math.sin(Math.min(1, k) * 3.14159);
      const grad = ctx.createLinearGradient(tx, ty, hx, hy);
      const core = m.warm ? '255,226,190' : '226,238,255';
      grad.addColorStop(0, 'rgba(' + core + ',0)');
      grad.addColorStop(0.62, 'rgba(' + core + ',' + (0.16 * fade).toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(255,255,255,' + (0.85 * fade).toFixed(3) + ')');
      ctx.strokeStyle = grad;
      ctx.lineWidth = m.w * dpr;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      const gg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 9 * dpr * m.w);
      gg.addColorStop(0, 'rgba(255,252,246,' + (0.75 * fade).toFixed(3) + ')');
      gg.addColorStop(1, 'rgba(255,240,220,0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(hx, hy, 9 * dpr * m.w, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop() {
    requestAnimationFrame(loop);
    if (visible) draw((performance.now() - t0) / 1000);
  }
  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState !== 'hidden';
  });
  requestAnimationFrame(loop);
})();
