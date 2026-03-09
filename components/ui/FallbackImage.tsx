import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Custom fallback content to show when the image fails to load. */
  fallback?: React.ReactNode;
  /** Language code for default fallback text ('fr' shows "Pas d'image"). */
  language?: string;
  /** Additional class name for the fallback container. */
  fallbackClassName?: string;
}

/**
 * Image component that gracefully falls back to a placeholder on load error.
 * Uses React state instead of imperative DOM manipulation.
 */
const FallbackImage: React.FC<FallbackImageProps> = ({
  fallback,
  language,
  fallbackClassName,
  src,
  alt,
  className,
  ...imgProps
}) => {
  const [hasError, setHasError] = useState(false);

  // If there's no src at all, show fallback immediately
  if (!src || hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div
        className={
          fallbackClassName ||
          'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-slate-900'
        }
      >
        <div className="text-center">
          <ImageOff className="w-8 h-8 text-purple-400/50 mx-auto mb-1" />
          <span className="text-xs text-purple-300/50">
            {language === 'fr' ? "Pas d'image" : 'No Image'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...imgProps}
    />
  );
};

export default FallbackImage;
