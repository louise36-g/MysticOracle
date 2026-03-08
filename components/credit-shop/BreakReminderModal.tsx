import { motion, AnimatePresence } from 'framer-motion';
import { Coffee } from 'lucide-react';
import Button from '../Button';

interface BreakReminderModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSetLimits: () => void;
  t: (key: string, fallback: string) => string;
}

const BreakReminderModal: React.FC<BreakReminderModalProps> = ({
  isOpen,
  onDismiss,
  onSetLimits,
  t,
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Coffee className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-xl font-heading text-white mb-2">
              {t('CreditShop.tsx.CreditShop.time_for_a', 'Time for a Break?')}
            </h3>
            <p className="text-slate-400 mb-6">
              {t(
                'CreditShop.tsx.CreditShop.youve_made_several',
                "You've made several purchases recently. Would you like to take a moment before continuing?"
              )}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onSetLimits}
              >
                {t('CreditShop.tsx.CreditShop.set_limits', 'Set Limits')}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={onDismiss}
              >
                {t('CreditShop.tsx.CreditShop.continue', 'Continue')}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default BreakReminderModal;
