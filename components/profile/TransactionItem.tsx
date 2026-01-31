import React from 'react';
import { CreditCard, Gift, Award, Share2, Sparkles, MessageCircle, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { Transaction } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { formatRelativeDate } from '../../utils/dateFormatters';

// Constants
const MAX_DESCRIPTION_WIDTH_PX = 200;

interface TransactionItemProps {
    transaction: Transaction;
}

const TRANSACTION_CONFIG: Record<string, {
    icon: React.ReactNode;
    translationKey: string;
    fallback: string;
    colorClass: string;
    bgClass: string;
}> = {
    PURCHASE: {
        icon: <CreditCard className="w-4 h-4" />,
        translationKey: 'transaction.type.purchase',
        fallback: 'Purchase',
        colorClass: 'text-green-400',
        bgClass: 'bg-green-500/20',
    },
    DAILY_BONUS: {
        icon: <Gift className="w-4 h-4" />,
        translationKey: 'transaction.type.daily_bonus',
        fallback: 'Daily Bonus',
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/20',
    },
    ACHIEVEMENT: {
        icon: <Award className="w-4 h-4" />,
        translationKey: 'transaction.type.achievement',
        fallback: 'Achievement',
        colorClass: 'text-purple-400',
        bgClass: 'bg-purple-500/20',
    },
    REFERRAL_BONUS: {
        icon: <Share2 className="w-4 h-4" />,
        translationKey: 'transaction.type.referral',
        fallback: 'Referral',
        colorClass: 'text-blue-400',
        bgClass: 'bg-blue-500/20',
    },
    READING: {
        icon: <Sparkles className="w-4 h-4" />,
        translationKey: 'transaction.type.reading',
        fallback: 'Reading',
        colorClass: 'text-pink-400',
        bgClass: 'bg-pink-500/20',
    },
    QUESTION: {
        icon: <MessageCircle className="w-4 h-4" />,
        translationKey: 'transaction.type.question',
        fallback: 'Question',
        colorClass: 'text-cyan-400',
        bgClass: 'bg-cyan-500/20',
    },
    REFUND: {
        icon: <TrendingUp className="w-4 h-4" />,
        translationKey: 'transaction.type.refund',
        fallback: 'Refund',
        colorClass: 'text-green-400',
        bgClass: 'bg-green-500/20',
    },
};

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
    const { t, language } = useApp();
    const config = TRANSACTION_CONFIG[transaction.type] || {
        icon: <Coins className="w-4 h-4" />,
        translationKey: 'transaction.type.other',
        fallback: transaction.type,
        colorClass: 'text-slate-400',
        bgClass: 'bg-slate-500/20',
    };

    const isPositive = transaction.amount > 0;
    const label = t(config.translationKey, config.fallback);

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors duration-150
                        ${isPositive
                            ? 'bg-green-900/10 border-green-500/20 hover:border-green-500/30'
                            : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/40'
                        }`}>
            <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${config.bgClass}`}>
                    <span className={config.colorClass}>{config.icon}</span>
                </div>

                {/* Details */}
                <div>
                    <p className="text-sm font-medium text-slate-200">{label}</p>
                    {transaction.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate" style={{ maxWidth: `${MAX_DESCRIPTION_WIDTH_PX}px` }}>
                            {transaction.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Amount & Date */}
            <div className="text-right">
                <p className={`text-sm font-bold flex items-center justify-end gap-1
                              ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {isPositive ? '+' : ''}{transaction.amount}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                    {formatRelativeDate(transaction.createdAt, t, language)}
                </p>
            </div>
        </div>
    );
};

export default TransactionItem;
