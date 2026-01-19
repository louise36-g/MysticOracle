import { motion } from 'framer-motion';

/**
 * Loading skeleton for article page
 * Displays an animated placeholder while the article loads
 */
export function ArticleSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back button skeleton */}
      <div className="h-5 w-16 bg-slate-800/50 rounded mb-6" />

      {/* Breadcrumb skeleton */}
      <div className="flex gap-2 mb-6">
        <div className="h-4 w-12 bg-slate-800/50 rounded" />
        <div className="h-4 w-4 bg-slate-800/30 rounded" />
        <div className="h-4 w-24 bg-slate-800/50 rounded" />
        <div className="h-4 w-4 bg-slate-800/30 rounded" />
        <div className="h-4 w-32 bg-slate-800/50 rounded" />
      </div>

      {/* Title skeleton */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-12 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg w-4/5 mx-auto mb-4" />
        <div className="h-12 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg w-3/5 mx-auto" />
      </motion.div>

      {/* Meta skeleton */}
      <div className="flex justify-center gap-4 mb-6">
        <div className="h-4 bg-slate-800/50 rounded w-20" />
        <div className="h-4 bg-slate-800/30 rounded w-1" />
        <div className="h-4 bg-slate-800/50 rounded w-16" />
        <div className="h-4 bg-slate-800/30 rounded w-1" />
        <div className="h-4 bg-slate-800/50 rounded w-28" />
      </div>

      {/* Badges skeleton */}
      <div className="flex justify-center gap-3 mb-8">
        <div className="h-7 bg-purple-900/20 rounded-full w-28 border border-purple-500/10" />
        <div className="h-7 bg-blue-900/20 rounded-full w-24 border border-blue-500/10" />
        <div className="h-7 bg-emerald-900/20 rounded-full w-20 border border-emerald-500/10" />
      </div>

      {/* Nav chips skeleton */}
      <div className="flex gap-2.5 overflow-hidden mb-10">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 bg-slate-800/50 rounded-full flex-shrink-0"
            style={{ width: `${80 + i * 15}px` }}
          />
        ))}
      </div>

      {/* Featured image skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl mb-12 overflow-hidden relative"
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      </motion.div>

      {/* Content skeleton */}
      <div className="space-y-8">
        {/* Paragraph block 1 */}
        <div className="space-y-3">
          <div className="h-4 bg-slate-800/60 rounded w-full" />
          <div className="h-4 bg-slate-800/60 rounded w-11/12" />
          <div className="h-4 bg-slate-800/60 rounded w-4/5" />
          <div className="h-4 bg-slate-800/60 rounded w-full" />
          <div className="h-4 bg-slate-800/60 rounded w-3/4" />
        </div>

        {/* Section heading skeleton */}
        <div className="pt-8">
          <div className="h-8 bg-slate-800/40 rounded-lg w-1/2 mx-auto" />
        </div>

        {/* Paragraph block 2 */}
        <div className="space-y-3">
          <div className="h-4 bg-slate-800/60 rounded w-full" />
          <div className="h-4 bg-slate-800/60 rounded w-10/12" />
          <div className="h-4 bg-slate-800/60 rounded w-full" />
          <div className="h-4 bg-slate-800/60 rounded w-5/6" />
        </div>

        {/* List skeleton */}
        <div className="space-y-2.5 pl-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/30" />
            <div className="h-4 bg-slate-800/50 rounded w-3/4" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/30" />
            <div className="h-4 bg-slate-800/50 rounded w-2/3" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/30" />
            <div className="h-4 bg-slate-800/50 rounded w-4/5" />
          </div>
        </div>

        {/* Another section */}
        <div className="pt-6">
          <div className="h-7 bg-slate-800/40 rounded-lg w-2/5 mx-auto mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-slate-800/60 rounded w-full" />
            <div className="h-4 bg-slate-800/60 rounded w-11/12" />
            <div className="h-4 bg-slate-800/60 rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
