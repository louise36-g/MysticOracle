import { motion } from 'framer-motion';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext';
import { QuickNavChips } from './QuickNavChips';
import { ArticleHeaderProps } from './types';
import { AuthorAvatar } from '../shared/AuthorAvatar';

/**
 * Article header with title, meta info, badges, and quick navigation
 */
export function ArticleHeader({
  title,
  author,
  readTime,
  dateModified,
  cardType,
  astrologicalCorrespondence,
  element,
  isCourtCard,
  sections,
  onSectionClick,
  language,
}: ArticleHeaderProps) {
  const { t } = useTranslation();

  const formattedDate = new Date(dateModified).toLocaleDateString(
    language === 'en' ? 'en-US' : 'fr-FR',
    { month: 'long', day: 'numeric', year: 'numeric' }
  );

  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      {/* Title */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-100 to-purple-300 mb-6 text-center leading-tight">
        {title}
      </h1>

      {/* Meta information */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-400 mb-6">
        <AuthorAvatar size="sm" />
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-purple-400/70" />
          {readTime}
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <time dateTime={dateModified} className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-purple-400/70" />
          Updated {formattedDate}
        </time>
      </div>

      {/* Card metadata badges */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <span className="px-4 py-1.5 bg-purple-500/15 text-purple-300 text-xs font-medium rounded-full border border-purple-500/30 backdrop-blur-sm">
          {cardType.replace(/_/g, ' ')}
        </span>
        <span className="px-4 py-1.5 bg-blue-500/15 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30 backdrop-blur-sm">
          {astrologicalCorrespondence}
        </span>
        <span className="px-4 py-1.5 bg-emerald-500/15 text-emerald-300 text-xs font-medium rounded-full border border-emerald-500/30 backdrop-blur-sm">
          {element}
        </span>
        {isCourtCard && (
          <span className="px-4 py-1.5 bg-amber-500/15 text-amber-300 text-xs font-medium rounded-full border border-amber-500/30 backdrop-blur-sm flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            {t('tarot.TarotArticlePage.court_card', 'Court Card')}
          </span>
        )}
      </div>

      {/* Quick Navigation Chips */}
      {sections.length > 0 && (
        <QuickNavChips sections={sections} onSectionClick={onSectionClick} />
      )}
    </motion.header>
  );
}
