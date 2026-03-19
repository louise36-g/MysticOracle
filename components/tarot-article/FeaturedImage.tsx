import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn } from 'lucide-react';
import { optimizeCloudinaryUrl } from '../../utils/cloudinaryUrl';

/** Widths for responsive srcset (CSS pixels, doubled for retina inside optimizeCloudinaryUrl) */
const SRCSET_WIDTHS = [400, 600, 800] as const;

interface FeaturedImageProps {
  src: string;
  alt: string;
  onClick: () => void;
}

/**
 * Featured image with zoom-on-click functionality
 * Includes hover effects and zoom indicator
 */
export function FeaturedImage({ src, alt, onClick }: FeaturedImageProps) {
  const { defaultSrc, srcSet } = useMemo(() => {
    const opts = { crop: 'limit' as const, quality: 'auto:best' as const };
    const set = SRCSET_WIDTHS
      .map(w => `${optimizeCloudinaryUrl(src, { ...opts, width: w })} ${w * 2}w`)
      .join(', ');
    return {
      defaultSrc: optimizeCloudinaryUrl(src, { ...opts, width: 600 }),
      srcSet: set,
    };
  }, [src]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-12 group cursor-pointer relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10"
      onClick={onClick}
    >
      <img
        src={defaultSrc}
        srcSet={srcSet}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 896px"
        alt={alt}
        width={896}
        height={504}
        className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-150"
        loading="lazy"
        decoding="async"
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Zoom indicator */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="p-4 bg-slate-900/60 backdrop-blur-sm rounded-full border border-purple-500/30">
          <ZoomIn className="w-6 h-6 text-purple-300" />
        </div>
      </div>
      {/* Corner accent */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}
