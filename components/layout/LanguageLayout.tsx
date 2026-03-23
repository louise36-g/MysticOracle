import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { Language } from '../../utils/language';

interface LanguageLayoutProps {
  lang: Language;
}

/**
 * Syncs the URL-based language to AppContext and sets <html lang="">.
 * Wraps RootLayout in the route tree — English routes use lang="en",
 * French routes under /fr use lang="fr".
 */
export function LanguageLayout({ lang }: LanguageLayoutProps) {
  const { setLanguage } = useApp();

  useEffect(() => {
    setLanguage(lang);
    document.documentElement.lang = lang;
  }, [lang, setLanguage]);

  return <Outlet />;
}
