import { useEffect, useRef } from 'react';
import './hs-intro.css';

// The store's real welcome animation (hs-by-fiona: src/components/Intro.astro + src/lib/intro.ts),
// ported to run inside the demo frame instead of full screen.

const STEPS = ['s-scene', 's-l1', 's-l2', 's-l3', 's-cta'];
const SPRAY_ANGLE = 158;
const ROSE = [179, 92, 122] as const;
const GLOW = [232, 180, 196] as const;
const SPARK = '#5e2a4a';

type Point = { x: number; y: number };
type Particle = {
  kind: 'mist' | 'spark'; x: number; y: number; vx: number; vy: number; r: number; grow: number;
  life: number; max: number; alpha: number; sprite: HTMLCanvasElement; phase: number;
};

function sprite([r, g, b]: readonly [number, number, number]) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.45, `rgba(${r},${g},${b},.45)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  return c;
}

export default function HsIntro({ onShop, onScent }: { onShop: () => void; onScent: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flierRef = useRef<HTMLDivElement>(null);
  const shopRef = useRef<HTMLButtonElement>(null);
  const nozzleRef = useRef<SVGRectElement>(null);
  const leave = useRef<(after: () => void) => void>((after) => after());

  useEffect(() => {
    const root = rootRef.current!, stage = stageRef.current!, canvas = canvasRef.current!;
    const flier = flierRef.current!, shopButton = shopRef.current!, nozzleEl = nozzleRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rose = sprite(ROSE), glow = sprite(GLOW);
    const timers: number[] = [];
    let particles: Particle[] = [];
    let burstUntil = 0, ambient = false, running = true, raf = 0;
    let fly: { o: Point; c: Point; e: Point; t0: number } | null = null;
    let width = 0, height = 0;

    // Everything is measured relative to the demo frame, not the window.
    const local = (r: DOMRect): Point => {
      const b = root.getBoundingClientRect();
      return { x: r.left - b.left, y: r.top - b.top };
    };
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = root.clientWidth;
      height = root.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    const scale = () => Math.min(Math.max(width / 420, 0.9), 1.8);
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const nozzle = (): Point => {
      const r = nozzleEl.getBoundingClientRect();
      const p = local(r);
      return { x: p.x, y: p.y + r.height / 2 };
    };
    const center = (el: Element): Point => {
      const r = el.getBoundingClientRect();
      const p = local(r);
      return { x: p.x + r.width / 2, y: p.y + r.height / 2 };
    };

    function emit(o: Point, n: number, kind: Particle['kind'], spread: number, base: number, speed: [number, number], fade = 1) {
      for (let i = 0; i < n; i++) {
        const a = ((base + (Math.random() - 0.5) * spread) * Math.PI) / 180;
        const s = rand(speed[0], speed[1]) * scale();
        const mist = kind === 'mist';
        particles.push({
          kind, x: o.x, y: o.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          r: mist ? rand(2, 6) : rand(0.8, 2.2), grow: rand(0.3, 0.85), life: 0,
          max: mist ? rand(100, 220) : rand(60, 140), alpha: (mist ? rand(0.08, 0.2) : rand(0.55, 0.9)) * fade,
          sprite: Math.random() < 0.65 ? rose : glow, phase: Math.random() * 6.28,
        });
      }
    }

    function flyStep(now: number) {
      if (!fly) return;
      const t = Math.min((now - fly.t0) / 1200, 1);
      const u = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const v = 1 - u;
      const { o, c, e } = fly;
      const x = v * v * o.x + 2 * v * u * c.x + u * u * e.x;
      const y = v * v * o.y + 2 * v * u * c.y + u * u * e.y;
      flier.style.transform = `translate(${x}px, ${y}px) scale(${1 + 0.5 * Math.sin(u * Math.PI)})`;
      if (Math.random() < 0.9) emit({ x, y }, 1, 'spark', 360, 0, [0.2, 0.8]);
      if (Math.random() < 0.4) emit({ x, y }, 1, 'mist', 360, 0, [0.1, 0.4], 0.7);
      if (t === 1) {
        fly = null;
        flier.style.opacity = '0';
        shopButton.classList.add('intro-landed');
        emit(center(shopButton), 14, 'spark', 360, 0, [1, 3.5]);
      }
    }

    function frame(now: number) {
      if (!running) return;
      if (now < burstUntil) {
        const o = nozzle();
        emit(o, 4, 'mist', 40, SPRAY_ANGLE, [2.2, 6.5]);
        if (Math.random() < 0.5) emit(o, 1, 'spark', 50, SPRAY_ANGLE, [1.5, 5]);
      }
      if (ambient && Math.random() < 0.06) {
        const o = nozzle();
        emit({ x: o.x + rand(-0.25, 0.45) * width, y: o.y - Math.random() * height * 0.2 }, 1, 'mist', 60, -60, [0.2, 0.7], 0.5);
      }
      ctx.clearRect(0, 0, width, height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        const t = p.life / p.max;
        if (t >= 1) { particles.splice(i, 1); continue; }
        p.vx *= 0.965;
        p.vy = p.vy * 0.965 - 0.004;
        p.x += p.vx + Math.sin(p.phase + p.life * 0.035) * 0.22;
        p.y += p.vy;
        const envelope = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;
        if (p.kind === 'mist') {
          p.r += p.grow * (1 - t);
          ctx.globalAlpha = p.alpha * envelope;
          ctx.drawImage(p.sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        } else {
          ctx.globalAlpha = p.alpha * envelope * (0.55 + 0.45 * Math.sin(p.life * 0.35 + p.phase));
          ctx.fillStyle = SPARK;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      flyStep(now);
      raf = requestAnimationFrame(frame);
    }

    function startDrop() {
      const o = nozzle();
      const e = center(shopButton);
      const c = { x: Math.min(width - 24, Math.max(o.x, e.x) + width * 0.22), y: o.y - 90 };
      fly = { o, c, e, t0: performance.now() };
      flier.style.opacity = '1';
    }

    leave.current = (after) => {
      timers.forEach(clearTimeout);
      root.classList.add('intro-leaving');
      timers.push(window.setTimeout(after, reduceMotion ? 0 : 400));
    };

    raf = requestAnimationFrame(frame);
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    if (reduceMotion) {
      stage.classList.add('intro-play', 'intro-bliss', ...STEPS);
      shopButton.classList.add('intro-landed');
    } else {
      stage.classList.add('intro-play');
      at(250, () => stage.classList.add('s-scene'));
      at(1350, () => { stage.classList.add('intro-press'); burstUntil = performance.now() + 800; });
      at(1600, () => stage.classList.remove('intro-press'));
      at(1700, () => stage.classList.add('s-l1'));
      at(1750, () => stage.classList.add('intro-bliss'));
      at(2700, () => stage.classList.add('s-l2'));
      at(3200, () => stage.classList.add('s-l3'));
      at(3800, () => stage.classList.add('s-cta'));
      at(4400, () => { ambient = true; startDrop(); });
    }

    return () => {
      running = false;
      particles = [];
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="hs-introbox" ref={rootRef} aria-label="Welcome to Heavenscented by Fiona">
      <canvas className="intro-mist" ref={canvasRef} aria-hidden="true" />
      <div className="intro-flier" ref={flierRef} aria-hidden="true" />
      <div className="intro-stage" ref={stageRef}>
        <div className="intro-top">
          <span className="intro-mark" aria-hidden="true" />
        </div>
        <div className="intro-main">
          <div className="intro-scene">
            <div className="intro-figure">
              <svg viewBox="0 0 240 262" aria-hidden="true">
                <defs>
                  <linearGradient id="hsd-glass" x1="0" x2="1">
                    <stop offset="0" stopColor="#D48AA3" /><stop offset=".5" stopColor="#B35C7A" /><stop offset="1" stopColor="#6E2F4A" />
                  </linearGradient>
                  <linearGradient id="hsd-gold" x1="0" x2="1">
                    <stop offset="0" stopColor="#E9C58E" /><stop offset=".5" stopColor="#C99A55" /><stop offset="1" stopColor="#8F6A33" />
                  </linearGradient>
                  <linearGradient id="hsd-skin" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#8E5C3B" /><stop offset="1" stopColor="#6F4429" />
                  </linearGradient>
                </defs>
                <path fill="url(#hsd-skin)" d="M78 132C74 104 82 62 110 46C124 38 136 44 140 58C142 66 141 72 143 78C147 85 154 90 155 94C155 97 150 99 146 99C148 102 149 104 147 106C149 108 148 111 146 112C148 115 146 119 142 120C141 124 143 129 141 132C137 138 130 140 124 140C122 154 123 170 128 188C142 200 170 206 186 224L192 262L28 262C28 236 44 216 66 206C80 199 86 184 84 164Z" />
                <circle cx="72" cy="44" r="18" fill="#26151F" />
                <path fill="#26151F" d="M112 40C92 34 70 46 66 70C62 92 70 118 82 150C86 158 92 158 92 148C90 124 96 100 108 86C118 74 128 66 139 60C137 48 126 40 112 40Z" />
                <path d="M64 36Q72 30 82 34" stroke="#C99A55" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M125 71Q131 67.5 138 70" stroke="#26151F" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <ellipse className="intro-eye-open" cx="132" cy="79" rx="3.3" ry="1.9" fill="#26151F" />
                <path className="intro-eye-closed" d="M127.5 79Q132 82.5 136.5 79" stroke="#26151F" strokeWidth="1.7" fill="none" strokeLinecap="round" />
                <path d="M146 104.5Q149 106 146.5 108.5" stroke="#4E2A18" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                <circle cx="97" cy="114" r="5.5" stroke="#C99A55" strokeWidth="1.8" fill="none" />
                <path d="M124 182Q150 204 184 214" stroke="#C99A55" strokeWidth="1.4" fill="none" />
                <path fill="#5E2A4A" d="M28 262C30 242 40 230 58 224C100 214 150 218 190 232L192 262Z" />
                <g className="intro-arm">
                  <path d="M207 199C214 222 227 252 238 300" stroke="url(#hsd-skin)" strokeWidth="20" fill="none" strokeLinecap="round" />
                  <g transform="translate(0 62) rotate(-18 195 130)">
                    <ellipse cx="204" cy="128" rx="10" ry="16" fill="url(#hsd-skin)" />
                    <rect x="180" y="104" width="27" height="37" rx="6" fill="url(#hsd-glass)" />
                    <rect x="185" y="110" width="4" height="25" rx="2" fill="#FFF4F7" opacity=".35" />
                    <rect x="186.5" y="96" width="14" height="9" rx="1.5" fill="url(#hsd-gold)" />
                    <g className="intro-pump">
                      <rect x="187.5" y="86" width="12" height="11" rx="2.5" fill="url(#hsd-gold)" />
                      <rect ref={nozzleRef} x="181.5" y="89" width="6.5" height="3.6" rx="1.2" fill="#8F6A33" />
                    </g>
                    <g fill="#8E5C3B" stroke="#6F4429" strokeWidth=".7">
                      <rect x="177" y="117" width="15" height="7" rx="3.5" />
                      <rect x="177" y="124.5" width="14" height="7" rx="3.5" />
                      <rect x="178" y="132" width="12" height="6.5" rx="3.25" />
                      <ellipse cx="207" cy="114" rx="4.5" ry="7.5" />
                    </g>
                    <path d="M206 110C212 99 207 88 197 84" stroke="#8E5C3B" strokeWidth="6.5" fill="none" strokeLinecap="round" />
                    <ellipse className="intro-finger" cx="194" cy="82.5" rx="6.5" ry="3.8" fill="#8E5C3B" />
                  </g>
                </g>
              </svg>
            </div>
          </div>
          <div className="intro-copy">
            <p className="intro-eyebrow">Welcome to</p>
            <h1 className="intro-name" aria-label="Heavenscented">
              <span className="intro-word">
                {[...'Heavenscented'].map((c, i) => (
                  <span key={i} className="intro-ch" style={{ ['--i' as string]: i }}>{c}</span>
                ))}
              </span>
            </h1>
            <p className="intro-by">by Fiona</p>
            <p className="intro-l2">Perfumes <span>·</span> Mists <span>·</span> Diffusers &amp; more</p>
            <p className="intro-l3">Let’s elevate your fragrance spirit.</p>
            <div className="intro-ctas">
              <button type="button" className="intro-btn intro-primary" ref={shopRef} onClick={() => leave.current(onShop)}>Start shopping</button>
              <button type="button" className="intro-btn intro-secondary" onClick={() => leave.current(onScent)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.4l-1.8-4.9L5 9.7l5.2-1.8z" /><path d="M19 15v4M17 17h4" />
                </svg>
                Find my scent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
