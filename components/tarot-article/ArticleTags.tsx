import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext';
import { useApp } from '../../context/AppContext';

interface ArticleTagsProps {
  tags: string[];
}

/**
 * Tag translation mappings for French
 */
const TAG_TRANSLATIONS: Record<string, string> = {
  // Suits
  'Cups': 'Coupes',
  'Pentacles': 'Deniers',
  'Swords': 'Épées',
  'Wands': 'Bâtons',
  // Court cards
  'King': 'Roi',
  'Queen': 'Reine',
  'Knight': 'Cavalier',
  'Page': 'Valet',
  // Numbers
  'Ace': 'As',
  'Two': 'Deux',
  'Three': 'Trois',
  'Four': 'Quatre',
  'Five': 'Cinq',
  'Six': 'Six',
  'Seven': 'Sept',
  'Eight': 'Huit',
  'Nine': 'Neuf',
  'Ten': 'Dix',
  // Major Arcana
  'The Fool': 'Le Mat',
  'The Magician': 'Le Bateleur',
  'The High Priestess': 'La Papesse',
  'The Empress': 'L\'Impératrice',
  'The Emperor': 'L\'Empereur',
  'The Hierophant': 'Le Pape',
  'The Lovers': 'Les Amoureux',
  'The Chariot': 'Le Chariot',
  'Strength': 'La Force',
  'The Hermit': 'L\'Ermite',
  'The Wheel of Fortune': 'La Roue de Fortune',
  'Justice': 'La Justice',
  'The Hanged Man': 'Le Pendu',
  'Death': 'L\'Arcane sans Nom',
  'Temperance': 'La Tempérance',
  'The Devil': 'Le Diable',
  'The Tower': 'La Maison Dieu',
  'The Star': 'L\'Étoile',
  'The Moon': 'La Lune',
  'The Sun': 'Le Soleil',
  'Judgement': 'Le Jugement',
  'The World': 'Le Monde',
  // Common terms
  'Major Arcana': 'Arcanes Majeurs',
  'Minor Arcana': 'Arcanes Mineurs',
  'meaning': 'signification',
  'reversed': 'inversé',
  'upright': 'droit',
  'love': 'amour',
  'career': 'carrière',
  'advice': 'conseil',
  'yes or no': 'oui ou non',
  'as a person': 'comme personne',
  'as feelings': 'comme sentiments',
  'tarot card': 'carte de tarot',
  'tarot': 'tarot',
  // Concepts
  'healing': 'guérison',
  'intuition': 'intuition',
  'transformation': 'transformation',
  'rebirth': 'renaissance',
  'new beginnings': 'nouveaux départs',
  'New Beginnings': 'Nouveaux Départs',
  'hope': 'espoir',
  'joy': 'joie',
  'clarity': 'clarté',
  'success': 'succès',
  'partnership': 'partenariat',
  'soulmate': 'âme sœur',
  'Soulmate': 'Âme Sœur',
  'shadow work': 'travail de l\'ombre',
  'spiritual awakening': 'éveil spirituel',
  'manifestation': 'manifestation',
  'letting go': 'lâcher prise',
  'inner wisdom': 'sagesse intérieure',
  'emotional balance': 'équilibre émotionnel',
  'divine feminine': 'féminin sacré',
  'mastery': 'maîtrise',
  'collaboration': 'collaboration',
  'teamwork': 'travail d\'équipe',
  'mystery': 'mystère',
  'subconscious': 'subconscient',
  'vitality': 'vitalité',
  'optimism': 'optimisme',
  'addiction': 'dépendance',
  'obsession': 'obsession',
  'generosity': 'générosité',
  'patience': 'patience',
  'fear': 'peur',
  'anxiety': 'anxiété',
  'heartbreak': 'chagrin d\'amour',
  // Zodiac
  'Capricorn': 'Capricorne',
  'Gemini': 'Gémeaux',
  'Leo': 'Lion',
  'Sagittarius': 'Sagittaire',
  'Scorpio': 'Scorpion',
  'Virgo': 'Vierge',
  // Prepositions
  'of': 'de',
};

/**
 * Translate a tag to French using simple string matching
 */
function translateTag(tag: string, language: string): string {
  if (language !== 'fr') return tag;

  // Try exact match first (case-sensitive)
  if (TAG_TRANSLATIONS[tag]) {
    return TAG_TRANSLATIONS[tag];
  }

  // Try case-insensitive exact match
  const lowerTag = tag.toLowerCase();
  for (const [en, fr] of Object.entries(TAG_TRANSLATIONS)) {
    if (en.toLowerCase() === lowerTag) {
      return fr;
    }
  }

  // Simple word replacement (no regex)
  let translated = tag;
  const sortedTranslations = Object.entries(TAG_TRANSLATIONS)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [en, fr] of sortedTranslations) {
    // Simple case-insensitive replace
    const lowerTranslated = translated.toLowerCase();
    const lowerEn = en.toLowerCase();
    let idx = lowerTranslated.indexOf(lowerEn);
    while (idx !== -1) {
      // Check word boundaries manually
      const before = idx === 0 || !/\w/.test(translated[idx - 1]);
      const after = idx + en.length >= translated.length || !/\w/.test(translated[idx + en.length]);
      if (before && after) {
        translated = translated.substring(0, idx) + fr + translated.substring(idx + en.length);
      }
      idx = translated.toLowerCase().indexOf(lowerEn, idx + fr.length);
    }
  }

  return translated;
}

/**
 * Article tags section - displays topic tags with language support
 */
export function ArticleTags({ tags }: ArticleTagsProps) {
  const { t } = useTranslation();
  const { language } = useApp();

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
            {translateTag(tag, language)}
          </motion.span>
        ))}
      </div>
    </motion.section>
  );
}
