import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Calendar, Users, Award, CreditCard, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SPREADS } from '../constants';
import { SpreadType } from '../types';
import Button from './Button';
import CreditShop from './CreditShop';
import { ROUTES } from '../routes/routes';

// Follow-up question cost (same as backend)
const FOLLOW_UP_CREDIT_COST = 1;

interface HowCreditsWorkProps {
  onOpenCreditShop?: () => void;
}

const HowCreditsWork: React.FC<HowCreditsWorkProps> = ({ onOpenCreditShop }) => {
  const navigate = useNavigate();
  const { language } = useApp();
  const [showCreditShop, setShowCreditShop] = useState(false);

  // Use provided callback or manage our own modal
  const handleOpenCreditShop = () => {
    if (onOpenCreditShop) {
      onOpenCreditShop();
    } else {
      setShowCreditShop(true);
    }
  };

  // Get spread costs directly from constants
  const spreadCosts = [
    {
      type: SpreadType.SINGLE,
      nameEn: SPREADS[SpreadType.SINGLE].nameEn,
      nameFr: SPREADS[SpreadType.SINGLE].nameFr,
      cost: SPREADS[SpreadType.SINGLE].cost
    },
    {
      type: SpreadType.THREE_CARD,
      nameEn: SPREADS[SpreadType.THREE_CARD].nameEn,
      nameFr: SPREADS[SpreadType.THREE_CARD].nameFr,
      cost: SPREADS[SpreadType.THREE_CARD].cost
    },
    {
      type: SpreadType.HORSESHOE,
      nameEn: SPREADS[SpreadType.HORSESHOE].nameEn,
      nameFr: SPREADS[SpreadType.HORSESHOE].nameFr,
      cost: SPREADS[SpreadType.HORSESHOE].cost
    },
    {
      type: SpreadType.CELTIC_CROSS,
      nameEn: SPREADS[SpreadType.CELTIC_CROSS].nameEn,
      nameFr: SPREADS[SpreadType.CELTIC_CROSS].nameFr,
      cost: SPREADS[SpreadType.CELTIC_CROSS].cost
    },
  ];

  const handleStartReading = () => {
    navigate(ROUTES.READING);
  };

  const content = {
    en: {
      heroTitle: 'How Credits Work',
      heroSubtitle: 'Simple, transparent, no subscriptions',
      whatAreTitle: 'What Are Credits?',
      whatAreDesc: "Credits are your currency for tarot readings on CelestiArcana. There are no monthly fees or subscriptions — you simply purchase credits when you need them, and they never expire. Each reading type has a fixed cost, so you always know exactly what you're spending.",
      costsTitle: 'Reading Costs',
      readingType: 'Reading Type',
      credits: 'Credits',
      credit: 'credit',
      creditsPlural: 'credits',
      followUp: 'Follow-up Question',
      costsNote: 'More complex spreads with additional cards provide deeper insights and cost more credits.',
      earnTitle: 'Earning Free Credits',
      dailyTitle: 'Daily Bonus',
      dailyDesc: 'Visit each day to claim free credits. Build a streak for bigger rewards — 7-day streaks unlock bonus credits!',
      referralsTitle: 'Referrals',
      referralsDesc: 'Share your referral link with friends. When they sign up and make their first reading, you both earn credits.',
      achievementsTitle: 'Achievements',
      achievementsDesc: 'Complete milestones like your first reading, trying all spread types, or maintaining streaks to unlock bonus credits.',
      buyTitle: 'Buying Credits',
      buyDesc: 'Need more credits? Purchase them instantly through our secure checkout. We offer several packages to suit your needs, with bigger packages offering better value.',
      stripe: 'Credit/Debit Cards (Stripe)',
      paypal: 'PayPal',
      viewPackages: 'View Credit Packages',
      ctaTitle: 'Ready to begin?',
      ctaDesc: 'Start your journey with a tarot reading and discover what the cards reveal for you.',
      ctaButton: 'Start a Reading',
    },
    fr: {
      heroTitle: 'Comment fonctionnent les crédits',
      heroSubtitle: 'Simple, transparent, sans abonnement',
      whatAreTitle: 'Que sont les crédits ?',
      whatAreDesc: "Les crédits sont votre monnaie pour les tirages de tarot sur CelestiArcana. Il n'y a pas de frais mensuels ni d'abonnements — vous achetez simplement des crédits quand vous en avez besoin, et ils n'expirent jamais. Chaque type de tirage a un coût fixe, vous savez donc toujours exactement ce que vous dépensez.",
      costsTitle: 'Coûts des tirages',
      readingType: 'Type de tirage',
      credits: 'Crédits',
      credit: 'crédit',
      creditsPlural: 'crédits',
      followUp: 'Question de suivi',
      costsNote: 'Les tirages plus complexes avec des cartes supplémentaires offrent des aperçus plus profonds et coûtent plus de crédits.',
      earnTitle: 'Gagner des crédits gratuits',
      dailyTitle: 'Bonus quotidien',
      dailyDesc: 'Visitez chaque jour pour réclamer des crédits gratuits. Construisez une série pour de plus grandes récompenses — les séries de 7 jours débloquent des crédits bonus !',
      referralsTitle: 'Parrainages',
      referralsDesc: "Partagez votre lien de parrainage avec vos amis. Quand ils s'inscrivent et font leur premier tirage, vous gagnez tous les deux des crédits.",
      achievementsTitle: 'Succès',
      achievementsDesc: "Complétez des étapes comme votre premier tirage, essayer tous les types de tirages, ou maintenir des séries pour débloquer des crédits bonus.",
      buyTitle: 'Acheter des crédits',
      buyDesc: "Besoin de plus de crédits ? Achetez-les instantanément via notre paiement sécurisé. Nous offrons plusieurs forfaits pour répondre à vos besoins, avec de meilleurs tarifs pour les plus gros forfaits.",
      stripe: 'Cartes de crédit/débit (Stripe)',
      paypal: 'PayPal',
      viewPackages: 'Voir les forfaits de crédits',
      ctaTitle: 'Prêt à commencer ?',
      ctaDesc: 'Commencez votre voyage avec un tirage de tarot et découvrez ce que les cartes révèlent pour vous.',
      ctaButton: 'Commencer un tirage',
    },
  };

  const t = content[language];

  return (
    <>
    {/* Credit Shop Modal (only rendered if not using external handler) */}
    {!onOpenCreditShop && (
      <CreditShop isOpen={showCreditShop} onClose={() => setShowCreditShop(false)} />
    )}

    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative py-16 px-4 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-purple-300 mb-4">
            {t.heroTitle}
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto">
            {t.heroSubtitle}
          </p>
        </motion.div>
      </section>

      <div className="max-w-4xl mx-auto px-4 space-y-16">
        {/* Section 1: What Are Credits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-heading text-amber-100 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-bold">1</span>
            {t.whatAreTitle}
          </h2>
          <div className="bg-slate-900/50 border border-white/5 rounded-xl p-6">
            <p className="text-slate-300 leading-relaxed">
              {t.whatAreDesc}
            </p>
          </div>
        </motion.section>

        {/* Section 2: Reading Costs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-heading text-amber-100 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-bold">2</span>
            {t.costsTitle}
          </h2>

          <div className="grid gap-3">
            {/* Header row */}
            <div className="grid grid-cols-2 gap-4 px-4 py-2 text-sm text-slate-400 font-medium">
              <span>{t.readingType}</span>
              <span className="text-right">{t.credits}</span>
            </div>

            {/* Spread costs */}
            {spreadCosts.map((spread, index) => (
              <motion.div
                key={spread.type}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="grid grid-cols-2 gap-4 bg-slate-900/50 border border-white/5 rounded-lg px-4 py-3 hover:border-purple-500/30 transition-colors"
              >
                <span className="text-slate-200">
                  {language === 'fr' ? spread.nameFr : spread.nameEn}
                </span>
                <span className="text-right text-amber-400 font-semibold">
                  {spread.cost} {spread.cost === 1 ? t.credit : t.creditsPlural}
                </span>
              </motion.div>
            ))}

            {/* Follow-up question */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="grid grid-cols-2 gap-4 bg-slate-900/50 border border-white/5 rounded-lg px-4 py-3 hover:border-purple-500/30 transition-colors"
            >
              <span className="text-slate-200">
                {t.followUp}
              </span>
              <span className="text-right text-amber-400 font-semibold">
                {FOLLOW_UP_CREDIT_COST} {t.credit}
              </span>
            </motion.div>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            {t.costsNote}
          </p>
        </motion.section>

        {/* Section 3: Earning Free Credits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-heading text-amber-100 mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-bold">3</span>
            {t.earnTitle}
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Daily Bonus */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:border-cyan-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-heading text-purple-200 mb-2">
                {t.dailyTitle}
              </h3>
              <p className="text-sm text-slate-400">
                {t.dailyDesc}
              </p>
            </motion.div>

            {/* Referrals */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:border-purple-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-heading text-purple-200 mb-2">
                {t.referralsTitle}
              </h3>
              <p className="text-sm text-slate-400">
                {t.referralsDesc}
              </p>
            </motion.div>

            {/* Achievements */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-slate-900/50 border border-white/5 rounded-xl p-6 hover:border-amber-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-heading text-purple-200 mb-2">
                {t.achievementsTitle}
              </h3>
              <p className="text-sm text-slate-400">
                {t.achievementsDesc}
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Section 4: Buying Credits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-heading text-amber-100 mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-bold">4</span>
            {t.buyTitle}
          </h2>

          <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/20 border border-purple-500/20 rounded-xl p-6">
            <p className="text-slate-300 mb-6">
              {t.buyDesc}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CreditCard className="w-4 h-4" />
                <span>{t.stripe}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="font-bold text-blue-400">P</span>
                <span>{t.paypal}</span>
              </div>
            </div>

            <Button onClick={handleOpenCreditShop} className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              {t.viewPackages}
            </Button>
          </div>
        </motion.section>

        {/* Footer CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center py-8"
        >
          <div className="bg-gradient-to-r from-purple-900/30 via-slate-900/50 to-purple-900/30 border border-purple-500/20 rounded-2xl p-8">
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-amber-100 mb-3">
              {t.ctaTitle}
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              {t.ctaDesc}
            </p>
            <Button size="lg" onClick={handleStartReading} className="flex items-center gap-2 mx-auto">
              {t.ctaButton}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.section>
      </div>
    </div>
    </>
  );
};

export default HowCreditsWork;
