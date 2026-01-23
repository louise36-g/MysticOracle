import React from 'react';
import { X } from 'lucide-react';

interface BlogLightboxProps {
  imageUrl: string;
  onClose: () => void;
}

/**
 * BlogLightbox Component
 *
 * Full-screen image modal with dark overlay and close button.
 * Clicking outside the image or the X button closes the lightbox.
 */
export const BlogLightbox: React.FC<BlogLightboxProps> = ({ imageUrl, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X className="w-8 h-8" />
      </button>
      <img
        src={imageUrl}
        alt="Full size image"
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
