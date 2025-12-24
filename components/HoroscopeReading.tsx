
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../context/AppContext';
import { generateHoroscope, generateHoroscopeFollowUp } from '../services/openrouterService';
import { getCachedHoroscope, cacheHoroscope, findCachedAnswer, cacheHoroscopeQA, willNextQuestionCostCredit, incrementHoroscopeQuestionCount } from '../services/storageService';
import Button from './Button';
import { Send } from 'lucide-react';

const zodiacSigns = {
  en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  fr: ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons']
};

const loadingPhrases = {
  en: [
    'Connecting to the stars...',
    'Consulting the cosmos...',
    'Reading the celestial alignments...',
    'Channeling the universe...',
    'Translating starlight into wisdom...',
    'Gazing into the cosmic ether...'
  ],
  fr: [
    'Connexion aux étoiles...',
    'Consultation du cosmos...',
    'Lecture des alignements célestes...',
    'Canalisation de l\'univers...',
    'Traduction de la lumière stellaire en sagesse...',
    'Regard dans l\'éther cosmique...'
  ]
};

// Helper to get current moon phase (simplified calculation)
const getMoonPhase = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Simplified moon phase calculation
  const c = Math.floor(365.25 * year);
  const e = Math.floor(30.6 * month);
  const jd = c + e + day - 694039.09;
  const phase = jd / 29.53058867;
  const phaseDay = Math.floor((phase - Math.floor(phase)) * 29.53);

  if (phaseDay < 1) return 'new';
  if (phaseDay < 7) return 'waxing_crescent';
  if (phaseDay < 8) return 'first_quarter';
  if (phaseDay < 14) return 'waxing_gibbous';
  if (phaseDay < 16) return 'full';
  if (phaseDay < 22) return 'waning_gibbous';
  if (phaseDay < 23) return 'last_quarter';
  return 'waning_crescent';
};

// Helper to check if we're near a solstice or equinox
const getSeasonalEvent = (): { event: string; daysAway: number } | null => {
  const now = new Date();
  const year = now.getFullYear();

  // Approximate dates for 2024/2025 (adjust year dynamically)
  const events = [
    { date: new Date(year, 2, 20), name: 'spring_equinox' },
    { date: new Date(year, 5, 21), name: 'summer_solstice' },
    { date: new Date(year, 8, 22), name: 'autumn_equinox' },
    { date: new Date(year, 11, 21), name: 'winter_solstice' },
  ];

  for (const event of events) {
    const diff = Math.abs(now.getTime() - event.date.getTime());
    const daysAway = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (daysAway <= 14) {
      return { event: event.name, daysAway };
    }
  }
  return null;
};

// Generate contextual suggested questions based on horoscope content
const generateSuggestedQuestions = (horoscope: string, language: 'en' | 'fr'): string[] => {
  const questions: string[] = [];
  const moonPhase = getMoonPhase();
  const seasonalEvent = getSeasonalEvent();
  const horoscopeLower = horoscope.toLowerCase();

  // Always include the beginner-friendly explanation as the first question
  questions.push(language === 'en'
    ? "Explain this reading as though I am a beginner to astrology."
    : "Expliquez cette lecture comme si j'étais débutant en astrologie.");

  // Check for planetary mentions and create relevant questions
  if (horoscopeLower.includes('venus')) {
    questions.push(language === 'en'
      ? "How long will Venus's current influence last, and how can I make the most of it?"
      : "Combien de temps durera l'influence actuelle de Vénus, et comment en tirer le meilleur parti?");
  }
  if (horoscopeLower.includes('mercury')) {
    questions.push(language === 'en'
      ? "What does Mercury's position mean for my communication and decision-making?"
      : "Que signifie la position de Mercure pour ma communication et mes prises de décision?");
  }
  if (horoscopeLower.includes('mars')) {
    questions.push(language === 'en'
      ? "How is Mars affecting my energy and motivation right now?"
      : "Comment Mars affecte-t-il mon énergie et ma motivation en ce moment?");
  }
  if (horoscopeLower.includes('jupiter')) {
    questions.push(language === 'en'
      ? "What opportunities might Jupiter be bringing into my life?"
      : "Quelles opportunités Jupiter pourrait-il apporter dans ma vie?");
  }
  if (horoscopeLower.includes('saturn')) {
    questions.push(language === 'en'
      ? "What lessons is Saturn trying to teach me during this transit?"
      : "Quelles leçons Saturne essaie-t-il de m'enseigner pendant ce transit?");
  }

  // Add moon phase question if we have room
  if (questions.length < 3) {
    const moonQuestions = {
      en: {
        new: "How can I harness the energy of the New Moon for new beginnings?",
        waxing_crescent: "What should I focus on during this Waxing Crescent Moon?",
        first_quarter: "How does the First Quarter Moon affect my decisions?",
        waxing_gibbous: "What refinements should I make as the Moon grows fuller?",
        full: "How is the Full Moon illuminating hidden aspects of my life?",
        waning_gibbous: "What should I release during this Waning Gibbous Moon?",
        last_quarter: "How can I use the Last Quarter Moon for reflection?",
        waning_crescent: "What should I let go of before the next lunar cycle?"
      },
      fr: {
        new: "Comment puis-je exploiter l'énergie de la Nouvelle Lune pour de nouveaux départs?",
        waxing_crescent: "Sur quoi dois-je me concentrer pendant cette Lune croissante?",
        first_quarter: "Comment le Premier Quartier de Lune affecte-t-il mes décisions?",
        waxing_gibbous: "Quels ajustements dois-je faire alors que la Lune grandit?",
        full: "Comment la Pleine Lune éclaire-t-elle les aspects cachés de ma vie?",
        waning_gibbous: "Que dois-je libérer pendant cette Lune gibbeuse décroissante?",
        last_quarter: "Comment utiliser le Dernier Quartier de Lune pour la réflexion?",
        waning_crescent: "Que dois-je laisser aller avant le prochain cycle lunaire?"
      }
    };
    questions.push(moonQuestions[language][moonPhase as keyof typeof moonQuestions.en]);
  }

  // Add solstice/equinox question if relevant and we have room
  if (seasonalEvent && questions.length < 3) {
    const eventQuestions = {
      en: {
        spring_equinox: "How will the Spring Equinox energy affect my sign's balance and renewal?",
        summer_solstice: "What does the Summer Solstice mean for my personal growth and vitality?",
        autumn_equinox: "How can I embrace the Autumn Equinox themes of harvest and gratitude?",
        winter_solstice: "What inner work does the Winter Solstice invite me to explore?"
      },
      fr: {
        spring_equinox: "Comment l'énergie de l'Équinoxe de Printemps affectera-t-elle l'équilibre de mon signe?",
        summer_solstice: "Que signifie le Solstice d'Été pour ma croissance personnelle?",
        autumn_equinox: "Comment puis-je accueillir les thèmes de récolte de l'Équinoxe d'Automne?",
        winter_solstice: "Quel travail intérieur le Solstice d'Hiver m'invite-t-il à explorer?"
      }
    };
    questions.push(eventQuestions[language][seasonalEvent.event as keyof typeof eventQuestions.en]);
  }

  // Add general astrological questions if we still need more
  const generalQuestions = {
    en: [
      "Which areas of my life are most influenced by current planetary alignments?",
      "How do the current transits interact with my sun sign's natural tendencies?",
      "What should I be mindful of in my relationships this week?"
    ],
    fr: [
      "Quels domaines de ma vie sont les plus influencés par les alignements planétaires actuels?",
      "Comment les transits actuels interagissent-ils avec mon signe solaire?",
      "À quoi dois-je être attentif dans mes relations cette semaine?"
    ]
  };

  // Fill to 3 questions if we don't have enough specific ones
  while (questions.length < 3 && generalQuestions[language].length > 0) {
    const randomIndex = Math.floor(Math.random() * generalQuestions[language].length);
    questions.push(generalQuestions[language][randomIndex]);
    generalQuestions[language].splice(randomIndex, 1);
  }

  // Return only 3 questions
  return questions.slice(0, 3);
};

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const HoroscopeReading: React.FC = () => {
  const { language, deductCredits, user } = useApp();
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [selectedSignIndex, setSelectedSignIndex] = useState<number | null>(null);
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [horoscopeLanguage, setHoroscopeLanguage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Cached question confirmation state
  const [pendingCachedQuestion, setPendingCachedQuestion] = useState<{ question: string; answer: string } | null>(null);

  // Track if next question costs credit (for UI updates)
  const [nextQuestionCostsCredit, setNextQuestionCostsCredit] = useState(willNextQuestionCostCredit());

  const currentLoadingPhrases = useMemo(() => loadingPhrases[language], [language]);
  const currentZodiacSigns = useMemo(() => zodiacSigns[language], [language]);

  // Regenerate horoscope when language changes (if one is already displayed)
  useEffect(() => {
    if (horoscope && selectedSignIndex !== null && horoscopeLanguage !== language && !isLoading) {
      const signInNewLanguage = zodiacSigns[language][selectedSignIndex];
      regenerateHoroscope(signInNewLanguage);
    }
  }, [language]);

  // Generate suggested questions when horoscope is loaded
  useEffect(() => {
    if (horoscope && !horoscope.startsWith('[Debug]') && !horoscope.startsWith('Failed')) {
      const questions = generateSuggestedQuestions(horoscope, language);
      setSuggestedQuestions(questions);
    }
  }, [horoscope, language]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Handle asking a question
  const handleAskQuestion = useCallback(async (question: string, bypassCache: boolean = false) => {
    if (!question.trim() || !horoscope || !selectedSign || isChatLoading) return;

    // Check cache first (unless bypassing)
    if (!bypassCache) {
      const cachedAnswer = findCachedAnswer(selectedSign, language, question);
      if (cachedAnswer) {
        // Show confirmation dialog - no credit cost for cached answers
        setPendingCachedQuestion({ question, answer: cachedAnswer });
        setUserQuestion('');
        return;
      }
    }

    // Check if this question will cost a credit (every 2nd new question costs 1 credit)
    const willCost = willNextQuestionCostCredit();
    if (willCost) {
      const result = deductCredits(1);
      if (!result.success) {
        // Not enough credits
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: question },
          {
            role: 'model',
            content: language === 'en'
              ? "You've used your free question for this pair. Each credit unlocks 2 questions - earn more credits through daily logins, achievements, or referrals to continue exploring the stars."
              : "Vous avez utilisé votre question gratuite pour cette paire. Chaque crédit débloque 2 questions - gagnez plus de crédits via les connexions quotidiennes, les succès ou les parrainages pour continuer à explorer les étoiles."
          }
        ]);
        setUserQuestion('');
        return;
      }
    }

    setUserQuestion('');
    setIsChatLoading(true);

    // Add user's question to chat
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: question }];
    setChatHistory(updatedHistory);

    try {
      const response = await generateHoroscopeFollowUp({
        horoscope,
        sign: selectedSign,
        history: updatedHistory,
        newQuestion: question,
        language
      });

      setChatHistory([...updatedHistory, { role: 'model', content: response }]);
      // Cache the Q&A and increment question count
      cacheHoroscopeQA(selectedSign, language, question, response);
      incrementHoroscopeQuestionCount();
      // Update credit indicator
      setNextQuestionCostsCredit(willNextQuestionCostCredit());
    } catch (error) {
      console.error('Error generating follow-up:', error);
      setChatHistory([
        ...updatedHistory,
        {
          role: 'model',
          content: language === 'en'
            ? 'The stars are momentarily obscured. Please try again.'
            : 'Les étoiles sont momentanément obscurcies. Veuillez réessayer.'
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }, [horoscope, selectedSign, chatHistory, language, isChatLoading, deductCredits]);

  // Handle showing cached answer
  const handleShowCachedAnswer = useCallback(() => {
    if (!pendingCachedQuestion) return;

    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: pendingCachedQuestion.question },
      { role: 'model', content: pendingCachedQuestion.answer }
    ];
    setChatHistory(updatedHistory);
    setPendingCachedQuestion(null);
  }, [pendingCachedQuestion, chatHistory]);

  // Handle dismissing the cache prompt
  const handleDismissCachePrompt = useCallback(() => {
    setPendingCachedQuestion(null);
  }, []);

  const handleSuggestedQuestion = (question: string) => {
    handleAskQuestion(question);
    // Remove the used question from suggestions
    setSuggestedQuestions(prev => prev.filter(q => q !== question));
  };

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskQuestion(userQuestion);
  };

  const regenerateHoroscope = async (sign: string) => {
    // Check cache first for the new language
    const cached = getCachedHoroscope(sign, language);
    if (cached) {
      setHoroscope(cached);
      setHoroscopeLanguage(language);
      return;
    }

    setIsLoading(true);
    setHoroscope(null);
    try {
      const reading = await generateHoroscope(sign, language);
      setHoroscope(reading);
      setHoroscopeLanguage(language);
      // Cache the new reading for today
      cacheHoroscope(sign, language, reading);
    } catch (error) {
      console.error('Error generating horoscope:', error);
      setHoroscope(language === 'en'
        ? 'Failed to generate horoscope. Please try again.'
        : 'Échec de la génération de l\'horoscope. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) {
      setLoadingMessageIndex(0);
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % currentLoadingPhrases.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading, currentLoadingPhrases.length]);

  const handleSignSelect = useCallback(async (sign: string, index: number) => {
    setSelectedSign(sign);
    setSelectedSignIndex(index);

    // Check cache first - return cached reading if available for today
    const cached = getCachedHoroscope(sign, language);
    if (cached) {
      setHoroscope(cached);
      setHoroscopeLanguage(language);
      return;
    }

    // No cache - generate new reading
    setIsLoading(true);
    setHoroscope(null);
    try {
      const reading = await generateHoroscope(sign, language);
      setHoroscope(reading);
      setHoroscopeLanguage(language);
      // Cache the new reading for today
      cacheHoroscope(sign, language, reading);
    } catch (error) {
      console.error('Error generating horoscope:', error);
      setHoroscope(language === 'en'
        ? 'Failed to generate horoscope. Please try again.'
        : 'Échec de la génération de l\'horoscope. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  const handleBack = () => {
    setSelectedSign(null);
    setSelectedSignIndex(null);
    setHoroscope(null);
    setHoroscopeLanguage(null);
    setChatHistory([]);
    setSuggestedQuestions([]);
    setUserQuestion('');
    setPendingCachedQuestion(null);
  }

  // Get the display name for the selected sign in current language
  const displaySignName = selectedSignIndex !== null ? currentZodiacSigns[selectedSignIndex] : selectedSign;

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="text-2xl text-purple-300 font-heading mb-4">{currentLoadingPhrases[loadingMessageIndex]}</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
      </div>
    );
  }

  if (horoscope && selectedSign) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-slate-900/80 rounded-2xl border border-purple-500/20 shadow-2xl">
        <h2 className="text-3xl font-heading text-amber-400 mb-6 text-center">{displaySignName}</h2>
        <p className="text-center text-purple-300/70 text-sm uppercase tracking-widest mb-8">
          {language === 'en' ? 'Daily Horoscope' : 'Horoscope du Jour'}
        </p>

        <div className="font-sans text-lg leading-relaxed text-slate-300">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-2xl font-bold text-purple-300 mt-6 mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold text-amber-200 mt-6 mb-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-bold text-amber-300/90 mt-4 mb-2">{children}</h3>,
              p: ({ children }) => <p className="mb-4 text-slate-300">{children}</p>,
              strong: ({ children }) => <strong className="text-amber-200 font-semibold">{children}</strong>,
              em: ({ children }) => <em className="text-purple-200 italic">{children}</em>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-slate-300">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-slate-300">{children}</ol>,
              li: ({ children }) => <li className="text-slate-300">{children}</li>,
            }}
          >
            {horoscope}
          </ReactMarkdown>
        </div>

        {/* Ask the Stars Chat Section */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <h3 className="text-xl font-heading text-purple-300 mb-4 text-center">
            {language === 'en' ? 'Ask the Stars' : 'Interrogez les Étoiles'}
          </h3>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && chatHistory.length === 0 && (
            <div className="mb-6">
              <p className="text-sm text-purple-300/70 mb-3 text-center">
                {language === 'en' ? 'Suggested questions:' : 'Questions suggérées:'}
              </p>
              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={isChatLoading}
                    className="w-full text-left p-3 bg-purple-900/30 rounded-lg border border-purple-500/20 text-purple-200 text-sm hover:bg-purple-900/50 hover:border-purple-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="mb-4 max-h-96 overflow-y-auto space-y-4 p-4 bg-slate-900/50 rounded-lg border border-purple-500/10">
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`${
                    message.role === 'user'
                      ? 'ml-8 bg-purple-900/40 border-purple-500/30'
                      : 'mr-8 bg-slate-800/60 border-amber-500/20'
                  } p-4 rounded-lg border`}
                >
                  <p className={`text-xs uppercase tracking-wider mb-2 ${
                    message.role === 'user' ? 'text-purple-400' : 'text-amber-400'
                  }`}>
                    {message.role === 'user'
                      ? (language === 'en' ? 'You' : 'Vous')
                      : (language === 'en' ? 'The Stars' : 'Les Étoiles')}
                  </p>
                  <div className="text-slate-300 text-sm leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="text-amber-200">{children}</strong>,
                        em: ({ children }) => <em className="text-purple-200">{children}</em>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="mr-8 bg-slate-800/60 border-amber-500/20 p-4 rounded-lg border">
                  <p className="text-xs uppercase tracking-wider mb-2 text-amber-400">
                    {language === 'en' ? 'The Stars' : 'Les Étoiles'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse text-purple-300">
                      {language === 'en' ? 'Consulting the cosmos...' : 'Consultation du cosmos...'}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Cached Question Confirmation */}
          {pendingCachedQuestion && (
            <div className="mb-4 p-4 bg-amber-900/30 rounded-lg border border-amber-500/30">
              <p className="text-amber-200 text-sm mb-3">
                {language === 'en'
                  ? 'You have already asked this question today. Would you like to see the previous answer?'
                  : 'Vous avez déjà posé cette question aujourd\'hui. Voulez-vous revoir la réponse précédente?'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleShowCachedAnswer}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition-colors duration-200"
                >
                  {language === 'en' ? 'Show answer' : 'Afficher la réponse'}
                </button>
                <button
                  onClick={handleDismissCachePrompt}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors duration-200"
                >
                  {language === 'en' ? 'Cancel' : 'Annuler'}
                </button>
              </div>
            </div>
          )}

          {/* Credit cost indicator */}
          <p className="text-xs text-purple-300/60 mb-2 text-center">
            {nextQuestionCostsCredit
              ? (language === 'en'
                  ? `Next question costs 1 credit (${user?.credits ?? 0} available)`
                  : `La prochaine question coûte 1 crédit (${user?.credits ?? 0} disponibles)`)
              : (language === 'en'
                  ? 'Next question is free'
                  : 'La prochaine question est gratuite')}
          </p>

          {/* Question Input */}
          <form onSubmit={handleSubmitQuestion} className="flex gap-2">
            <input
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder={language === 'en' ? 'Ask about planetary influences, moon phases, or your forecast...' : 'Posez une question sur les influences planétaires, les phases lunaires...'}
              disabled={isChatLoading || pendingCachedQuestion !== null}
              className="flex-1 px-4 py-3 bg-slate-800/60 border border-purple-500/20 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isChatLoading || !userQuestion.trim() || pendingCachedQuestion !== null}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-50 rounded-lg transition-colors duration-200"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-white/10">
          <Button onClick={handleBack}>
            {language === 'en' ? 'Choose another sign' : 'Choisir un autre signe'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-3xl font-heading text-center text-purple-200 mb-8">
        {language === 'en' ? 'Select Your Zodiac Sign' : 'Sélectionnez Votre Signe du Zodiaque'}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentZodiacSigns.map((sign, index) => (
          <button
            key={sign}
            onClick={() => handleSignSelect(sign, index)}
            className="p-4 bg-slate-900/40 rounded-xl border border-white/10 text-center backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <span className="text-lg font-heading text-purple-200">{sign}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HoroscopeReading;
