import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, ChevronRight } from 'lucide-react';
import { TableOfContentsProps } from './types';

/**
 * Floating Table of Contents (Desktop XL+)
 *
 * Design: Elegant vertical navigation with progress indicator
 * - Collapsed: Minimal floating pill with section count
 * - Expanded: Full section list with active highlighting
 */
export function TableOfContents({
  sections,
  activeSection,
  onSectionClick,
}: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show TOC only after scrolling past the header
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (sections.length === 0) return null;

  // Calculate progress through sections
  const activeIndex = sections.findIndex((s) => s.id === activeSection);
  const progress = activeIndex >= 0 ? ((activeIndex + 1) / sections.length) * 100 : 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="hidden xl:block fixed right-0 top-0 bottom-0 w-48 z-40"
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          {/* Inner container for TOC positioning */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              /* ===== EXPANDED STATE ===== */
              <motion.nav
                key="expanded"
                initial={{ opacity: 0, width: 56, scale: 0.95 }}
                animate={{ opacity: 1, width: 220, scale: 1 }}
                exit={{ opacity: 0, width: 56, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                className="relative bg-slate-900/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden"
                aria-label="Table of contents"
              >
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-purple-500/10">
                  <div className="flex items-center gap-2 text-purple-300">
                    <List className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Contents
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Section list */}
                <div className="py-2 max-h-[50vh] overflow-y-auto scrollbar-hide">
                  {sections.map((section, index) => {
                    const isActive = activeSection === section.id;
                    const isPast = activeIndex > index;

                    return (
                      <motion.button
                        key={section.id}
                        onClick={() => onSectionClick(section.id)}
                        className={`
                          w-full text-left px-4 py-2.5 flex items-center gap-3
                          transition-all duration-200 group relative
                          ${isActive
                            ? 'text-purple-200 bg-purple-500/15'
                            : isPast
                              ? 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/5'
                              : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/5'
                          }
                        `}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Index number */}
                        <span
                          className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                            transition-all duration-200
                            ${isActive
                              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                              : isPast
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-slate-800 text-slate-500 group-hover:bg-purple-500/10 group-hover:text-purple-400'
                            }
                          `}
                        >
                          {index + 1}
                        </span>

                        {/* Label */}
                        <span className="text-sm truncate flex-1">
                          {section.shortLabel}
                        </span>

                        {/* Active indicator */}
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-purple-400" />
                        )}

                        {/* Left border for active */}
                        {isActive && (
                          <motion.div
                            layoutId="toc-active-border"
                            className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 to-fuchsia-400"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.nav>
            ) : (
              /* ===== COLLAPSED STATE ===== */
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="relative"
              >
                {/* Vertical progress track */}
                <div className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-0.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="w-full bg-gradient-to-b from-purple-500 to-fuchsia-500"
                    style={{ height: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Dot indicators */}
                <div className="relative bg-slate-900/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-2.5 flex flex-col items-center gap-2">
                  {sections.map((section, index) => {
                    const isActive = activeSection === section.id;
                    const isPast = activeIndex > index;

                    return (
                      <button
                        key={section.id}
                        onClick={() => onSectionClick(section.id)}
                        className="relative group"
                        aria-label={section.title}
                        title={section.title}
                      >
                        <motion.div
                          className={`
                            w-2.5 h-2.5 rounded-full transition-all duration-300
                            ${isActive
                              ? 'bg-purple-400 scale-150'
                              : isPast
                                ? 'bg-purple-500/50'
                                : 'bg-slate-600 group-hover:bg-purple-400/60'
                            }
                          `}
                          whileHover={{ scale: 1.3 }}
                        />
                        {/* Glow effect for active */}
                        {isActive && (
                          <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-50 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
