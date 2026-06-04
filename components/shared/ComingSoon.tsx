import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import LocalizedLink from '../LocalizedLink';

interface ComingSoonProps {
  titleEn: string;
  titleFr: string | null;
  categorySlug: string | null;
  categoryNameEn: string | null;
  categoryNameFr: string | null;
  language: 'en' | 'fr';
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  titleEn,
  titleFr,
  categorySlug,
  categoryNameEn,
  categoryNameFr,
  language,
}) => {
  const title = language === 'fr' && titleFr ? titleFr : titleEn;
  const categoryName =
    language === 'fr' && categoryNameFr ? categoryNameFr : categoryNameEn;
  const backPath = categorySlug ? `/blog/category/${categorySlug}` : '/blog';
  const backLabel =
    language === 'fr'
      ? categoryName
        ? `Retour vers ${categoryName}`
        : 'Retour au Blog'
      : categoryName
      ? `Back to ${categoryName}`
      : 'Back to Blog';

  const pageTitle =
    language === 'fr'
      ? `${title} – Bientôt disponible | CelestiArcana`
      : `${title} – Coming Soon | CelestiArcana`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto text-center"
        >
          {/* Glowing moon icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <span className="text-4xl" role="img" aria-label="moon">
              🌙
            </span>
          </div>

          {/* Coming Soon badge */}
          <span className="inline-block px-4 py-1 mb-5 text-xs font-semibold uppercase tracking-widest text-purple-300 bg-purple-500/15 border border-purple-500/30 rounded-full">
            {language === 'fr' ? 'Bientôt disponible' : 'Coming Soon'}
          </span>

          {/* Article title */}
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-purple-100 mb-4 leading-tight">
            {title}
          </h1>

          {/* Teaser sentence */}
          <p className="text-slate-400 leading-relaxed mb-8">
            {language === 'fr'
              ? 'Cet article est préparé avec soin et sera révélé très prochainement.'
              : 'This article is being prepared with care and will be revealed soon.'}
          </p>

          {/* Back link */}
          <LocalizedLink
            to={backPath}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600/20 border border-purple-500/40 text-purple-300 rounded-xl hover:bg-purple-600/30 hover:text-purple-200 transition-all text-sm font-medium group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {backLabel}
          </LocalizedLink>
        </motion.div>
      </div>
    </>
  );
};

export default ComingSoon;
