import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Cookie, X, Settings, Check } from 'lucide-react';
import Button from './Button';

interface ConsentSettings {
  necessary: boolean; // Always true - required for site function
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const CONSENT_KEY = 'mysticoracle_cookie_consent';
const CONSENT_VERSION = 1; // Increment when policy changes

interface CookieConsentProps {
  onNavigate?: (view: string) => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onNavigate }) => {
  const { language } = useApp();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConsentSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: 0
  });

  useEffect(() => {
    // Check if consent has been given
    const storedConsent = localStorage.getItem(CONSENT_KEY);
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent);
        // Check if consent is still valid (less than 13 months old per CNIL)
        const thirteenMonthsMs = 13 * 30 * 24 * 60 * 60 * 1000;
        if (parsed.timestamp && Date.now() - parsed.timestamp < thirteenMonthsMs) {
          setSettings(parsed);
          return;
        }
      } catch {
        // Invalid stored consent, show banner
      }
    }
    // Delay showing banner slightly for better UX
    const timer = setTimeout(() => setShowBanner(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const saveConsent = (newSettings: ConsentSettings) => {
    const consentData = {
      ...newSettings,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    setSettings(newSettings);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now()
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    });
  };

  const handleSaveSettings = () => {
    saveConsent(settings);
  };

  const content = {
    en: {
      title: 'Cookie Preferences',
      description: 'We use cookies to enhance your experience. By accepting all cookies, you help us improve our services through analytics. By refusing, only essential cookies required for the site to function will be used.',
      necessary: 'Essential Cookies',
      necessaryDesc: 'Required for the website to function (authentication, security, preferences). Cannot be disabled.',
      analytics: 'Analytics Cookies',
      analyticsDesc: 'Help us understand how visitors use our site to improve it. Your data is anonymized.',
      marketing: 'Marketing Cookies',
      marketingDesc: 'Used to deliver relevant advertisements based on your interests.',
      acceptAll: 'Accept All',
      rejectAll: 'Reject All',
      customize: 'Customize',
      saveSettings: 'Save Preferences',
      privacyLink: 'Privacy Policy',
      moreInfo: 'Learn more in our'
    },
    fr: {
      title: 'Préférences de Cookies',
      description: 'Nous utilisons des cookies pour améliorer votre expérience. En acceptant tous les cookies, vous nous aidez à améliorer nos services via les analyses. En refusant, seuls les cookies essentiels au fonctionnement du site seront utilisés.',
      necessary: 'Cookies Essentiels',
      necessaryDesc: 'Nécessaires au fonctionnement du site (authentification, sécurité, préférences). Ne peuvent pas être désactivés.',
      analytics: 'Cookies Analytiques',
      analyticsDesc: 'Nous aident à comprendre comment les visiteurs utilisent notre site. Vos données sont anonymisées.',
      marketing: 'Cookies Marketing',
      marketingDesc: 'Utilisés pour afficher des publicités pertinentes selon vos intérêts.',
      acceptAll: 'Tout Accepter',
      rejectAll: 'Tout Refuser',
      customize: 'Personnaliser',
      saveSettings: 'Enregistrer',
      privacyLink: 'Politique de Confidentialité',
      moreInfo: 'En savoir plus dans notre'
    }
  };

  const t = content[language];

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop for settings modal - separate from banner */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[99] bg-black/50 pointer-events-auto"
          onClick={() => setShowSettings(false)}
        />
      )}

      {/* Banner container */}
      <div className="fixed inset-x-0 bottom-0 z-[100] flex items-end justify-center p-4 pointer-events-none">
        {/* Main Banner */}
        <div className="w-full max-w-2xl pointer-events-auto">
        {showSettings ? (
          // Detailed Settings View
          <div className="bg-slate-900 border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/10 p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-heading text-purple-200">{t.title}</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Necessary Cookies */}
              <div className="flex items-start justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-slate-200 font-medium">{t.necessary}</p>
                  <p className="text-slate-400 text-sm">{t.necessaryDesc}</p>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-6 bg-purple-600 rounded-full flex items-center justify-end px-1 cursor-not-allowed">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-slate-200 font-medium">{t.analytics}</p>
                  <p className="text-slate-400 text-sm">{t.analyticsDesc}</p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setSettings(s => ({ ...s, analytics: !s.analytics }))}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      settings.analytics ? 'bg-purple-600 justify-end' : 'bg-slate-600 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-slate-200 font-medium">{t.marketing}</p>
                  <p className="text-slate-400 text-sm">{t.marketingDesc}</p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setSettings(s => ({ ...s, marketing: !s.marketing }))}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      settings.marketing ? 'bg-purple-600 justify-end' : 'bg-slate-600 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSettings(false)}
              >
                {language === 'en' ? 'Cancel' : 'Annuler'}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSaveSettings}
              >
                <Check className="w-4 h-4 mr-2" />
                {t.saveSettings}
              </Button>
            </div>
          </div>
        ) : (
          // Compact Banner View - CNIL Compliant: Equal prominence for Accept/Reject
          <div className="bg-slate-900 border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/10 p-4 md:p-6 animate-slide-up">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex p-3 bg-purple-500/10 rounded-lg">
                <Cookie className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-slate-300 text-sm mb-3">
                  {t.description}
                </p>
                <p className="text-slate-400 text-xs mb-4">
                  {t.moreInfo}{' '}
                  <button
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('privacy');
                        setShowBanner(false);
                      }
                    }}
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    {t.privacyLink}
                  </button>
                </p>
                {/* CNIL Requirement: Accept and Reject buttons must have EQUAL prominence */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleRejectNonEssential}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 transition-colors"
                  >
                    {t.rejectAll}
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 transition-colors"
                  >
                    {t.acceptAll}
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    {t.customize}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
      </div>
    </>
  );
};

export default CookieConsent;

// Export helper function to check consent status
export const getCookieConsent = (): ConsentSettings | null => {
  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const hasAnalyticsConsent = (): boolean => {
  const consent = getCookieConsent();
  return consent?.analytics ?? false;
};

export const hasMarketingConsent = (): boolean => {
  const consent = getCookieConsent();
  return consent?.marketing ?? false;
};
