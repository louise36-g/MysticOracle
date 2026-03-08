import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnlargedImageModalProps {
  image: { url: string; alt: string } | null;
  onClose: () => void;
}

const EnlargedImageModal: React.FC<EnlargedImageModalProps> = ({ image, onClose }) => (
  <AnimatePresence>
    {image && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-lg max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={image.url}
            alt={image.alt}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
          <p className="text-center text-white/80 mt-4 font-heading">
            {image.alt}
          </p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default EnlargedImageModal;
