import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QuickNavChips } from './QuickNavChips';
import { ArticleHeaderProps } from './types';
import { AuthorAvatar } from '../shared/AuthorAvatar';
import { formatDate } from '../../utils/dateFormatters';

/**
 * Article header with title, meta info, badges, and quick navigation
 */
export function ArticleHeader({
  title,
  author,
  readTime,
  dateModified,
  sections,
  onSectionClick,
  language,
}: ArticleHeaderProps) {
  const { t } = useApp();

  const formattedDate = formatDate(dateModified, language as 'en' | 'fr');

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
          {t('tarot.ArticleHeader.updated', 'Updated')} {formattedDate}
        </time>
      </div>

      {/* Quick Navigation Chips */}
      {sections.length > 0 && (
        <QuickNavChips sections={sections} onSectionClick={onSectionClick} />
      )}
    </motion.header>
  );
}
