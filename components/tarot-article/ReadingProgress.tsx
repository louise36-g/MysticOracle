import { motion } from 'framer-motion';
import { useReadingProgress } from './hooks';

/**
 * Reading progress bar - shows scroll progress at top of page
 * Displays a gradient bar with animated shimmer effect
 */
export function ReadingProgress() {
  const progress = useReadingProgress();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-900/80 backdrop-blur-sm">
      <motion.div
        className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-400"
        style={{ width: `${progress}%` }}
      />
      <motion.div
        className="absolute top-0 h-full w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
        style={{ left: `calc(${progress}% - 2rem)` }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
