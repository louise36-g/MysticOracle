// constants/threeCardLayouts.ts

export type ThreeCardCategory = 'general' | 'love' | 'career' | 'decision' | 'healing';

export type ThreeCardLayoutId =
  | 'past_present_future'
  | 'you_them_connection'
  | 'situation_action_outcome'
  | 'option_a_b_guidance'
  | 'situation_obstacle_path'
  | 'mind_body_spirit'
  | 'challenge_support_growth';

export interface ThreeCardLayout {
  id: ThreeCardLayoutId;
  labelEn: string;
  labelFr: string;
  positions: {
    en: [string, string, string];
    fr: [string, string, string];
  };
}

export interface ThreeCardCategoryConfig {
  id: ThreeCardCategory;
  labelEn: string;
  labelFr: string;
  iconName: string;
  layouts: ThreeCardLayoutId[];
  defaultLayout: ThreeCardLayoutId;
}

export interface ThreeCardQuestion {
  id: string;
  textEn: string;
  textFr: string;
}

// Layout definitions
export const THREE_CARD_LAYOUTS: Record<ThreeCardLayoutId, ThreeCardLayout> = {
  past_present_future: {
    id: 'past_present_future',
    labelEn: 'Past → Present → Future',
    labelFr: 'Passé → Présent → Futur',
    positions: {
      en: ['Past', 'Present', 'Future'],
      fr: ['Passé', 'Présent', 'Futur'],
    },
  },
  you_them_connection: {
    id: 'you_them_connection',
    labelEn: 'You → Them → Connection',
    labelFr: 'Vous → Eux → Connexion',
    positions: {
      en: ['You', 'Them', 'The Connection'],
      fr: ['Vous', 'Eux', 'La Connexion'],
    },
  },
  situation_action_outcome: {
    id: 'situation_action_outcome',
    labelEn: 'Situation → Action → Outcome',
    labelFr: 'Situation → Action → Résultat',
    positions: {
      en: ['Situation', 'Action', 'Outcome'],
      fr: ['Situation', 'Action', 'Résultat'],
    },
  },
  option_a_b_guidance: {
    id: 'option_a_b_guidance',
    labelEn: 'Option A → Option B → Guidance',
    labelFr: 'Option A → Option B → Conseil',
    positions: {
      en: ['Option A', 'Option B', 'Guidance'],
      fr: ['Option A', 'Option B', 'Conseil'],
    },
  },
  situation_obstacle_path: {
    id: 'situation_obstacle_path',
    labelEn: 'Situation → Obstacle → Path Forward',
    labelFr: 'Situation → Obstacle → Voie à Suivre',
    positions: {
      en: ['Situation', 'Obstacle', 'Path Forward'],
      fr: ['Situation', 'Obstacle', 'Voie à Suivre'],
    },
  },
  mind_body_spirit: {
    id: 'mind_body_spirit',
    labelEn: 'Mind → Body → Spirit',
    labelFr: 'Esprit → Corps → Âme',
    positions: {
      en: ['Mind', 'Body', 'Spirit'],
      fr: ['Esprit', 'Corps', 'Âme'],
    },
  },
  challenge_support_growth: {
    id: 'challenge_support_growth',
    labelEn: 'Challenge → Support → Growth',
    labelFr: 'Défi → Soutien → Croissance',
    positions: {
      en: ['Challenge', 'Support', 'Growth'],
      fr: ['Défi', 'Soutien', 'Croissance'],
    },
  },
};

// Category configurations
export const THREE_CARD_CATEGORIES: ThreeCardCategoryConfig[] = [
  {
    id: 'general',
    labelEn: 'General Guidance',
    labelFr: 'Guidance Générale',
    iconName: 'Sparkles',
    layouts: ['past_present_future'],
    defaultLayout: 'past_present_future',
  },
  {
    id: 'love',
    labelEn: 'Love & Relationships',
    labelFr: 'Amour & Relations',
    iconName: 'Heart',
    layouts: ['you_them_connection'],
    defaultLayout: 'you_them_connection',
  },
  {
    id: 'career',
    labelEn: 'Career & Purpose',
    labelFr: 'Carrière & Vocation',
    iconName: 'Briefcase',
    layouts: ['situation_action_outcome'],
    defaultLayout: 'situation_action_outcome',
  },
  {
    id: 'decision',
    labelEn: 'Decision-Making',
    labelFr: 'Prise de Décision',
    iconName: 'Scale',
    layouts: ['option_a_b_guidance', 'situation_obstacle_path'],
    defaultLayout: 'option_a_b_guidance',
  },
  {
    id: 'healing',
    labelEn: 'Healing & Growth',
    labelFr: 'Guérison & Croissance',
    iconName: 'Leaf',
    layouts: ['mind_body_spirit', 'challenge_support_growth'],
    defaultLayout: 'mind_body_spirit',
  },
];

// Questions per category (same questions work for all layouts within a category)
export const THREE_CARD_QUESTIONS: Record<ThreeCardCategory, ThreeCardQuestion[]> = {
  general: [
    { id: '3gen1', textEn: 'What do I most need to understand about this situation right now?', textFr: 'Que dois-je comprendre de cette situation en ce moment?' },
    { id: '3gen2', textEn: 'What energy is surrounding this issue?', textFr: 'Quelle énergie entoure cette situation?' },
    { id: '3gen3', textEn: 'What is being asked of me at this time?', textFr: "Qu'est-ce qui m'est demandé en ce moment?" },
    { id: '3gen4', textEn: 'What am I not seeing clearly?', textFr: 'Que ne vois-je pas clairement?' },
    { id: '3gen5', textEn: 'What would support my highest good in this situation?', textFr: "Qu'est-ce qui soutiendrait mon plus grand bien dans cette situation?" },
  ],
  love: [
    { id: '3love1', textEn: 'What is the deeper dynamic between me and this person?', textFr: 'Quelle est la dynamique profonde entre cette personne et moi?' },
    { id: '3love2', textEn: 'What can I learn from this connection?', textFr: 'Que puis-je apprendre de cette connexion?' },
    { id: '3love3', textEn: 'What role do I play in the current state of this relationship?', textFr: "Quel rôle je joue dans l'état actuel de cette relation?" },
    { id: '3love4', textEn: 'What would help me move forward in a healthy way?', textFr: "Qu'est-ce qui m'aiderait à avancer sainement?" },
    { id: '3love5', textEn: 'What is this relationship teaching me about myself?', textFr: "Que m'apprend cette relation sur moi-même?" },
  ],
  career: [
    { id: '3car1', textEn: 'What direction is most aligned with me right now?', textFr: 'Quelle direction est la plus alignée avec moi en ce moment?' },
    { id: '3car2', textEn: 'What strengths should I be leaning into at work?', textFr: "Sur quelles forces devrais-je m'appuyer au travail?" },
    { id: '3car3', textEn: 'What is blocking my progress, and how can I address it?', textFr: "Qu'est-ce qui bloque ma progression et comment y remédier?" },
    { id: '3car4', textEn: 'What opportunities am I overlooking?', textFr: 'Quelles opportunités est-ce que je néglige?' },
    { id: '3car5', textEn: 'What would success look like for me in this phase of my career?', textFr: 'À quoi ressemblerait le succès dans cette phase de ma carrière?' },
  ],
  decision: [
    { id: '3dec1', textEn: 'What are the key factors I should consider before deciding?', textFr: 'Quels sont les facteurs clés à considérer avant de décider?' },
    { id: '3dec2', textEn: 'What is the potential outcome if I choose this path?', textFr: 'Quel est le résultat potentiel si je choisis cette voie?' },
    { id: '3dec3', textEn: 'What fears or beliefs are influencing my choice?', textFr: 'Quelles peurs ou croyances influencent mon choix?' },
    { id: '3dec4', textEn: 'What would help me feel more confident in my decision?', textFr: "Qu'est-ce qui m'aiderait à me sentir plus confiant dans ma décision?" },
    { id: '3dec5', textEn: 'What is the long-term lesson connected to this choice?', textFr: 'Quelle est la leçon à long terme liée à ce choix?' },
  ],
  healing: [
    { id: '3heal1', textEn: 'What needs healing or attention within me right now?', textFr: "Qu'est-ce qui a besoin de guérison ou d'attention en moi maintenant?" },
    { id: '3heal2', textEn: 'What pattern am I being asked to release?', textFr: 'Quel schéma suis-je invité à libérer?' },
    { id: '3heal3', textEn: 'What would help me feel more balanced and grounded?', textFr: "Qu'est-ce qui m'aiderait à me sentir plus équilibré et ancré?" },
    { id: '3heal4', textEn: 'What inner strength can I draw on?', textFr: "Sur quelle force intérieure puis-je m'appuyer?" },
    { id: '3heal5', textEn: 'How can I best support my own growth at this time?', textFr: 'Comment puis-je soutenir ma propre croissance en ce moment?' },
  ],
};

// Helper text for custom questions
export const THREE_CARD_CUSTOM_QUESTION_HELPER = {
  en: 'Open-ended questions work best. Try "What can I learn from..." or "What do I need to understand about..."',
  fr: 'Les questions ouvertes fonctionnent mieux. Essayez "Que puis-je apprendre de..." ou "Que dois-je comprendre de..."',
};

// Helper to get category config by id
export function getThreeCardCategory(id: ThreeCardCategory): ThreeCardCategoryConfig | undefined {
  return THREE_CARD_CATEGORIES.find(c => c.id === id);
}

// Helper to check if category has multiple layouts
export function categoryHasMultipleLayouts(categoryId: ThreeCardCategory): boolean {
  const category = getThreeCardCategory(categoryId);
  return category ? category.layouts.length > 1 : false;
}
