import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { loadTranslations, refreshTranslations } from '../services/translationService';
import { Language } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '');

interface LanguageInfo {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
}

interface TranslationContextType {
  language: string;
  setLanguage: (code: string) => void;
  languages: LanguageInfo[];
  translations: Record<string, string>;
  t: (key: string, fallback?: string, variables?: Record<string, string | number>) => string;
  isLoading: boolean;
  isReady: boolean;
  refresh: () => Promise<void>;
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
    // 1. Check URL path — same priority as AppContext's detectInitialLanguage
    // Ensures French-browser users on English paths start with English translations
    try {
      const path = window.location.pathname;
      if (path !== '/fr' && !path.startsWith('/fr/')) {
        // On an English path: if localStorage explicitly says 'en', use it
        // Otherwise, fall through so the redirect function can handle it
        const saved = localStorage.getItem('celestiarcana-language');
        if (saved === 'en') return 'en';
        if (saved === 'fr') return 'fr';
        // No saved preference on English path — default to 'en'
        // (redirectToPreferredLanguage already redirected French users to /fr/)
        return 'en';
      }
    } catch {
      // window/localStorage not available
    }

    // 2. On /fr/ path, check localStorage then browser language
    const saved = localStorage.getItem('celestiarcana-language');
    if (saved) return saved;

    const browserLang = navigator.language.split('-')[0];
    return ['en', 'fr'].includes(browserLang) ? browserLang : 'en';
  });

  const [languages, setLanguages] = useState<LanguageInfo[]>([]);
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
        console.warn('Failed to fetch languages:', error);
        // Set default languages as fallback
        setLanguages([
          { id: '1', code: 'en', name: 'English', nativeName: 'English', isDefault: true },
          { id: '2', code: 'fr', name: 'French', nativeName: 'Français', isDefault: false }
        ]);
      }
    };

    fetchLanguages();
  }, []);

  // Load translations when language changes (uses translationService caching)
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await loadTranslations(language as Language);
        if (isMounted) {
          setTranslations({
            ...FALLBACK_TRANSLATIONS[language],
            ...data
          });
        }
      } catch (error) {
        console.warn('Failed to load translations:', error);
        if (isMounted) {
          setTranslations(FALLBACK_TRANSLATIONS[language] || FALLBACK_TRANSLATIONS.en);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    };

    load();

    // Listen for background translation updates (version-based cache invalidation)
    const handleTranslationsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ language: Language }>;
      if (customEvent.detail.language === language && isMounted) {
        loadTranslations(language as Language).then(data => {
          if (isMounted) {
            setTranslations({
              ...FALLBACK_TRANSLATIONS[language],
              ...data
            });
          }
        });
      }
    };

    window.addEventListener('translations-updated', handleTranslationsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('translations-updated', handleTranslationsUpdated);
    };
  }, [language]);

  const setLanguage = useCallback((code: string) => {
    localStorage.setItem('celestiarcana-language', code);
    setLanguageState(code);
  }, []);

  // Force-refresh translations (used after admin mutations)
  const refresh = useCallback(async () => {
    const data = await refreshTranslations(language as Language);
    setTranslations({
      ...FALLBACK_TRANSLATIONS[language],
      ...data
    });
  }, [language]);

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
      isReady,
      refresh
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
