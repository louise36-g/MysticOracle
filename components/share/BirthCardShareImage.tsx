// components/share/BirthCardShareImage.tsx
// Canvas-based image generator for shareable birth card images

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getCardImageUrl } from '../../constants/cardImages';

interface BirthCardShareImageProps {
  personalityCardId: number;
  soulCardId: number;
  zodiacSign?: string;
  language: 'en' | 'fr';
  customTitle: string;
  onImageGenerated?: (dataUrl: string) => void;
}

// Image dimensions optimized for social media (Facebook og:image, Twitter card)
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

// Card dimensions on canvas - larger to fill more space
const CARD_WIDTH = 240;
const CARD_HEIGHT = 400;
const UNIFIED_CARD_WIDTH = 280;
const UNIFIED_CARD_HEIGHT = 467;

/**
 * Draws mystical decorative elements (stars) on the canvas
 */
function drawMysticalDecorations(ctx: CanvasRenderingContext2D) {
  const starPositions = [
    { x: 100, y: 80, size: 3 },
    { x: 150, y: 150, size: 2 },
    { x: 80, y: 250, size: 2 },
    { x: 1100, y: 100, size: 3 },
    { x: 1050, y: 180, size: 2 },
    { x: 1120, y: 280, size: 2 },
    { x: 200, y: 500, size: 2 },
    { x: 1000, y: 520, size: 2 },
    { x: 600, y: 50, size: 2 },
    { x: 400, y: 580, size: 2 },
    { x: 800, y: 560, size: 2 },
  ];

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  starPositions.forEach(({ x, y, size }) => {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw subtle moon crescent in top right
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1050, 60, 25, 0.3 * Math.PI, 1.7 * Math.PI);
  ctx.stroke();
}

/**
 * Loads an image from a URL and returns a promise
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Draws a card image on the canvas with rounded corners
 */
function drawCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const radius = 12;

  ctx.save();

  // Create rounded rectangle clip
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.clip();

  // Draw image
  ctx.drawImage(img, x, y, width, height);

  // Add subtle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a label below a card
 */
function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string = '#c4b5fd'
) {
  ctx.font = '600 18px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

/**
 * BirthCardShareImage component - generates a shareable image using canvas
 */
const BirthCardShareImage: React.FC<BirthCardShareImageProps> = ({
  personalityCardId,
  soulCardId,
  zodiacSign,
  language,
  customTitle,
  onImageGenerated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUnified = personalityCardId === soulCardId;

  const generateImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 1. Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
      gradient.addColorStop(0, '#1e1b4b'); // indigo-950
      gradient.addColorStop(0.5, '#312e81'); // indigo-900
      gradient.addColorStop(1, '#581c87'); // purple-900
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

      // 2. Add decorative elements
      drawMysticalDecorations(ctx);

      // 3. Draw custom title at top
      ctx.font = '48px Georgia, serif';
      ctx.fillStyle = '#fbbf24'; // amber-400
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(customTitle, IMAGE_WIDTH / 2, 30);

      // 4. Load and draw card images
      if (isUnified) {
        // Single card centered
        const cardImg = await loadImage(getCardImageUrl(personalityCardId));
        const cardX = (IMAGE_WIDTH - UNIFIED_CARD_WIDTH) / 2;
        const cardY = 90;
        drawCard(ctx, cardImg, cardX, cardY, UNIFIED_CARD_WIDTH, UNIFIED_CARD_HEIGHT);

        // Label below card
        const labelText = language === 'en' ? 'Unified Birth Card' : 'Carte de Naissance Unifiée';
        drawLabel(ctx, labelText, IMAGE_WIDTH / 2, cardY + UNIFIED_CARD_HEIGHT + 12, '#a78bfa');
      } else {
        // Two cards side by side
        const spacing = 60;
        const totalWidth = CARD_WIDTH * 2 + spacing;
        const startX = (IMAGE_WIDTH - totalWidth) / 2;
        const cardY = 100;

        const [personalityImg, soulImg] = await Promise.all([
          loadImage(getCardImageUrl(personalityCardId)),
          loadImage(getCardImageUrl(soulCardId)),
        ]);

        // Personality card (left)
        drawCard(ctx, personalityImg, startX, cardY, CARD_WIDTH, CARD_HEIGHT);
        const personalityLabel = language === 'en' ? 'Personality' : 'Personnalité';
        drawLabel(ctx, personalityLabel, startX + CARD_WIDTH / 2, cardY + CARD_HEIGHT + 12, '#fcd34d');

        // Soul card (right)
        const soulX = startX + CARD_WIDTH + spacing;
        drawCard(ctx, soulImg, soulX, cardY, CARD_WIDTH, CARD_HEIGHT);
        const soulLabel = language === 'en' ? 'Soul' : 'Âme';
        drawLabel(ctx, soulLabel, soulX + CARD_WIDTH / 2, cardY + CARD_HEIGHT + 12, '#a78bfa');
      }

      // 5. Draw branding at bottom
      ctx.font = '500 24px Georgia, serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('mysticoracle.com', IMAGE_WIDTH / 2, IMAGE_HEIGHT - 25);

      // Add subtle line above branding
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(450, IMAGE_HEIGHT - 60);
      ctx.lineTo(750, IMAGE_HEIGHT - 60);
      ctx.stroke();

      // Export as PNG
      const dataUrl = canvas.toDataURL('image/png');
      onImageGenerated?.(dataUrl);
    } catch (err) {
      console.error('[BirthCardShareImage] Error generating image:', err);
      setError(
        language === 'en'
          ? 'Failed to generate image. Please try again.'
          : 'Échec de la génération de l\'image. Veuillez réessayer.'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [personalityCardId, soulCardId, isUnified, language, customTitle, onImageGenerated]);

  // Regenerate image when props change
  useEffect(() => {
    generateImage();
  }, [generateImage]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={IMAGE_WIDTH}
        height={IMAGE_HEIGHT}
        className="w-full h-auto rounded-lg shadow-lg"
        style={{ maxWidth: '600px' }}
      />
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
      )}
    </div>
  );
};

export default BirthCardShareImage;
