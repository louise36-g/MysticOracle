import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Coins, BookOpen, Shield, Mail, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { SPREADS } from '../constants';
import { SpreadType } from '../types';
import Button from './Button';
import { ROUTES } from '../routes/routes';

// Follow-up question cost (same as backend)
const FOLLOW_UP_CREDIT_COST = 1;
const SUPPORT_EMAIL = 'support@mysticoracle.com';

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-slate-900/30 hover:border-purple-500/30 transition-colors">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <span className="text-slate-200 font-medium pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-4 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-3">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface FAQSectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
}

const FAQSection: React.FC<FAQSectionProps> = ({ title, icon, iconColor, children }) => {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full ${iconColor} flex items-center justify-center`}>
          {icon}
        </div>
        <h2 className="text-xl font-heading text-amber-100">{title}</h2>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  const { t, language } = useTranslation();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = useCallback((id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Get actual costs from constants (with safe access for spreads that may not exist)
  const singleCardCost = SPREADS[SpreadType.SINGLE]?.cost ?? 1;
  const threeCardCost = SPREADS[SpreadType.THREE_CARD]?.cost ?? 3;
  const fiveCardCost = SPREADS[SpreadType.FIVE_CARD]?.cost ?? 5; // Love & Career are now 5-card layouts
  const horseshoeCost = SPREADS[SpreadType.HORSESHOE]?.cost ?? 7;
  const celticCrossCost = SPREADS[SpreadType.CELTIC_CROSS]?.cost ?? 10;

  // Helper to create styled links
  const StyledLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link
      to={to}
      className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
    >
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative py-16 px-4 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-purple-300 mb-4">
            {t('faq.hero.title', 'Frequently Asked Questions')}
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto">
            {t('faq.hero.subtitle', 'Everything you need to know about MysticOracle')}
          </p>
        </motion.div>
      </section>

      <div className="max-w-3xl mx-auto px-4">
        {/* Important Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 p-5 bg-amber-900/20 border border-amber-500/30 rounded-xl"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-amber-200 font-medium mb-2">
                {t('faq.disclaimer.title', 'Important Notice')}
              </h3>
              <p className="text-sm text-amber-200/70 leading-relaxed">
                {t('faq.disclaimer.text', 'MysticOracle is for entertainment and personal reflection purposes only. Tarot readings provided here are generated by artificial intelligence and should not be considered professional advice (medical, legal, financial, or otherwise). The interpretations offer symbolic guidance and perspective, not predictions of the future. We encourage you to use these readings as a tool for self-reflection, not as a basis for important life decisions. Always consult qualified professionals for serious matters.')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Getting Started */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <FAQSection
            title={t('faq.gettingStarted.title', 'Getting Started')}
            icon={<BookOpen className="w-5 h-5 text-white" />}
            iconColor="bg-cyan-500/30"
          >
            <FAQItem
              question={t('faq.gettingStarted.q1', 'What is MysticOracle?')}
              answer={t('faq.gettingStarted.a1', 'MysticOracle is an AI-powered tarot reading application. Each reading combines traditional tarot symbolism with personalized interpretation based on your question and the cards drawn. It\'s designed to offer guidance, perspective, and moments of reflection through the rich imagery of tarot.')}
              isOpen={openItems.has('gs-1')}
              onToggle={() => toggleItem('gs-1')}
            />
            <FAQItem
              question={t('faq.gettingStarted.q2', 'Is this real tarot?')}
              answer={t('faq.gettingStarted.a2', 'We use authentic tarot card meanings, traditional spreads, and genuine symbolism from the Rider-Waite-Smith tradition. The interpretations are generated by AI, crafted to be thoughtful and relevant to your situation. Think of it as tarot wisdom made accessible — the cards are real, the meanings are authentic, and the technology helps deliver personalized insights.')}
              isOpen={openItems.has('gs-2')}
              onToggle={() => toggleItem('gs-2')}
            />
            <FAQItem
              question={t('faq.gettingStarted.q3', 'Do I need to know tarot to use this?')}
              answer={t('faq.gettingStarted.a3', 'Not at all. MysticOracle is designed for everyone, from complete beginners to experienced readers. Simply ask your question and we\'ll handle the rest. Each reading explains the cards drawn, their traditional meanings, and how they relate to your specific situation.')}
              isOpen={openItems.has('gs-3')}
              onToggle={() => toggleItem('gs-3')}
            />
            <FAQItem
              question={t('faq.gettingStarted.q4', 'Are the readings accurate predictions?')}
              answer={
                <span>
                  {t('faq.gettingStarted.a4', 'MysticOracle does not predict the future. Tarot is a tool for reflection and insight, not divination. Our AI-generated interpretations offer symbolic guidance based on traditional card meanings. They\'re meant to help you think about your situation from new angles, not to tell you what will happen. The value lies in the perspective and self-reflection they inspire.')}
                </span>
              }
              isOpen={openItems.has('gs-4')}
              onToggle={() => toggleItem('gs-4')}
            />
            <FAQItem
              question={t('faq.gettingStarted.q5', 'Are the interpretations generated by AI?')}
              answer={t('faq.gettingStarted.a5', 'Yes. All readings are generated by artificial intelligence. While we\'ve trained our system on authentic tarot meanings and interpretation techniques, AI can make mistakes or produce responses that don\'t fully resonate with your situation. Use the readings as one perspective among many, and trust your own intuition above all.')}
              isOpen={openItems.has('gs-5')}
              onToggle={() => toggleItem('gs-5')}
            />
          </FAQSection>
        </motion.div>

        {/* Credits & Payment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FAQSection
            title={t('faq.credits.title', 'Credits & Payment')}
            icon={<Coins className="w-5 h-5 text-white" />}
            iconColor="bg-amber-500/30"
          >
            <FAQItem
              question={t('faq.credits.q1', 'How do credits work?')}
              answer={
                <span>
                  {t('faq.credits.a1', 'Credits are how you pay for readings. There are no subscriptions or monthly fees — you simply buy credits when you need them, or earn them for free through daily bonuses and referrals.')}{' '}
                  <StyledLink to={ROUTES.HOW_CREDITS_WORK}>{t('faq.credits.learnMore', 'Learn more about credits')}</StyledLink>
                </span>
              }
              isOpen={openItems.has('cp-1')}
              onToggle={() => toggleItem('cp-1')}
            />
            <FAQItem
              question={t('faq.credits.q2', 'How much do readings cost?')}
              answer={
                <span>
                  {language === 'en'
                    ? `A Single Card reading costs ${singleCardCost} credit. Three Card spreads cost ${threeCardCost} credits. Five Card spreads (Love & Career) cost ${fiveCardCost} credits. Horseshoe spreads cost ${horseshoeCost} credits. The comprehensive Celtic Cross costs ${celticCrossCost} credits. Follow-up questions: 2 questions for ${FOLLOW_UP_CREDIT_COST} credit.`
                    : `Une lecture Carte Unique coûte ${singleCardCost} crédit. Les tirages à Trois Cartes coûtent ${threeCardCost} crédits. Les tirages à Cinq Cartes (Amour & Carrière) coûtent ${fiveCardCost} crédits. Les tirages Fer à Cheval coûtent ${horseshoeCost} crédits. La Croix Celtique complète coûte ${celticCrossCost} crédits. Questions de suivi : 2 questions pour ${FOLLOW_UP_CREDIT_COST} crédit.`
                  }{' '}
                  <StyledLink to={ROUTES.HOW_CREDITS_WORK}>{t('faq.credits.seeFullPricing', 'See full pricing')}</StyledLink>
                </span>
              }
              isOpen={openItems.has('cp-2')}
              onToggle={() => toggleItem('cp-2')}
            />
            <FAQItem
              question={t('faq.credits.q3', 'Do credits expire?')}
              answer={t('faq.credits.a3', 'No. Your credits never expire. They\'re yours until you use them, whether that\'s tomorrow or years from now.')}
              isOpen={openItems.has('cp-3')}
              onToggle={() => toggleItem('cp-3')}
            />
            <FAQItem
              question={t('faq.credits.q4', 'What payment methods do you accept?')}
              answer={t('faq.credits.a4', 'We accept credit and debit cards through Stripe (Visa, Mastercard, American Express, and more) as well as PayPal. All payments are processed securely — we never see or store your payment details.')}
              isOpen={openItems.has('cp-4')}
              onToggle={() => toggleItem('cp-4')}
            />
            <FAQItem
              question={t('faq.credits.q5', 'Can I get a refund?')}
              answer={
                <span>
                  {t('faq.credits.a5', 'We evaluate refund requests on a case-by-case basis. If you\'re unhappy with a purchase, please contact us at')}{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                    {SUPPORT_EMAIL}
                  </a>{' '}
                  {t('faq.credits.a5b', 'and we\'ll do our best to help.')}
                </span>
              }
              isOpen={openItems.has('cp-5')}
              onToggle={() => toggleItem('cp-5')}
            />
          </FAQSection>
        </motion.div>

        {/* Your Readings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FAQSection
            title={t('faq.readings.title', 'Your Readings')}
            icon={<BookOpen className="w-5 h-5 text-white" />}
            iconColor="bg-purple-500/30"
          >
            <FAQItem
              question={t('faq.readings.q1', 'Are my readings saved?')}
              answer={
                <span>
                  {t('faq.readings.a1', 'Yes. All your readings are automatically saved to your account. You can view your complete reading history anytime from your')}{' '}
                  <StyledLink to={ROUTES.PROFILE}>{t('faq.readings.profile', 'profile page')}</StyledLink>.
                </span>
              }
              isOpen={openItems.has('yr-1')}
              onToggle={() => toggleItem('yr-1')}
            />
            <FAQItem
              question={t('faq.readings.q2', 'Can I ask follow-up questions?')}
              answer={
                language === 'en'
                  ? `Yes. After receiving your reading, you can ask follow-up questions to dive deeper or clarify specific aspects. You get 2 follow-up questions for ${FOLLOW_UP_CREDIT_COST} credit.`
                  : `Oui. Après avoir reçu votre lecture, vous pouvez poser des questions de suivi pour approfondir ou clarifier des aspects spécifiques. Vous obtenez 2 questions de suivi pour ${FOLLOW_UP_CREDIT_COST} crédit.`
              }
              isOpen={openItems.has('yr-2')}
              onToggle={() => toggleItem('yr-2')}
            />
            <FAQItem
              question={t('faq.readings.q3', 'What spread types are available?')}
              answer={
                <span>
                  {t('faq.readings.a3', 'We offer several spread types to suit different needs:')}<br /><br />
                  <strong className="text-slate-300">{t('faq.readings.spread1', 'Single Card')}</strong> ({singleCardCost} {t(singleCardCost === 1 ? 'faq.credit' : 'faq.credits', singleCardCost === 1 ? 'credit' : 'credits')}) — {t('faq.readings.spread1desc', 'Quick guidance for simple questions')}<br />
                  <strong className="text-slate-300">{t('faq.readings.spread2', 'Three Card')}</strong> ({threeCardCost} {t('faq.credits', 'credits')}) — {t('faq.readings.spread2desc', 'Past, present, and future perspective')}<br />
                  <strong className="text-slate-300">{t('faq.readings.spread5', 'Five Card (Love & Career)')}</strong> ({fiveCardCost} {t('faq.credits', 'credits')}) — {t('faq.readings.spread5desc', '5-card spreads for relationships and career')}<br />
                  <strong className="text-slate-300">{t('faq.readings.spread3', 'Horseshoe')}</strong> ({horseshoeCost} {t('faq.credits', 'credits')}) — {t('faq.readings.spread3desc', 'Deeper situation analysis with 7 cards')}<br />
                  <strong className="text-slate-300">{t('faq.readings.spread4', 'Celtic Cross')}</strong> ({celticCrossCost} {t('faq.credits', 'credits')}) — {t('faq.readings.spread4desc', 'Comprehensive 10-card reading for complex questions')}
                </span>
              }
              isOpen={openItems.has('yr-3')}
              onToggle={() => toggleItem('yr-3')}
            />
            <FAQItem
              question={t('faq.readings.q4', 'Can I add my own reflections to readings?')}
              answer={t('faq.readings.a4', 'Yes. After each reading, you have the option to write your own reflections and thoughts. This helps you process the reading and creates a personal journal of your tarot journey.')}
              isOpen={openItems.has('yr-4')}
              onToggle={() => toggleItem('yr-4')}
            />
            <FAQItem
              question={t('faq.readings.q5', 'What languages are supported?')}
              answer={t('faq.readings.a5', 'MysticOracle is fully available in English and French. You can switch languages anytime using the flag icon in the header. Your readings will be generated in your selected language.')}
              isOpen={openItems.has('yr-5')}
              onToggle={() => toggleItem('yr-5')}
            />
          </FAQSection>
        </motion.div>

        {/* Privacy & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <FAQSection
            title={t('faq.privacy.title', 'Privacy & Security')}
            icon={<Shield className="w-5 h-5 text-white" />}
            iconColor="bg-green-500/30"
          >
            <FAQItem
              question={t('faq.privacy.q1', 'Is my data private?')}
              answer={
                <span>
                  {t('faq.privacy.a1', 'Yes. Your readings, questions, and personal reflections are completely private to your account. We do not share, sell, or use your data for any purpose other than providing you with the service. See our')}{' '}
                  <StyledLink to={ROUTES.PRIVACY}>{t('faq.privacy.privacyPolicy', 'Privacy Policy')}</StyledLink>{' '}
                  {t('faq.privacy.a1b', 'for complete details.')}
                </span>
              }
              isOpen={openItems.has('ps-1')}
              onToggle={() => toggleItem('ps-1')}
            />
            <FAQItem
              question={t('faq.privacy.q2', 'Where is my data stored?')}
              answer={t('faq.privacy.a2', 'Your data is stored on secure servers in the European Union (Frankfurt, Germany), in compliance with GDPR regulations. We use industry-standard encryption to protect your information.')}
              isOpen={openItems.has('ps-2')}
              onToggle={() => toggleItem('ps-2')}
            />
            <FAQItem
              question={t('faq.privacy.q3', 'How do I delete my account?')}
              answer={
                <span>
                  {t('faq.privacy.a3', 'To delete your account and all associated data, please contact us at')}{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                    {SUPPORT_EMAIL}
                  </a>.{' '}
                  {t('faq.privacy.a3b', 'We\'ll process your request within 30 days and confirm once your data has been permanently deleted.')}
                </span>
              }
              isOpen={openItems.has('ps-3')}
              onToggle={() => toggleItem('ps-3')}
            />
            <FAQItem
              question={t('faq.privacy.q4', 'Is payment information secure?')}
              answer={t('faq.privacy.a4', 'Absolutely. All payments are processed by Stripe and PayPal — industry leaders in payment security. We never see, store, or have access to your credit card numbers or banking details.')}
              isOpen={openItems.has('ps-4')}
              onToggle={() => toggleItem('ps-4')}
            />
          </FAQSection>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <FAQSection
            title={t('faq.support.title', 'Support')}
            icon={<Mail className="w-5 h-5 text-white" />}
            iconColor="bg-indigo-500/30"
          >
            <FAQItem
              question={t('faq.support.q1', 'How do I contact support?')}
              answer={
                <span>
                  {t('faq.support.a1', 'Email us at')}{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                    {SUPPORT_EMAIL}
                  </a>.{' '}
                  {t('faq.support.a1b', 'We typically respond within 24-48 hours.')}
                </span>
              }
              isOpen={openItems.has('sp-1')}
              onToggle={() => toggleItem('sp-1')}
            />
            <FAQItem
              question={t('faq.support.q2', 'I have a payment issue')}
              answer={
                <span>
                  {t('faq.support.a2', 'We\'re sorry to hear that. Please contact us at')}{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                    {SUPPORT_EMAIL}
                  </a>{' '}
                  {t('faq.support.a2b', 'with your payment confirmation or any relevant details. We\'ll investigate and resolve the issue as quickly as possible.')}
                </span>
              }
              isOpen={openItems.has('sp-2')}
              onToggle={() => toggleItem('sp-2')}
            />
            <FAQItem
              question={t('faq.support.q3', 'Something isn\'t working correctly')}
              answer={
                <span>
                  {t('faq.support.a3', 'Please email us at')}{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                    {SUPPORT_EMAIL}
                  </a>{' '}
                  {t('faq.support.a3b', 'with a description of the issue, what you were trying to do, and any error messages you saw. Screenshots are always helpful!')}
                </span>
              }
              isOpen={openItems.has('sp-3')}
              onToggle={() => toggleItem('sp-3')}
            />
            <FAQItem
              question={t('faq.support.q4', 'Can I suggest a feature?')}
              answer={
                <span>
                  {t('faq.support.a4', 'Absolutely! We love hearing from our users. Send your ideas to')}{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                    {SUPPORT_EMAIL}
                  </a>.{' '}
                  {t('faq.support.a4b', 'We read every suggestion and consider them for future updates.')}
                </span>
              }
              isOpen={openItems.has('sp-4')}
              onToggle={() => toggleItem('sp-4')}
            />
          </FAQSection>
        </motion.div>

        {/* Still have questions CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center py-10 mt-6"
        >
          <div className="bg-gradient-to-r from-purple-900/30 via-slate-900/50 to-purple-900/30 border border-purple-500/20 rounded-2xl p-8">
            <h2 className="text-xl font-heading text-amber-100 mb-3">
              {t('faq.cta.title', 'Still have questions?')}
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              {t('faq.cta.description', 'We\'re here to help. Reach out and we\'ll get back to you as soon as possible.')}
            </p>
            <Button
              onClick={() => window.location.href = `mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {t('faq.cta.button', 'Contact Support')}
            </Button>
          </div>
        </motion.div>

        {/* Final disclaimer */}
        <div className="text-center text-xs text-slate-500 mt-8 pb-8">
          <p>
            {t('faq.footer.disclaimer', 'MysticOracle is intended for entertainment and personal insight only. Readings are AI-generated and should not replace professional advice. By using this service, you agree to our')}{' '}
            <StyledLink to={ROUTES.TERMS}>{t('faq.footer.terms', 'Terms of Service')}</StyledLink>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
