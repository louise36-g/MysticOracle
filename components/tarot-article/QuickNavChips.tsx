import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { QuickNavChipsProps } from './types';

/**
 * Horizontal scrollable navigation chips for quick section access
 *
 * Design: Elegant pill-shaped buttons with gradient backgrounds
 * - Scroll arrows on desktop when content overflows
 * - Smooth horizontal scrolling on mobile
 * - Staggered entrance animation
 */
// Color palette for section pills — each section gets a distinct color
const CHIP_COLORS = [
  { text: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   numBg: 'bg-amber-500/20',  numText: 'text-amber-300',   hoverBorder: 'hover:border-amber-400/50' },
  { text: 'text-purple-300',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  numBg: 'bg-purple-500/20', numText: 'text-purple-300',  hoverBorder: 'hover:border-purple-400/50' },
  { text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', numBg: 'bg-emerald-500/20', numText: 'text-emerald-300', hoverBorder: 'hover:border-emerald-400/50' },
  { text: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    numBg: 'bg-rose-500/20',   numText: 'text-rose-300',    hoverBorder: 'hover:border-rose-400/50' },
  { text: 'text-cyan-300',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    numBg: 'bg-cyan-500/20',   numText: 'text-cyan-300',    hoverBorder: 'hover:border-cyan-400/50' },
  { text: 'text-violet-300',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  numBg: 'bg-violet-500/20', numText: 'text-violet-300',  hoverBorder: 'hover:border-violet-400/50' },
];

export function QuickNavChips({ sections, onSectionClick }: QuickNavChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [sections]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (sections.length === 0) return null;

  return (
    <div className="relative mt-6 mb-2">
      {/* Top divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-4" />

      {/* Scroll left button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center bg-slate-900/90 border border-purple-500/20 rounded-full text-purple-300 hover:text-purple-200 hover:border-purple-500/40 transition-all shadow-lg"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Scroll right button */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center bg-slate-900/90 border border-purple-500/20 rounded-full text-purple-300 hover:text-purple-200 hover:border-purple-500/40 transition-all shadow-lg"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Scrollable container - centered */}
      <div
        ref={scrollRef}
        className="flex justify-center gap-2 overflow-x-auto scrollbar-hide py-3 px-4"
      >
        {sections.map((section, index) => {
          const color = CHIP_COLORS[index % CHIP_COLORS.length];
          return (
            <motion.button
              key={section.id}
              onClick={() => onSectionClick(section.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className={`group relative flex-shrink-0 px-4 py-1.5 rounded-full ${color.bg} border ${color.border} ${color.hoverBorder} ${color.text} text-sm font-medium whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2`}
            >
              <span className={`w-5 h-5 rounded-full ${color.numBg} ${color.numText} text-xs font-semibold flex items-center justify-center`}>
                {index + 1}
              </span>
              <span>{section.shortLabel}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile scroll hint */}
      <div className="sm:hidden flex justify-center mt-2">
        <div className="flex gap-1">
          {sections.slice(0, 5).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-purple-500/30"
            />
          ))}
          {sections.length > 5 && (
            <span className="text-xs text-purple-400/50 ml-1">
              +{sections.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Bottom divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mt-4" />
    </div>
  );
}
