import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, ChevronDown, ChevronUp, Coins, Sparkles, Loader2, History } from 'lucide-react';
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
import { SingleCardLayoutId } from '../../../constants/singleCardLayouts';
import { getCategory } from '../../../constants/categoryConfig';
import { ROUTES, localizedRoute } from '../../../routes/routes';
import LocalizedLink from '../../LocalizedLink';

const VERDICT_COLORS: Record<string, string> = {
  YES: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  NO: 'bg-red-500/20 text-red-300 border-red-500/40',
  MAYBE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

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
  singleCardLayout?: SingleCardLayoutId | null;
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
  singleCardLayout,
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

  // Map from card name (en/fr, lowercase) → article slug — includes drawn + clarification cards
  const cardNameToSlug = React.useMemo(() => {
    // Number words to digits (slug format uses digits for all suits except the one exception below)
    const numberWords: Record<string, string> = {
      two: '2', three: '3', four: '4', five: '5',
      six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
    };
    // Slugs that don't follow the simple derivation rule
    const exceptions: Record<string, string> = {
      'the high priestess': 'high-priestess-tarot-card-meaning',
      'four of pentacles': 'four-of-pentacles-tarot-card-meaning',
    };
    const toSlug = (nameEn: string): string => {
      const lower = nameEn.toLowerCase();
      if (exceptions[lower]) return exceptions[lower];
      let s = lower;
      Object.entries(numberWords).forEach(([word, digit]) => {
        s = s.replace(new RegExp(`\\b${word}\\b`), digit);
      });
      return s.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-tarot-card-meaning';
    };
    const map = new Map<string, string>();
    const addCard = (card: TarotCard) => {
      const slug = toSlug(card.nameEn);
      map.set(card.nameEn.toLowerCase(), slug);
      map.set(card.nameFr.toLowerCase(), slug);
    };
    drawnCards.forEach(({ card }) => addCard(card));
    clarificationCards?.forEach(({ card }) => addCard(card));
    return map;
  }, [drawnCards, clarificationCards]);

  // Sorted card names longest-first so multi-word names match before single words
  const sortedCardNames = React.useMemo(
    () => Array.from(cardNameToSlug.keys()).sort((a, b) => b.length - a.length),
    [cardNameToSlug]
  );

  const LINK_CLASS = 'text-amber-300/90 hover:text-amber-200 underline decoration-amber-400/50 hover:decoration-amber-300 transition-colors';
  const LINK_PROPS = { className: LINK_CLASS, target: '_blank', rel: 'noopener noreferrer' } as const;

  // Splits a plain-text string on known card names and returns mixed text/link nodes
  const splitOnCardNames = (text: string, baseKey: string): React.ReactNode => {
    if (sortedCardNames.length === 0 || !text) return text;
    const escaped = sortedCardNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(pattern);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
      const slug = cardNameToSlug.get(part.toLowerCase());
      if (slug) {
        return (
          <LocalizedLink key={`${baseKey}-n${i}`} to={`/tarot/${slug}`} {...LINK_PROPS}>
            {part}
          </LocalizedLink>
        );
      }
      return <React.Fragment key={`${baseKey}-t${i}`}>{part}</React.Fragment>;
    });
  };

  // Renders a paragraph line: detects **CardName** bold markers AND plain card names
  const renderParagraph = (text: string): React.ReactNode => {
    const boldParts = text.split(/(\*\*[^*]+\*\*)/);
    const nodes: React.ReactNode[] = [];
    boldParts.forEach((part, idx) => {
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch) {
        const inner = boldMatch[1];
        const slug = cardNameToSlug.get(inner.toLowerCase());
        if (slug) {
          nodes.push(
            <LocalizedLink key={`b${idx}`} to={`/tarot/${slug}`} {...LINK_PROPS}>
              {inner}
            </LocalizedLink>
          );
        } else {
          nodes.push(<React.Fragment key={`b${idx}`}>{inner}</React.Fragment>);
        }
      } else {
        // Plain text — scan for card names
        nodes.push(<React.Fragment key={`p${idx}`}>{splitOnCardNames(part, `p${idx}`)}</React.Fragment>);
      }
    });
    return nodes;
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

  // Yes/No verdict detection: parse [VERDICT:X] token from readingText
  const isYesNoSpread = singleCardLayout === 'yes_no' || threeCardLayout === 'yes_no';
  const verdictMatch = isYesNoSpread ? readingText.match(/\[VERDICT:(YES|NO|MAYBE)\]/) : null;
  const verdict = verdictMatch ? verdictMatch[1] : null;
  const displayText = isYesNoSpread && verdictMatch
    ? readingText.replace(/\[VERDICT:(YES|NO|MAYBE)\]\s*\n?/, '')
    : readingText;

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

            {/* Reading primer — explains why position meanings differ from standalone card meanings */}
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3 mb-4 text-sm text-slate-300/90 leading-relaxed"
              style={{ background: 'rgba(139, 92, 246, 0.06)' }}
            >
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-50" style={{ color: theme.primary }} />
              <p>
                {language === 'en'
                  ? "A card's meaning in a reading is always a blend. Each card carries its own energy, but your question, its position in the spread, and the surrounding cards all act on it — the way neighbouring colours shift each other. What you read below is that combined, nuanced meaning, not the card in isolation."
                  : "La signification d'une carte dans un tirage est toujours un mélange. Chaque carte porte sa propre énergie, mais ta question, la position qu'elle occupe et les cartes voisines l'influencent mutuellement — comme des couleurs qui se modifient au contact les unes des autres. Ce que tu lis ci-dessous, c'est cette signification combinée et nuancée, et non la carte vue isolément."}
              </p>
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
                <span className={`text-xs font-bold ${theme.textAccent} uppercase tracking-[0.2em]`}>
                  {language === 'en' ? 'The Oracle Speaks' : 'L\'Oracle Parle'}
                </span>
              </div>

              {/* Verdict pill for yes/no spreads */}
              {isYesNoSpread && verdict && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex justify-center mb-6"
                >
                  <span className={`inline-block px-8 py-2.5 rounded-full text-xl font-heading font-bold border ${VERDICT_COLORS[verdict]}`}>
                    {verdict === 'YES' && (language === 'en' ? 'YES' : 'OUI')}
                    {verdict === 'NO' && (language === 'en' ? 'NO' : 'NON')}
                    {verdict === 'MAYBE' && (language === 'en' ? 'MAYBE' : 'PEUT-ÊTRE')}
                  </span>
                </motion.div>
              )}

              {/* Reading content box */}
              <div
                className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-10"
                style={{ boxShadow: `0 0 60px ${theme.glow}` }}
              >
                <div className="max-w-none">
                  {displayText.split('\n').map((line, i) => {
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

                    return (
                      <p key={`line-${i}`} className="text-slate-300 leading-relaxed mb-4 text-base md:text-lg">
                        {renderParagraph(line)}
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
                            <LocalizedLink
                              to={`/tarot/${cardNameToSlug.get(cCard.card.nameEn.toLowerCase()) ?? ''}`}
                              className="text-white font-medium text-lg hover:text-amber-300 transition-colors underline decoration-white/30 hover:decoration-amber-300/50"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {language === 'en' ? cCard.card.nameEn : cCard.card.nameFr}
                            </LocalizedLink>
                            {cCard.isReversed && (
                              <span className="text-xs text-slate-400 block mt-0.5">
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
                                {renderParagraph(line)}
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
                            <img src="/logos/card-back-moon.webp" alt="" className="w-8 h-8 object-contain" />
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
                            <motion.img
                              src="/logos/card-back-moon.webp"
                              alt=""
                              className="w-8 h-8 object-contain"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
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

            {/* Start New Reading + Reading History */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button onClick={onFinish} variant="secondary">
                {language === 'en' ? 'Start New Reading' : 'Nouvelle Lecture'}
              </Button>
              <a
                href={localizedRoute(ROUTES.PROFILE, language)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-sm text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all"
              >
                <History className="w-4 h-4" />
                {language === 'en' ? 'See Reading History' : 'Voir l\'Historique'}
              </a>
            </div>
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
