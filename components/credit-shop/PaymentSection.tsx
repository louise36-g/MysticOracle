import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Coins, Shield, Loader2 } from 'lucide-react';

// PayPal icon component
const PayPalIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
  </svg>
);

export interface CurrentSelection {
  type: 'quick' | 'package';
  credits: number;
  priceEur: number;
  packageId: string;
  name: string;
}

interface PaymentSectionProps {
  currentSelection: CurrentSelection | null;
  loading: boolean;
  paymentMethod: 'stripe' | 'stripe_link' | 'paypal' | null;
  onStripeCheckout: () => void;
  onPayPalCheckout: () => void;
  t: (key: string, fallback: string) => string;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  currentSelection,
  loading,
  paymentMethod,
  onStripeCheckout,
  onPayPalCheckout,
  t,
}) => {
  if (!currentSelection) {
    return (
      <div className="text-center py-6 text-slate-400">
        <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">
          {t('CreditShop.tsx.CreditShop.select_a_credit', 'Select a credit package above to continue')}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Section header with selected summary */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-400" />
          {t('CreditShop.tsx.CreditShop.complete_purchase', 'Complete Purchase')}
        </h3>
        <div className="flex items-center gap-2 bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-500/30">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-amber-300">{currentSelection.credits}</span>
          <span className="text-amber-200/70 text-sm">
            {t('CreditShop.tsx.CreditShop.credits', 'credits')}
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        {/* Credit Card */}
        <motion.button
          onClick={onStripeCheckout}
          disabled={loading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex items-center justify-between p-4 bg-slate-800/70 border border-purple-500/30 rounded-xl hover:border-purple-400/60 transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white">
                {t('CreditShop.tsx.CreditShop.credit_debit_card', 'Credit / Debit Card')}
              </p>
              <p className="text-sm text-slate-400">Visa, Mastercard, Amex</p>
            </div>
          </div>
          {loading && paymentMethod === 'stripe' ? (
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          ) : (
            <span className="text-xl font-bold text-purple-300">
              €{currentSelection.priceEur.toFixed(2)}
            </span>
          )}
        </motion.button>

        {/* PayPal */}
        <motion.button
          onClick={onPayPalCheckout}
          disabled={loading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex items-center justify-between p-4 bg-blue-900/30 border border-blue-500/30 rounded-xl hover:border-blue-400/60 transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <PayPalIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white">PayPal</p>
              <p className="text-sm text-slate-400">
                {t('CreditShop.tsx.CreditShop.pay_with_paypal', 'Pay with PayPal')}
              </p>
            </div>
          </div>
          {loading && paymentMethod === 'paypal' ? (
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          ) : (
            <span className="text-xl font-bold text-blue-300">
              €{currentSelection.priceEur.toFixed(2)}
            </span>
          )}
        </motion.button>
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4">
        <Shield className="w-4 h-4" />
        <span>
          {t(
            'CreditShop.tsx.CreditShop.secure_payment_processed',
            'Secure payment processed by Stripe & PayPal'
          )}
        </span>
      </div>
    </motion.div>
  );
};

export default PaymentSection;
