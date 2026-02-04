
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { fetchHoroscope } from '../services/api';
import Button from './Button';

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

const HoroscopeReading: React.FC = () => {
  const { language } = useApp();
  const { getToken } = useAuth();
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [selectedSignIndex, setSelectedSignIndex] = useState<number | null>(null);
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [horoscopeLanguage, setHoroscopeLanguage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const currentLoadingPhrases = useMemo(() => loadingPhrases[language], [language]);
  const currentZodiacSigns = useMemo(() => zodiacSigns[language], [language]);

  // Regenerate horoscope when language changes (if one is already displayed)
  useEffect(() => {
    if (horoscope && selectedSignIndex !== null && horoscopeLanguage !== language && !isLoading) {
      const signInNewLanguage = zodiacSigns[language][selectedSignIndex];
      regenerateHoroscope(signInNewLanguage);
    }
  }, [language]);

  const regenerateHoroscope = async (sign: string) => {
    setIsLoading(true);
    setHoroscope(null);
    try {
      const token = await getToken();
      const { horoscope: reading } = await fetchHoroscope(sign, language, token);
      setHoroscope(reading);
      setHoroscopeLanguage(language);
    } catch (error: any) {
      console.error('Error generating horoscope:', error);
      const errorMsg = error?.message || (language === 'en'
        ? 'Failed to generate horoscope. Please try again.'
        : 'Échec de la génération de l\'horoscope. Veuillez réessayer.');
      setHoroscope(errorMsg);
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
    setIsLoading(true);
    setHoroscope(null);

    try {
      const token = await getToken();
      const { horoscope: reading } = await fetchHoroscope(sign, language, token);
      setHoroscope(reading);
      setHoroscopeLanguage(language);
    } catch (error: any) {
      console.error('Error generating horoscope:', error);
      const errorMsg = error?.message || (language === 'en'
        ? 'Failed to generate horoscope. Please try again.'
        : 'Échec de la génération de l\'horoscope. Veuillez réessayer.');
      setHoroscope(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [language, getToken]);

  const handleBack = () => {
    setSelectedSign(null);
    setSelectedSignIndex(null);
    setHoroscope(null);
    setHoroscopeLanguage(null);
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
          {language === 'fr' ? 'Horoscope du Jour' : 'Daily Horoscope'}
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

        <div className="text-center mt-8 pt-6 border-t border-white/10">
          <Button onClick={handleBack}>
            {language === 'fr' ? 'Choisir un autre signe' : 'Choose another sign'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-3xl font-heading text-center text-purple-200 mb-8">
        {language === 'fr' ? 'Sélectionnez Votre Signe du Zodiaque' : 'Select Your Zodiac Sign'}
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
