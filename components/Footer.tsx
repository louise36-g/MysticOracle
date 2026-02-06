import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Moon } from 'lucide-react';
import { ROUTES } from '../routes/routes';

const Footer: React.FC = () => {
  const { language } = useApp();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-purple-500/20 bg-[#28174e]/95 backdrop-blur-md mt-auto">
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
              {language === 'fr' ? 'Tirages de tarot et horoscopes avec IA' : 'AI-powered tarot readings and horoscopes'}
            </p>
          </div>

          {/* Help */}
          <div className="flex flex-col items-center">
            <h4 className="text-slate-300 font-medium mb-3">
              {language === 'fr' ? 'Aide' : 'Help'}
            </h4>
            <nav className="flex flex-col items-center gap-2">
              <Link
                to={ROUTES.FAQ}
                className="text-slate-400 hover:text-purple-300 text-sm transition-colors"
              >
                FAQ
              </Link>
              <Link
                to={ROUTES.HOW_CREDITS_WORK}
                className="text-slate-400 hover:text-purple-300 text-sm transition-colors"
              >
                {language === 'fr' ? 'Comment fonctionnent les crédits' : 'How Credits Work'}
              </Link>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col items-center">
            <h4 className="text-slate-300 font-medium mb-3">
              {language === 'fr' ? 'Mentions légales' : 'Legal'}
            </h4>
            <nav className="flex flex-col items-center gap-2">
              <Link
                to={ROUTES.PRIVACY}
                className="text-slate-400 hover:text-purple-300 text-sm transition-colors"
              >
                {language === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'}
              </Link>
              <Link
                to={ROUTES.TERMS}
                className="text-slate-400 hover:text-purple-300 text-sm transition-colors"
              >
                {language === 'fr' ? 'Conditions d\'utilisation' : 'Terms of Service'}
              </Link>
              <Link
                to={ROUTES.COOKIES}
                className="text-slate-400 hover:text-purple-300 text-sm transition-colors"
              >
                {language === 'fr' ? 'Politique des cookies' : 'Cookie Policy'}
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-end">
            <h4 className="text-slate-300 font-medium mb-3">
              Contact
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
            © {currentYear} MysticOracle. {language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
          </p>
          <p className="text-slate-600 text-xs mt-2">
            {language === 'fr' ? 'À des fins de divertissement uniquement. Ne remplace pas un avis professionnel.' : 'For entertainment purposes only. Not a substitute for professional advice.'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
