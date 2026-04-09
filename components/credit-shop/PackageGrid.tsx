import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Check, TrendingUp } from 'lucide-react';
import Skeleton from '../ui/Skeleton';
import type { CreditPackage } from '../../services/paymentService';

interface PackageGridProps {
  packages: CreditPackage[];
  packagesLoaded: boolean;
  selectedPackageId: string | null;
  bestValuePackageId: string | null;
  language: string;
  onSelectPackage: (pkg: CreditPackage) => void;
  t: (key: string, fallback: string) => string;
}

// Badge style based on type
function getBadgeStyles(badge: string | null): string {
  switch (badge) {
    case 'popular':
      return 'bg-gradient-to-r from-amber-500 to-orange-500';
    case 'value':
      return 'bg-gradient-to-r from-green-500 to-emerald-500';
    case 'enthusiast':
      return 'bg-gradient-to-r from-purple-500 to-pink-500';
    default:
      return 'bg-slate-600';
  }
}

// Get badge label via translation key (falls back to DB label if no specific key matches)
function getBadgeLabel(
  badge: string | null,
  dbLabel: string,
  t: (key: string, fallback: string) => string
): string {
  if (badge === 'popular') return t('CreditShop.tsx.CreditShop.badge_popular', dbLabel || '⭐ Most Popular');
  if (badge === 'enthusiast') return t('CreditShop.tsx.CreditShop.badge_enthusiast', dbLabel || '✨ Enthusiast');
  if (badge === 'value') return t('CreditShop.tsx.CreditShop.badge_value', dbLabel || '💰 Best Value');
  return dbLabel;
}

const PackageGridSkeleton: React.FC = () => (
  <>
    <div className="grid grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="p-3 rounded-xl border-2 border-slate-700 bg-slate-800/50">
          <div className="flex items-start justify-between mb-2">
            <Skeleton width={60} height={20} variant="text" />
            <Skeleton width={16} height={16} variant="circular" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Skeleton width={20} height={20} variant="circular" />
              <Skeleton width={40} height={28} variant="text" />
            </div>
            <Skeleton width={50} height={24} variant="text" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="p-4 rounded-xl border-2 border-slate-700 bg-slate-800/50">
          <div className="flex items-start justify-between mb-3">
            <Skeleton width={70} height={20} variant="text" />
            <Skeleton width={20} height={20} variant="circular" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Skeleton width={24} height={24} variant="circular" />
            <Skeleton width={50} height={32} variant="text" />
          </div>
          <Skeleton width={100} height={16} variant="text" className="mb-3" />
          <div className="pt-3 border-t border-slate-700/50">
            <Skeleton width={70} height={28} variant="text" />
          </div>
        </div>
      ))}
    </div>
  </>
);

const PackageGrid: React.FC<PackageGridProps> = ({
  packages,
  packagesLoaded,
  selectedPackageId,
  bestValuePackageId,
  language,
  onSelectPackage,
  t,
}) => {
  if (!packagesLoaded) {
    return (
      <div className="space-y-4 mb-6">
        <PackageGridSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* First row: 2 smaller starter packages */}
      <div className="grid grid-cols-2 gap-3">
        {packages.slice(0, 2).map((pkg, index) => {
          const isSelected = selectedPackageId === pkg.id;
          const label = language === 'en' ? pkg.labelEn : pkg.labelFr;
          const isStarter = index === 0;

          return (
            <motion.button
              key={pkg.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPackage(pkg)}
              className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-amber-400 bg-gradient-to-br from-amber-900/30 to-amber-800/20 shadow-lg shadow-amber-500/20'
                  : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'
              }`}
            >
              {/* Badge row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex flex-wrap gap-1.5">
                  {isStarter && (
                    <span className="px-2 py-0.5 bg-slate-600 rounded text-xs font-bold text-white">
                      {t('CreditShop.tsx.CreditShop.starter', 'Starter')}
                    </span>
                  )}
                  {pkg.badge && (
                    <span
                      className={`px-2 py-0.5 ${getBadgeStyles(pkg.badge)} rounded text-xs font-bold text-white`}
                    >
                      {getBadgeLabel(pkg.badge, label, t)}
                    </span>
                  )}
                  {pkg.discount > 0 && (
                    <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded text-xs font-medium text-green-400">
                      -{pkg.discount}%
                    </span>
                  )}
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-slate-900" />}
                </div>
              </div>

              {/* Credits + Price inline */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Coins className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-purple-400'}`} />
                  <span className="text-2xl font-bold text-white">{pkg.credits}</span>
                  {pkg.bonusCredits && pkg.bonusCredits > 0 && (
                    <span className="text-lg font-bold text-green-400">+{pkg.bonusCredits}</span>
                  )}
                  <span className="text-xs text-slate-400">
                    {t('CreditShop.tsx.CreditShop.credits', 'credits')}
                  </span>
                </div>
                <p className={`text-xl font-bold ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                  €{pkg.priceEur.toFixed(2)}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Second row: 3 larger packages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {packages.slice(2).map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          const label = language === 'en' ? pkg.labelEn : pkg.labelFr;
          const name = language === 'en' ? pkg.nameEn : pkg.nameFr;
          const isBestValue = pkg.id === bestValuePackageId;
          const pricePerCredit = pkg.priceEur / pkg.credits;

          return (
            <motion.button
              key={pkg.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPackage(pkg)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-amber-400 bg-gradient-to-br from-amber-900/30 to-amber-800/20 shadow-lg shadow-amber-500/20'
                  : isBestValue
                    ? 'border-green-500/50 bg-slate-800/70 hover:border-green-400/70'
                    : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'
              }`}
            >
              {/* Top row: Badge + Selection indicator */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-wrap gap-1.5">
                  {pkg.badge && (
                    <span
                      className={`px-2 py-0.5 ${getBadgeStyles(pkg.badge)} rounded text-xs font-bold text-white`}
                    >
                      {getBadgeLabel(pkg.badge, label, t)}
                    </span>
                  )}
                  {isBestValue && !pkg.badge && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded text-xs font-bold text-white flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {t('CreditShop.tsx.CreditShop.best_value', 'Best Value')}
                    </span>
                  )}
                  {pkg.discount > 0 && (
                    <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded text-xs font-medium text-green-400">
                      -{pkg.discount}%
                    </span>
                  )}
                </div>
                {/* Selection check */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-slate-900" />}
                </div>
              </div>

              {/* Credits display - prominent */}
              <div className="flex items-center gap-2 mb-1">
                <Coins
                  className={`w-6 h-6 ${isSelected ? 'text-amber-400' : isBestValue ? 'text-green-400' : 'text-purple-400'}`}
                />
                <span className="text-3xl font-bold text-white">{pkg.credits}</span>
                {pkg.bonusCredits && pkg.bonusCredits > 0 && (
                  <span className="text-xl font-bold text-green-400">+{pkg.bonusCredits}</span>
                )}
                <span className="text-sm text-slate-400">
                  {t('CreditShop.tsx.CreditShop.credits', 'credits')}
                </span>
              </div>

              {/* Package name */}
              <p className="text-sm text-slate-400 mb-3">{name}</p>

              {/* Price section */}
              <div className="pt-3 border-t border-slate-700/50">
                <div className="flex items-baseline justify-between">
                  <p
                    className={`text-2xl font-bold ${isSelected ? 'text-amber-400' : isBestValue ? 'text-green-400' : 'text-white'}`}
                  >
                    €{pkg.priceEur.toFixed(2)}
                  </p>
                  <span className="text-xs text-slate-500">
                    €{pricePerCredit.toFixed(2)}/{t('CreditShop.tsx.CreditShop.credit', 'credit')}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default PackageGrid;
