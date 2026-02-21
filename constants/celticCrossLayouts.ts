// constants/celticCrossLayouts.ts

export type CelticCrossCategory =
  | 'general'
  | 'love'
  | 'career'
  | 'life_path'
  | 'growth';

export type CelticCrossLayoutId = 'celtic_cross';

export interface CelticCrossLayout {
  id: CelticCrossLayoutId;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  positions: {
    en: [string, string, string, string, string, string, string, string, string, string];
    fr: [string, string, string, string, string, string, string, string, string, string];
  };
}

export interface CelticCrossCategoryConfig {
  id: CelticCrossCategory;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  iconName: string;
  colorClass: string;
  layouts: CelticCrossLayoutId[];
  defaultLayout: CelticCrossLayoutId;
}

export interface CelticCrossQuestion {
  id: string;
  textEn: string;
  textFr: string;
}

// Single universal Celtic Cross layout
export const CELTIC_CROSS_LAYOUT: CelticCrossLayout = {
  id: 'celtic_cross',
  labelEn: 'Celtic Cross',
  labelFr: 'Croix Celtique',
  taglineEn: 'The most comprehensive spread for deep insight into complex situations. Ten cards reveal the full picture - past, present, future, and the forces at play.',
  taglineFr: 'Le tirage le plus complet pour une compréhension profonde des situations complexes. Dix cartes révèlent le tableau complet - passé, présent, futur et les forces en jeu.',
  positions: {
    en: [
      'The heart of the matter',
      "What's blocking you",
      "What's beneath (unconscious)",
      "What's behind (past)",
      "What's above (conscious goal)",
      "What's ahead (near future)",
      'How you see yourself',
      'How others see you',
      'What you need to know',
      'Where this leads',
    ],
    fr: [
      'Le cœur du sujet',
      'Ce qui vous bloque',
      'Ce qui est en dessous (inconscient)',
      'Ce qui est derrière (passé)',
      'Ce qui est au-dessus (objectif conscient)',
      'Ce qui est devant (futur proche)',
      'Comment vous vous voyez',
      'Comment les autres vous voient',
      'Ce que vous devez savoir',
      'Où cela mène',
    ],
  },
};

// Layout record for SpreadIntroSelector compatibility
export const CELTIC_CROSS_LAYOUTS: Record<CelticCrossLayoutId, CelticCrossLayout> = {
  celtic_cross: CELTIC_CROSS_LAYOUT,
};

// Category configurations
export const CELTIC_CROSS_CATEGORIES: CelticCrossCategoryConfig[] = [
  {
    id: 'love',
    labelEn: 'Love & Relationships',
    labelFr: 'Amour & Relations',
    taglineEn: 'Deep insight into matters of the heart',
    taglineFr: 'Compréhension profonde des affaires du cœur',
    iconName: 'Heart',
    colorClass: 'rose',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'career',
    labelEn: 'Career & Calling',
    labelFr: 'Carrière & Vocation',
    taglineEn: 'Clarity on your professional path',
    taglineFr: 'Clarté sur votre parcours professionnel',
    iconName: 'Briefcase',
    colorClass: 'amber',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'general',
    labelEn: 'General Guidance',
    labelFr: 'Guidance Générale',
    taglineEn: 'Deep insight on any topic',
    taglineFr: 'Éclairage profond sur tout sujet',
    iconName: 'MessageCircle',
    colorClass: 'purple',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'life_path',
    labelEn: 'Spiritual / Wellbeing',
    labelFr: 'Spirituel / Bien-être',
    taglineEn: 'Inner peace and soul purpose',
    taglineFr: 'Paix intérieure et mission de vie',
    iconName: 'Sun',
    colorClass: 'indigo',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'growth',
    labelEn: 'Personal Growth',
    labelFr: 'Développement Personnel',
    taglineEn: 'Deep exploration of your personal evolution',
    taglineFr: 'Exploration profonde de votre évolution personnelle',
    iconName: 'Sprout',
    colorClass: 'teal',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
];

// Category-based questions (3 per category)
export const CELTIC_CROSS_QUESTIONS: Record<CelticCrossCategory, CelticCrossQuestion[]> = {
  // Love & Relationships
  love: [
    {
      id: 'cc_love_1',
      textEn: 'What deeper story is unfolding in my love life right now?',
      textFr: 'Quelle histoire plus profonde se tisse dans ma vie amoureuse en ce moment ?',
    },
    {
      id: 'cc_love_2',
      textEn: 'What tender part of me is asking to be seen in my relationships?',
      textFr: 'Quelle part tendre de moi demande à être vue dans mes relations ?',
    },
    {
      id: 'cc_love_3',
      textEn: 'How can I honor both my needs and my partner\'s in a way that feels true?',
      textFr: 'Comment puis-je honorer mes besoins et ceux de l\'autre avec authenticité ?',
    },
  ],

  // Career & Calling
  career: [
    {
      id: 'cc_career_1',
      textEn: 'What is the full picture of my relationship with my work right now?',
      textFr: 'Quel est le tableau complet de ma relation avec mon travail en ce moment ?',
    },
    {
      id: 'cc_career_2',
      textEn: 'What deeper purpose is weaving itself through my career choices?',
      textFr: 'Quel dessein plus profond se tisse à travers mes choix de carrière ?',
    },
    {
      id: 'cc_career_3',
      textEn: 'How can I honor both my ambitions and my need for meaning?',
      textFr: 'Comment puis-je honorer à la fois mes ambitions et mon besoin de sens ?',
    },
  ],

  // General Guidance
  general: [
    {
      id: 'cc_general_1',
      textEn: 'What is the full picture of my current situation?',
      textFr: 'Quel est le tableau complet de ma situation actuelle ?',
    },
    {
      id: 'cc_general_2',
      textEn: 'What hidden forces are shaping my life right now?',
      textFr: 'Quelles forces cachées façonnent ma vie en ce moment ?',
    },
    {
      id: 'cc_general_3',
      textEn: 'What do I most need to understand about where I am and where I\'m heading?',
      textFr: 'Que dois-je comprendre sur là où j\'en suis et là où je me dirige ?',
    },
  ],

  // Life Path
  life_path: [
    {
      id: 'cc_path_1',
      textEn: 'What is the full story of this chapter of my life?',
      textFr: 'Quelle est l\'histoire complète de ce chapitre de ma vie ?',
    },
    {
      id: 'cc_path_2',
      textEn: 'What sacred pattern is woven through the choices I\'ve been making?',
      textFr: 'Quel motif sacré se tisse à travers les choix que j\'ai faits ?',
    },
    {
      id: 'cc_path_3',
      textEn: 'How can I walk my path with both courage and tenderness?',
      textFr: 'Comment puis-je marcher sur mon chemin avec à la fois du courage et de la douceur ?',
    },
  ],

  // Personal Growth
  growth: [
    {
      id: 'cc_growth_1',
      textEn: 'What is the full picture of my personal evolution right now?',
      textFr: 'Quel est le tableau complet de mon évolution personnelle en ce moment ?',
    },
    {
      id: 'cc_growth_2',
      textEn: 'What deep pattern is ready to be transformed within me?',
      textFr: 'Quel schéma profond est prêt à être transformé en moi ?',
    },
    {
      id: 'cc_growth_3',
      textEn: 'How can I honor both my vulnerabilities and my strengths as I grow?',
      textFr: 'Comment puis-je honorer à la fois mes vulnérabilités et mes forces dans ma croissance ?',
    },
  ],
};

// Empty layout-specific questions (Celtic Cross uses category-based questions instead)
export const CELTIC_CROSS_LAYOUT_QUESTIONS: Record<CelticCrossLayoutId, CelticCrossQuestion[]> = {
  celtic_cross: [],
};

// Helper text for custom questions
export const CELTIC_CROSS_CUSTOM_QUESTION_HELPER = {
  en: 'The Celtic Cross excels at complex, layered questions. Ask about situations with multiple factors, long-standing patterns, or when you need to see the full picture of past, present, and future influences.',
  fr: 'La Croix Celtique excelle pour les questions complexes et nuancées. Posez des questions sur des situations avec plusieurs facteurs, des schémas de longue date, ou quand vous avez besoin de voir le tableau complet des influences passées, présentes et futures.',
};

// Helper to get category config by id
export function getCelticCrossCategory(id: CelticCrossCategory): CelticCrossCategoryConfig | undefined {
  return CELTIC_CROSS_CATEGORIES.find((c) => c.id === id);
}

// Helper to get questions for a category
export function getCelticCrossQuestions(categoryId: CelticCrossCategory): CelticCrossQuestion[] {
  return CELTIC_CROSS_QUESTIONS[categoryId] || [];
}
