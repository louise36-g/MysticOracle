/**
 * Cloudinary URL optimization utility.
 *
 * Inserts transformation parameters into Cloudinary URLs to serve images
 * at the right size, format, and quality. Non-Cloudinary URLs pass through unchanged.
 */

const CLOUDINARY_PATTERN = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)/;

interface OptimizeOptions {
  /** Target display width in CSS pixels (will be doubled for retina) */
  width?: number;
  /** Target display height in CSS pixels (will be doubled for retina) */
  height?: number;
  /** Crop mode — 'fill' crops to exact dimensions, 'limit' scales down without cropping */
  crop?: 'fill' | 'limit';
  /** Quality level — 'auto:best' preserves sharpness, 'auto:good' balances size/quality */
  quality?: 'auto:best' | 'auto:good' | 'auto:eco';
}

export function optimizeCloudinaryUrl(
  url: string | null | undefined,
  options: OptimizeOptions = {},
): string {
  if (!url) return '';

  const match = url.match(CLOUDINARY_PATTERN);
  if (!match) return url;

  const [, base, rest] = match;
  const { width, height, crop = 'fill', quality = 'auto:good' } = options;

  const transforms: string[] = [`f_auto`, `q_${quality}`];

  if (width) {
    transforms.push(`w_${width * 2}`);
  }
  if (height) {
    transforms.push(`h_${height * 2}`);
  }
  if (width || height) {
    transforms.push(`c_${crop}`);
  }

  return `${base}${transforms.join(',')}/${rest}`;
}

/** Preset sizes for common use cases */
export const IMAGE_SIZES = {
  /** Blog/tarot list card thumbnails (250px cards) */
  thumbnail: { width: 250, quality: 'auto:good' as const },
  /** Blog related posts, tarot related cards */
  related: { width: 300, quality: 'auto:good' as const },
  /** Blog post cover, tarot featured image (full content width) */
  cover: { width: 600, crop: 'limit' as const, quality: 'auto:best' as const },
  /** Lightbox / full-size view */
  lightbox: { width: 1000, crop: 'limit' as const, quality: 'auto:best' as const },
  /** Open Graph / social sharing (1200x630 standard) */
  og: { width: 600, height: 315, quality: 'auto:good' as const },
  /** Small avatar images */
  avatar: { width: 80, quality: 'auto:good' as const },
} as const;
