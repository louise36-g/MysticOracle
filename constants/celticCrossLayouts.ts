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
    labelEn: 'Career & Work',
    labelFr: 'Carrière & Travail',
    taglineEn: 'Clarity on your professional path',
    taglineFr: 'Clarté sur votre parcours professionnel',
    iconName: 'Briefcase',
    colorClass: 'amber',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'money',
    labelEn: 'Money & Finances',
    labelFr: 'Argent & Finances',
    taglineEn: 'Understanding your relationship with prosperity',
    taglineFr: 'Comprendre votre relation avec la prospérité',
    iconName: 'Coins',
    colorClass: 'emerald',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'life_path',
    labelEn: 'Life Path & Direction',
    labelFr: 'Chemin de Vie & Direction',
    taglineEn: 'Navigate major crossroads and transitions',
    taglineFr: 'Naviguer les carrefours majeurs et les transitions',
    iconName: 'Compass',
    colorClass: 'indigo',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
  {
    id: 'family',
    labelEn: 'Family & Belonging',
    labelFr: 'Famille & Appartenance',
    taglineEn: 'Insight into bonds and belonging',
    taglineFr: 'Aperçu des liens et de l\'appartenance',
    iconName: 'Users',
    colorClass: 'teal',
    layouts: ['celtic_cross'],
    defaultLayout: 'celtic_cross',
  },
];

// Category-based questions (4 per category)
export const CELTIC_CROSS_QUESTIONS: Record<CelticCrossCategory, CelticCrossQuestion[]> = {
  // Love & Relationships
  love: [
    {
      id: 'cc_love_1',
      textEn: 'What\'s the full story of my love life right now?',
      textFr: 'Quelle est l\'histoire complète de ma vie amoureuse en ce moment?',
    },
    {
      id: 'cc_love_2',
      textEn: 'Why do my relationships keep ending the same way?',
      textFr: 'Pourquoi mes relations finissent-elles toujours de la même façon?',
    },
    {
      id: 'cc_love_3',
      textEn: 'Is this relationship my forever or just for now?',
      textFr: 'Est-ce que cette relation est pour toujours ou juste pour maintenant?',
    },
    {
      id: 'cc_love_4',
      textEn: 'What\'s really going on between me and this person?',
      textFr: 'Que se passe-t-il vraiment entre moi et cette personne?',
    },
  ],

  // Career & Work
  career: [
    {
      id: 'cc_career_1',
      textEn: 'What does my career path look like from here?',
      textFr: 'À quoi ressemble mon parcours professionnel à partir d\'ici?',
    },
    {
      id: 'cc_career_2',
      textEn: 'Why can\'t I seem to get ahead at work?',
      textFr: 'Pourquoi n\'arrive-je pas à progresser au travail?',
    },
    {
      id: 'cc_career_3',
      textEn: 'Should I make a major career change?',
      textFr: 'Devrais-je faire un changement de carrière majeur?',
    },
    {
      id: 'cc_career_4',
      textEn: 'What\'s blocking my professional success?',
      textFr: 'Qu\'est-ce qui bloque ma réussite professionnelle?',
    },
  ],

  // Money & Finances
  money: [
    {
      id: 'cc_money_1',
      textEn: 'What\'s the full picture of my financial situation?',
      textFr: 'Quelle est l\'image complète de ma situation financière?',
    },
    {
      id: 'cc_money_2',
      textEn: 'Why do I always struggle with money?',
      textFr: 'Pourquoi est-ce que j\'ai toujours du mal avec l\'argent?',
    },
    {
      id: 'cc_money_3',
      textEn: 'Will my financial situation improve?',
      textFr: 'Est-ce que ma situation financière va s\'améliorer?',
    },
    {
      id: 'cc_money_4',
      textEn: 'What do I need to do to become financially stable?',
      textFr: 'Que dois-je faire pour devenir financièrement stable?',
    },
  ],

  // Life Path & Direction
  life_path: [
    {
      id: 'cc_path_1',
      textEn: 'Where is my life heading?',
      textFr: 'Où va ma vie?',
    },
    {
      id: 'cc_path_2',
      textEn: 'Am I making the right choices with my life?',
      textFr: 'Est-ce que je fais les bons choix dans ma vie?',
    },
    {
      id: 'cc_path_3',
      textEn: 'What\'s my purpose and how do I find it?',
      textFr: 'Quel est mon but et comment le trouver?',
    },
    {
      id: 'cc_path_4',
      textEn: 'What do the next few years have in store for me?',
      textFr: 'Que me réservent les prochaines années?',
    },
  ],

  // Family & Belonging
  family: [
    {
      id: 'cc_family_1',
      textEn: 'Will my family situation ever get better?',
      textFr: 'Est-ce que ma situation familiale va s\'améliorer un jour?',
    },
    {
      id: 'cc_family_2',
      textEn: 'What\'s really causing the tension in my family?',
      textFr: 'Qu\'est-ce qui cause vraiment la tension dans ma famille?',
    },
    {
      id: 'cc_family_3',
      textEn: 'How do I heal old wounds with my family?',
      textFr: 'Comment guérir les vieilles blessures avec ma famille?',
    },
    {
      id: 'cc_family_4',
      textEn: 'Am I repeating my parents\' mistakes?',
      textFr: 'Est-ce que je répète les erreurs de mes parents?',
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
