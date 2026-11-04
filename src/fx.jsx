import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Ornate frame. Every moving part is a GPU transform/opacity        */
/*  animation (no filters, no per-frame repaints) so it stays smooth. */
/*   ring    crisp thin edge (no outer glow)                           */
/*   comet   small light running up the left / down the right side     */
/*   corners highlighted ornaments                                     */
/*   flames  soft low flame on big frames                              */
/*   dust    looping aura motes on head + footer of big frames         */
/* ------------------------------------------------------------------ */
const CURL = 'M15 15 C22 15 24 22 31 22 C36 22 38 18 35 15 C33 13 30 14 30 16 M15 15 C15 22 22 24 22 31 C22 36 18 38 15 35 C13 33 14 30 16 30';

function CornerArt({ k }) {
  return (
    <>
      <path d="M3 54 V15 C3 8 8 3 15 3 H54" strokeWidth={2 * k} />
      <path d="M9 46 V17 C9 12 12 9 17 9 H46" strokeWidth={1.5 * k} opacity=".6" />
      <path d={CURL} strokeWidth={1.5 * k} />
      <path d="M3 24 H10 M24 3 V10" strokeWidth={1.5 * k} opacity=".7" />
    </>
  );
}

function Corner({ pos }) {
  // static design (stays pale) + lit overlay in the level colour that glows up and down like a bulb
  return (
    <>
      <svg className={`frame__corner frame__corner--${pos}`} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <g opacity=".3"><CornerArt k={2.4} /></g>
        <CornerArt k={1.1} />
        <g stroke="#fff" opacity=".85"><CornerArt k={.45} /></g>
        <circle cx="3" cy="58" r="2" fill="currentColor" stroke="none" />
        <circle cx="58" cy="3" r="2" fill="currentColor" stroke="none" />
      </svg>
      <svg className={`frame__corner frame__corner--${pos} frame__lit`} viewBox="0 0 64 64" fill="none" stroke="var(--energy)" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="16" cy="16" r="24" fill="var(--energy)" stroke="none" opacity=".16" />
        <g opacity=".42"><CornerArt k={6.5} /></g>
        <g opacity=".8"><CornerArt k={3} /></g>
        <g stroke="var(--energy2)"><CornerArt k={1.6} /></g>
        <circle cx="3" cy="58" r="3" fill="var(--energy2)" stroke="none" />
        <circle cx="58" cy="3" r="3" fill="var(--energy2)" stroke="none" />
      </svg>
    </>
  );
}

const GEM_PATH = 'M2 8 H40 M80 8 H118 M40 8 C46 8 50 3 54 3 M80 8 C74 8 70 3 66 3 M40 8 C46 8 50 13 54 13 M80 8 C74 8 70 13 66 13';
function Gem() {
  return (
    <>
      <svg className="frame__gem" viewBox="0 0 120 16" fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
        <g opacity=".3" strokeWidth="3.4"><path d={GEM_PATH} /></g>
        <g strokeWidth="1.4"><path d={GEM_PATH} /></g>
        <path d="M60 1.5 L67 8 L60 14.5 L53 8 Z" fill="#000" stroke="#fff" strokeWidth="1.4" opacity=".9" />
      </svg>
      <svg className="frame__gem frame__lit" viewBox="0 0 120 16" fill="none" stroke="var(--energy)" strokeLinecap="round" aria-hidden="true">
        <g opacity=".42" strokeWidth="8"><path d={GEM_PATH} /></g>
        <g stroke="var(--energy2)" strokeWidth="2"><path d={GEM_PATH} /></g>
        <path d="M60 1.5 L67 8 L60 14.5 L53 8 Z" fill="var(--energy)" fillOpacity=".5" stroke="var(--energy2)" strokeWidth="1.8" />
        <circle cx="60" cy="8" r="2.4" fill="#fff" stroke="none" />
      </svg>
    </>
  );
}

// soft flame plumes (tall, blurry-looking radial gradients) + a thin wavy light line on the edge
const WAVE = 'M0 5 C10 2 14 8 24 5 S38 1 48 5 S62 9 72 4 S88 2 100 5 S114 8 124 5 S138 2 150 5 S164 9 174 4 S190 2 200 5';
const Flames = ({ edge }) =>
  (edge === 'both' ? ['top', 'bottom'] : [edge]).map((r) => (
    <div className={`flames flames--${r}`} key={r} aria-hidden="true">
      {[1, 2, 3, 4, 5, 6, 7].map((n) => <i key={n} className={`p p${n}`} />)}
      <span className="flames__wave"><svg viewBox="0 0 200 10" preserveAspectRatio="none"><path d={WAVE} vectorEffect="non-scaling-stroke" /><path d={WAVE} transform="translate(200 0)" vectorEffect="non-scaling-stroke" /></svg></span>
    </div>
  ));

// fixed, hand-tuned motes: [left %, orbit width px, orbit height px, period s, delay s, size px]
// small orbit = a mote that hangs near the border, big orbit = one that wanders along it
const MOTES = [
  [6, 10, 12, 11, 0, 5], [19, 22, 16, 15, -4, 4], [31, 8, 10, 12, -7, 6], [44, 26, 14, 17, -2, 4],
  [57, 9, 13, 13, -9, 5], [69, 24, 17, 16, -5, 4], [82, 11, 11, 12, -11, 6], [94, 20, 15, 14, -6, 4],
];
export const Dust = ({ at }) => (
  <div className={`dust dust--${at}`} aria-hidden="true">
    {MOTES.map(([x, rx, ry, t, d, s], i) => (
      <i key={i} style={{ '--x': x + '%', '--rx': rx + 'px', '--ry': ry + 'px', '--t': t + 's', '--d': d + 's', '--s': s + 'px' }}><b /></i>
    ))}
  </div>
);

const BIG = { hero: 1, head: 1, alert: 1 };

export function Frame({ as: Tag = 'section', variant = 'card', flames, gem = true, dust, className = '', style, children, ...rest }) {
  const showDust = dust ?? !!BIG[variant];
  const isTile = variant === 'tile';
  const flameEdge = isTile ? null : (flames ?? 'both');
  const el = useRef(null);
  const [away, setAway] = useState(false);
  // pause every animation in a frame that is scrolled off-screen (big saving on phones)
  useEffect(() => {
    const node = el.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setAway(!e.isIntersecting), { rootMargin: '120px 0px' });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  // random phase so neighbouring panels never pulse in unison
  const phase = useRef(null);
  if (phase.current === null) phase.current = -(Math.random() * 6).toFixed(2);
  return (
    <Tag ref={el} className={`frame frame--${variant} ${away ? 'is-away' : ''} ${className}`} style={{ '--ph': `${phase.current}s`, ...style }} {...rest}>
      <i className="frame__ring" aria-hidden="true" />
      <b className="comet comet--r" aria-hidden="true"><i /></b>
      <b className="comet comet--l" aria-hidden="true"><i /></b>
      {flameEdge && <Flames edge={flameEdge} />}
      {isTile && <><i className="edgeglow edgeglow--top" aria-hidden="true" /><i className="edgeglow edgeglow--bottom" aria-hidden="true" /></>}
      {showDust && <><Dust at="top" /><Dust at="bottom" /></>}
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
      {gem && <Gem />}
      <div className="frame__body">{children}</div>
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  Full-screen canvas: rising embers, blue flame haze, lightning      */
/* ------------------------------------------------------------------ */
function sprite(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return c;
}

function readColor(probe, css) {
  probe.fillStyle = '#27baff';
  probe.fillStyle = css || '#27baff';
  const v = probe.fillStyle;
  if (v[0] === '#') return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
  const m = v.match(/[\d.]+/g) || [39, 186, 255];
  return [+m[0], +m[1], +m[2]];
}

function makeBolt(W, H, strong) {
  // enter from the top near one of the side edges and fork down
  const side = Math.random();
  const x0 = side < 0.4 ? W * (0.02 + Math.random() * 0.14) : side < 0.8 ? W * (0.84 + Math.random() * 0.14) : W * (0.2 + Math.random() * 0.6);
  const yEnd = H * (strong ? 0.55 + Math.random() * 0.4 : 0.28 + Math.random() * 0.5);
  const lines = [];
  const walk = (x1, y1, x2, y2, disp, depth, width) => {
    if (depth === 0 || Math.hypot(x2 - x1, y2 - y1) < 14) { lines.push([x1, y1, x2, y2, width]); return; }
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * disp;
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * disp * 0.35;
    walk(x1, y1, mx, my, disp / 2, depth - 1, width);
    walk(mx, my, x2, y2, disp / 2, depth - 1, width);
    if (depth === 3 && Math.random() < 0.55) {
      const bx = mx + (Math.random() - 0.5) * 220;
      walk(mx, my, bx, my + 60 + Math.random() * 150, 60, 3, width * 0.55);
    }
  };
  walk(x0, -10, x0 + (Math.random() - 0.5) * 260, yEnd, 130, 6, 1);
  return { lines, age: 0, life: strong ? 0.75 : 0.5, strong };
}

export function FxCanvas({ level, burst }) {
  const ref = useRef(null);
  const engine = useRef(null);

  useEffect(() => {
    if (level === 'off') return undefined;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const probe = document.createElement('canvas').getContext('2d');
    const high = level === 'high';
    const frameMs = high ? 0 : 1000 / 30 - 4; // medium: steady 30fps (margin keeps 60Hz screens from stuttering)
    let W = 0, H = 0, raf = 0, last = 0, alive = true, colorAt = -1e9;
    let rgb = [39, 186, 255], rgb2 = [179, 246, 255];
    let glow = null, flame = null;
    let embers = [], tongues = [], bolts = [], flash = 0;
    let nextBolt = performance.now() + 2200;

    const build = () => {
      const [r, g, b] = rgb, [r2, g2, b2] = rgb2;
      glow = sprite(48, 48, (c, w, h) => {
        const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, `rgba(${r2},${g2},${b2},1)`); gr.addColorStop(0.25, `rgba(${r},${g},${b},.8)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        c.fillStyle = gr; c.fillRect(0, 0, w, h);
      });
      flame = sprite(64, 128, (c, w, h) => {
        c.save(); c.translate(w / 2, h); c.scale(1, 2);
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, w / 2);
        gr.addColorStop(0, `rgba(${r2},${g2},${b2},.9)`); gr.addColorStop(0.35, `rgba(${r},${g},${b},.55)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        c.fillStyle = gr; c.beginPath(); c.arc(0, 0, w / 2, Math.PI, 0); c.fill(); c.restore();
      });
    };

    const seed = () => {
      const n = Math.round(Math.min(high ? 60 : 18, (W * H) / (high ? 18000 : 52000)));
      embers = Array.from({ length: n }, () => spawnEmber(true));
      const t = Math.max(6, Math.min(high ? 24 : 10, Math.round(W / (high ? 70 : 110))));
      tongues = Array.from({ length: t }, (_, i) => ({ x: ((i + 0.5) / t) * W, w: (W / t) * (1.6 + Math.random()), p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.1, a: 0.5 + Math.random() * 0.5 }));
    };
    const spawnEmber = (anywhere) => ({
      x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10 + Math.random() * 40,
      vy: 16 + Math.random() * 46, sway: 8 + Math.random() * 26, ph: Math.random() * 6.28, f: 1.5 + Math.random() * 3,
      s: 2.2 + Math.random() * 5.5, a: 0.25 + Math.random() * 0.6,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, high ? 1.25 : 1);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const drawBolts = (dt) => {
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.age += dt;
        if (b.age > b.life) { bolts.splice(i, 1); continue; }
        const k = 1 - b.age / b.life;
        // strobe: bright - dim - bright - fade
        const strobe = b.age < 0.07 ? 1 : b.age < 0.12 ? 0.25 : b.age < 0.2 ? 0.95 : k * 0.8;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const passes = [[7, 0.16, rgb], [3.2, 0.5, rgb], [1.3, 1, [255, 255, 255]]];
        passes.forEach(([lw, al, col]) => {
          ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${al * strobe})`;
          b.lines.forEach(([x1, y1, x2, y2, w]) => { ctx.lineWidth = lw * w * (b.strong ? 1.25 : 1); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
        });
      }
    };

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (now - last < frameMs) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (now - colorAt > 700) {
        colorAt = now;
        const cs = getComputedStyle(document.documentElement);
        const n1 = readColor(probe, cs.getPropertyValue('--energy').trim());
        const n2 = readColor(probe, cs.getPropertyValue('--energy2').trim());
        if (!glow || n1.join() !== rgb.join() || n2.join() !== rgb2.join()) { rgb = n1; rgb2 = n2; build(); }
      }
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      // blue flame haze along the bottom of the screen
      for (const f of tongues) {
        const hgt = H * (0.1 + 0.1 * (0.5 + 0.5 * Math.sin(t * f.s + f.p))) * f.a;
        ctx.globalAlpha = 0.2 + 0.1 * Math.sin(t * f.s * 1.7 + f.p);
        ctx.drawImage(flame, f.x - f.w / 2 + Math.sin(t * 0.6 + f.p) * 10, H - hgt, f.w, hgt);
      }
      // embers
      for (const e of embers) {
        e.y -= e.vy * dt; e.x += Math.sin(t * 0.9 + e.ph) * e.sway * dt;
        if (e.y < -20) Object.assign(e, spawnEmber(false));
        const life = Math.max(0, Math.min(1, e.y / H));
        ctx.globalAlpha = e.a * (0.45 + 0.55 * Math.sin(t * e.f + e.ph)) * (0.25 + life);
        ctx.drawImage(glow, e.x - e.s, e.y - e.s, e.s * 2, e.s * 2);
      }
      ctx.globalAlpha = 1;

      // lightning
      if (now > nextBolt) {
        bolts.push(makeBolt(W, H, false)); flash = 0.07;
        if (Math.random() < 0.3) bolts.push(makeBolt(W, H, false));
        nextBolt = now + (high ? 3200 + Math.random() * 5200 : 6500 + Math.random() * 7000);
      }
      drawBolts(dt);
      if (flash > 0.002) {
        ctx.globalAlpha = flash; ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
        flash *= 0.82;
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const onVis = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf && alive) { last = 0; raf = requestAnimationFrame(frame); }
    };

    engine.current = {
      burst: () => {
        bolts.push(makeBolt(W, H, true), makeBolt(W, H, true), makeBolt(W, H, false));
        flash = 0.22;
      },
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false; engine.current = null;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [level]);

  useEffect(() => { if (burst) engine.current?.burst(); }, [burst]);

  if (level === 'off') return null;
  return <canvas ref={ref} className="fx-canvas" aria-hidden="true" />;
}
