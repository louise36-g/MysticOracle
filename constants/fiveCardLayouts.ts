// constants/fiveCardLayouts.ts

export type FiveCardCategory =
  | 'self_awareness'
  | 'gentle_healing'
  | 'know_yourself'
  | 'personal_growth'
  | 'relationships_career';

export type FiveCardLayoutId =
  | 'iceberg'
  | 'mirror'
  | 'inner_child'
  | 'safe_space'
  | 'authentic_self'
  | 'values'
  | 'alchemy'
  | 'seasons'
  | 'love_relationships'
  | 'career_purpose';

export interface FiveCardLayout {
  id: FiveCardLayoutId;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  positions: {
    en: [string, string, string, string, string];
    fr: [string, string, string, string, string];
  };
  /** Short position names for compact display */
  shortPositions: {
    en: [string, string, string, string, string];
    fr: [string, string, string, string, string];
  };
}

export interface FiveCardCategoryConfig {
  id: FiveCardCategory;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  iconName: string;
  colorClass: string;
  layouts: FiveCardLayoutId[];
  defaultLayout: FiveCardLayoutId;
}

export interface FiveCardQuestion {
  id: string;
  textEn: string;
  textFr: string;
}

// Layout definitions (all 10 layouts)
export const FIVE_CARD_LAYOUTS: Record<FiveCardLayoutId, FiveCardLayout> = {
  // Self-Awareness layouts
  iceberg: {
    id: 'iceberg',
    labelEn: 'The Iceberg',
    labelFr: "L'Iceberg",
    taglineEn: 'Explore what lies beneath recurring patterns or reactions. This layout helps you understand not just what you show the world, but the deeper roots and how to integrate them.',
    taglineFr: 'Explorez ce qui se cache sous vos schémas récurrents. Ce tirage vous aide à comprendre ce que vous montrez au monde, les racines profondes, et comment les intégrer.',
    positions: {
      en: ["What's visible", "What's beneath", 'Root cause', 'How it serves you', 'Path to integration'],
      fr: ['Ce qui est visible', 'Ce qui est caché', 'Cause profonde', 'Comment cela vous sert', "Chemin vers l'intégration"],
    },
    shortPositions: {
      en: ['Surface', 'Beneath', 'Root', 'Purpose', 'Integration'],
      fr: ['Surface', 'Caché', 'Racine', 'But', 'Intégration'],
    },
  },
  mirror: {
    id: 'mirror',
    labelEn: 'The Mirror',
    labelFr: 'Le Miroir',
    taglineEn: 'Bridge the gap between self-perception and reality. Reveals blind spots and invites self-acceptance by showing how you see yourself versus how others experience you.',
    taglineFr: 'Comblez l\'écart entre perception de soi et réalité. Révèle les angles morts et invite à l\'acceptation en montrant comment vous vous voyez versus comment les autres vous perçoivent.',
    positions: {
      en: ['How you see yourself', 'How others see you', 'What you refuse to see', 'The truth beneath', 'Acceptance message'],
      fr: ['Comment vous vous voyez', 'Comment les autres vous voient', 'Ce que vous refusez de voir', 'La vérité profonde', "Message d'acceptation"],
    },
    shortPositions: {
      en: ['Self-view', 'Others see', 'Blind spot', 'Truth', 'Accept'],
      fr: ['Ma vision', 'Leur vision', 'Angle mort', 'Vérité', 'Accepter'],
    },
  },
  // Gentle Healing layouts
  inner_child: {
    id: 'inner_child',
    labelEn: 'Inner Child',
    labelFr: 'Enfant Intérieur',
    taglineEn: 'Reconnect with your inner child—the part of you that still needs care. This gentle layout helps you understand old wounds, meet unmet needs, and discover the gifts your inner child holds.',
    taglineFr: 'Reconnectez-vous avec votre enfant intérieur—la partie de vous qui a encore besoin de soin. Ce tirage doux aide à comprendre les anciennes blessures et découvrir les cadeaux qu\'il porte.',
    positions: {
      en: ['Your inner child now', 'What they need', 'What wounded them', 'How to nurture them', 'The gift they hold'],
      fr: ['Votre enfant intérieur', 'Ce dont il a besoin', "Ce qui l'a blessé", 'Comment le nourrir', "Le cadeau qu'il porte"],
    },
    shortPositions: {
      en: ['Now', 'Needs', 'Wounds', 'Healing', 'Gift'],
      fr: ['Actuel', 'Besoins', 'Blessures', 'Soin', 'Cadeau'],
    },
  },
  safe_space: {
    id: 'safe_space',
    labelEn: 'Safe Space',
    labelFr: 'Espace Sécurisant',
    taglineEn: 'Build a foundation of inner security. Helpful when you feel anxious or ungrounded, this layout identifies what threatens your sense of safety and how to cultivate protection from within.',
    taglineFr: 'Construisez une fondation de sécurité intérieure. Utile quand vous vous sentez anxieux ou déstabilisé, ce tirage identifie ce qui menace votre sécurité et comment cultiver la protection intérieure.',
    positions: {
      en: ['Where you feel unsafe', 'What safety means to you', 'What blocks safety', 'Creating internal safety', 'Your protector energy'],
      fr: ['Où vous vous sentez vulnérable', 'Ce que la sécurité signifie', 'Ce qui bloque la sécurité', 'Créer la sécurité intérieure', 'Votre énergie protectrice'],
    },
    shortPositions: {
      en: ['Unsafe', 'Safety', 'Blocks', 'Create', 'Protect'],
      fr: ['Vulnérable', 'Sécurité', 'Blocages', 'Créer', 'Protéger'],
    },
  },
  // Know Yourself layouts
  authentic_self: {
    id: 'authentic_self',
    labelEn: 'Authentic Self',
    labelFr: 'Moi Authentique',
    taglineEn: 'Peel back the layers of conditioning to find your true self. This layout reveals the masks you wear, the fears that keep them in place, and how to step into who you really are.',
    taglineFr: 'Décollez les couches de conditionnement pour trouver votre vrai moi. Ce tirage révèle les masques que vous portez, les peurs qui les maintiennent, et comment devenir qui vous êtes vraiment.',
    positions: {
      en: ['Who you were taught to be', 'Who you pretend to be', 'Who you fear being', 'Who you truly are', 'How to embody your truth'],
      fr: ["Qui on vous a appris à être", 'Qui vous prétendez être', "Qui vous craignez d'être", 'Qui vous êtes vraiment', 'Comment incarner votre vérité'],
    },
    shortPositions: {
      en: ['Taught', 'Mask', 'Fear', 'True', 'Embody'],
      fr: ['Appris', 'Masque', 'Peur', 'Vrai', 'Incarner'],
    },
  },
  values: {
    id: 'values',
    labelEn: 'Values',
    labelFr: 'Valeurs',
    taglineEn: 'Check if your life reflects what truly matters to you. This layout reveals gaps between what you believe and how you live, and guides you toward greater alignment.',
    taglineFr: 'Vérifiez si votre vie reflète ce qui compte vraiment pour vous. Ce tirage révèle les écarts entre ce que vous croyez et comment vous vivez, et vous guide vers plus d\'alignement.',
    positions: {
      en: ['What you say you value', 'What your actions reveal', 'A value abandoned', 'A value calling you', 'Alignment message'],
      fr: ['Ce que vous dites valoriser', 'Ce que vos actions révèlent', 'Une valeur abandonnée', 'Une valeur qui vous appelle', "Message d'alignement"],
    },
    shortPositions: {
      en: ['Stated', 'Actions', 'Lost', 'Calling', 'Align'],
      fr: ['Dit', 'Actes', 'Perdu', 'Appel', 'Aligner'],
    },
  },
  // Personal Growth layouts
  alchemy: {
    id: 'alchemy',
    labelEn: 'The Alchemy',
    labelFr: "L'Alchimie",
    taglineEn: 'Transform struggle into strength. When facing difficulties, this layout shows where you\'re starting, the challenge pushing growth, and the gold emerging from your experience.',
    taglineFr: 'Transformez les difficultés en force. Face aux épreuves, ce tirage montre où vous en êtes, le défi qui pousse la croissance, et l\'or qui émerge de votre expérience.',
    positions: {
      en: ['Lead (your starting point)', 'Fire (the challenge pushing growth)', 'Crucible (what holds transformation)', 'Gold (your highest potential)', 'Stone (your unique gift)'],
      fr: ['Plomb (votre point de départ)', 'Feu (le défi qui pousse)', 'Creuset (ce qui contient)', 'Or (votre potentiel)', 'Pierre (votre don unique)'],
    },
    shortPositions: {
      en: ['Lead (Base)', 'Fire (Challenge)', 'Crucible (Transform)', 'Gold (Potential)', 'Stone (Gift)'],
      fr: ['Plomb (Base)', 'Feu (Défi)', 'Creuset (Transform.)', 'Or (Potentiel)', 'Pierre (Don)'],
    },
  },
  seasons: {
    id: 'seasons',
    labelEn: 'The Seasons',
    labelFr: 'Les Saisons',
    taglineEn: 'Work with life\'s natural rhythms rather than against them. This layout reveals what\'s ending, resting, emerging, and flourishing in your life right now.',
    taglineFr: 'Travaillez avec les rythmes naturels de la vie plutôt que contre eux. Ce tirage révèle ce qui se termine, se repose, émerge et s\'épanouit dans votre vie actuellement.',
    positions: {
      en: ['What needs to die (autumn)', 'What needs rest (winter)', 'Ready to sprout (spring)', 'Ready to bloom (summer)', "The cycle's wisdom"],
      fr: ['Ce qui doit mourir (automne)', 'Ce qui a besoin de repos (hiver)', 'Prêt à germer (printemps)', 'Prêt à fleurir (été)', 'La sagesse du cycle'],
    },
    shortPositions: {
      en: ['Autumn', 'Winter', 'Spring', 'Summer', 'Wisdom'],
      fr: ['Automne', 'Hiver', 'Printemps', 'Été', 'Sagesse'],
    },
  },
  // Relationships and Career layouts
  love_relationships: {
    id: 'love_relationships',
    labelEn: 'Love & Relationships',
    labelFr: 'Amour & Relations',
    taglineEn: 'Gain deeper insight into a relationship that matters to you. See both perspectives, understand the connection\'s energy, identify challenges, and explore its potential.',
    taglineFr: 'Obtenez une vision plus profonde d\'une relation qui vous tient à coeur. Voyez les deux perspectives, comprenez l\'énergie de la connexion, identifiez les défis et explorez son potentiel.',
    positions: {
      en: ['Your Heart', 'Their Heart', 'The Connection', 'Challenges', 'Potential'],
      fr: ['Votre Coeur', 'Son Coeur', 'La Connexion', 'Défis', 'Potentiel'],
    },
    shortPositions: {
      en: ['You', 'Them', 'Bond', 'Challenges', 'Potential'],
      fr: ['Vous', 'Eux', 'Lien', 'Défis', 'Potentiel'],
    },
  },
  career_purpose: {
    id: 'career_purpose',
    labelEn: 'Career & Purpose',
    labelFr: 'Carrière & Vocation',
    taglineEn: 'Get strategic clarity on your professional path. This layout shows where you stand, what\'s blocking progress, hidden factors at play, and the best action to take.',
    taglineFr: 'Obtenez une clarté stratégique sur votre parcours professionnel. Ce tirage montre où vous en êtes, ce qui bloque, les facteurs cachés en jeu, et la meilleure action à entreprendre.',
    positions: {
      en: ['Current Position', 'Obstacles', 'Hidden Factors', 'Action to Take', 'Outcome'],
      fr: ['Position Actuelle', 'Obstacles', 'Facteurs Cachés', 'Action à Prendre', 'Résultat'],
    },
    shortPositions: {
      en: ['Now', 'Blocks', 'Hidden', 'Action', 'Result'],
      fr: ['Actuel', 'Blocages', 'Caché', 'Action', 'Résultat'],
    },
  },
};

// Category configurations
export const FIVE_CARD_CATEGORIES: FiveCardCategoryConfig[] = [
  {
    id: 'self_awareness',
    labelEn: 'Self-Awareness',
    labelFr: 'Conscience de Soi',
    taglineEn: 'Exploring what lies beneath the surface',
    taglineFr: 'Explorer ce qui se cache sous la surface',
    iconName: 'Eye',
    colorClass: 'indigo',
    layouts: ['iceberg', 'mirror'],
    defaultLayout: 'iceberg',
  },
  {
    id: 'gentle_healing',
    labelEn: 'Gentle Healing',
    labelFr: 'Guérison Douce',
    taglineEn: 'Nurturing your heart and inner child',
    taglineFr: 'Prendre soin de votre coeur et enfant intérieur',
    iconName: 'Heart',
    colorClass: 'rose',
    layouts: ['inner_child', 'safe_space'],
    defaultLayout: 'inner_child',
  },
  {
    id: 'know_yourself',
    labelEn: 'Know Yourself',
    labelFr: 'Se Connaître',
    taglineEn: 'Discovering who you truly are',
    taglineFr: 'Découvrir qui vous êtes vraiment',
    iconName: 'Compass',
    colorClass: 'amber',
    layouts: ['authentic_self', 'values'],
    defaultLayout: 'authentic_self',
  },
  {
    id: 'personal_growth',
    labelEn: 'Personal Growth',
    labelFr: 'Croissance Personnelle',
    taglineEn: 'Embracing change and new beginnings',
    taglineFr: 'Embrasser le changement et les nouveaux départs',
    iconName: 'Sprout',
    colorClass: 'emerald',
    layouts: ['alchemy', 'seasons'],
    defaultLayout: 'alchemy',
  },
  {
    id: 'relationships_career',
    labelEn: 'Relationships & Career',
    labelFr: 'Relations & Carrière',
    taglineEn: 'Navigating love and work',
    taglineFr: "Naviguer l'amour et le travail",
    iconName: 'Users',
    colorClass: 'violet',
    layouts: ['love_relationships', 'career_purpose'],
    defaultLayout: 'love_relationships',
  },
];

// Questions for most categories (3 per category)
export const FIVE_CARD_QUESTIONS: Record<FiveCardCategory, FiveCardQuestion[]> = {
  self_awareness: [
    { id: '5sa1', textEn: 'Why do I keep making the same mistakes?', textFr: 'Pourquoi est-ce que je répète toujours les mêmes erreurs ?' },
    { id: '5sa2', textEn: 'What am I in denial about?', textFr: 'Qu\'est-ce que je refuse de voir ?' },
    { id: '5sa3', textEn: 'What\'s the real reason I\'m unhappy?', textFr: 'Quelle est la vraie raison de mon mal-être ?' },
  ],
  gentle_healing: [
    { id: '5gh1', textEn: 'How do I stop feeling so broken?', textFr: 'Comment puis-je arrêter de me sentir si brisé(e) ?' },
    { id: '5gh2', textEn: 'Why is it so hard for me to trust people?', textFr: 'Pourquoi m\'est-il si difficile de faire confiance aux gens ?' },
    { id: '5gh3', textEn: 'How do I move past what happened to me?', textFr: 'Comment puis-je dépasser ce qui m\'est arrivé ?' },
  ],
  know_yourself: [
    { id: '5ky1', textEn: 'Who am I when I\'m not trying to please everyone?', textFr: 'Qui suis-je quand je n\'essaie pas de plaire à tout le monde ?' },
    { id: '5ky2', textEn: 'What do I really want out of life?', textFr: 'Qu\'est-ce que je veux vraiment dans la vie ?' },
    { id: '5ky3', textEn: 'Why do I feel like I\'m living someone else\'s life?', textFr: 'Pourquoi ai-je l\'impression de vivre la vie de quelqu\'un d\'autre ?' },
  ],
  personal_growth: [
    { id: '5pg1', textEn: 'What needs to change for me to be happy?', textFr: 'Que doit changer pour que je sois heureux/heureuse ?' },
    { id: '5pg2', textEn: 'How do I become the person I want to be?', textFr: 'Comment devenir la personne que je veux être ?' },
    { id: '5pg3', textEn: 'What\'s holding me back from reaching my potential?', textFr: 'Qu\'est-ce qui m\'empêche d\'atteindre mon potentiel ?' },
  ],
  relationships_career: [], // Layout-specific questions below
};

// Layout-specific questions for relationships_career category
export const FIVE_CARD_LAYOUT_QUESTIONS: Record<'love_relationships' | 'career_purpose', FiveCardQuestion[]> = {
  love_relationships: [
    { id: '5lr1', textEn: 'Is this relationship worth fighting for?', textFr: 'Cette relation vaut-elle la peine de se battre ?' },
    { id: '5lr2', textEn: 'What does my partner really think of me?', textFr: 'Que pense vraiment mon partenaire de moi ?' },
    { id: '5lr3', textEn: 'Are we meant to be together?', textFr: 'Sommes-nous faits pour être ensemble ?' },
  ],
  career_purpose: [
    { id: '5cp1', textEn: 'Am I wasting my time in this job?', textFr: 'Est-ce que je perds mon temps dans ce travail ?' },
    { id: '5cp2', textEn: 'What career would actually make me happy?', textFr: 'Quelle carrière me rendrait vraiment heureux/heureuse ?' },
    { id: '5cp3', textEn: 'Is it too late to change direction?', textFr: 'Est-il trop tard pour changer de direction ?' },
  ],
};

// Helper text for custom questions
export const FIVE_CARD_CUSTOM_QUESTION_HELPER = {
  en: 'Open-ended questions work best. Try "What can I learn from..." or "What do I need to understand about..."',
  fr: 'Les questions ouvertes fonctionnent mieux. Essayez "Que puis-je apprendre de..." ou "Que dois-je comprendre de..."',
};

// Helper to get category config by id
export function getFiveCardCategory(id: FiveCardCategory): FiveCardCategoryConfig | undefined {
  return FIVE_CARD_CATEGORIES.find(c => c.id === id);
}

// Helper to get questions based on category and layout selection
export function getFiveCardQuestionsForSelection(
  category: FiveCardCategory,
  layoutId: FiveCardLayoutId
): FiveCardQuestion[] {
  // For relationships_career, return layout-specific questions
  if (category === 'relationships_career') {
    if (layoutId === 'love_relationships' || layoutId === 'career_purpose') {
      return FIVE_CARD_LAYOUT_QUESTIONS[layoutId];
    }
  }
  return FIVE_CARD_QUESTIONS[category];
}
