import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import Button from './Button';
import { CheckCircle, XCircle, Loader2, Coins, Sparkles } from 'lucide-react';
import { verifyStripePayment, capturePayPalOrder } from '../services/paymentService';
import { ROUTES } from '../routes/routes';

const PaymentResult: React.FC = () => {
  const location = useLocation();
  // Determine type from URL path
  const type: 'success' | 'cancelled' = location.pathname.includes('success') ? 'success' : 'cancelled';
  const navigate = useNavigate();
  const { language, t, refreshUser } = useApp();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [loading, setLoading] = useState(type === 'success');
  const [result, setResult] = useState<{ success: boolean; credits?: number; error?: string } | null>(null);

  useEffect(() => {
    if (type !== 'success') return;

    const verifyPayment = async () => {
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

        let paymentResult: { success: boolean; credits?: number; newBalance?: number; error?: string };

        if (provider === 'paypal' && paypalOrderId) {
          // Capture PayPal order
          console.log('[PaymentResult] Capturing PayPal order:', paypalOrderId);
          paymentResult = await capturePayPalOrder(token, paypalOrderId);
          console.log('[PaymentResult] PayPal result:', JSON.stringify(paymentResult, null, 2));
        } else if (sessionId) {
          // Verify Stripe payment (also adds credits as backup to webhook)
          console.log('[PaymentResult] Verifying Stripe session:', sessionId);
          paymentResult = await verifyStripePayment(token, sessionId);
          console.log('[PaymentResult] Stripe result:', paymentResult);
        } else {
          // No payment to verify - redirect home
          console.log('[PaymentResult] No session_id or token found in URL');
          setResult({ success: false, error: 'no_payment' });
          setLoading(false);
          return;
        }

        setResult(paymentResult);

        // Refresh user data to update credit balance in header
        if (paymentResult.success) {
          console.log('[PaymentResult] Payment successful, refreshing user data...');
          await refreshUser();
          console.log('[PaymentResult] User data refreshed');
        }
      } catch (error) {
        console.error('[PaymentResult] Payment verification error:', error);
        // Provide helpful error message - payment might have succeeded even if verification failed
        const errorMessage = error instanceof Error ? error.message : 'Verification failed';
        setResult({
          success: false,
          error: `${errorMessage}. If you were charged, please check your profile - credits may have been added.`
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [type, getToken, clerkUser?.id]);

  // If no payment session found, redirect home
  useEffect(() => {
    if (result?.error === 'no_payment') {
      navigate(ROUTES.HOME);
    }
  }, [result, navigate]);

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
          {t('PaymentResult.tsx.PaymentResult.verifying_your_payment', 'Verifying your payment...')}
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
          {t('PaymentResult.tsx.PaymentResult.payment_cancelled', 'Payment Cancelled')}
        </h1>

        <p className="text-slate-400 mb-8 text-center max-w-md">
          {t('PaymentResult.tsx.PaymentResult.no_worries_your', "No worries! Your payment was cancelled and you haven't been charged.")}
        </p>

        <div className="flex gap-4">
          <Link to={ROUTES.PROFILE}>
            <Button variant="outline">
              {t('PaymentResult.tsx.PaymentResult.back_to_profile', 'Back to Profile')}
            </Button>
          </Link>
          <Link to={ROUTES.HOME}>
            <Button>
              {t('PaymentResult.tsx.PaymentResult.go_home', 'Home Page')}
            </Button>
          </Link>
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
            {t('PaymentResult.tsx.PaymentResult.payment_successful', 'Payment Successful!')}
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
                  {t('PaymentResult.tsx.PaymentResult.credits_added', 'Credits Added')}
                </p>
                <p className="text-3xl font-bold text-amber-400">+{result.credits}</p>
              </div>
            </motion.div>
          )}

          <p className="text-slate-400 mb-8 text-center max-w-md">
            {t('PaymentResult.tsx.PaymentResult.your_credits_have', 'Your credits have been added to your account. Start your mystical journey!')}
          </p>

          <div className="flex gap-4">
            <Link to={ROUTES.PROFILE}>
              <Button variant="outline">
                {t('PaymentResult.tsx.PaymentResult.view_profile', 'View Profile')}
              </Button>
            </Link>
            <Link to={ROUTES.READING}>
              <Button>
                {t('PaymentResult.tsx.PaymentResult.start_reading', 'Start Reading')}
              </Button>
            </Link>
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
            {t('PaymentResult.tsx.PaymentResult.payment_failed', 'Payment Failed')}
          </h1>

          <p className="text-slate-400 mb-4 text-center max-w-md">
            {result?.error || t('PaymentResult.tsx.PaymentResult.there_was_an', 'There was an issue processing your payment. Please try again.')}
          </p>

          <div className="flex gap-4">
            <Link to={ROUTES.PROFILE}>
              <Button variant="outline">
                {t('PaymentResult.tsx.PaymentResult.back_to_profile_2', 'Back to Profile')}
              </Button>
            </Link>
            <Link to={ROUTES.HOME}>
              <Button>
                {t('PaymentResult.tsx.PaymentResult.go_home_2', 'Home Page')}
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentResult;
