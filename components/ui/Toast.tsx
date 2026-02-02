import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Gift, Copy, X } from 'lucide-react';

export type ToastType = 'success' | 'bonus' | 'copy' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <Check className="w-4 h-4" />,
  bonus: <Gift className="w-4 h-4" />,
  copy: <Copy className="w-4 h-4" />,
  error: <X className="w-4 h-4" />,
};

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-600 text-white',
  bonus: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  copy: 'bg-purple-600 text-white',
  error: 'bg-red-600 text-white',
};

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  isVisible,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg ${TOAST_STYLES[type]}`}
          >
            {TOAST_ICONS[type]}
            <span className="font-medium text-sm">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
