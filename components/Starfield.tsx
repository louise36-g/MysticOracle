import { useEffect, useRef, useCallback } from 'react';

/**
 * Animated canvas starfield with visible star movement and scroll-based fade.
 *
 * Stars drift across the screen at varying speeds (parallax depth layers).
 * Fades to transparent as the user scrolls past the hero area.
 * Respects prefers-reduced-motion (shows static stars, no animation).
 */

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  phase: number;
  twinkleSpeed: number;
  /** Horizontal velocity (px per second) */
  vx: number;
  /** Vertical velocity (px per second) */
  vy: number;
  /** Depth layer 0–1 (0 = far/slow/dim, 1 = close/fast/bright) */
  depth: number;
  /** Color warmth offset */
  warmth: number;
}

const STAR_COUNT = 450;
const FADE_START = 300;
const FADE_END = 1400;

function createStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const depth = Math.random();
    // Deeper stars are smaller and dimmer, closer ones are bigger and brighter
    const baseSize = 0.5 + depth * 2.5;
    // Speed scales with depth — close stars move faster
    const speed = 3 + depth * 18;
    // Mostly drifting right and slightly upward, with some variation
    const angle = (-0.15 + Math.random() * 0.3); // radians, roughly horizontal
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: baseSize,
      baseAlpha: 0.3 + depth * 0.7,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.4 + Math.random() * 1.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      depth,
      warmth: (Math.random() - 0.4) * 40,
    });
  }
  return stars;
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animRef = useRef<number>(0);
  const scrollRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const lastTimeRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = sizeRef.current;
    if (w === 0) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    // Delta time for smooth movement regardless of frame rate
    const dt = lastTimeRef.current === 0 ? 0.016 : Math.min((time - lastTimeRef.current) * 0.001, 0.1);
    lastTimeRef.current = time;

    // Scroll-based global opacity
    const scroll = scrollRef.current;
    const globalAlpha =
      scroll <= FADE_START ? 1
        : scroll >= FADE_END ? 0
        : 1 - (scroll - FADE_START) / (FADE_END - FADE_START);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (globalAlpha <= 0) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const stars = starsRef.current;
    const reduced = reducedMotionRef.current;
    const t = time * 0.001;

    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];

      // Move stars (unless reduced motion)
      if (!reduced && dt > 0) {
        star.x += star.vx * dt;
        star.y += star.vy * dt;

        // Wrap around edges with padding
        if (star.x > w + 10) star.x = -10;
        if (star.x < -10) star.x = w + 10;
        if (star.y > h + 10) star.y = -10;
        if (star.y < -10) star.y = h + 10;
      }

      // Twinkle (floor at 65% so stars stay visible)
      const twinkle = reduced
        ? star.baseAlpha
        : star.baseAlpha * (0.65 + 0.35 * Math.sin(t * star.twinkleSpeed + star.phase));

      const alpha = twinkle * globalAlpha;
      if (alpha < 0.01) continue;

      // Star color with warm/cool tint
      const r = Math.min(255, Math.max(180, 230 + star.warmth));
      const g = Math.min(255, Math.max(180, 225 + star.warmth * 0.3));
      const b = Math.min(255, Math.max(200, 240 - star.warmth * 0.5));

      // Draw star core
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();

      // Medium stars: soft glow
      if (star.size > 1.2 && alpha > 0.2) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`;
        ctx.fill();
      }

      // Large close stars: bigger halo
      if (star.size > 2.0 && alpha > 0.3) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.07})`;
        ctx.fill();
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', handleMotionChange);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      sizeRef.current = { w, h };
      starsRef.current = createStars(w, h);
      lastTimeRef.current = 0;
    };

    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };

    resize();
    onScroll();

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      mq.removeEventListener('change', handleMotionChange);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1] pointer-events-none"
      aria-hidden="true"
    />
  );
}
