import React from 'react';
import { BookOpen, Coins, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';

type EmptyStateType = 'readings' | 'transactions' | 'filtered';

interface EmptyStateProps {
    type: EmptyStateType;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
    const { t } = useApp();
    const config = {
        readings: {
            icon: <BookOpen className="w-16 h-16 text-slate-600" />,
            title: t('profile.EmptyState.no_readings_yet', 'No readings yet'),
            description: t('profile.EmptyState.start_your_mystical', 'Start your mystical journey with your first tarot reading'),
            cta: t('profile.EmptyState.get_a_reading', 'Get a Reading'),
        },
        transactions: {
            icon: <Coins className="w-16 h-16 text-slate-600" />,
            title: t('profile.EmptyState.no_transactions_yet', 'No transactions yet'),
            description: t('profile.EmptyState.claim_your_daily', 'Claim your daily bonus to earn free credits'),
            cta: t('profile.EmptyState.claim_daily_bonus', 'Claim Daily Bonus'),
        },
        filtered: {
            icon: <Filter className="w-16 h-16 text-slate-600" />,
            title: t('profile.EmptyState.no_matches_found', 'No matches found'),
            description: t('profile.EmptyState.try_adjusting_your', 'Try adjusting your filters to see more results'),
            cta: t('profile.EmptyState.clear_filters', 'Clear Filters'),
        },
    };

    const state = config[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center py-12 sm:py-16"
        >
            <div className="mb-4">
                {state.icon}
            </div>
            <h3 className="text-lg font-medium text-slate-400 mb-2">{state.title}</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto px-4">{state.description}</p>
            {onAction && (
                <button
                    onClick={onAction}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg
                               transition-colors duration-200 text-sm font-medium"
                >
                    {state.cta}
                </button>
            )}
        </motion.div>
    );
};

export default EmptyState;
