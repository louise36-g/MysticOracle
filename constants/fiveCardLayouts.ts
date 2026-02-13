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
  | 'career_purpose'
  | 'inner_child_career'
  | 'inner_child_money'
  | 'inner_child_life_path'
  | 'self_discovery';

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
    labelEn: 'Career & Calling',
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
  // Category-specific Inner Child layouts
  inner_child_career: {
    id: 'inner_child_career',
    labelEn: 'Inner Child',
    labelFr: 'Enfant Intérieur',
    taglineEn: 'Uncover how childhood messages shape your work identity. Transform limiting beliefs into a new empowering story.',
    taglineFr: 'Découvrez comment les messages d\'enfance façonnent votre identité professionnelle. Transformez les croyances limitantes en une nouvelle histoire.',
    positions: {
      en: ['What They Said', 'What You Believed', 'How It Shows Up', 'The Truth', 'The New Story'],
      fr: ['Ce qu\'ils ont dit', 'Ce que vous avez cru', 'Comment ça se manifeste', 'La vérité', 'La nouvelle histoire'],
    },
    shortPositions: {
      en: ['Said', 'Believed', 'Shows Up', 'Truth', 'New Story'],
      fr: ['Dit', 'Cru', 'Manifeste', 'Vérité', 'Nouvelle'],
    },
  },
  inner_child_money: {
    id: 'inner_child_money',
    labelEn: 'Inner Child',
    labelFr: 'Enfant Intérieur',
    taglineEn: 'Trace your abundance blocks to their origin and discover your true worth. Open to receive what pours in.',
    taglineFr: 'Retracez vos blocages d\'abondance jusqu\'à leur origine et découvrez votre vraie valeur. Ouvrez-vous à ce qui afflue.',
    positions: {
      en: ['The Block', 'Its Origin', 'Your Worth', 'How to Open', 'What Pours In'],
      fr: ['Le blocage', 'Son origine', 'Votre valeur', 'Comment s\'ouvrir', 'Ce qui afflue'],
    },
    shortPositions: {
      en: ['Block', 'Origin', 'Worth', 'Open', 'Receive'],
      fr: ['Blocage', 'Origine', 'Valeur', 'Ouvrir', 'Recevoir'],
    },
  },
  inner_child_life_path: {
    id: 'inner_child_life_path',
    labelEn: 'Inner Child',
    labelFr: 'Enfant Intérieur',
    taglineEn: 'Journey from what you were told to what you choose. Reclaim your authentic path and rewrite your story.',
    taglineFr: 'Voyagez de ce qu\'on vous a dit à ce que vous choisissez. Réclamez votre chemin authentique et réécrivez votre histoire.',
    positions: {
      en: ['You Were Told', 'You Lived', 'You Believed', 'The Truth', 'You Choose'],
      fr: ['On vous a dit', 'Vous avez vécu', 'Vous avez cru', 'La vérité', 'Vous choisissez'],
    },
    shortPositions: {
      en: ['Told', 'Lived', 'Believed', 'Truth', 'Choose'],
      fr: ['Dit', 'Vécu', 'Cru', 'Vérité', 'Choix'],
    },
  },
  self_discovery: {
    id: 'self_discovery',
    labelEn: 'Self-Discovery',
    labelFr: 'Découverte de Soi',
    taglineEn: 'Explore the many facets of who you are within your family. See yourself clearly, understand what you hide, and embrace your unique gifts.',
    taglineFr: 'Explorez les multiples facettes de qui vous êtes au sein de votre famille. Voyez-vous clairement, comprenez ce que vous cachez, et embrassez vos dons uniques.',
    positions: {
      en: ['Who You Are', 'Who Others See', 'What You Hide', 'Your Gift', 'Your Lesson'],
      fr: ['Qui vous êtes', 'Ce que les autres voient', 'Ce que vous cachez', 'Votre don', 'Votre leçon'],
    },
    shortPositions: {
      en: ['You', 'Others See', 'Hidden', 'Gift', 'Lesson'],
      fr: ['Vous', 'Ils voient', 'Caché', 'Don', 'Leçon'],
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
    { id: '5sa1', textEn: 'What deeper current is carrying me toward my next chapter?', textFr: 'Quel courant profond me porte vers mon prochain chapitre ?' },
    { id: '5sa2', textEn: 'What would my life look like if I followed my truest instincts?', textFr: 'À quoi ressemblerait ma vie si je suivais mes instincts les plus vrais ?' },
    { id: '5sa3', textEn: 'What is the thread that connects where I\'ve been to where I\'m going?', textFr: 'Quel est le fil qui relie là d\'où je viens à là où je vais ?' },
  ],
  gentle_healing: [
    { id: '5gh1', textEn: 'What deeper journey is love inviting me to take?', textFr: 'Quel voyage plus profond l\'amour m\'invite-t-il à entreprendre ?' },
    { id: '5gh2', textEn: 'What part of me is ready to bloom in my relationships?', textFr: 'Quelle part de moi est prête à s\'épanouir dans mes relations ?' },
    { id: '5gh3', textEn: 'How can I honor what my heart truly longs for?', textFr: 'Comment puis-je honorer ce que mon cœur désire vraiment ?' },
  ],
  know_yourself: [
    { id: '5ky1', textEn: 'What deeper current is carrying me toward my next chapter?', textFr: 'Quel courant profond me porte vers mon prochain chapitre ?' },
    { id: '5ky2', textEn: 'What would my life look like if I followed my truest instincts?', textFr: 'À quoi ressemblerait ma vie si je suivais mes instincts les plus vrais ?' },
    { id: '5ky3', textEn: 'What is the thread that connects where I\'ve been to where I\'m going?', textFr: 'Quel est le fil qui relie là d\'où je viens à là où je vais ?' },
  ],
  personal_growth: [
    { id: '5pg1', textEn: 'What deeper current is carrying me toward my next chapter?', textFr: 'Quel courant profond me porte vers mon prochain chapitre ?' },
    { id: '5pg2', textEn: 'What would my life look like if I followed my truest instincts?', textFr: 'À quoi ressemblerait ma vie si je suivais mes instincts les plus vrais ?' },
    { id: '5pg3', textEn: 'What is the thread that connects where I\'ve been to where I\'m going?', textFr: 'Quel est le fil qui relie là d\'où je viens à là où je vais ?' },
  ],
  relationships_career: [], // Layout-specific questions below
};

// Layout-specific questions for relationships_career category
export const FIVE_CARD_LAYOUT_QUESTIONS: Record<'love_relationships' | 'career_purpose', FiveCardQuestion[]> = {
  love_relationships: [
    { id: '5lr1', textEn: 'What deeper journey is love inviting me to take?', textFr: 'Quel voyage plus profond l\'amour m\'invite-t-il à entreprendre ?' },
    { id: '5lr2', textEn: 'What part of me is ready to bloom in my relationships?', textFr: 'Quelle part de moi est prête à s\'épanouir dans mes relations ?' },
    { id: '5lr3', textEn: 'How can I honor what my heart truly longs for?', textFr: 'Comment puis-je honorer ce que mon cœur désire vraiment ?' },
  ],
  career_purpose: [
    { id: '5cp1', textEn: 'What deeper transformation is unfolding in my professional life?', textFr: 'Quelle transformation plus profonde se déploie dans ma vie professionnelle ?' },
    { id: '5cp2', textEn: 'How can I align my daily work with what truly fulfills me?', textFr: 'Comment puis-je aligner mon travail quotidien avec ce qui me nourrit vraiment ?' },
    { id: '5cp3', textEn: 'What would my career look like if I trusted my deepest instincts?', textFr: 'À quoi ressemblerait ma carrière si je faisais confiance à mes instincts les plus profonds ?' },
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
