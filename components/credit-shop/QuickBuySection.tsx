import React from 'react';
import { Zap } from 'lucide-react';

const QUICK_BUY_OPTIONS = [1, 2, 3, 4, 5] as const;
const QUICK_BUY_PRICE_PER_CREDIT = 0.5;

interface QuickBuySectionProps {
  selectedQuickBuy: number | null;
  onSelectQuickBuy: (credits: number) => void;
  t: (key: string, fallback: string) => string;
}

const QuickBuySection: React.FC<QuickBuySectionProps> = ({
  selectedQuickBuy,
  onSelectQuickBuy,
  t,
}) => (
  <>
    <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-medium text-slate-200">
          {t('CreditShop.tsx.CreditShop.quick_buy', 'Quick Buy')}
        </h3>
        <span className="text-xs text-slate-400">
          {t('CreditShop.tsx.CreditShop.price_per_credit', '€0.50 per credit')}
        </span>
      </div>
      <div className="flex gap-2">
        {QUICK_BUY_OPTIONS.map((credits) => {
          const isSelected = selectedQuickBuy === credits;
          const price = (credits * QUICK_BUY_PRICE_PER_CREDIT).toFixed(2);
          return (
            <button
              key={credits}
              onClick={() => onSelectQuickBuy(credits)}
              className={`flex-1 py-3 px-2 min-h-[44px] rounded-lg border-2 transition-all text-center ${
                isSelected
                  ? 'border-amber-400 bg-amber-900/30 shadow-lg shadow-amber-500/20'
                  : 'border-slate-600 bg-slate-800/50 hover:border-purple-500/50'
              }`}
            >
              <div className="text-xl font-bold text-white">{credits}</div>
              <div className={`text-xs ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                €{price}
              </div>
            </button>
          );
        })}
      </div>
    </div>

    {/* Better Value Divider */}
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      <span className="text-xs text-slate-400 uppercase tracking-wider">
        {t('CreditShop.tsx.CreditShop.better_value', 'Better Value')}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
    </div>
  </>
);

export { QUICK_BUY_PRICE_PER_CREDIT };
export default QuickBuySection;
