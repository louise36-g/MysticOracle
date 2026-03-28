import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { optimizeCloudinaryUrl, IMAGE_SIZES } from '../../utils/cloudinaryUrl';

export interface LightboxProps {
  image: string | { url: string; alt: string } | null;
  onClose: () => void;
  alt?: string;
  optimizeImage?: boolean;
  showCaption?: boolean;
  backdropBlur?: boolean;
}

export function Lightbox({
  image,
  onClose,
  alt = 'Enlarged view',
  optimizeImage = true,
  showCaption = false,
  backdropBlur = false,
}: LightboxProps) {
  // Close on Escape key
  useEffect(() => {
    if (!image) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose]);

  // Normalize image prop
  const normalized = !image
    ? null
    : typeof image === 'string'
      ? { url: image, alt }
      : image;

  const src = normalized
    ? (optimizeImage ? optimizeCloudinaryUrl(normalized.url, IMAGE_SIZES.lightbox) : normalized.url)
    : '';

  return (
    <AnimatePresence>
      {normalized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 ${backdropBlur ? 'backdrop-blur-sm' : ''}`}
          onClick={onClose}
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            src={src}
            alt={normalized.alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {showCaption && normalized.alt && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-8 text-center text-white/80 font-heading"
            >
              {normalized.alt}
            </motion.p>
          )}
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Lightbox;
