/**
 * Social media sharing utilities
 */

export type SharePlatform = 'whatsapp' | 'twitter';

/**
 * Creates a share URL for a given social media platform
 * @param platform - Social media platform ('whatsapp' | 'twitter')
 * @param text - Text to share
 * @returns Share URL for the platform
 */
export const createShareUrl = (platform: SharePlatform, text: string): string => {
  const encodedText = encodeURIComponent(text);

  const platformUrlMap: Record<SharePlatform, string> = {
    whatsapp: `https://wa.me/?text=${encodedText}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}`
  };

  return platformUrlMap[platform];
};
