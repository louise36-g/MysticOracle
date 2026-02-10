// constants/celticCrossLayouts.ts

export type CelticCrossCategory =
  | 'love'
  | 'career'
  | 'money'
  | 'life_path'
  | 'family';

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
    id: 'money',
    labelEn: 'Wealth & Alignment',
    labelFr: 'Richesse & Alignement',
    taglineEn: 'Understanding your relationship with prosperity',
    taglineFr: 'Comprendre votre relation avec la prospérité',
    iconName: 'Coins',
    colorClass: 'emerald',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'life_path',
    labelEn: 'Life Path',
    labelFr: 'Chemin de Vie',
    taglineEn: 'Navigate major crossroads and transitions',
    taglineFr: 'Naviguer les carrefours majeurs et les transitions',
    iconName: 'Compass',
    colorClass: 'indigo',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'family',
    labelEn: 'Hearth & Home',
    labelFr: 'Foyer & Cocon',
    taglineEn: 'Insight into bonds and belonging',
    taglineFr: 'Aperçu des liens et de l\'appartenance',
    iconName: 'Users',
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

  // Wealth & Alignment
  money: [
    {
      id: 'cc_money_1',
      textEn: 'What is the full landscape of my relationship with abundance?',
      textFr: 'Quel est le paysage complet de ma relation avec l\'abondance ?',
    },
    {
      id: 'cc_money_2',
      textEn: 'What deep roots are feeding — or blocking — my sense of prosperity?',
      textFr: 'Quelles racines profondes nourrissent — ou bloquent — mon sentiment de prospérité ?',
    },
    {
      id: 'cc_money_3',
      textEn: 'How can I align my values with the way wealth flows through my life?',
      textFr: 'Comment puis-je aligner mes valeurs avec la façon dont la richesse circule dans ma vie ?',
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

  // Hearth & Home
  family: [
    {
      id: 'cc_family_1',
      textEn: 'What is the full picture of the energy within my home and family?',
      textFr: 'Quel est le tableau complet de l\'énergie au sein de mon foyer et de ma famille ?',
    },
    {
      id: 'cc_family_2',
      textEn: 'What generational gift — or wound — is asking for my attention?',
      textFr: 'Quel cadeau — ou quelle blessure — générationnel(le) demande mon attention ?',
    },
    {
      id: 'cc_family_3',
      textEn: 'How can I honor where I come from while building where I\'m going?',
      textFr: 'Comment puis-je honorer d\'où je viens tout en construisant là où je vais ?',
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
