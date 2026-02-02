/**
 * Social media sharing utilities
 */

export type SharePlatform = 'whatsapp' | 'twitter' | 'facebook';

/**
 * Creates a share URL for a given social media platform
 * @param platform - Social media platform
 * @param text - Text to share
 * @param url - Optional URL to include in the share (for Facebook)
 * @returns Share URL for the platform
 */
export const createShareUrl = (
  platform: SharePlatform,
  text: string,
  url?: string
): string => {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = url ? encodeURIComponent(url) : '';

  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodedText}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedText}`;
    case 'facebook':
      // Facebook share dialog - works best with a URL
      return url
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`
        : `https://www.facebook.com/sharer/sharer.php?quote=${encodedText}`;
    default:
      return '';
  }
};

/**
 * Downloads a data URL as a file
 * @param dataUrl - The data URL to download (e.g., from canvas.toDataURL())
 * @param filename - The filename for the downloaded file
 */
export const downloadDataUrl = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copies an image data URL to clipboard (if supported)
 * Returns true if successful, false otherwise
 * @param dataUrl - The data URL to copy
 */
export const copyImageToClipboard = async (dataUrl: string): Promise<boolean> => {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard || !window.ClipboardItem) {
      return false;
    }

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Copy to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);

    return true;
  } catch (error) {
    console.error('[socialShare] Failed to copy image to clipboard:', error);
    return false;
  }
};

/**
 * Opens a share URL in a new window/tab
 * @param platform - Social media platform
 * @param text - Text to share
 * @param url - Optional URL to include
 */
export const openShareWindow = (
  platform: SharePlatform,
  text: string,
  url?: string
): void => {
  const shareUrl = createShareUrl(platform, text, url);
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Checks if the Web Share API is available
 */
export const canUseWebShare = (): boolean => {
  return typeof navigator !== 'undefined' && !!navigator.share;
};

/**
 * Uses the native Web Share API if available
 * Returns true if share was initiated, false if not available
 */
export const shareNative = async (data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> => {
  if (!canUseWebShare()) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    // User cancelled or error occurred
    if ((error as Error).name !== 'AbortError') {
      console.error('[socialShare] Native share failed:', error);
    }
    return false;
  }
};
