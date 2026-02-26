/**
 * ReferralSection Component
 * Compact referral code with copy, social share, email invite, and code redemption
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, CheckCircle, Mail, Send, Gift, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { createShareUrl } from '../../utils/socialShare';
import { redeemReferralCode, sendReferralInvite } from '../../services/api/user';

interface ReferralSectionProps {
  referralCode: string;
  referredById: string | null;
  language: 'en' | 'fr';
  animationDelay?: number;
  t: (key: string, fallback: string) => string;
  onCreditsAwarded?: (amount: number) => void;
}

const SECTION_CLASSES =
  'bg-slate-900/70 backdrop-blur-sm border border-slate-700/40 rounded-2xl p-4 sm:p-6';

export const ReferralSection: React.FC<ReferralSectionProps> = ({
  referralCode,
  referredById,
  language,
  animationDelay = 0.16,
  t,
  onCreditsAwarded,
}) => {
  const { getToken } = useAuth();
  const [isCopied, setIsCopied] = useState(false);

  // Email invite state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [inviteMessage, setInviteMessage] = useState('');

  // Redemption state
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [redeemMessage, setRedeemMessage] = useState('');
  const [hasRedeemed, setHasRedeemed] = useState(!!referredById);

  const siteUrl = 'https://celestiarcana.com';
  const signupUrl = `${siteUrl}/sign-up?ref=${referralCode}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getShareText = () => {
    return language === 'en'
      ? `I found this gorgeous tarot site and immediately thought of you. Sign up with this code and get 5 free credits to try it for yourself.\n\nCode: ${referralCode}\n${signupUrl}`
      : `J'ai trouvé ce magnifique site de tarot et j'ai tout de suite pensé à toi. Inscris-toi avec ce code et obtiens 5 crédits gratuits pour l'essayer.\n\nCode : ${referralCode}\n${signupUrl}`;
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || isSendingInvite) return;

    setIsSendingInvite(true);
    setInviteStatus('idle');
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const result = await sendReferralInvite(token, inviteEmail.trim());
      setInviteStatus('success');
      setInviteMessage(result.message);
      setInviteEmail('');
      setTimeout(() => {
        setInviteStatus('idle');
        setShowEmailForm(false);
      }, 3000);
    } catch (error: any) {
      setInviteStatus('error');
      setInviteMessage(
        error?.message || (language === 'en' ? 'Failed to send invitation' : "Échec de l'envoi")
      );
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim() || isRedeeming) return;

    setIsRedeeming(true);
    setRedeemStatus('idle');
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const result = await redeemReferralCode(token, redeemCode.trim());
      setRedeemStatus('success');
      setRedeemMessage(result.message);
      setHasRedeemed(true);
      if (onCreditsAwarded) {
        onCreditsAwarded(result.creditsAwarded);
      }
    } catch (error: any) {
      setRedeemStatus('error');
      setRedeemMessage(
        error?.message || (language === 'en' ? 'Invalid referral code' : 'Code invalide')
      );
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
      className={SECTION_CLASSES}
    >
      <h2 className="text-base font-heading text-purple-100 flex items-center gap-2 mb-3">
        <Share2 className="w-4 h-4 text-purple-400" />
        {t('referral.title', 'Referral & Invite')}
        <span className="text-xs text-slate-500 font-normal ml-1">
          {t('referral.share_description', 'Share your code — you both get +5 credits')}
        </span>
      </h2>

      <div className="space-y-3">
        {/* Compact share row: code + copy + WhatsApp + X + Email */}
        <div className="flex items-center gap-1.5">
          {/* Referral code display */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-purple-200 tracking-wider text-sm">
            {referralCode}
          </div>

          {/* Copy button */}
          <button
            onClick={copyReferral}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={language === 'en' ? 'Copy code' : 'Copier le code'}
          >
            {isCopied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-700/60 mx-0.5" />

          {/* WhatsApp */}
          <button
            onClick={() => window.open(createShareUrl('whatsapp', getShareText()), '_blank')}
            className="p-1.5 rounded-lg bg-green-600/20 border border-green-500/30 hover:bg-green-600/40 text-green-400 hover:text-green-300 transition-colors"
            title="WhatsApp"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </button>

          {/* X / Twitter */}
          <button
            onClick={() => window.open(createShareUrl('twitter', getShareText()), '_blank')}
            className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/40 text-blue-400 hover:text-blue-300 transition-colors"
            title="X"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>

          {/* Email */}
          <button
            onClick={() => setShowEmailForm(!showEmailForm)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showEmailForm
                ? 'bg-purple-500/40 border-purple-400/50 text-purple-300'
                : 'bg-purple-600/20 border-purple-500/30 hover:bg-purple-600/40 text-purple-400 hover:text-purple-300'
            }`}
            title="Email"
          >
            <Mail className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Email Invite Form */}
        <AnimatePresence>
          {showEmailForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSendInvite} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={language === 'en' ? "Friend's email..." : "Email de votre ami(e)..."}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white
                             placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                  required
                />
                <button
                  type="submit"
                  disabled={isSendingInvite || !inviteEmail.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500
                             text-white px-4 rounded-lg transition-colors duration-200 flex items-center gap-1.5 text-sm"
                >
                  {isSendingInvite ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {language === 'en' ? 'Send' : 'Envoyer'}
                </button>
              </form>
              {inviteStatus !== 'idle' && (
                <p className={`mt-2 text-sm ${inviteStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {inviteMessage}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Redeem a Referral Code */}
        {!hasRedeemed && (
          <div className="border-t border-slate-700/40 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-medium text-amber-200">
                {t('referral.have_code', 'Have a referral code?')}
              </p>
            </div>
            <form onSubmit={handleRedeem} className="flex gap-2">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => {
                  setRedeemCode(e.target.value.toUpperCase());
                  setRedeemStatus('idle');
                }}
                placeholder={language === 'en' ? 'Enter code...' : 'Entrez le code...'}
                maxLength={20}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono
                           tracking-wider placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 uppercase"
              />
              <button
                type="submit"
                disabled={isRedeeming || !redeemCode.trim()}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500
                           text-white px-4 rounded-lg transition-colors duration-200 flex items-center gap-1.5 text-sm font-medium"
              >
                {isRedeeming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t('referral.redeem', 'Redeem')
                )}
              </button>
            </form>
            {redeemStatus !== 'idle' && (
              <p className={`mt-2 text-sm ${redeemStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {redeemMessage}
              </p>
            )}
          </div>
        )}

        {/* Already redeemed message */}
        {hasRedeemed && redeemStatus === 'idle' && (
          <div className="border-t border-slate-700/40 pt-3">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              {t('referral.already_redeemed', 'Referral code already redeemed')}
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default ReferralSection;
