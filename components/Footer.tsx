import React from 'react';
import { useApp } from '../context/AppContext';
import { Moon } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { language } = useApp();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center">
                <Moon className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-lg font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-100 to-purple-200">
                MysticOracle
              </span>
            </div>
            <p className="text-slate-500 text-sm text-center md:text-left">
              {language === 'en'
                ? 'AI-powered tarot readings and horoscopes'
                : 'Lectures de tarot et horoscopes alimentés par l\'IA'}
            </p>
          </div>

          {/* Help */}
          <div className="flex flex-col items-center">
            <h4 className="text-slate-300 font-medium mb-3">
              {language === 'en' ? 'Help' : 'Aide'}
            </h4>
            <nav className="flex flex-col items-center gap-2">
              <button
                onClick={() => onNavigate('faq')}
                className="text-slate-400 hover:text-purple-300 text-sm transition-colors"
              >
                {language === 'en' ? 'FAQ' : 'FAQ'}
              </button>
              <button
                onClick={() => onNavigate('how-credits-work')}
                className="text-slate-400 hover:text-purple-300 text-sm transition-colors"
              >
                {language === 'en' ? 'How Credits Work' : 'Comment fonctionnent les crédits'}
              </button>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col items-center">
            <h4 className="text-slate-300 font-medium mb-3">
              {language === 'en' ? 'Legal' : 'Mentions Légales'}
            </h4>
            <nav className="flex flex-col items-center gap-2">
              <button
                onClick={() => onNavigate('privacy')}
                className="text-slate-400 hover:text-purple-300 text-sm transition-colors"
              >
                {language === 'en' ? 'Privacy Policy' : 'Politique de Confidentialité'}
              </button>
              <button
                onClick={() => onNavigate('terms')}
                className="text-slate-400 hover:text-purple-300 text-sm transition-colors"
              >
                {language === 'en' ? 'Terms of Service' : 'Conditions d\'Utilisation'}
              </button>
              <button
                onClick={() => onNavigate('cookies')}
                className="text-slate-400 hover:text-purple-300 text-sm transition-colors"
              >
                {language === 'en' ? 'Cookie Policy' : 'Politique des Cookies'}
              </button>
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-end">
            <h4 className="text-slate-300 font-medium mb-3">
              {language === 'en' ? 'Contact' : 'Contact'}
            </h4>
            <a
              href="mailto:privacy@mysticoracle.com"
              className="text-slate-400 hover:text-purple-300 text-sm transition-colors"
            >
              privacy@mysticoracle.com
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-8 pt-6 text-center">
          <p className="text-slate-500 text-xs">
            © {currentYear} MysticOracle. {language === 'en' ? 'All rights reserved.' : 'Tous droits réservés.'}
          </p>
          <p className="text-slate-600 text-xs mt-2">
            {language === 'en'
              ? 'For entertainment purposes only. Not a substitute for professional advice.'
              : 'À des fins de divertissement uniquement. Ne remplace pas un avis professionnel.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
