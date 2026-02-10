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
  taglineEn: string;
  taglineFr: string;
  positions: {
    en: [string, string, string];
    fr: [string, string, string];
  };
  /** Short position names for compact display */
  shortPositions: {
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
    taglineEn: 'Understand how past experiences shape your current situation and glimpse where things are heading. Ideal when you feel stuck or need perspective.',
    taglineFr: 'Comprenez comment les expériences passées façonnent votre situation actuelle et entrevoyez où les choses se dirigent. Idéal quand vous vous sentez bloqué.',
    positions: {
      en: ['Past', 'Present', 'Future'],
      fr: ['Passé', 'Présent', 'Futur'],
    },
    shortPositions: {
      en: ['Past', 'Present', 'Future'],
      fr: ['Passé', 'Présent', 'Futur'],
    },
  },
  you_them_connection: {
    id: 'you_them_connection',
    labelEn: 'You → Them → Connection',
    labelFr: 'Vous → Eux → Connexion',
    taglineEn: 'See both sides of a relationship clearly. Reveals your energy, theirs, and what exists between you—helpful for any connection you want to understand better.',
    taglineFr: 'Voyez clairement les deux côtés d\'une relation. Révèle votre énergie, la leur, et ce qui existe entre vous.',
    positions: {
      en: ['You', 'Them', 'The Connection'],
      fr: ['Vous', 'Eux', 'La Connexion'],
    },
    shortPositions: {
      en: ['You', 'Them', 'Bond'],
      fr: ['Vous', 'Eux', 'Lien'],
    },
  },
  situation_action_outcome: {
    id: 'situation_action_outcome',
    labelEn: 'Situation → Action → Outcome',
    labelFr: 'Situation → Action → Résultat',
    taglineEn: 'Get practical guidance on what to do next. Shows where you stand, the best action to take, and the likely result—perfect for work decisions.',
    taglineFr: 'Obtenez des conseils pratiques sur la marche à suivre. Montre où vous en êtes, la meilleure action, et le résultat probable.',
    positions: {
      en: ['Situation', 'Action', 'Outcome'],
      fr: ['Situation', 'Action', 'Résultat'],
    },
    shortPositions: {
      en: ['Now', 'Action', 'Result'],
      fr: ['Actuel', 'Action', 'Résultat'],
    },
  },
  option_a_b_guidance: {
    id: 'option_a_b_guidance',
    labelEn: 'Option A → Option B → Guidance',
    labelFr: 'Option A → Option B → Conseil',
    taglineEn: 'Torn between two paths? Compare the energy of each option and receive guidance on what matters most in making this choice.',
    taglineFr: 'Tiraillé entre deux voies? Comparez l\'énergie de chaque option et recevez des conseils sur ce qui compte le plus.',
    positions: {
      en: ['Option A', 'Option B', 'Guidance'],
      fr: ['Option A', 'Option B', 'Conseil'],
    },
    shortPositions: {
      en: ['Path A', 'Path B', 'Advice'],
      fr: ['Voie A', 'Voie B', 'Conseil'],
    },
  },
  situation_obstacle_path: {
    id: 'situation_obstacle_path',
    labelEn: 'Situation → Obstacle → Path Forward',
    labelFr: 'Situation → Obstacle → Voie à Suivre',
    taglineEn: 'Identify what\'s blocking your progress and discover how to move past it. Helpful when you know something\'s in the way but can\'t name it.',
    taglineFr: 'Identifiez ce qui bloque votre progression et découvrez comment le surmonter. Utile quand quelque chose vous retient.',
    positions: {
      en: ['Situation', 'Obstacle', 'Path Forward'],
      fr: ['Situation', 'Obstacle', 'Voie à Suivre'],
    },
    shortPositions: {
      en: ['Now', 'Block', 'Forward'],
      fr: ['Actuel', 'Blocage', 'Issue'],
    },
  },
  mind_body_spirit: {
    id: 'mind_body_spirit',
    labelEn: 'Mind → Body → Spirit',
    labelFr: 'Esprit → Corps → Âme',
    taglineEn: 'A holistic check-in across all dimensions of your wellbeing. Reveals where you\'re thriving and what needs more attention or care.',
    taglineFr: 'Un bilan holistique de toutes les dimensions de votre bien-être. Révèle où vous prospérez et ce qui a besoin d\'attention.',
    positions: {
      en: ['Mind', 'Body', 'Spirit'],
      fr: ['Esprit', 'Corps', 'Âme'],
    },
    shortPositions: {
      en: ['Mind', 'Body', 'Spirit'],
      fr: ['Esprit', 'Corps', 'Âme'],
    },
  },
  challenge_support_growth: {
    id: 'challenge_support_growth',
    labelEn: 'Challenge → Support → Growth',
    labelFr: 'Défi → Soutien → Croissance',
    taglineEn: 'Navigate difficult times with clarity. Understand the challenge you\'re facing, where to find support, and how this experience helps you grow.',
    taglineFr: 'Naviguez les moments difficiles avec clarté. Comprenez le défi, où trouver du soutien, et comment cette expérience vous fait grandir.',
    positions: {
      en: ['Challenge', 'Support', 'Growth'],
      fr: ['Défi', 'Soutien', 'Croissance'],
    },
    shortPositions: {
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
    { id: '3gen1', textEn: 'What do I need to know about my current situation?', textFr: 'Que dois-je savoir sur ma situation actuelle ?' },
    { id: '3gen2', textEn: 'What am I missing that I need to see?', textFr: 'Qu\'est-ce qui m\'échappe que je dois voir ?' },
    { id: '3gen3', textEn: 'How did I get here, and where am I going?', textFr: 'Comment en suis-je arrivé(e) là, et où vais-je ?' },
    { id: '3gen4', textEn: 'What do I need to let go of to move forward?', textFr: 'De quoi dois-je me libérer pour avancer ?' },
    { id: '3gen5', textEn: 'What should I do next?', textFr: 'Que devrais-je faire ensuite ?' },
  ],
  love: [
    { id: '3love1', textEn: 'Does this person have real feelings for me?', textFr: 'Cette personne a-t-elle de vrais sentiments pour moi ?' },
    { id: '3love2', textEn: 'Why do my relationships always end the same way?', textFr: 'Pourquoi mes relations finissent-elles toujours de la même façon ?' },
    { id: '3love3', textEn: 'Should I give them another chance?', textFr: 'Devrais-je leur donner une autre chance ?' },
    { id: '3love4', textEn: 'What\'s really going on between us?', textFr: 'Que se passe-t-il vraiment entre nous ?' },
    { id: '3love5', textEn: 'Why can\'t I get over my ex?', textFr: 'Pourquoi n\'arrive-je pas à oublier mon ex ?' },
  ],
  career: [
    { id: '3car1', textEn: 'Should I stay in my current job or look for something new?', textFr: 'Devrais-je rester dans mon emploi actuel ou chercher autre chose ?' },
    { id: '3car2', textEn: 'Why am I not getting promoted?', textFr: 'Pourquoi est-ce que je n\'obtiens pas de promotion ?' },
    { id: '3car3', textEn: 'Is this the right career for me?', textFr: 'Est-ce la bonne carrière pour moi ?' },
    { id: '3car4', textEn: 'What\'s stopping me from reaching my goals?', textFr: 'Qu\'est-ce qui m\'empêche d\'atteindre mes objectifs ?' },
    { id: '3car5', textEn: 'Should I start my own business?', textFr: 'Devrais-je créer ma propre entreprise ?' },
  ],
  decision: [
    { id: '3dec1', textEn: 'Which option is truly best for me?', textFr: 'Quelle option est vraiment la meilleure pour moi ?' },
    { id: '3dec2', textEn: 'What will happen if I choose path A vs path B?', textFr: 'Que se passera-t-il si je choisis la voie A ou la voie B ?' },
    { id: '3dec3', textEn: 'Am I making this decision for the right reasons?', textFr: 'Est-ce que je prends cette décision pour les bonnes raisons ?' },
    { id: '3dec4', textEn: 'What am I afraid of that\'s making this so hard?', textFr: 'De quoi ai-je peur qui rend cela si difficile ?' },
    { id: '3dec5', textEn: 'What will I regret if I don\'t act now?', textFr: 'Qu\'est-ce que je regretterai si je n\'agis pas maintenant ?' },
  ],
  healing: [
    { id: '3heal1', textEn: 'Why do I keep feeling this way?', textFr: 'Pourquoi est-ce que je continue à me sentir ainsi ?' },
    { id: '3heal2', textEn: 'How do I start healing from this?', textFr: 'Comment puis-je commencer à guérir de cela ?' },
    { id: '3heal3', textEn: 'What do I need to forgive myself for?', textFr: 'Que dois-je me pardonner ?' },
    { id: '3heal4', textEn: 'Why do I feel so drained all the time?', textFr: 'Pourquoi est-ce que je me sens si épuisé(e) tout le temps ?' },
    { id: '3heal5', textEn: 'What do I need to feel whole again?', textFr: 'De quoi ai-je besoin pour me sentir à nouveau entier/entière ?' },
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
