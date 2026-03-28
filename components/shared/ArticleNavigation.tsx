import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import LocalizedLink from '../LocalizedLink';

interface NavItem {
  slug: string;
  title: string;
  titleFr?: string;
}

interface ArticleNavigationProps {
  prev?: NavItem | null;
  next?: NavItem | null;
  basePath: string; // '/tarot' or '/blog'
}

const ArticleNavigation: React.FC<ArticleNavigationProps> = ({ prev, next, basePath }) => {
  const { language } = useApp();

  if (!prev && !next) return null;

  const getTitle = (item: NavItem) =>
    language === 'fr' && item.titleFr ? item.titleFr : item.title;

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="my-12 grid grid-cols-2 gap-4"
      aria-label={language === 'fr' ? 'Navigation entre articles' : 'Article navigation'}
    >
      {prev ? (
        <LocalizedLink
          to={`${basePath}/${prev.slug}`}
          className="group flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 border border-purple-500/20 hover:border-purple-400/40 hover:bg-slate-800/60 transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5 text-purple-400 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
          <div className="min-w-0">
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {language === 'fr' ? 'Précédent' : 'Previous'}
            </span>
            <p className="text-sm text-purple-200 truncate group-hover:text-white transition-colors">
              {getTitle(prev)}
            </p>
          </div>
        </LocalizedLink>
      ) : (
        <div />
      )}

      {next ? (
        <LocalizedLink
          to={`${basePath}/${next.slug}`}
          className="group flex items-center justify-end gap-3 p-4 rounded-xl bg-slate-800/40 border border-purple-500/20 hover:border-purple-400/40 hover:bg-slate-800/60 transition-all duration-300 text-right"
        >
          <div className="min-w-0">
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              {language === 'fr' ? 'Suivant' : 'Next'}
            </span>
            <p className="text-sm text-purple-200 truncate group-hover:text-white transition-colors">
              {getTitle(next)}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
        </LocalizedLink>
      ) : (
        <div />
      )}
    </motion.nav>
  );
};

export default ArticleNavigation;
