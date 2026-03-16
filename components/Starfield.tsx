import { useEffect, useRef, useCallback } from 'react';

/**
 * Animated canvas starfield with scroll-based fade.
 *
 * Draws twinkling stars over the cosmic background image.
 * Fades to transparent as the user scrolls past the hero area,
 * leaving content sections with a clean readable background.
 *
 * Respects prefers-reduced-motion (shows static stars, no animation).
 */

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  /** Current twinkle phase (radians) */
  phase: number;
  /** Twinkle speed — how fast the star pulses */
  speed: number;
  /** Gentle vertical drift speed */
  drift: number;
  /** Color hue offset: 0 = white, positive = warm gold, negative = cool blue */
  warmth: number;
}

const STAR_COUNT = 500;
/** Stars fully visible until this scroll px, then fade until FADE_END */
const FADE_START = 300;
const FADE_END = 1400;

function createStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const roll = Math.random();
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      // 70% small (1–1.8px), 20% medium (1.8–2.8px), 10% large bright (2.8–3.8px)
      size: roll < 0.70 ? 1.0 + Math.random() * 0.8
        : roll < 0.90 ? 1.8 + Math.random() * 1.0
        : 2.8 + Math.random() * 1.0,
      baseAlpha: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 1.2,
      drift: 0.02 + Math.random() * 0.06,
      // Most stars white, some warm (gold), some cool (blue-purple)
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

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    // Scroll-based global opacity: 1 at top, 0 past FADE_END
    const scroll = scrollRef.current;
    const globalAlpha =
      scroll <= FADE_START
        ? 1
        : scroll >= FADE_END
          ? 0
          : 1 - (scroll - FADE_START) / (FADE_END - FADE_START);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (globalAlpha <= 0) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const stars = starsRef.current;
    const reduced = reducedMotionRef.current;
    const t = time * 0.001; // seconds

    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];

      // Twinkle: sinusoidal brightness oscillation (floor at 60% so stars stay visible)
      const twinkle = reduced
        ? star.baseAlpha
        : star.baseAlpha * (0.6 + 0.4 * Math.sin(t * star.speed + star.phase));

      const alpha = twinkle * globalAlpha;
      if (alpha < 0.01) continue;

      // Gentle drift (moves stars slowly upward, wrapping around)
      let y = star.y;
      if (!reduced) {
        y = star.y - t * star.drift * 10;
        // Wrap around
        y = ((y % height) + height) % height;
      }

      // Star color: white with a slight warm/cool tint
      const r = Math.min(255, Math.max(180, 230 + star.warmth));
      const g = Math.min(255, Math.max(180, 225 + star.warmth * 0.3));
      const b = Math.min(255, Math.max(200, 240 - star.warmth * 0.5));

      ctx.beginPath();
      ctx.arc(star.x, y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();

      // Medium stars get a soft glow, large stars get a stronger one
      if (star.size > 1.5 && alpha > 0.2) {
        ctx.beginPath();
        ctx.arc(star.x, y, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.18})`;
        ctx.fill();
      }
      if (star.size > 2.5 && alpha > 0.3) {
        ctx.beginPath();
        ctx.arc(star.x, y, star.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.08})`;
        ctx.fill();
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check reduced motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', handleMotionChange);

    // Size canvas to window
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      // Regenerate stars for new dimensions
      starsRef.current = createStars(window.innerWidth, window.innerHeight);
    };

    // Track scroll position
    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };

    resize();
    onScroll();

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Start animation
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
