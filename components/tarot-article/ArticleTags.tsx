import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext';

interface ArticleTagsProps {
  tags: string[];
}

/**
 * Article tags section - displays topic tags
 */
export function ArticleTags({ tags }: ArticleTagsProps) {
  const { t } = useTranslation();

  if (tags.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-12"
    >
      <h3 className="text-lg text-slate-400 mb-4 flex items-center gap-2">
        <Tag className="w-4 h-4 text-purple-400/70" />
        {t('tarot.TarotArticlePage.related_topics', 'Related Topics')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 + index * 0.03 }}
            className="px-4 py-1.5 bg-purple-500/10 text-purple-300 text-sm rounded-full border border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/15 transition-all cursor-default"
          >
            {tag}
          </motion.span>
        ))}
      </div>
    </motion.section>
  );
}
