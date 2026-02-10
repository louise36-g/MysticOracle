// constants/singleCardLayouts.ts

export type SingleCardCategory =
  | 'daily_guidance'
  | 'love'
  | 'career'
  | 'decision'
  | 'self_reflection';

export type SingleCardLayoutId =
  | 'card_of_the_day'
  | 'hearts_message'
  | 'professional_insight'
  | 'clarity_card'
  | 'mirror_card';

export interface SingleCardLayout {
  id: SingleCardLayoutId;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  positions: {
    en: [string];
    fr: [string];
  };
}

export interface SingleCardCategoryConfig {
  id: SingleCardCategory;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  iconName: string;
  colorClass: string;
  layouts: SingleCardLayoutId[];
  defaultLayout: SingleCardLayoutId;
}

export interface SingleCardQuestion {
  id: string;
  textEn: string;
  textFr: string;
}

// Layout definitions
export const SINGLE_CARD_LAYOUTS: Record<SingleCardLayoutId, SingleCardLayout> = {
  card_of_the_day: {
    id: 'card_of_the_day',
    labelEn: 'Card of the Day',
    labelFr: 'Carte du Jour',
    taglineEn: 'Start your day with intention. One card reveals the energy to embrace or be mindful of today.',
    taglineFr: "Commencez votre journée avec intention. Une carte révèle l'énergie à accueillir ou dont être conscient aujourd'hui.",
    positions: {
      en: ['The energy and guidance for your day'],
      fr: ["L'énergie et les conseils pour votre journée"],
    },
  },
  hearts_message: {
    id: 'hearts_message',
    labelEn: "Heart's Message",
    labelFr: 'Message du Coeur',
    taglineEn: 'When emotions feel tangled, one card cuts through the noise to reveal what your heart truly needs.',
    taglineFr: 'Quand les émotions semblent confuses, une carte traverse le bruit pour révéler ce dont votre coeur a vraiment besoin.',
    positions: {
      en: ['What your heart is trying to tell you'],
      fr: ['Ce que votre coeur essaie de vous dire'],
    },
  },
  professional_insight: {
    id: 'professional_insight',
    labelEn: 'Professional Insight',
    labelFr: 'Vision Professionnelle',
    taglineEn: 'Gain clarity on a work situation. One card highlights what to focus on or approach differently.',
    taglineFr: 'Gagnez en clarté sur une situation professionnelle. Une carte met en lumière ce sur quoi vous concentrer.',
    positions: {
      en: ['The insight you need for your career'],
      fr: ["L'éclairage dont vous avez besoin pour votre carrière"],
    },
  },
  clarity_card: {
    id: 'clarity_card',
    labelEn: 'Clarity Card',
    labelFr: 'Carte de Clarté',
    taglineEn: 'Facing a choice? One card illuminates what you might be overlooking or need to consider.',
    taglineFr: 'Face à un choix? Une carte illumine ce que vous pourriez négliger ou devez considérer.',
    positions: {
      en: ['What you need to see clearly about this decision'],
      fr: ['Ce que vous devez voir clairement concernant cette décision'],
    },
  },
  mirror_card: {
    id: 'mirror_card',
    labelEn: 'Mirror Card',
    labelFr: 'Carte Miroir',
    taglineEn: 'A gentle check-in with yourself. One card reflects what needs your attention or acknowledgment.',
    taglineFr: 'Un moment de connexion avec vous-même. Une carte reflète ce qui a besoin de votre attention.',
    positions: {
      en: ['What is asking for your attention within'],
      fr: ['Ce qui demande votre attention intérieure'],
    },
  },
};

// Category configurations
export const SINGLE_CARD_CATEGORIES: SingleCardCategoryConfig[] = [
  {
    id: 'daily_guidance',
    labelEn: 'Daily Guidance',
    labelFr: 'Guidance Quotidienne',
    taglineEn: 'A message for your day',
    taglineFr: 'Un message pour votre journée',
    iconName: 'Sun',
    colorClass: 'amber',
    layouts: ['card_of_the_day'],
    defaultLayout: 'card_of_the_day',
  },
  {
    id: 'love',
    labelEn: 'Love & Relationships',
    labelFr: 'Amour & Relations',
    taglineEn: 'Matters of the heart',
    taglineFr: 'Les affaires du coeur',
    iconName: 'Heart',
    colorClass: 'rose',
    layouts: ['hearts_message'],
    defaultLayout: 'hearts_message',
  },
  {
    id: 'career',
    labelEn: 'Career & Purpose',
    labelFr: 'Carrière & Vocation',
    taglineEn: 'Your professional path',
    taglineFr: 'Votre chemin professionnel',
    iconName: 'Briefcase',
    colorClass: 'emerald',
    layouts: ['professional_insight'],
    defaultLayout: 'professional_insight',
  },
  {
    id: 'decision',
    labelEn: 'Decision-Making',
    labelFr: 'Prise de Décision',
    taglineEn: 'Clarity for your choices',
    taglineFr: 'Clarté pour vos choix',
    iconName: 'Scale',
    colorClass: 'indigo',
    layouts: ['clarity_card'],
    defaultLayout: 'clarity_card',
  },
  {
    id: 'self_reflection',
    labelEn: 'Self-Reflection',
    labelFr: 'Introspection',
    taglineEn: 'Looking within',
    taglineFr: 'Regarder en soi',
    iconName: 'Eye',
    colorClass: 'violet',
    layouts: ['mirror_card'],
    defaultLayout: 'mirror_card',
  },
];

// Questions per category
export const SINGLE_CARD_QUESTIONS: Record<SingleCardCategory, SingleCardQuestion[]> = {
  daily_guidance: [
    { id: '1dg1', textEn: 'What should I focus on today?', textFr: 'Sur quoi devrais-je me concentrer aujourd\'hui ?' },
    { id: '1dg2', textEn: 'What do I need to know before starting my day?', textFr: 'Que dois-je savoir avant de commencer ma journée ?' },
    { id: '1dg3', textEn: 'What energy is surrounding me today?', textFr: 'Quelle énergie m\'entoure aujourd\'hui ?' },
  ],
  love: [
    { id: '1lv1', textEn: 'What do I need to know about my love life right now?', textFr: 'Que dois-je savoir sur ma vie amoureuse en ce moment ?' },
    { id: '1lv2', textEn: 'Why do I keep attracting the same type of person?', textFr: 'Pourquoi est-ce que j\'attire toujours le même type de personne ?' },
    { id: '1lv3', textEn: 'What\'s blocking me from finding love?', textFr: 'Qu\'est-ce qui m\'empêche de trouver l\'amour ?' },
  ],
  career: [
    { id: '1cr1', textEn: 'Am I on the right career path?', textFr: 'Suis-je sur la bonne voie professionnelle ?' },
    { id: '1cr2', textEn: 'What\'s holding me back at work?', textFr: 'Qu\'est-ce qui me retient au travail ?' },
    { id: '1cr3', textEn: 'Should I take this new opportunity?', textFr: 'Devrais-je saisir cette nouvelle opportunité ?' },
  ],
  decision: [
    { id: '1dc1', textEn: 'What should I consider before making this choice?', textFr: 'Que devrais-je considérer avant de faire ce choix ?' },
    { id: '1dc2', textEn: 'What am I not seeing clearly about this situation?', textFr: 'Qu\'est-ce que je ne vois pas clairement dans cette situation ?' },
    { id: '1dc3', textEn: 'What would happen if I took the leap?', textFr: 'Que se passerait-il si je me lançais ?' },
  ],
  self_reflection: [
    { id: '1sr1', textEn: 'What do I need to work on right now?', textFr: 'Sur quoi dois-je travailler en ce moment ?' },
    { id: '1sr2', textEn: 'Why do I feel stuck?', textFr: 'Pourquoi est-ce que je me sens bloqué(e) ?' },
    { id: '1sr3', textEn: 'What am I afraid to admit to myself?', textFr: 'Qu\'est-ce que j\'ai peur de m\'avouer ?' },
  ],
};

// Helper text for custom questions
export const SINGLE_CARD_CUSTOM_QUESTION_HELPER = {
  en: 'Open-ended questions work best. Try "What do I need to understand about..." or "What energy surrounds..."',
  fr: 'Les questions ouvertes fonctionnent mieux. Essayez "Que dois-je comprendre de..." ou "Quelle énergie entoure..."',
};

// Helper to get category config by id
export function getSingleCardCategory(id: SingleCardCategory): SingleCardCategoryConfig | undefined {
  return SINGLE_CARD_CATEGORIES.find(c => c.id === id);
}
