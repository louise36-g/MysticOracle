import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ROUTES } from '../routes/routes';

const Footer: React.FC = () => {
  const { language } = useApp();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-purple-500/20 bg-[#28174e]/95 backdrop-blur-md mt-auto">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          {/* Copyright */}
          <p className="text-slate-400">
            © {currentYear} CelestiArcana. {language === 'fr' ? 'Divertissement uniquement.' : 'Entertainment only.'}
          </p>

          {/* Legal Links */}
          <nav className="flex items-center gap-5">
            <Link
              to={ROUTES.PRIVACY}
              className="text-slate-400 hover:text-purple-300 transition-colors"
            >
              {language === 'fr' ? 'Confidentialité' : 'Privacy'}
            </Link>
            <Link
              to={ROUTES.TERMS}
              className="text-slate-400 hover:text-purple-300 transition-colors"
            >
              {language === 'fr' ? 'Conditions' : 'Terms'}
            </Link>
            <Link
              to={ROUTES.COOKIES}
              className="text-slate-400 hover:text-purple-300 transition-colors"
            >
              Cookies
            </Link>
            <Link
              to={ROUTES.FAQ}
              className="text-slate-400 hover:text-purple-300 transition-colors"
            >
              FAQ
            </Link>
            <a
              href="mailto:privacy@celestiarcana.com"
              className="text-slate-400 hover:text-purple-300 transition-colors"
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
