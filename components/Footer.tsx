import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../routes/routes';

const Footer: React.FC = () => {
  const { language } = useApp();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-purple-500/20 bg-[#0f0c29]/90 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          {/* Copyright */}
          <p className="text-slate-300">
            © {currentYear} CelestiArcana. {language === 'fr' ? 'Divertissement uniquement.' : 'Entertainment only.'}
          </p>

          {/* Legal Links */}
          <nav className="flex items-center gap-5">
            <Link
              to={ROUTES.PRIVACY}
              className="text-slate-300 hover:text-purple-300 transition-colors underline decoration-slate-600 underline-offset-2 hover:decoration-purple-400"
            >
              {language === 'fr' ? 'Confidentialité' : 'Privacy'}
            </Link>
            <Link
              to={ROUTES.TERMS}
              className="text-slate-300 hover:text-purple-300 transition-colors underline decoration-slate-600 underline-offset-2 hover:decoration-purple-400"
            >
              {language === 'fr' ? 'Conditions' : 'Terms'}
            </Link>
            <Link
              to={ROUTES.COOKIES}
              className="text-slate-300 hover:text-purple-300 transition-colors underline decoration-slate-600 underline-offset-2 hover:decoration-purple-400"
            >
              Cookies
            </Link>
            <Link
              to={ROUTES.FAQ}
              className="text-slate-300 hover:text-purple-300 transition-colors underline decoration-slate-600 underline-offset-2 hover:decoration-purple-400"
            >
              FAQ
            </Link>
            <a
              href="mailto:contact@celestiarcana.com"
              className="text-slate-300 hover:text-purple-300 transition-colors underline decoration-slate-600 underline-offset-2 hover:decoration-purple-400"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
