import { motion } from 'framer-motion';
import { SmartLink } from '../SmartLink';
import { useTranslation } from '../../context/TranslationContext';

interface RelatedCardsProps {
  cards: string[];
  onNavigate: (path: string) => void;
}

/**
 * Related cards section - shows links to related tarot card articles
 */
export function RelatedCards({ cards, onNavigate }: RelatedCardsProps) {
  const { t } = useTranslation();

  if (cards.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="border-t border-purple-500/20 pt-12"
    >
      <h2 className="text-2xl font-heading text-purple-200 mb-6 text-center">
        {t('tarot.TarotArticlePage.related_cards', 'Related Cards')}
      </h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card, index) => {
          const slug = card.toLowerCase().replace(/\s+/g, '-');
          return (
            <motion.div
              key={card}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
            >
              <SmartLink
                href={`/tarot/articles/${slug}`}
                onClick={() => onNavigate(`/tarot/articles/${slug}`)}
                className="group block px-5 py-4 bg-slate-900/60 border border-purple-500/20 rounded-xl
                  hover:border-purple-500/50 hover:bg-slate-800/60 transition-all duration-300
                  text-purple-300 hover:text-purple-200 font-medium text-center
                  hover:shadow-lg hover:shadow-purple-500/10"
              >
                <span className="relative">
                  {card}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-purple-500 to-fuchsia-500 group-hover:w-full transition-all duration-300" />
                </span>
              </SmartLink>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
