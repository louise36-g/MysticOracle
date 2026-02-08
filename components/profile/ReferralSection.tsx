/**
 * ReferralSection Component
 * Displays referral code with copy and social share functionality
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, CheckCircle } from 'lucide-react';
import { createShareUrl } from '../../utils/socialShare';

interface ReferralSectionProps {
  referralCode: string;
  language: 'en' | 'fr';
  animationDelay?: number;
  t: (key: string, fallback: string) => string;
}

const SECTION_CLASSES =
  'bg-slate-900/70 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-4 sm:p-6';

export const ReferralSection: React.FC<ReferralSectionProps> = ({
  referralCode,
  language,
  animationDelay = 0.16,
  t,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getWhatsAppText = () => {
    return language === 'en'
      ? `Join me on CelestiArcana and get 5 free credits! Use code: ${referralCode}`
      : `Rejoignez-moi sur CelestiArcana et obtenez 5 crédits gratuits ! Code: ${referralCode}`;
  };

  const getTwitterText = () => {
    return language === 'en'
      ? `Join me on CelestiArcana! Use code ${referralCode} for 5 free credits 🔮✨`
      : `Rejoignez-moi sur CelestiArcana ! Code ${referralCode} pour 5 crédits gratuits 🔮✨`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
      className={SECTION_CLASSES}
    >
      <h3 className="text-base font-medium text-purple-200 mb-1 flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        {t('UserProfile.tsx.UserProfile.referral_code', 'Referral Code')}
      </h3>
      <p className="text-sm text-slate-400 mb-3">
        {t('UserProfile.tsx.UserProfile.share_both_get', 'Share & both get +5 credits')}
      </p>
      <div className="flex gap-2 mb-3">
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 font-mono text-purple-200 tracking-wider">
          {referralCode}
        </div>
        <button
          onClick={copyReferral}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-lg transition-colors duration-200"
        >
          {isCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Social Share Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => window.open(createShareUrl('whatsapp', getWhatsAppText()), '_blank')}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500
                     text-white rounded-lg transition-colors duration-200 text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          WhatsApp
        </button>
        <button
          onClick={() => window.open(createShareUrl('twitter', getTwitterText()), '_blank')}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-400
                     text-white rounded-lg transition-colors duration-200 text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X (Twitter)
        </button>
      </div>
    </motion.div>
  );
};

export default ReferralSection;
