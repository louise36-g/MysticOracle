import { motion } from 'framer-motion';
import { ZoomIn } from 'lucide-react';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-12 group cursor-pointer relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10"
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
