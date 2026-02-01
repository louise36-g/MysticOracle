/**
 * Loading Messages for Tarot Reading Generation
 * Mystical-themed messages shown while AI generates interpretations
 */

export const LOADING_MESSAGES = {
  en: [
    'Consulting the spirits...',
    'Shuffling the astral deck...',
    'Listening to the whispers of fate...',
    'Aligning the cosmic energies...',
    'Channeling ancient wisdom...',
    'Reading the threads of destiny...',
    'Gazing into the void...',
  ],
  fr: [
    'Consultation des esprits...',
    'Mélange du jeu astral...',
    'Écoute des murmures du destin...',
    'Alignement des énergies cosmiques...',
    'Canalisation de la sagesse ancienne...',
    'Lecture des fils du destin...',
    'Regard dans le vide...',
  ],
};

export type LoadingMessagesLanguage = keyof typeof LOADING_MESSAGES;

export function getLoadingMessages(language: LoadingMessagesLanguage): string[] {
  return LOADING_MESSAGES[language] || LOADING_MESSAGES.en;
}

export default LOADING_MESSAGES;
