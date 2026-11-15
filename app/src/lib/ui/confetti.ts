/** A small gold-and-navy confetti burst (blueprint: once per lesson that reaches 100). Skipped with reduced motion. */
export function confetti(count = 90) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:90';
  c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
  c.setAttribute('aria-hidden', 'true');
  document.body.appendChild(c);
  const g = c.getContext('2d')!; g.scale(devicePixelRatio, devicePixelRatio);
  const colours = ['#E2BC4F', '#B8901C', '#13294B', '#2B4E86', '#F3E7C2'];
  const ps = Array.from({ length: count }, () => ({ x: innerWidth / 2, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 3, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, s: 5 + Math.random() * 6, c: colours[Math.floor(Math.random() * colours.length)] }));
  const start = performance.now();
  const frame = (now: number) => {
    const t = now - start;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) { p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.r += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.globalAlpha = Math.max(0, 1 - t / 1200); g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }
    if (t < 1200) requestAnimationFrame(frame); else c.remove();
  };
  requestAnimationFrame(frame);
}
