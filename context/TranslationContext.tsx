import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '');

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
}

interface TranslationContextType {
  language: string;
  setLanguage: (code: string) => void;
  languages: Language[];
  translations: Record<string, string>;
  t: (key: string, fallback?: string, variables?: Record<string, string | number>) => string;
  isLoading: boolean;
  isReady: boolean;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

// Fallback translations for critical UI elements (used before API loads)
const FALLBACK_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'nav.home': 'Home',
    'nav.signIn': 'Sign In',
  },
  fr: {
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'nav.home': 'Accueil',
    'nav.signIn': 'Connexion',
  }
};

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => {
    // Check localStorage first, then browser language
    const saved = localStorage.getItem('celestiarcana_language');
    if (saved) return saved;

    const browserLang = navigator.language.split('-')[0];
    return ['en', 'fr'].includes(browserLang) ? browserLang : 'en';
  });

  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>(
    FALLBACK_TRANSLATIONS[language] || FALLBACK_TRANSLATIONS.en
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Fetch available languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await fetch(`${API_URL}/api/translations/languages`);
        if (res.ok) {
          const data = await res.json();
          setLanguages(data.languages);
        }
      } catch (error) {
        console.error('Failed to fetch languages:', error);
        // Set default languages as fallback
        setLanguages([
          { id: '1', code: 'en', name: 'English', nativeName: 'English', isDefault: true },
          { id: '2', code: 'fr', name: 'French', nativeName: 'Français', isDefault: false }
        ]);
      }
    };

    fetchLanguages();
  }, []);

  // Fetch translations when language changes
  useEffect(() => {
    const fetchTranslations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/translations/${language}`);
        if (res.ok) {
          const data = await res.json();
          setTranslations({
            ...FALLBACK_TRANSLATIONS[language],
            ...data.translations
          });
        } else {
          // Use fallback if fetch fails
          setTranslations(FALLBACK_TRANSLATIONS[language] || FALLBACK_TRANSLATIONS.en);
        }
      } catch (error) {
        console.error('Failed to fetch translations:', error);
        setTranslations(FALLBACK_TRANSLATIONS[language] || FALLBACK_TRANSLATIONS.en);
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    };

    fetchTranslations();
  }, [language]);

  const setLanguage = useCallback((code: string) => {
    localStorage.setItem('celestiarcana_language', code);
    setLanguageState(code);
  }, []);

  // Translation function with variable interpolation support
  // Variables use {{varName}} syntax in translation strings
  const t = useCallback((key: string, fallback?: string, variables?: Record<string, string | number>): string => {
    let text = translations[key] || fallback || key;

    // Replace {{varName}} placeholders with actual values
    if (variables) {
      Object.entries(variables).forEach(([varName, value]) => {
        text = text.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), String(value));
      });
    }

    return text;
  }, [translations]);

  return (
    <TranslationContext.Provider value={{
      language,
      setLanguage,
      languages,
      translations,
      t,
      isLoading,
      isReady
    }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

// Hook for simple translation access
export function useT() {
  const { t } = useTranslation();
  return t;
}

export default TranslationContext;
