import { useEffect, useRef, useCallback } from 'react';

/**
 * Animated canvas starfield — stars radiate outward from center,
 * creating a "flying through space" parallax effect.
 *
 * Fades to transparent as the user scrolls past the hero area.
 * Respects prefers-reduced-motion (shows static stars, no animation).
 */

interface Star {
  /** Angle from center (radians) */
  angle: number;
  /** Distance from center as a fraction of max radius (0 = center, 1 = edge) */
  dist: number;
  /** Speed multiplier — how fast this star moves outward */
  speed: number;
  size: number;
  baseAlpha: number;
  phase: number;
  twinkleSpeed: number;
  warmth: number;
}

const STAR_COUNT = 500;
const FADE_START = 300;
const FADE_END = 1400;
/** How quickly stars travel outward (fraction of radius per second) */
const BASE_SPEED = 0.06;

function createStar(): Star {
  return {
    angle: Math.random() * Math.PI * 2,
    // Start scattered across the full radius so the field looks full immediately
    dist: Math.random(),
    speed: 0.4 + Math.random() * 0.8,
    size: 0.3 + Math.random() * 0.5, // Starts small, grows as it moves out
    baseAlpha: 0.5 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.4 + Math.random() * 1.5,
    warmth: (Math.random() - 0.4) * 40,
  };
}

function createStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, createStar);
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

    const dt = lastTimeRef.current === 0
      ? 0.016
      : Math.min((time - lastTimeRef.current) * 0.001, 0.1);
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

    const cx = w / 2;
    const cy = h / 2;
    // Max radius — distance from center to corner
    const maxR = Math.sqrt(cx * cx + cy * cy);
    const stars = starsRef.current;
    const reduced = reducedMotionRef.current;
    const t = time * 0.001;

    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];

      // Move star outward from center
      if (!reduced && dt > 0) {
        star.dist += BASE_SPEED * star.speed * dt;

        // When star reaches edge, respawn near center
        if (star.dist > 1) {
          star.dist = 0.005 + Math.random() * 0.05;
          star.angle = Math.random() * Math.PI * 2;
          star.speed = 0.4 + Math.random() * 0.8;
          star.warmth = (Math.random() - 0.4) * 40;
        }
      }

      const d = star.dist;

      // Size grows as star moves outward (far = tiny dot, close = bigger)
      const currentSize = 0.3 + d * d * 3.0;

      // Brightness increases as star moves outward (fade in from center, bright at edges)
      const distAlpha = d < 0.1 ? d / 0.1 : 1; // Fade in near center

      // Twinkle
      const twinkle = reduced
        ? star.baseAlpha
        : star.baseAlpha * (0.65 + 0.35 * Math.sin(t * star.twinkleSpeed + star.phase));

      const alpha = twinkle * distAlpha * globalAlpha;
      if (alpha < 0.01) continue;

      // Convert polar to screen coordinates
      const px = cx + Math.cos(star.angle) * d * maxR;
      const py = cy + Math.sin(star.angle) * d * maxR;

      // Star color
      const r = Math.min(255, Math.max(180, 230 + star.warmth));
      const g = Math.min(255, Math.max(180, 225 + star.warmth * 0.3));
      const b = Math.min(255, Math.max(200, 240 - star.warmth * 0.5));

      // Draw star core
      ctx.beginPath();
      ctx.arc(px, py, currentSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();

      // Soft glow on medium stars
      if (currentSize > 1.0 && alpha > 0.2) {
        ctx.beginPath();
        ctx.arc(px, py, currentSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.12})`;
        ctx.fill();
      }

      // Bigger halo on large stars near the edge
      if (currentSize > 2.0 && alpha > 0.3) {
        ctx.beginPath();
        ctx.arc(px, py, currentSize * 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.06})`;
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
      // Only regenerate stars on first load, not on resize (preserves animation state)
      if (starsRef.current.length === 0) {
        starsRef.current = createStars();
      }
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
