
import React, { useState, useEffect, useCallback } from 'react';
import { generateHoroscope } from '../services/openrouterService';
import Button from './Button';

const zodiacSigns = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const loadingPhrases = [
  'Connecting to the stars...',
  'Consulting the cosmos...',
  'Reading the celestial alignments...',
  'Channeling the universe...',
  'Translating starlight into wisdom...',
  'Gazing into the cosmic ether...'
];

const HoroscopeReading: React.FC = () => {
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>(loadingPhrases[0]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingText(prev => {
          const currentIndex = loadingPhrases.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingPhrases.length;
          return loadingPhrases[nextIndex];
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleSignSelect = useCallback(async (sign: string) => {
    setSelectedSign(sign);
    setIsLoading(true);
    setHoroscope(null);
    try {
      const reading = await generateHoroscope(sign);
      setHoroscope(reading);
    } catch (error) {
      console.error('Error generating horoscope:', error);
      setHoroscope('Failed to generate horoscope. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBack = () => {
    setSelectedSign(null);
    setHoroscope(null);
  }

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="text-2xl text-purple-300 font-heading mb-4">{loadingText}</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
      </div>
    );
  }

  if (horoscope && selectedSign) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-slate-900/40 rounded-xl border border-white/10">
        <h2 className="text-3xl font-heading text-amber-400 mb-4 text-center">{selectedSign} - Daily Horoscope</h2>
        <p className="text-slate-300 whitespace-pre-wrap">{horoscope}</p>
        <div className="text-center mt-6">
          <Button onClick={handleBack}>Choose another sign</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-3xl font-heading text-center text-purple-200 mb-8">Select Your Zodiac Sign</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {zodiacSigns.map(sign => (
          <button
            key={sign}
            onClick={() => handleSignSelect(sign)}
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
