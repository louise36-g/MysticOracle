import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import Button from './Button';
import { CheckCircle, XCircle, Loader2, Coins, Sparkles, Gift } from 'lucide-react';
import { verifyStripePayment, capturePayPalOrder } from '../services/paymentService';

// First-purchase tracking
const FIRST_PURCHASE_STORAGE_KEY = 'mysticoracle_first_purchase_';

const hasCompletedFirstPurchase = (userId: string | undefined): boolean => {
  if (!userId) return false;
  return localStorage.getItem(`${FIRST_PURCHASE_STORAGE_KEY}${userId}`) === 'true';
};

const markFirstPurchaseComplete = (userId: string | undefined): void => {
  if (!userId) return;
  localStorage.setItem(`${FIRST_PURCHASE_STORAGE_KEY}${userId}`, 'true');
};

interface PaymentResultProps {
  type: 'success' | 'cancelled';
  onNavigate: (view: string) => void;
}

const PaymentResult: React.FC<PaymentResultProps> = ({ type, onNavigate }) => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [loading, setLoading] = useState(type === 'success');
  const [result, setResult] = useState<{ success: boolean; credits?: number; error?: string } | null>(null);
  const [wasFirstPurchase, setWasFirstPurchase] = useState(false);

  useEffect(() => {
    if (type !== 'success') return;

    const verifyPayment = async () => {
      // Check if this is a first purchase BEFORE we mark it complete
      const isFirstPurchase = !hasCompletedFirstPurchase(clerkUser?.id);

      try {
        const token = await getToken();
        if (!token) {
          setResult({ success: false, error: 'Authentication required' });
          setLoading(false);
          return;
        }

        // Check URL params
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const provider = urlParams.get('provider');
        const paypalOrderId = urlParams.get('token'); // PayPal uses 'token' for order ID

        let paymentResult: { success: boolean; credits?: number; error?: string };

        if (provider === 'paypal' && paypalOrderId) {
          // Capture PayPal order
          paymentResult = await capturePayPalOrder(paypalOrderId, token);
        } else if (sessionId) {
          // Verify Stripe payment
          paymentResult = await verifyStripePayment(sessionId, token);
        } else {
          // No payment to verify - redirect home
          setResult({ success: false, error: 'no_payment' });
          setLoading(false);
          return;
        }

        // If payment succeeded and this was first purchase, mark it complete
        if (paymentResult.success && isFirstPurchase) {
          markFirstPurchaseComplete(clerkUser?.id);
          setWasFirstPurchase(true);
        }

        setResult(paymentResult);
      } catch (error) {
        console.error('Payment verification error:', error);
        setResult({ success: false, error: error instanceof Error ? error.message : 'Verification failed' });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [type, getToken, clerkUser?.id]);

  // If no payment session found, redirect home
  useEffect(() => {
    if (result?.error === 'no_payment') {
      onNavigate('home');
    }
  }, [result, onNavigate]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-16 h-16 text-purple-400" />
        </motion.div>
        <p className="mt-4 text-lg text-slate-300">
          {language === 'en' ? 'Verifying your payment...' : 'Vérification de votre paiement...'}
        </p>
      </div>
    );
  }

  // Don't render anything if redirecting
  if (result?.error === 'no_payment') {
    return null;
  }

  if (type === 'cancelled') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-orange-900/30 rounded-full flex items-center justify-center mb-6"
        >
          <XCircle className="w-12 h-12 text-orange-400" />
        </motion.div>

        <h1 className="text-2xl font-heading text-white mb-2">
          {language === 'en' ? 'Payment Cancelled' : 'Paiement Annulé'}
        </h1>

        <p className="text-slate-400 mb-8 text-center max-w-md">
          {language === 'en'
            ? "No worries! Your payment was cancelled and you haven't been charged."
            : "Pas de souci ! Votre paiement a été annulé et vous n'avez pas été débité."}
        </p>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => onNavigate('profile')}>
            {language === 'en' ? 'Back to Profile' : 'Retour au Profil'}
          </Button>
          <Button onClick={() => onNavigate('home')}>
            {language === 'en' ? 'Go Home' : 'Accueil'}
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  const isSuccess = result?.success;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      {isSuccess ? (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative mb-6"
          >
            <div className="w-24 h-24 bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-14 h-14 text-green-400" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -top-2 -right-2 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
          </motion.div>

          <h1 className="text-3xl font-heading text-white mb-2">
            {language === 'en' ? 'Payment Successful!' : 'Paiement Réussi !'}
          </h1>

          {result?.credits && result.credits > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 bg-amber-900/30 border border-amber-500/30 rounded-xl px-6 py-4 mb-4"
            >
              <Coins className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-sm text-slate-400">
                  {language === 'en' ? 'Credits Added' : 'Crédits Ajoutés'}
                </p>
                <p className="text-3xl font-bold text-amber-400">+{result.credits}</p>
              </div>
            </motion.div>
          )}

          {/* First Purchase Bonus Message */}
          {wasFirstPurchase && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border border-amber-500/40 rounded-lg px-4 py-2 mb-6"
            >
              <Gift className="w-5 h-5 text-amber-400" />
              <p className="text-sm text-amber-200">
                {language === 'en'
                  ? 'First purchase bonus included!'
                  : 'Bonus de premier achat inclus !'}
              </p>
            </motion.div>
          )}

          <p className="text-slate-400 mb-8 text-center max-w-md">
            {language === 'en'
              ? 'Your credits have been added to your account. Start your mystical journey!'
              : 'Vos crédits ont été ajoutés à votre compte. Commencez votre voyage mystique !'}
          </p>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => onNavigate('profile')}>
              {language === 'en' ? 'View Profile' : 'Voir le Profil'}
            </Button>
            <Button onClick={() => onNavigate('home')}>
              {language === 'en' ? 'Start Reading' : 'Commencer une Lecture'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mb-6"
          >
            <XCircle className="w-12 h-12 text-red-400" />
          </motion.div>

          <h1 className="text-2xl font-heading text-white mb-2">
            {language === 'en' ? 'Payment Failed' : 'Paiement Échoué'}
          </h1>

          <p className="text-slate-400 mb-4 text-center max-w-md">
            {result?.error || (language === 'en'
              ? 'There was an issue processing your payment. Please try again.'
              : 'Un problème est survenu lors du traitement de votre paiement. Veuillez réessayer.')}
          </p>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => onNavigate('profile')}>
              {language === 'en' ? 'Back to Profile' : 'Retour au Profil'}
            </Button>
            <Button onClick={() => onNavigate('home')}>
              {language === 'en' ? 'Go Home' : 'Accueil'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentResult;
