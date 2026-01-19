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
        {sections.map((section, index) => (
          <motion.button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
            className="group relative flex-shrink-0"
          >
            {/* Background gradient on hover */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/15 to-fuchsia-500/15 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />

            {/* Button content - rectangular with soft corners */}
            <div className="relative px-3.5 py-1.5 bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-purple-500/30 rounded-lg text-sm text-slate-400 hover:text-purple-200 whitespace-nowrap transition-all duration-200 flex items-center gap-2">
              {/* Number badge - square with soft corners */}
              <span className="w-5 h-5 rounded bg-slate-700/60 text-slate-400 text-xs font-medium flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                {index + 1}
              </span>
              <span className="font-medium">{section.shortLabel}</span>
            </div>
          </motion.button>
        ))}
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
