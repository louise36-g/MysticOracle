import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Coins,
  Hand,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROUTES } from '../../routes/routes';
import { SPREADS } from '../../constants';
import {
  SpreadType,
  InterpretationStyle,
  TarotCard,
} from '../../types';
import { useReadingGeneration } from '../../hooks/useReadingGeneration';
import { createReading, updateReadingReflection } from '../../services/api';
import ReflectionPrompt from '../reading/ReflectionPrompt';
import { TWO_CARD_LAYOUTS, TwoCardLayoutId } from '../../constants/twoCardLayouts';
import { THREE_CARD_LAYOUTS, ThreeCardLayoutId } from '../../constants/threeCardLayouts';
import CardSelector from './CardSelector';
import Card from '../Card';

interface SelectedCard {
  card: TarotCard;
  isReversed: boolean;
}

type Step = 'spread' | 'layout' | 'cards' | 'style' | 'question' | 'generating' | 'result';

// Spread configs for Interpret My Cards (1, 2, 3 card)
const INTERPRET_SPREADS: { id: SpreadType; count: number; labelEn: string; labelFr: string; descEn: string; descFr: string }[] = [
  {
    id: SpreadType.SINGLE,
    count: 1,
    labelEn: '1 Card',
    labelFr: '1 Carte',
    descEn: 'A focused reading for one card and one question.',
    descFr: 'Une lecture ciblée pour une carte et une question.',
  },
  {
    id: SpreadType.TWO_CARD,
    count: 2,
    labelEn: '2 Cards',
    labelFr: '2 Cartes',
    descEn: 'Weigh two energies, two paths, or two possibilities.',
    descFr: 'Pesez deux énergies, deux chemins ou deux possibilités.',
  },
  {
    id: SpreadType.THREE_CARD,
    count: 3,
    labelEn: '3 Cards',
    labelFr: '3 Cartes',
    descEn: 'The most versatile spread in tarot.',
    descFr: 'Le tirage le plus polyvalent du tarot.',
  },
];

// Interpretation style options
const STYLE_OPTIONS: { id: InterpretationStyle; labelEn: string; labelFr: string; descEn: string; descFr: string }[] = [
  {
    id: InterpretationStyle.CLASSIC,
    labelEn: 'Classic',
    labelFr: 'Classique',
    descEn: 'Traditional tarot symbolism',
    descFr: 'Symbolisme traditionnel du tarot',
  },
  {
    id: InterpretationStyle.SPIRITUAL,
    labelEn: 'Spiritual',
    labelFr: 'Spirituel',
    descEn: 'Soul-level guidance',
    descFr: 'Guidance au niveau de l\'âme',
  },
  {
    id: InterpretationStyle.PSYCHO_EMOTIONAL,
    labelEn: 'Psycho-Emotional',
    labelFr: 'Psycho-Émotionnel',
    descEn: 'Emotional patterns & psychology',
    descFr: 'Schémas émotionnels & psychologie',
  },
  {
    id: InterpretationStyle.NUMEROLOGY,
    labelEn: 'Numerology',
    labelFr: 'Numérologie',
    descEn: 'Numerological significance',
    descFr: 'Signification numérologique',
  },
  {
    id: InterpretationStyle.ELEMENTAL,
    labelEn: 'Elemental',
    labelFr: 'Élémental',
    descEn: 'Earth, Water, Fire, Air energies',
    descFr: 'Énergies Terre, Eau, Feu, Air',
  },
];

const LOADING_MESSAGES = {
  en: [
    "Reading the cards you've drawn...",
    "Connecting with your chosen archetypes...",
    "Interpreting the energies you've brought forward...",
    "Weaving the story of your cards...",
    "Channeling insight from your selection...",
  ],
  fr: [
    "Lecture des cartes que vous avez tirées...",
    "Connexion avec les archétypes que vous avez choisis...",
    "Interprétation des énergies que vous avez invoquées...",
    "Tissage de l'histoire de vos cartes...",
    "Canalisation de l'intuition de votre sélection...",
  ],
};

const InterpretMyCards: React.FC = () => {
  const { language, user, canAfford, refreshUser } = useApp();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { generateReading, isGenerating, error: genError } = useReadingGeneration();

  // Flow state
  const [step, setStep] = useState<Step>('spread');
  const [selectedSpread, setSelectedSpread] = useState<SpreadType | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<InterpretationStyle>(InterpretationStyle.CLASSIC);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [question, setQuestion] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [savedReadingId, setSavedReadingId] = useState<string | null>(null);

  // Rotate loading messages
  React.useEffect(() => {
    if (step !== 'generating') return;
    const interval = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES[language].length);
    }, 3000);
    return () => clearInterval(interval);
  }, [step, language]);

  // Get the spread config for the selected spread
  const spreadConfig = useMemo(() => {
    if (!selectedSpread) return null;
    return SPREADS[selectedSpread] || null;
  }, [selectedSpread]);

  // Whether this is the user's first free interpretation
  const isFirstFree = user ? !user.hasUsedFreeInterpretation : false;

  // Interpret My Cards always costs 1 credit regardless of card count
  const creditCost = 1;

  // Max cards for current spread
  const maxCards = useMemo(() => {
    const match = INTERPRET_SPREADS.find(s => s.id === selectedSpread);
    return match?.count || 1;
  }, [selectedSpread]);

  // Position labels for selected cards
  const positionLabels = useMemo(() => {
    if (!selectedSpread || !spreadConfig) return undefined;

    if (selectedSpread === SpreadType.TWO_CARD && selectedLayout) {
      const layout = TWO_CARD_LAYOUTS[selectedLayout as TwoCardLayoutId];
      if (layout) return language === 'fr' ? layout.positions.fr : layout.positions.en;
    }

    if (selectedSpread === SpreadType.THREE_CARD && selectedLayout) {
      const layout = THREE_CARD_LAYOUTS[selectedLayout as ThreeCardLayoutId];
      if (layout) return language === 'fr' ? layout.positions.fr : layout.positions.en;
    }

    return language === 'fr' ? spreadConfig.positionMeaningsFr : spreadConfig.positionMeaningsEn;
  }, [selectedSpread, selectedLayout, spreadConfig, language]);

  // Available layouts for 2-card and 3-card spreads
  const availableLayouts = useMemo(() => {
    if (selectedSpread === SpreadType.TWO_CARD) {
      return Object.values(TWO_CARD_LAYOUTS);
    }
    if (selectedSpread === SpreadType.THREE_CARD) {
      // Show a subset of general-purpose layouts for interpret
      const layoutIds: ThreeCardLayoutId[] = [
        'past_present_future',
        'situation_action_outcome',
        'mind_body_spirit',
        'challenge_support_growth',
        'option_a_b_guidance',
      ];
      return layoutIds.map(id => THREE_CARD_LAYOUTS[id]);
    }
    return [];
  }, [selectedSpread]);

  // Determine if layout step is needed
  const needsLayout = selectedSpread === SpreadType.TWO_CARD || selectedSpread === SpreadType.THREE_CARD;

  // Handle spread selection
  const handleSelectSpread = useCallback((spreadType: SpreadType) => {
    setSelectedSpread(spreadType);
    setSelectedCards([]);
    setSelectedLayout(null);
    if (spreadType === SpreadType.SINGLE) {
      setStep('question'); // Skip layout for single card, go to question
    } else {
      setStep('layout');
    }
  }, []);

  // Handle layout selection
  const handleSelectLayout = useCallback((layoutId: string) => {
    setSelectedLayout(layoutId);
    setStep('question');
  }, []);

  // Handle proceeding from question to cards
  const handleQuestionComplete = useCallback(() => {
    setStep('cards');
  }, []);

  // Handle proceeding to style step
  const handleCardsComplete = useCallback(() => {
    setStep('style');
  }, []);

  // Style is the last step before generating — button calls handleGenerate directly

  // Generate the interpretation
  const handleGenerate = useCallback(async () => {
    if (!spreadConfig || !user) return;

    setStep('generating');
    setError(null);

    const result = await generateReading({
      spread: spreadConfig,
      isAdvanced,
      selectedStyles: isAdvanced ? [selectedStyle] : [InterpretationStyle.CLASSIC],
      drawnCards: selectedCards,
      question: question.trim(),
      language,
      layoutId: selectedLayout || undefined,
      interpretMode: 'user_selected',
    });

    if (result) {
      setInterpretation(result.interpretation);
      setStep('result');

      // Save reading to backend
      try {
        const token = await getToken();
        if (token) {
          const cardsForAPI = selectedCards.map((sc, idx) => ({
            cardId: String(sc.card.id),
            position: idx,
            isReversed: sc.isReversed,
          }));

          const savedReading = await createReading(token, {
            spreadType: spreadConfig.id,
            interpretationStyle: isAdvanced ? selectedStyle : InterpretationStyle.CLASSIC,
            question: question.trim() || undefined,
            cards: cardsForAPI,
            interpretation: result.interpretation,
            isUserSelected: true,
          });

          if (savedReading?.id) {
            setSavedReadingId(savedReading.id);
          }

          // Refresh user to update credits
          await refreshUser();
        }
      } catch (saveErr) {
        console.error('[InterpretMyCards] Failed to save reading:', saveErr);
      }
    } else {
      setError(genError || (language === 'fr' ? 'Échec de la génération' : 'Generation failed'));
      setStep('style');
    }
  }, [
    spreadConfig, user, selectedCards, selectedStyle, isAdvanced,
    question, language, selectedLayout, generateReading, getToken,
    refreshUser, genError,
  ]);

  // Save reflection for the reading
  const handleSaveReflection = useCallback(async (reflection: string) => {
    if (!savedReadingId) return;
    const token = await getToken();
    if (token) {
      await updateReadingReflection(token, savedReadingId, reflection);
    }
  }, [savedReadingId, getToken]);

  // Go back one step (flow: spread → layout → question → cards → style)
  const handleBack = useCallback(() => {
    switch (step) {
      case 'layout':
        setStep('spread');
        break;
      case 'question':
        if (needsLayout) {
          setStep('layout');
        } else {
          setStep('spread');
        }
        break;
      case 'cards':
        setStep('question');
        break;
      case 'style':
        setStep('cards');
        break;
      case 'result':
        navigate(ROUTES.INTERPRET);
        break;
    }
  }, [step, needsLayout, navigate]);

  return (
    <div className="min-h-[calc(100dvh-6rem)] flex flex-col justify-center py-12 md:py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-4 mt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs font-medium mb-2">
            <Hand className="w-3.5 h-3.5" />
            <span>{language === 'fr' ? 'Vos cartes, notre interprétation' : 'Your cards, our interpretation'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading text-white mb-2">
            {language === 'fr' ? 'Interpréter mes cartes' : 'Interpret My Cards'}
          </h1>
          <p className="text-white/85 text-sm max-w-md mx-auto">
            {language === 'fr'
              ? 'Vous avez tiré les cartes. Laissez-nous vous aider à entendre ce qu\'elles vous disent.'
              : 'You drew the cards. Now let us help you hear what they are saying.'}
          </p>
          <p className="text-[#C9A84C] text-sm italic mt-2 max-w-md mx-auto">
            {language === 'fr'
              ? 'Fonctionne avec les decks Rider-Waite-Smith. Votre première interprétation est notre cadeau.'
              : 'Works with Rider-Waite-Smith decks. Your first interpretation is our gift.'}
          </p>
          <div className="text-[#C9A84C] text-xs tracking-[0.3em] mt-4">
            ✦ &nbsp; ✦ &nbsp; ✦
          </div>
        </div>

        {/* Step indicators */}
        {step !== 'result' && step !== 'generating' && (
          <div className="flex items-center justify-center gap-2 mb-4">
            {['spread', ...(needsLayout ? ['layout'] : []), 'question', 'cards', 'style'].map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  s === step ? 'bg-purple-500 w-6' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        )}

        {/* Back button */}
        {step !== 'spread' && step !== 'generating' && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'fr' ? 'Retour' : 'Back'}
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Spread Selection */}
          {step === 'spread' && (
            <motion.div
              key="spread"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-base font-medium text-white mb-3">
                {language === 'fr' ? 'Combien de cartes avez-vous tiré aujourd\'hui ?' : 'How many cards did you draw today?'}
              </h2>
              <div className="grid gap-2">
                {INTERPRET_SPREADS.map((spread) => (
                  <button
                    key={spread.id}
                    onClick={() => handleSelectSpread(spread.id)}
                    className="relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group cursor-pointer hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #3D1F6E, #5B2D9E)',
                      border: '1.5px solid #C9A84C',
                      boxShadow: '0 2px 12px rgba(91, 45, 158, 0.5)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#E8C96A';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(201, 168, 76, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#C9A84C';
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(91, 45, 158, 0.5)';
                    }}
                  >
                    {/* Free / Cost badge — top-right corner */}
                    <span className="absolute top-2 right-3">
                      {isFirstFree ? (
                        <span className="text-xs text-[#C9A84C] font-semibold">
                          {language === 'fr' ? 'Gratuit' : 'Free'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs">
                          <Coins className="w-3 h-3 text-amber-400/80" />
                          <span className="text-amber-400/80 font-semibold">1 {language === 'fr' ? 'crédit' : 'credit'}</span>
                        </span>
                      )}
                    </span>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[#1A0A2E] text-base font-bold flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
                        boxShadow: '0 2px 8px rgba(201, 168, 76, 0.4)',
                      }}
                    >
                      {spread.count}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">
                        {language === 'fr' ? spread.labelFr : spread.labelEn}
                      </p>
                      <p className="text-xs text-white/85">
                        {language === 'fr' ? spread.descFr : spread.descEn}
                      </p>
                    </div>
                    <span className="text-xs md:text-sm text-amber-400/70 group-hover:text-amber-300 transition-colors font-semibold tracking-wide flex-shrink-0">
                      {language === 'en' ? 'Select →' : 'Choisir →'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Layout Selection (2-card / 3-card only) */}
          {step === 'layout' && (
            <motion.div
              key="layout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-base font-medium text-white mb-3">
                {language === 'fr' ? 'Choisissez un type de lecture' : 'Choose a reading layout'}
              </h2>
              <div className="grid gap-2">
                {availableLayouts.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => handleSelectLayout(layout.id)}
                    className="p-3 bg-slate-800/60 border border-white/5 rounded-xl hover:border-purple-500/30 hover:bg-slate-800/80 transition-all text-left"
                  >
                    <p className="text-sm text-white font-medium mb-0.5">
                      {language === 'fr' ? layout.labelFr : layout.labelEn}
                    </p>
                    <p className="text-sm text-white/85">
                      {language === 'fr' ? layout.taglineFr : layout.taglineEn}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {(language === 'fr' ? layout.positions.fr : layout.positions.en).map((pos, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded-full">
                          {pos}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Question (required — asked before cards for personalised reading) */}
          {step === 'question' && (
            <motion.div
              key="question"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-base font-medium text-white">
                {language === 'fr' ? 'Quelle est votre question ?' : 'What is your question?'}
              </h2>
              <p className="text-xs text-white/85">
                {language === 'fr'
                  ? 'Que demandiez-vous aux cartes lorsque vous les avez tirées ? Votre intention est la clé pour comprendre ce qu\'elles vous disent.'
                  : 'What were you asking the cards when you drew them? Your intention is the key to understanding what they are telling you.'}
              </p>

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={language === 'fr'
                  ? 'Ex: Que me disent ces cartes sur ma situation actuelle ?'
                  : 'E.g. What do these cards tell me about my current situation?'}
                className="w-full px-4 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 resize-none"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleQuestionComplete}
                  disabled={!question.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{language === 'fr' ? 'Continuer' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Card Selection */}
          {step === 'cards' && (
            <motion.div
              key="cards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-base font-medium text-white">
                {language === 'fr' ? 'Quelles cartes avez-vous tiré ?' : 'Which cards did you draw?'}
              </h2>

              <CardSelector
                maxCards={maxCards}
                selectedCards={selectedCards}
                onCardsChange={setSelectedCards}
                positionLabels={positionLabels as string[] | undefined}
              />

              {selectedCards.length === maxCards && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <button
                    onClick={handleCardsComplete}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                  >
                    <span>{language === 'fr' ? 'Continuer' : 'Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 5: Style Selection + Cost Summary + Generate */}
          {step === 'style' && (
            <motion.div
              key="style"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-base font-medium text-white">
                {language === 'fr' ? 'Style d\'interprétation' : 'Interpretation Style'}
              </h2>
              <p className="text-xs text-white/85">
                {language === 'fr'
                  ? 'Choisissez le style qui correspond le mieux à votre question.'
                  : 'Choose the style that best fits your question.'}
              </p>

              <div className="grid gap-2">
                {STYLE_OPTIONS.map((style) => {
                  const isClassic = style.id === InterpretationStyle.CLASSIC;
                  const isSelected = isClassic ? !isAdvanced : (isAdvanced && selectedStyle === style.id);

                  return (
                    <button
                      key={style.id}
                      onClick={() => {
                        if (isClassic) {
                          setIsAdvanced(false);
                          setSelectedStyle(InterpretationStyle.CLASSIC);
                        } else {
                          setIsAdvanced(true);
                          setSelectedStyle(style.id);
                        }
                      }}
                      className={`
                        flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                        ${isSelected
                          ? 'bg-purple-500/15 border-purple-500/40 ring-1 ring-purple-500/20'
                          : 'bg-slate-800/40 border-white/5 hover:border-white/15'
                        }
                      `}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-purple-500' : 'border-slate-600'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {language === 'fr' ? style.labelFr : style.labelEn}
                        </p>
                        <p className="text-xs text-white/85">
                          {language === 'fr' ? style.descFr : style.descEn}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cost summary */}
              <div className="bg-slate-800/40 border border-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">
                    {language === 'fr' ? 'Coût' : 'Cost'}
                  </span>
                  {isFirstFree ? (
                    <span className="text-sm font-medium text-green-400">
                      {language === 'fr' ? '1ère interprétation gratuite !' : '1st Interpretation Free!'}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-white font-medium">{creditCost}</span>
                      <span className="text-slate-400 text-sm">
                        {language === 'fr' ? 'crédit' : 'credit'}
                      </span>
                    </div>
                  )}
                </div>
                {user && !isFirstFree && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {language === 'fr' ? 'Votre solde' : 'Your balance'}
                    </span>
                    <span className={user.credits >= creditCost ? 'text-green-400' : 'text-red-400'}>
                      {user.credits} {language === 'fr' ? 'crédits' : 'credits'}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={(!isFirstFree && !canAfford(creditCost)) || isGenerating}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Interpréter' : 'Interpret'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* GENERATING STATE */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 space-y-6"
            >
              <div className="relative">
                <div className="w-16 h-16 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <Sparkles className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMsgIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-slate-400 text-center"
                >
                  {LOADING_MESSAGES[language][loadingMsgIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {/* RESULT */}
          {step === 'result' && interpretation && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Cards summary */}
              <div className="bg-slate-800/40 border border-white/5 rounded-xl p-4">
                <div className="flex flex-wrap gap-3 justify-center">
                  {selectedCards.map((sc, i) => (
                    <div key={sc.card.id} className="text-center">
                      <div className={`w-16 h-24 mx-auto mb-1 ${sc.isReversed ? 'rotate-180' : ''}`}>
                        <Card card={sc.card} isRevealed width={64} height={96} hideOverlay />
                      </div>
                      <p className="text-xs text-slate-400 max-w-[80px] truncate">
                        {language === 'fr' ? sc.card.nameFr : sc.card.nameEn}
                      </p>
                      {positionLabels && positionLabels[i] && (
                        <p className="text-[10px] text-purple-400">{positionLabels[i]}</p>
                      )}
                      {sc.isReversed && (
                        <p className="text-[10px] text-amber-400">
                          {language === 'fr' ? 'Renversée' : 'Reversed'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Interpretation */}
              <div className="prose prose-invert prose-purple max-w-none bg-slate-800/30 border border-white/5 rounded-xl p-6">
                <div dangerouslySetInnerHTML={{ __html: interpretation.replace(/\n/g, '<br />') }} />
              </div>

              {/* Reflection prompt */}
              <ReflectionPrompt
                readingId={savedReadingId}
                onSave={handleSaveReflection}
              />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setStep('spread');
                    setSelectedSpread(null);
                    setSelectedCards([]);
                    setSelectedLayout(null);
                    setQuestion('');
                    setInterpretation('');
                    setIsAdvanced(false);
                    setSelectedStyle(InterpretationStyle.CLASSIC);
                    setSavedReadingId(null);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                  <Hand className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Nouvelle interprétation' : 'New Interpretation'}</span>
                </button>
                <button
                  onClick={() => navigate(ROUTES.PROFILE)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl font-medium transition-colors border border-purple-500/20"
                >
                  <span>{language === 'fr' ? 'Voir mes lectures' : 'View My Readings'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InterpretMyCards;
