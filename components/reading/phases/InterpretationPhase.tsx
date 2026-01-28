import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { SpreadConfig, TarotCard, SpreadType } from '../../../types';
import Card from '../../Card';
import Button from '../../Button';
import ThemedBackground from '../ThemedBackground';
import OracleChat from '../OracleChat';
import ReflectionPrompt from '../ReflectionPrompt';
import { ReadingCompleteCelebration } from '../../rewards';
import { SPREAD_THEMES } from '../SpreadThemes';
import { THREE_CARD_LAYOUTS, ThreeCardLayoutId } from '../../../constants/threeCardLayouts';

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
  onContextToggle,
  onFinish,
  onCelebrationComplete,
  onSaveReflection,
  onChatInputChange,
  onSendMessage,
}) => {
  const theme = SPREAD_THEMES[spread.id];

  return (
    <div className="relative min-h-screen">
      {/* Themed Background */}
      <ThemedBackground spreadType={spread.id} />

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
                            />
                            <span className={`text-[10px] ${theme.textAccent} mt-2 font-bold uppercase tracking-wider text-center max-w-[100px]`}>
                              {spread.id === SpreadType.THREE_CARD && threeCardLayout && THREE_CARD_LAYOUTS[threeCardLayout]
                                ? THREE_CARD_LAYOUTS[threeCardLayout].positions[language][i]
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
                <div className="prose prose-invert max-w-none">
                  {readingText.split('\n').map((line, i) => {
                    if (!line.trim()) return null;
                    if (line.startsWith('**')) {
                      return (
                        <h3 key={`line-${i}`} className={`text-lg md:text-xl font-bold ${theme.textAccent} mt-6 mb-3 first:mt-0`}>
                          {line.replace(/\*\*/g, '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('#')) {
                      return (
                        <h2 key={`line-${i}`} className="text-xl md:text-2xl font-bold text-white mt-8 mb-4 first:mt-0">
                          {line.replace(/#/g, '').trim()}
                        </h2>
                      );
                    }
                    return (
                      <p key={`line-${i}`} className="text-slate-300 leading-relaxed mb-4 text-base md:text-lg">
                        {line.replace(/\*\*/g, '')}
                      </p>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="mt-10 pt-6 border-t border-white/10 flex justify-center">
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
