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
    taglineEn: 'Your message for today.',
    taglineFr: "Votre message pour aujourd'hui.",
    positions: {
      en: ['The energy and guidance for your day'],
      fr: ["L'énergie et les conseils pour votre journée"],
    },
  },
  hearts_message: {
    id: 'hearts_message',
    labelEn: "Heart's Message",
    labelFr: 'Message du Coeur',
    taglineEn: 'What your heart needs to know.',
    taglineFr: 'Ce que votre coeur doit savoir.',
    positions: {
      en: ['What your heart is trying to tell you'],
      fr: ['Ce que votre coeur essaie de vous dire'],
    },
  },
  professional_insight: {
    id: 'professional_insight',
    labelEn: 'Professional Insight',
    labelFr: 'Vision Professionnelle',
    taglineEn: 'Guidance for your work.',
    taglineFr: 'Des conseils pour votre travail.',
    positions: {
      en: ['The insight you need for your career'],
      fr: ["L'éclairage dont vous avez besoin pour votre carrière"],
    },
  },
  clarity_card: {
    id: 'clarity_card',
    labelEn: 'Clarity Card',
    labelFr: 'Carte de Clarté',
    taglineEn: 'Light on your choice.',
    taglineFr: 'Lumière sur votre choix.',
    positions: {
      en: ['What you need to see clearly about this decision'],
      fr: ['Ce que vous devez voir clairement concernant cette décision'],
    },
  },
  mirror_card: {
    id: 'mirror_card',
    labelEn: 'Mirror Card',
    labelFr: 'Carte Miroir',
    taglineEn: 'Reflect on what lies within.',
    taglineFr: "Réfléchissez à ce qui se trouve à l'intérieur.",
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
    { id: '1dg1', textEn: 'What energy should I embrace today?', textFr: "Quelle énergie devrais-je accueillir aujourd'hui?" },
    { id: '1dg2', textEn: 'What do I need to be aware of today?', textFr: "De quoi dois-je être conscient(e) aujourd'hui?" },
    { id: '1dg3', textEn: 'What opportunity awaits me today?', textFr: "Quelle opportunité m'attend aujourd'hui?" },
  ],
  love: [
    { id: '1lv1', textEn: 'What does my heart need to hear right now?', textFr: 'Que mon coeur a-t-il besoin d\'entendre en ce moment?' },
    { id: '1lv2', textEn: 'What is the current energy around my love life?', textFr: "Quelle est l'énergie actuelle autour de ma vie amoureuse?" },
    { id: '1lv3', textEn: 'What should I focus on in my relationships?', textFr: 'Sur quoi devrais-je me concentrer dans mes relations?' },
  ],
  career: [
    { id: '1cr1', textEn: 'What insight do I need for my work today?', textFr: "De quel éclairage ai-je besoin pour mon travail aujourd'hui?" },
    { id: '1cr2', textEn: 'What strength should I lean into professionally?', textFr: 'Sur quelle force devrais-je m\'appuyer professionnellement?' },
    { id: '1cr3', textEn: 'What is the energy around my career right now?', textFr: "Quelle est l'énergie autour de ma carrière en ce moment?" },
  ],
  decision: [
    { id: '1dc1', textEn: 'What do I need to see clearly about this choice?', textFr: 'Que dois-je voir clairement concernant ce choix?' },
    { id: '1dc2', textEn: 'What factor am I overlooking in this decision?', textFr: 'Quel facteur est-ce que je néglige dans cette décision?' },
    { id: '1dc3', textEn: 'What wisdom can guide my decision?', textFr: 'Quelle sagesse peut guider ma décision?' },
  ],
  self_reflection: [
    { id: '1sr1', textEn: 'What aspect of myself needs attention right now?', textFr: "Quel aspect de moi-même a besoin d'attention en ce moment?" },
    { id: '1sr2', textEn: 'What is my inner self trying to show me?', textFr: "Que mon moi intérieur essaie-t-il de me montrer?" },
    { id: '1sr3', textEn: 'What truth am I ready to see within myself?', textFr: 'Quelle vérité suis-je prêt(e) à voir en moi?' },
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
