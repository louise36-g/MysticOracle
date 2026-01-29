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
  },
  {
    id: 'career',
    labelEn: 'Career & Work',
    labelFr: 'Carrière & Travail',
    taglineEn: 'Clarity on your professional path',
    taglineFr: 'Clarté sur votre parcours professionnel',
    iconName: 'Briefcase',
    colorClass: 'amber',
  },
  {
    id: 'money',
    labelEn: 'Money & Finances',
    labelFr: 'Argent & Finances',
    taglineEn: 'Understanding your relationship with prosperity',
    taglineFr: 'Comprendre votre relation avec la prospérité',
    iconName: 'Coins',
    colorClass: 'emerald',
  },
  {
    id: 'life_path',
    labelEn: 'Life Path & Direction',
    labelFr: 'Chemin de Vie & Direction',
    taglineEn: 'Navigate major crossroads and transitions',
    taglineFr: 'Naviguer les carrefours majeurs et les transitions',
    iconName: 'Compass',
    colorClass: 'indigo',
  },
  {
    id: 'family',
    labelEn: 'Family & Belonging',
    labelFr: 'Famille & Appartenance',
    taglineEn: 'Insight into bonds and belonging',
    taglineFr: 'Aperçu des liens et de l\'appartenance',
    iconName: 'Users',
    colorClass: 'teal',
  },
];

// Category-based questions (4 per category, introspective CNV-friendly phrasing)
export const CELTIC_CROSS_QUESTIONS: Record<CelticCrossCategory, CelticCrossQuestion[]> = {
  // Love & Relationships
  love: [
    {
      id: 'cc_love_1',
      textEn: 'What patterns in how I connect with others are asking for my attention?',
      textFr: 'Quels schémas dans ma façon de me connecter aux autres demandent mon attention?',
    },
    {
      id: 'cc_love_2',
      textEn: 'What do I need to understand about how I give and receive love?',
      textFr: 'Que dois-je comprendre sur ma façon de donner et recevoir l\'amour?',
    },
    {
      id: 'cc_love_3',
      textEn: 'What is my heart truly longing for in my relationships?',
      textFr: 'Qu\'est-ce que mon cœur désire vraiment dans mes relations?',
    },
    {
      id: 'cc_love_4',
      textEn: 'How can I create deeper intimacy while honouring my own needs?',
      textFr: 'Comment puis-je créer plus d\'intimité tout en honorant mes propres besoins?',
    },
  ],

  // Career & Work
  career: [
    {
      id: 'cc_career_1',
      textEn: 'What is my professional path revealing about my deeper purpose?',
      textFr: 'Que révèle mon parcours professionnel sur ma vocation plus profonde?',
    },
    {
      id: 'cc_career_2',
      textEn: 'What aspects of my work feel aligned with who I truly am?',
      textFr: 'Quels aspects de mon travail sont alignés avec qui je suis vraiment?',
    },
    {
      id: 'cc_career_3',
      textEn: 'What gifts and talents am I not yet fully expressing in my career?',
      textFr: 'Quels dons et talents n\'ai-je pas encore pleinement exprimés dans ma carrière?',
    },
    {
      id: 'cc_career_4',
      textEn: 'How can I find more meaning and fulfilment in my professional life?',
      textFr: 'Comment puis-je trouver plus de sens et d\'épanouissement dans ma vie professionnelle?',
    },
  ],

  // Money & Finances
  money: [
    {
      id: 'cc_money_1',
      textEn: 'What beliefs about money and abundance am I ready to examine?',
      textFr: 'Quelles croyances sur l\'argent et l\'abondance suis-je prêt(e) à examiner?',
    },
    {
      id: 'cc_money_2',
      textEn: 'What is my relationship with money trying to teach me?',
      textFr: 'Que ma relation avec l\'argent essaie-t-elle de m\'apprendre?',
    },
    {
      id: 'cc_money_3',
      textEn: 'Where in my life am I blocking the flow of prosperity?',
      textFr: 'Où dans ma vie est-ce que je bloque le flux de prospérité?',
    },
    {
      id: 'cc_money_4',
      textEn: 'How can I cultivate a healthier sense of security and abundance?',
      textFr: 'Comment puis-je cultiver un sentiment plus sain de sécurité et d\'abondance?',
    },
  ],

  // Life Path & Direction
  life_path: [
    {
      id: 'cc_path_1',
      textEn: 'What crossroads am I facing and what do I need to understand before choosing?',
      textFr: 'Quel carrefour est-ce que j\'affronte et que dois-je comprendre avant de choisir?',
    },
    {
      id: 'cc_path_2',
      textEn: 'What major transition is unfolding in my life and how can I navigate it with grace?',
      textFr: 'Quelle transition majeure se déroule dans ma vie et comment puis-je la traverser avec grâce?',
    },
    {
      id: 'cc_path_3',
      textEn: 'What is my soul calling me toward at this stage of my journey?',
      textFr: 'Vers quoi mon âme m\'appelle-t-elle à cette étape de mon voyage?',
    },
    {
      id: 'cc_path_4',
      textEn: 'How can I trust my inner guidance more fully as I move forward?',
      textFr: 'Comment puis-je faire plus confiance à ma guidance intérieure alors que j\'avance?',
    },
  ],

  // Family & Belonging
  family: [
    {
      id: 'cc_family_1',
      textEn: 'What dynamics within my family are asking for my understanding?',
      textFr: 'Quelles dynamiques au sein de ma famille demandent ma compréhension?',
    },
    {
      id: 'cc_family_2',
      textEn: 'What role have I played in my family that may no longer serve me?',
      textFr: 'Quel rôle ai-je joué dans ma famille qui ne me sert peut-être plus?',
    },
    {
      id: 'cc_family_3',
      textEn: 'Where do I find my sense of belonging and how can I nurture it?',
      textFr: 'Où est-ce que je trouve mon sentiment d\'appartenance et comment puis-je le nourrir?',
    },
    {
      id: 'cc_family_4',
      textEn: 'How can I honour my roots while becoming more fully myself?',
      textFr: 'Comment puis-je honorer mes racines tout en devenant plus pleinement moi-même?',
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
