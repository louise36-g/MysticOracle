import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, ChevronDown, ChevronUp, Coins, Sparkles, Loader2 } from 'lucide-react';
import { SpreadConfig, TarotCard, SpreadType, ReadingCategory } from '../../../types';
import Card from '../../Card';
import Button from '../../Button';
import ThemedBackground from '../ThemedBackground';
import OracleChat from '../OracleChat';
import ReflectionPrompt from '../ReflectionPrompt';
import { ReadingCompleteCelebration } from '../../rewards';
import { SPREAD_THEMES } from '../SpreadThemes';
import { THREE_CARD_LAYOUTS, ThreeCardLayoutId } from '../../../constants/threeCardLayouts';
import { FIVE_CARD_LAYOUTS, FiveCardLayoutId } from '../../../constants/fiveCardLayouts';
import { getCategory } from '../../../constants/categoryConfig';

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
}

interface InterpretationPhaseProps {
  spread: SpreadConfig;
  language: 'en' | 'fr';
  drawnCards: DrawnCard[];
  question: string;
  readingText: string;
  isGenerating: boolean;
  loadingMessages: string[];
  loadingMessageIndex: number;
  isContextExpanded: boolean;
  showCelebration: boolean;
  backendReadingId: string | null;
  credits: number;
  chatHistory: { role: 'user' | 'model'; content: string }[];
  chatInput: string;
  isChatLoading: boolean;
  questionCost: number;
  threeCardLayout?: ThreeCardLayoutId | null;
  fiveCardLayout?: FiveCardLayoutId | null;
  category?: ReadingCategory;
  clarificationCards?: Array<{
    card: TarotCard;
    isReversed: boolean;
    interpretation: string;
  }>;
  isClarificationLoading?: boolean;
  canDrawClarification?: boolean;
  onDrawClarification?: () => void;
  onContextToggle: () => void;
  onFinish: () => void;
  onCelebrationComplete: () => void;
  onSaveReflection: (reflection: string) => Promise<void>;
  onChatInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

const InterpretationPhase: React.FC<InterpretationPhaseProps> = ({
  spread,
  language,
  drawnCards,
  question,
  readingText,
  isGenerating,
  loadingMessages,
  loadingMessageIndex,
  isContextExpanded,
  showCelebration,
  backendReadingId,
  credits,
  chatHistory,
  chatInput,
  isChatLoading,
  questionCost,
  threeCardLayout,
  fiveCardLayout,
  category,
  clarificationCards = [],
  isClarificationLoading,
  canDrawClarification,
  onDrawClarification,
  onContextToggle,
  onFinish,
  onCelebrationComplete,
  onSaveReflection,
  onChatInputChange,
  onSendMessage,
}) => {
  const spreadTheme = SPREAD_THEMES[spread.id];
  const categoryConfig = category ? getCategory(category) : null;
  const categoryTheme = categoryConfig?.colorTheme;

  // Unified theme: prefer category colors when available
  const theme = {
    textAccent: categoryTheme ? `text-${categoryTheme.accent}` : spreadTheme.textAccent,
    cardBorder: categoryTheme ? categoryTheme.border : spreadTheme.cardBorder,
    bgGradient: categoryTheme ? categoryTheme.gradient : spreadTheme.bgGradient,
    glow: categoryTheme ? categoryTheme.glow : spreadTheme.glow,
    icon: categoryConfig?.icon || spreadTheme.icon,
    name: categoryConfig ? (language === 'en' ? categoryConfig.labelEn : categoryConfig.labelFr) : spreadTheme.name,
    primary: spreadTheme.primary,
    secondary: spreadTheme.secondary,
  };

  // Clarification card draw state
  const [hasStartedDraw, setHasStartedDraw] = React.useState(false);
  const prevCardsLength = React.useRef(clarificationCards?.length ?? 0);

  // Reset draw animation when a new card arrives
  React.useEffect(() => {
    const len = clarificationCards?.length ?? 0;
    if (len > prevCardsLength.current && hasStartedDraw) {
      setHasStartedDraw(false);
    }
    prevCardsLength.current = len;
  }, [clarificationCards?.length, hasStartedDraw]);

  const handleDeckTap = () => {
    setHasStartedDraw(true);
    onDrawClarification?.();
  };

  return (
    <div className="relative min-h-screen">
      {/* Themed Background - uses category colors when available */}
      <ThemedBackground
        spreadType={spread.id}
        categoryTheme={categoryTheme ? {
          gradient: categoryTheme.gradient,
          glow: categoryTheme.glow,
        } : undefined}
      />

      <div className="container mx-auto max-w-4xl px-4 py-6 pb-32 relative z-10">
        {/* Loading State */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[50vh] py-12"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-white/20 rounded-full"></div>
              <div
                className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-spin"
                style={{ borderTopColor: theme.primary }}
              />
              <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${theme.textAccent}`}>
                {theme.icon}
              </span>
            </div>
            <motion.p
              key={loadingMessageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white font-heading text-xl mt-6"
            >
              {loadingMessages[loadingMessageIndex]}
            </motion.p>
            <p className={`text-sm mt-2 ${theme.textAccent} opacity-60`}>
              {language === 'en'
                ? 'Your personalized reading is being channeled...'
                : 'Votre lecture personnalisée est en cours de canalisation...'}
            </p>
          </motion.div>
        )}

        {/* Main Content - Only show when not generating */}
        {!isGenerating && (
          <>
            {/* Theme Header */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 border border-white/10">
                <span className={theme.textAccent}>{theme.icon}</span>
                <span className="text-xs text-white/50 uppercase tracking-wider">{theme.name}</span>
                <span className="text-white/30">•</span>
                <span className="text-xs text-white/40">{language === 'en' ? spread.nameEn : spread.nameFr}</span>
              </div>
            </div>

            {/* Collapsible Reading Context Panel */}
            <div className="mb-4">
              <button
                onClick={onContextToggle}
                className="w-full bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4 hover:bg-black/40 transition-colors group"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Question preview */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Quote className="w-4 h-4 text-amber-500/70 flex-shrink-0" />
                    <p className="text-amber-100/90 text-sm md:text-base italic truncate">
                      {question}
                    </p>
                  </div>

                  {/* Mini card thumbnails */}
                  <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                    {drawnCards.slice(0, 5).map((item, i) => (
                      <div
                        key={`mini-${i}`}
                        className="w-6 h-9 md:w-7 md:h-10 rounded bg-gradient-to-br from-indigo-900 to-purple-950 border border-amber-600/40 flex items-center justify-center text-[8px] text-amber-500/60 font-bold"
                      >
                        {i + 1}
                      </div>
                    ))}
                    {drawnCards.length > 5 && (
                      <span className="text-xs text-slate-500 ml-1">+{drawnCards.length - 5}</span>
                    )}
                  </div>

                  {/* Expand/collapse indicator */}
                  <div className="flex-shrink-0 text-slate-400 group-hover:text-purple-300 transition-colors">
                    {isContextExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded cards view */}
              <AnimatePresence>
                {isContextExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-black/20 border-x border-b border-white/10 rounded-b-xl p-4 md:p-6 -mt-2">
                      <div className="flex flex-wrap gap-4 justify-center">
                        {drawnCards.map((item, i) => (
                          <motion.div
                            key={`expanded-card-${i}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex flex-col items-center"
                          >
                            <Card
                              card={item.card}
                              isRevealed={true}
                              isReversed={item.isReversed}
                              width={100}
                              height={155}
                              className="shadow-lg"
                              hideOverlay={true}
                            />
                            <span className={`text-[10px] ${theme.textAccent} mt-2 font-bold uppercase tracking-wider text-center max-w-[100px]`}>
                              {spread.id === SpreadType.THREE_CARD && threeCardLayout && THREE_CARD_LAYOUTS[threeCardLayout]
                                ? THREE_CARD_LAYOUTS[threeCardLayout].positions[language][i]
                                : spread.id === SpreadType.FIVE_CARD && fiveCardLayout && FIVE_CARD_LAYOUTS[fiveCardLayout]
                                  ? FIVE_CARD_LAYOUTS[fiveCardLayout].positions[language][i]
                                  : language === 'en' ? spread.positionMeaningsEn[i] : spread.positionMeaningsFr[i]}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 text-center max-w-[100px] truncate">
                              {language === 'en' ? item.card.nameEn : item.card.nameFr}
                              {item.isReversed && (language === 'en' ? ' (R)' : ' (R)')}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* The Oracle's Interpretation - Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {/* Decorative header */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${theme.primary}50)` }}></div>
                <span className={`text-xs font-bold ${theme.textAccent} uppercase tracking-[0.2em]`}>
                  {language === 'en' ? 'The Oracle Speaks' : 'L\'Oracle Parle'}
                </span>
                <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${theme.primary}50)` }}></div>
              </div>

              {/* Reading content box */}
              <div
                className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-10"
                style={{ boxShadow: `0 0 60px ${theme.glow}` }}
              >
                <div className="max-w-none">
                  {readingText.split('\n').map((line, i) => {
                    if (!line.trim()) return null;
                    const trimmedLine = line.trim();

                    // Headers: lines starting with **, #, or numbered lists with ** (e.g., "1. **Header**")
                    // Also detect lines that are entirely bold (card names like "**The Fool** (Position)")
                    const isNumberedHeader = /^\d+\.\s*\*\*/.test(trimmedLine);
                    const isMarkdownHeader = trimmedLine.startsWith('#');
                    const isBoldHeader = trimmedLine.startsWith('**') && (
                      trimmedLine.endsWith('**') ||
                      trimmedLine.includes('** -') ||
                      trimmedLine.includes('**:') ||
                      /\*\*\s*\(/.test(trimmedLine) // Card name with position like "**The Fool** (Present)"
                    );

                    const isHeader = isNumberedHeader || isMarkdownHeader || isBoldHeader;

                    if (isHeader) {
                      // Remove all markdown header syntax: ##, ###, **, numbered prefixes, etc.
                      const cleanText = trimmedLine
                        .replace(/^\d+\.\s*/, '')     // Remove numbered list prefix (1. 2. etc.)
                        .replace(/^#{1,6}\s*/, '')    // Remove # headers
                        .replace(/\*\*/g, '')         // Remove all ** markers
                        .replace(/\s*-\s*$/, '')      // Remove trailing dash
                        .trim();

                      // Skip if the cleaned text is empty
                      if (!cleanText) return null;

                      return (
                        <p key={`line-${i}`} className={`text-lg md:text-xl font-bold ${theme.textAccent} mt-6 mb-3 first:mt-0`}>
                          {cleanText}
                        </p>
                      );
                    }

                    // Regular paragraph - strip all ** markers
                    const cleanParagraph = line.replace(/\*\*/g, '');

                    return (
                      <p key={`line-${i}`} className="text-slate-300 leading-relaxed mb-4 text-base md:text-lg">
                        {cleanParagraph}
                      </p>
                    );
                  })}
                </div>

                {/* Clarification Card Section - inside reading box, above actions */}
                {(canDrawClarification || clarificationCards.length > 0 || isClarificationLoading || hasStartedDraw) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 pt-6 border-t border-white/10"
                  >
                    {/* Rendered clarification card results */}
                    {clarificationCards.map((cCard, idx) => (
                      <motion.div
                        key={`clar-result-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className={idx > 0 ? 'mt-6 pt-6 border-t border-white/10' : ''}
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className={`w-4 h-4 ${theme.textAccent}`} />
                          <span className={`text-sm font-bold ${theme.textAccent} uppercase tracking-wider`}>
                            {language === 'en'
                              ? `Clarification Card${clarificationCards.length > 1 ? ` ${idx + 1}` : ''}`
                              : `Carte de Clarification${clarificationCards.length > 1 ? ` ${idx + 1}` : ''}`}
                          </span>
                        </div>

                        {/* Card display */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                          <motion.div
                            initial={{ rotateY: 180, scale: 0.8 }}
                            animate={{ rotateY: 0, scale: 1 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{ perspective: 800 }}
                          >
                            <Card
                              card={cCard.card}
                              isRevealed={true}
                              isReversed={cCard.isReversed}
                              width={100}
                              height={155}
                              className="shadow-lg"
                              hideOverlay={true}
                            />
                          </motion.div>
                          <div className="flex-1 text-center sm:text-left">
                            <p className="text-white font-medium text-lg">
                              {language === 'en' ? cCard.card.nameEn : cCard.card.nameFr}
                            </p>
                            {cCard.isReversed && (
                              <span className="text-xs text-slate-400">
                                ({language === 'en' ? 'Reversed' : 'Renversée'})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interpretation */}
                        <div className="border-t border-white/10 pt-4">
                          {cCard.interpretation.split('\n').map((line, i) => {
                            if (!line.trim()) return null;
                            return (
                              <p key={`clar-${idx}-${i}`} className="text-slate-300 leading-relaxed mb-3 text-sm md:text-base">
                                {line.replace(/\*\*/g, '')}
                              </p>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}

                    {/* Mini deck - tap to draw (shown after existing cards or as first prompt) */}
                    {canDrawClarification && !hasStartedDraw && (
                      <div className={`flex flex-col items-center py-2 ${clarificationCards.length > 0 ? 'mt-6 pt-6 border-t border-white/10' : ''}`}>
                        {/* Label + cost */}
                        <div className="flex items-center gap-2 mb-5">
                          <Sparkles className={`w-4 h-4 ${theme.textAccent}`} />
                          <span className={`text-xs font-bold ${theme.textAccent} uppercase tracking-wider`}>
                            {clarificationCards.length > 0
                              ? (language === 'en' ? 'Draw Another Card' : 'Tirer une Autre Carte')
                              : (language === 'en' ? 'Clarification Card' : 'Carte de Clarification')}
                          </span>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
                            <Coins className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] text-amber-300 font-medium">1</span>
                          </div>
                        </div>

                        {/* Deck stack */}
                        <motion.button
                          onClick={handleDeckTap}
                          className="relative w-24 h-36 focus:outline-none"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Ambient glow behind deck */}
                          <motion.div
                            className="absolute inset-0 rounded-xl"
                            style={{ background: `radial-gradient(ellipse, ${theme.glow} 0%, transparent 70%)` }}
                            animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.9, 1.1, 0.9] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          {/* Bottom card */}
                          <div
                            className="absolute bottom-0 left-1/2 w-16 h-24 rounded-lg bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 border-2 border-amber-500/30 shadow-lg"
                            style={{ transform: 'translateX(-50%) rotate(-5deg)' }}
                          />
                          {/* Middle card */}
                          <div
                            className="absolute bottom-1 left-1/2 w-16 h-24 rounded-lg bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 border-2 border-amber-500/40 shadow-lg"
                            style={{ transform: 'translateX(-50%) rotate(-1deg)' }}
                          />
                          {/* Top card - gently bobbing */}
                          <motion.div
                            className="absolute bottom-2 left-1/2 w-16 h-24 rounded-lg bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 border-2 border-amber-500/60 shadow-xl flex items-center justify-center"
                            style={{ x: '-50%', rotate: 2 }}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <span className="text-amber-400/70 text-xl">☽</span>
                          </motion.div>
                        </motion.button>

                        <p className="text-xs text-slate-500 mt-3">
                          {language === 'en' ? 'Tap the deck to draw a card' : 'Touchez le paquet pour tirer une carte'}
                        </p>
                      </div>
                    )}

                    {/* Card drawing animation + loading */}
                    {hasStartedDraw && (
                      <div className={`flex flex-col items-center py-4 ${clarificationCards.length > 0 ? 'mt-6 pt-6 border-t border-white/10' : ''}`}>
                        <div className="flex items-center gap-2 mb-5">
                          <Sparkles className={`w-4 h-4 ${theme.textAccent}`} />
                          <span className={`text-xs font-bold ${theme.textAccent} uppercase tracking-wider`}>
                            {language === 'en' ? 'Clarification Card' : 'Carte de Clarification'}
                          </span>
                        </div>

                        {/* Card lifting from deck */}
                        <div className="relative w-24 h-40">
                          {/* Remaining deck cards */}
                          <div
                            className="absolute bottom-0 left-1/2 w-16 h-24 rounded-lg bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 border-2 border-amber-500/30 shadow-lg"
                            style={{ transform: 'translateX(-50%) rotate(-3deg)' }}
                          />
                          <div
                            className="absolute bottom-1 left-1/2 w-16 h-24 rounded-lg bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 border-2 border-amber-500/40 shadow-lg"
                            style={{ transform: 'translateX(-50%)' }}
                          />
                          {/* Drawn card - lifts and floats */}
                          <motion.div
                            className="absolute left-1/2 w-16 h-24 rounded-lg bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 border-2 border-amber-500/60 shadow-xl flex items-center justify-center"
                            initial={{ bottom: 8, x: '-50%', rotate: 2 }}
                            animate={{
                              bottom: 60,
                              rotate: 0,
                              scale: [1, 1.05, 1],
                            }}
                            transition={{
                              bottom: { duration: 0.6, ease: 'easeOut' },
                              rotate: { duration: 0.4 },
                              scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
                            }}
                          >
                            <motion.span
                              className="text-amber-400/70 text-xl"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              ☽
                            </motion.span>
                          </motion.div>
                        </div>

                        <Loader2 className={`w-5 h-5 ${theme.textAccent} animate-spin mt-4`} />
                        <p className="text-sm text-slate-400 mt-2">
                          {language === 'en' ? 'Revealing your card...' : 'Révélation de votre carte...'}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Actions */}
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
                  <Button onClick={onFinish} variant="secondary">
                    {language === 'en' ? 'Start New Reading' : 'Nouvelle Lecture'}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Reflection prompt */}
            <ReflectionPrompt
              readingId={backendReadingId}
              onSave={onSaveReflection}
            />

            {/* Oracle Chat for follow-up questions */}
            <OracleChat
              language={language}
              credits={credits}
              chatHistory={chatHistory}
              chatInput={chatInput}
              isChatLoading={isChatLoading}
              questionCost={questionCost}
              onInputChange={onChatInputChange}
              onSendMessage={onSendMessage}
            />
          </>
        )}

        {/* Reading completion celebration with mystery bonus chance */}
        <ReadingCompleteCelebration
          isActive={showCelebration}
          onComplete={onCelebrationComplete}
          spreadName={language === 'en' ? spread.nameEn : spread.nameFr}
        />
      </div>
    </div>
  );
};

export default InterpretationPhase;
