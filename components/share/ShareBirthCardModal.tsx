// components/share/ShareBirthCardModal.tsx
// Modal for sharing birth card readings

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, FileText, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import BirthCardShareImage from './BirthCardShareImage';
import { downloadDataUrl, openShareWindow } from '../../utils/socialShare';

// Major Arcana names for display
const MAJOR_ARCANA: Record<number, { en: string; fr: string }> = {
  0: { en: 'The Fool', fr: 'Le Mat' },
  1: { en: 'The Magician', fr: 'Le Bateleur' },
  2: { en: 'The High Priestess', fr: 'La Papesse' },
  3: { en: 'The Empress', fr: "L'Impératrice" },
  4: { en: 'The Emperor', fr: "L'Empereur" },
  5: { en: 'The Hierophant', fr: 'Le Pape' },
  6: { en: 'The Lovers', fr: "L'Amoureux" },
  7: { en: 'The Chariot', fr: 'Le Chariot' },
  8: { en: 'Strength', fr: 'La Force' },
  9: { en: 'The Hermit', fr: "L'Hermite" },
  10: { en: 'Wheel of Fortune', fr: 'La Roue de Fortune' },
  11: { en: 'Justice', fr: 'La Justice' },
  12: { en: 'The Hanged Man', fr: 'Le Pendu' },
  13: { en: 'Death', fr: "L'Arcane Sans Nom" },
  14: { en: 'Temperance', fr: 'La Tempérance' },
  15: { en: 'The Devil', fr: 'Le Diable' },
  16: { en: 'The Tower', fr: 'La Maison Dieu' },
  17: { en: 'The Star', fr: "L'Étoile" },
  18: { en: 'The Moon', fr: 'La Lune' },
  19: { en: 'The Sun', fr: 'Le Soleil' },
  20: { en: 'Judgement', fr: 'Le Jugement' },
  21: { en: 'The World', fr: 'Le Monde' },
};

interface ShareBirthCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalityCardId: number;
  soulCardId: number;
  zodiacSign?: string;
  /** The full reading/synthesis text to share */
  readingText?: string;
}

// Social platform icons
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

/**
 * Strip HTML tags using regex (safe approach without innerHTML)
 * Converts HTML to plain text for sharing
 */
function stripHtmlTags(html: string): string {
  if (!html) return '';

  // Replace common HTML entities
  let text = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Replace <br> and block elements with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(p|div|h[1-6]|li)>/gi, '\n');
  text = text.replace(/<(p|div|h[1-6])[^>]*>/gi, '\n');

  // Replace list items with bullet points
  text = text.replace(/<li[^>]*>/gi, '• ');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');

  return text.trim();
}

const ShareBirthCardModal: React.FC<ShareBirthCardModalProps> = ({
  isOpen,
  onClose,
  personalityCardId,
  soulCardId,
  zodiacSign,
  readingText,
}) => {
  const { language, t } = useApp();
  const lang = language as 'en' | 'fr';

  const [copyTextSuccess, setCopyTextSuccess] = useState(false);
  const [showImageSection, setShowImageSection] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState(lang === 'en' ? 'My Birth Cards' : 'Mes Cartes de Naissance');

  const isUnified = personalityCardId === soulCardId;
  const personalityName = MAJOR_ARCANA[personalityCardId]?.[lang] || `Card ${personalityCardId}`;
  const soulName = MAJOR_ARCANA[soulCardId]?.[lang] || `Card ${soulCardId}`;

  // Build the full shareable text
  const shareableText = useMemo(() => {
    const lines: string[] = [];

    // Header
    if (isUnified) {
      lines.push(lang === 'en'
        ? `✨ My Birth Card Reading ✨`
        : `✨ Ma Lecture de Carte de Naissance ✨`
      );
      lines.push('');
      lines.push(lang === 'en'
        ? `🎴 Unified Birth Card: ${personalityName}`
        : `🎴 Carte de Naissance Unifiée: ${personalityName}`
      );
    } else {
      lines.push(lang === 'en'
        ? `✨ My Birth Cards Reading ✨`
        : `✨ Ma Lecture de Cartes de Naissance ✨`
      );
      lines.push('');
      lines.push(lang === 'en'
        ? `🎴 Personality Card: ${personalityName}`
        : `🎴 Carte de Personnalité: ${personalityName}`
      );
      lines.push(lang === 'en'
        ? `🎴 Soul Card: ${soulName}`
        : `🎴 Carte de l'Âme: ${soulName}`
      );
    }

    if (zodiacSign) {
      lines.push(lang === 'en' ? `⭐ Zodiac: ${zodiacSign}` : `⭐ Zodiaque: ${zodiacSign}`);
    }

    // Add the reading text if available
    if (readingText) {
      lines.push('');
      lines.push('─'.repeat(30));
      lines.push('');
      // Strip HTML and add the reading
      const plainText = stripHtmlTags(readingText);
      lines.push(plainText);
    }

    // Footer
    lines.push('');
    lines.push('─'.repeat(30));
    lines.push(lang === 'en'
      ? '🔮 For more tarot readings and birth charts, pop over to https://mysticoracle.com'
      : '🔮 Pour plus de lectures de tarot et de thèmes astraux, rendez-vous sur https://mysticoracle.com'
    );

    return lines.join('\n');
  }, [isUnified, personalityName, soulName, zodiacSign, readingText, lang]);

  const handleCopyFullReading = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareableText);
      setCopyTextSuccess(true);
      setTimeout(() => setCopyTextSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }, [shareableText]);

  const handleWhatsAppShare = useCallback(() => {
    // WhatsApp can handle longer text, so we send the full reading
    openShareWindow('whatsapp', shareableText);
  }, [shareableText]);

  const handleImageGenerated = useCallback((dataUrl: string) => {
    setImageDataUrl(dataUrl);
  }, []);

  const handleDownloadImage = useCallback(() => {
    if (!imageDataUrl) return;
    const filename = `birth-cards-${Date.now()}.png`;
    downloadDataUrl(imageDataUrl, filename);
  }, [imageDataUrl]);

  const handleClose = useCallback(() => {
    setCopyTextSuccess(false);
    setShowImageSection(false);
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-slate-900 rounded-2xl border border-slate-700 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-heading text-white">
                  {t('share.title', 'Share Your Reading')}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Reading Preview */}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {lang === 'en' ? 'Your Reading' : 'Votre Lecture'}
                </p>
                <div className="bg-slate-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">
                    {shareableText}
                  </pre>
                </div>
              </div>

              {/* Primary Action: Copy Full Reading */}
              <button
                onClick={handleCopyFullReading}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors text-lg font-medium"
              >
                {copyTextSuccess ? (
                  <>
                    <Check className="w-6 h-6 text-green-300" />
                    <span>{lang === 'en' ? 'Copied to Clipboard!' : 'Copié!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-6 h-6" />
                    <span>{lang === 'en' ? 'Copy Full Reading' : 'Copier la Lecture Complète'}</span>
                  </>
                )}
              </button>

              {/* WhatsApp Share (supports long text) */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-lg transition-colors"
              >
                <WhatsAppIcon />
                <span>{lang === 'en' ? 'Share Full Reading on WhatsApp' : 'Partager sur WhatsApp'}</span>
              </button>

              {/* Hint */}
              <p className="text-sm text-slate-400 text-center">
                {lang === 'en'
                  ? 'Copy your reading and paste it anywhere - email, messages, social media posts, etc.'
                  : 'Copiez votre lecture et collez-la où vous voulez - email, messages, réseaux sociaux, etc.'}
              </p>

              {/* Collapsible Image Section */}
              <div className="border-t border-slate-700 pt-4">
                <button
                  onClick={() => setShowImageSection(!showImageSection)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2 text-slate-300">
                    <ImageIcon className="w-4 h-4" />
                    {lang === 'en' ? 'Download Card Image (optional)' : 'Télécharger l\'Image (optionnel)'}
                  </span>
                  {showImageSection ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <AnimatePresence>
                  {showImageSection && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 space-y-3">
                        {/* Custom Title Input */}
                        <div>
                          <label htmlFor="share-title" className="block text-xs text-slate-400 mb-1">
                            {lang === 'en' ? 'Image Title' : 'Titre de l\'image'}
                          </label>
                          <input
                            id="share-title"
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            maxLength={40}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>

                        {/* Image Preview */}
                        <div className="flex justify-center">
                          <BirthCardShareImage
                            personalityCardId={personalityCardId}
                            soulCardId={soulCardId}
                            zodiacSign={zodiacSign}
                            language={lang}
                            customTitle={customTitle}
                            onImageGenerated={handleImageGenerated}
                          />
                        </div>

                        {/* Download Button */}
                        <button
                          onClick={handleDownloadImage}
                          disabled={!imageDataUrl}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>{lang === 'en' ? 'Download Image' : 'Télécharger l\'Image'}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareBirthCardModal;
