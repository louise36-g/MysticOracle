// constants/horseshoeLayouts.ts

export type HorseshoeCategory =
  | 'general'
  | 'love'
  | 'career'
  | 'life_path'
  | 'growth';

export type HorseshoeLayoutId =
  | 'new_connection'
  | 'relationship_checkin'
  | 'relationship_troubles'
  | 'breakup_moving_on'
  | 'career_crossroads'
  | 'career_purpose'
  | 'workplace_conflicts'
  | 'starting_business'
  | 'financial_stability'
  | 'abundance_blocks'
  | 'money_decisions'
  | 'financial_recovery'
  | 'right_path'
  | 'life_transitions'
  | 'major_decisions'
  | 'whats_ahead'
  | 'family_dynamics'
  | 'parenting'
  | 'friendships'
  | 'difficult_relatives'
  | 'personal_patterns'
  | 'habit_transformation'
  | 'self_discovery_deep'
  | 'growth_catalyst';

export interface HorseshoeLayout {
  id: HorseshoeLayoutId;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  positions: {
    en: [string, string, string, string, string, string, string];
    fr: [string, string, string, string, string, string, string];
  };
}

export interface HorseshoeCategoryConfig {
  id: HorseshoeCategory;
  labelEn: string;
  labelFr: string;
  taglineEn: string;
  taglineFr: string;
  iconName: string;
  colorClass: string;
  layouts: HorseshoeLayoutId[];
  defaultLayout: HorseshoeLayoutId;
}

export interface HorseshoeQuestion {
  id: string;
  textEn: string;
  textFr: string;
}

// Layout definitions (all 20 layouts)
export const HORSESHOE_LAYOUTS: Record<HorseshoeLayoutId, HorseshoeLayout> = {
  // Category 1: Love & Relationships
  new_connection: {
    id: 'new_connection',
    labelEn: 'New Connection',
    labelFr: 'Nouvelle Connexion',
    taglineEn: 'Exploring a new connection or wondering about compatibility? This spread reveals what each person brings, hidden dynamics, and the relationship\'s potential.',
    taglineFr: 'Vous explorez une nouvelle connexion ou vous interrogez sur la compatibilité? Ce tirage révèle ce que chaque personne apporte, les dynamiques cachées et le potentiel de la relation.',
    positions: {
      en: ['What you bring to this connection', 'What they bring to this connection', 'The energy between you', 'Hidden factors at play', 'External influences on this potential', 'Guidance for moving forward', 'What this connection could become'],
      fr: ['Ce que vous apportez à cette connexion', 'Ce qu\'ils apportent à cette connexion', 'L\'énergie entre vous', 'Facteurs cachés en jeu', 'Influences extérieures sur ce potentiel', 'Guidance pour avancer', 'Ce que cette connexion pourrait devenir'],
    },
  },
  relationship_checkin: {
    id: 'relationship_checkin',
    labelEn: 'Relationship Check-In',
    labelFr: 'Bilan de Relation',
    taglineEn: 'Take the pulse of a partnership. Understand what\'s working, what needs attention, and how to nurture the bond.',
    taglineFr: 'Prenez le pouls d\'une relation. Comprenez ce qui fonctionne, ce qui demande attention, et comment nourrir le lien.',
    positions: {
      en: ['The foundation built together', 'Current state of the relationship', 'What remains unspoken', 'Challenges to address', 'Outside pressures on the bond', 'How to strengthen connection', 'The relationship\'s potential'],
      fr: ['Les fondations construites ensemble', 'État actuel de la relation', 'Ce qui reste non-dit', 'Défis à relever', 'Pressions extérieures sur le lien', 'Comment renforcer la connexion', 'Le potentiel de la relation'],
    },
  },
  relationship_troubles: {
    id: 'relationship_troubles',
    labelEn: 'Relationship Troubles',
    labelFr: 'Difficultés Relationnelles',
    taglineEn: 'When conflict or distance arises, this spread helps reveal root causes, both perspectives, and a path toward resolution.',
    taglineFr: 'Quand le conflit ou la distance surgit, ce tirage aide à révéler les causes profondes, les deux perspectives, et un chemin vers la résolution.',
    positions: {
      en: ['How things reached this point', 'The current tension', 'What\'s really going on beneath', 'One perspective on the difficulty', 'The other perspective', 'What would help heal this', 'Possible resolution'],
      fr: ['Comment les choses en sont arrivées là', 'La tension actuelle', 'Ce qui se passe vraiment en profondeur', 'Une perspective sur la difficulté', 'L\'autre perspective', 'Ce qui aiderait à guérir cela', 'Résolution possible'],
    },
  },
  breakup_moving_on: {
    id: 'breakup_moving_on',
    labelEn: 'Breakup & Moving On',
    labelFr: 'Rupture & Aller de l\'Avant',
    taglineEn: 'Processing a breakup or wondering about an ex? Gain clarity on what happened, what\'s being held onto, and the path forward.',
    taglineFr: 'Vous traversez une rupture ou pensez à un ex? Obtenez de la clarté sur ce qui s\'est passé, ce qui est retenu, et le chemin à suivre.',
    positions: {
      en: ['What led to the ending', 'The current emotional landscape', 'What hasn\'t been processed', 'What\'s keeping things stuck', 'What this person represents', 'What needs to be released', 'The heart\'s next chapter'],
      fr: ['Ce qui a mené à la fin', 'Le paysage émotionnel actuel', 'Ce qui n\'a pas été traité', 'Ce qui maintient les choses bloquées', 'Ce que cette personne représente', 'Ce qui doit être libéré', 'Le prochain chapitre du cœur'],
    },
  },
  // Category 2: Career & Work
  career_crossroads: {
    id: 'career_crossroads',
    labelEn: 'Career Crossroads',
    labelFr: 'Carrefour de Carrière',
    taglineEn: 'Evaluating your current role or considering a change? Understand what\'s working, what\'s not, and the path toward fulfillment.',
    taglineFr: 'Vous évaluez votre rôle actuel ou envisagez un changement? Comprenez ce qui fonctionne, ce qui ne fonctionne pas, et le chemin vers l\'épanouissement.',
    positions: {
      en: ['The career journey so far', 'Current feelings about this work', 'What\'s fulfilling vs. what\'s draining', 'What\'s blocking progress or satisfaction', 'Workplace dynamics at play', 'Guidance for the next step', 'Likely outcome if changes are made'],
      fr: ['Le parcours professionnel jusqu\'ici', 'Sentiments actuels envers ce travail', 'Ce qui nourrit vs. ce qui épuise', 'Ce qui bloque le progrès ou la satisfaction', 'Dynamiques professionnelles en jeu', 'Guidance pour la prochaine étape', 'Issue probable si des changements sont faits'],
    },
  },
  career_purpose: {
    id: 'career_purpose',
    labelEn: 'Career Direction & Purpose',
    labelFr: 'Direction & Vocation',
    taglineEn: 'Feeling lost or questioning the path? Discover what truly drives fulfillment and whether current work aligns with a deeper calling.',
    taglineFr: 'Vous vous sentez perdu ou remettez en question votre chemin? Découvrez ce qui motive vraiment l\'épanouissement et si le travail actuel s\'aligne avec un appel plus profond.',
    positions: {
      en: ['Skills and experiences present', 'The current relationship with work', 'What the soul craves professionally', 'Fears that may be present', 'Opportunities that may be overlooked', 'How to align work with purpose', 'Professional potential'],
      fr: ['Compétences et expériences présentes', 'La relation actuelle avec le travail', 'Ce que l\'âme désire professionnellement', 'Peurs qui peuvent être présentes', 'Opportunités qui peuvent être négligées', 'Comment aligner travail et vocation', 'Potentiel professionnel'],
    },
  },
  workplace_conflicts: {
    id: 'workplace_conflicts',
    labelEn: 'Workplace Conflicts',
    labelFr: 'Conflits au Travail',
    taglineEn: 'Navigating difficult colleagues or challenging dynamics? See beneath the surface and find strategies to protect peace and progress.',
    taglineFr: 'Vous naviguez avec des collègues difficiles ou des dynamiques complexes? Voyez sous la surface et trouvez des stratégies pour protéger votre paix et votre progression.',
    positions: {
      en: ['How this situation developed', 'The current dynamic', 'What\'s really driving the conflict', 'Blind spots in this situation', 'The other perspective', 'How to navigate this wisely', 'Understanding the guidance'],
      fr: ['Comment cette situation s\'est développée', 'La dynamique actuelle', 'Ce qui alimente vraiment le conflit', 'Angles morts dans cette situation', 'L\'autre perspective', 'Comment naviguer cela sagement', 'Comprendre la guidance'],
    },
  },
  starting_business: {
    id: 'starting_business',
    labelEn: 'Starting a Business',
    labelFr: 'Lancer une Entreprise',
    taglineEn: 'Ready to launch a new venture? This spread reveals readiness, challenges ahead, and what will help it succeed.',
    taglineFr: 'Prêt à lancer une nouvelle entreprise? Ce tirage révèle la préparation, les défis à venir, et ce qui aidera à réussir.',
    positions: {
      en: ['Experience to build on', 'Current readiness', 'Hidden strengths or resources', 'Obstacles to prepare for', 'Market and external factors', 'Key to making this work', 'The venture\'s potential'],
      fr: ['Expérience sur laquelle bâtir', 'Préparation actuelle', 'Forces ou ressources cachées', 'Obstacles à anticiper', 'Marché et facteurs externes', 'Clé pour réussir', 'Le potentiel de l\'entreprise'],
    },
  },
  // Category 3: Money & Finances
  financial_stability: {
    id: 'financial_stability',
    labelEn: 'Financial Stability',
    labelFr: 'Stabilité Financière',
    taglineEn: 'Seeking security with money? Understand the current foundation, what strengthens or weakens it, and how to build lasting stability.',
    taglineFr: 'Vous cherchez la sécurité financière? Comprenez la fondation actuelle, ce qui la renforce ou l\'affaiblit, et comment bâtir une stabilité durable.',
    positions: {
      en: ['Financial patterns from the past', 'The current financial picture', 'Hidden factors affecting the flow', 'What threatens stability', 'Resources and support available', 'Actions to strengthen the foundation', 'Potential for security'],
      fr: ['Schémas financiers du passé', 'La situation financière actuelle', 'Facteurs cachés affectant le flux', 'Ce qui menace la stabilité', 'Ressources et soutien disponibles', 'Actions pour renforcer les fondations', 'Potentiel de sécurité'],
    },
  },
  abundance_blocks: {
    id: 'abundance_blocks',
    labelEn: 'Blocks to Abundance',
    labelFr: 'Blocages à l\'Abondance',
    taglineEn: 'Feeling stuck around money? Uncover deep-seated beliefs, fears, or patterns that may be limiting the flow of prosperity.',
    taglineFr: 'Vous vous sentez bloqué avec l\'argent? Découvrez les croyances profondes, peurs ou schémas qui peuvent limiter le flux de prospérité.',
    positions: {
      en: ['Early messages received about money', 'The current relationship with abundance', 'Limiting beliefs operating beneath', 'How these blocks manifest', 'What abundance truly means here', 'How to begin shifting the energy', 'What becomes possible when released'],
      fr: ['Messages reçus tôt sur l\'argent', 'La relation actuelle avec l\'abondance', 'Croyances limitantes en jeu', 'Comment ces blocages se manifestent', 'Ce que l\'abondance signifie vraiment ici', 'Comment commencer à changer l\'énergie', 'Ce qui devient possible une fois libéré'],
    },
  },
  money_decisions: {
    id: 'money_decisions',
    labelEn: 'Money Decisions',
    labelFr: 'Décisions Financières',
    taglineEn: 'Facing a financial choice? Weigh the factors, understand the risks, and find clarity on the path forward.',
    taglineFr: 'Face à un choix financier? Pesez les facteurs, comprenez les risques, et trouvez la clarté sur le chemin à suivre.',
    positions: {
      en: ['What led to this decision point', 'The current financial standing', 'What hasn\'t been fully considered', 'Risks to be aware of', 'External factors at play', 'Guidance for this choice', 'Likely outcome if proceeding'],
      fr: ['Ce qui a mené à ce point de décision', 'La situation financière actuelle', 'Ce qui n\'a pas été pleinement considéré', 'Risques à connaître', 'Facteurs externes en jeu', 'Guidance pour ce choix', 'Issue probable si on avance'],
    },
  },
  financial_recovery: {
    id: 'financial_recovery',
    labelEn: 'Debt & Financial Recovery',
    labelFr: 'Dette & Rétablissement Financier',
    taglineEn: 'Working through debt or financial hardship? This spread brings compassion and clarity to the path toward recovery.',
    taglineFr: 'Vous traversez une dette ou des difficultés financières? Ce tirage apporte compassion et clarté sur le chemin vers le rétablissement.',
    positions: {
      en: ['How this situation arose', 'The current weight being carried', 'Emotions present in this situation', 'What\'s making recovery harder', 'Support and resources to draw on', 'The next step forward', 'Potential for healing and renewal'],
      fr: ['Comment cette situation est apparue', 'Le poids actuel porté', 'Émotions présentes dans cette situation', 'Ce qui rend la récupération plus difficile', 'Soutien et ressources à solliciter', 'La prochaine étape', 'Potentiel de guérison et renouveau'],
    },
  },
  // Category 4: Life Path & Major Decisions
  right_path: {
    id: 'right_path',
    labelEn: 'Am I On The Right Path?',
    labelFr: 'Suis-je sur le Bon Chemin?',
    taglineEn: 'Doubting the direction of life? This spread offers perspective on where things stand, what\'s aligned, and what may need adjustment.',
    taglineFr: 'Vous doutez de la direction de votre vie? Ce tirage offre une perspective sur où en sont les choses, ce qui est aligné, et ce qui peut nécessiter un ajustement.',
    positions: {
      en: ['The path that led here', 'Where things stand now', 'What the soul is truly seeking', 'What feels misaligned', 'Signs and synchronicities present', 'How to reconnect with inner guidance', 'What alignment could look like'],
      fr: ['Le chemin qui a mené ici', 'Où en sont les choses maintenant', 'Ce que l\'âme cherche vraiment', 'Ce qui semble désaligné', 'Signes et synchronicités présents', 'Comment se reconnecter à la guidance intérieure', 'À quoi l\'alignement pourrait ressembler'],
    },
  },
  life_transitions: {
    id: 'life_transitions',
    labelEn: 'Major Life Transitions',
    labelFr: 'Transitions Majeures',
    taglineEn: 'Navigating a significant change? Understand what\'s ending, what\'s emerging, and how to move through the threshold with grace.',
    taglineFr: 'Vous naviguez un changement significatif? Comprenez ce qui se termine, ce qui émerge, et comment traverser ce seuil avec grâce.',
    positions: {
      en: ['What needs to be left behind', 'The current threshold', 'Emotions arising in this transition', 'What makes this transition difficult', 'Support available during this time', 'How to honour this passage', 'What\'s emerging on the other side'],
      fr: ['Ce qui doit être laissé derrière', 'Le seuil actuel', 'Émotions qui surgissent dans cette transition', 'Ce qui rend cette transition difficile', 'Soutien disponible pendant cette période', 'Comment honorer ce passage', 'Ce qui émerge de l\'autre côté'],
    },
  },
  major_decisions: {
    id: 'major_decisions',
    labelEn: 'Major Decisions',
    labelFr: 'Décisions Majeures',
    taglineEn: 'Facing a significant choice or considering a move? Explore the options, uncover hidden factors, and find clarity on the path forward.',
    taglineFr: 'Face à un choix significatif ou envisagez de déménager? Explorez les options, découvrez les facteurs cachés, et trouvez la clarté sur le chemin à suivre.',
    positions: {
      en: ['How this decision point arose', 'What the current situation offers', 'What the new path offers', 'What\'s not being seen clearly', 'External factors influencing the choice', 'What the heart truly wants', 'Guidance for deciding'],
      fr: ['Comment ce point de décision est apparu', 'Ce que la situation actuelle offre', 'Ce que le nouveau chemin offre', 'Ce qui n\'est pas vu clairement', 'Facteurs externes influençant le choix', 'Ce que le cœur veut vraiment', 'Guidance pour décider'],
    },
  },
  whats_ahead: {
    id: 'whats_ahead',
    labelEn: 'What\'s Ahead',
    labelFr: 'Ce Qui Vient',
    taglineEn: 'Seeking a general life overview? This spread illuminates current energies, upcoming influences, and guidance for the journey ahead.',
    taglineFr: 'Vous cherchez un aperçu général de votre vie? Ce tirage illumine les énergies actuelles, les influences à venir, et la guidance pour le chemin à parcourir.',
    positions: {
      en: ['Recent experiences shaping now', 'The current life energy', 'What\'s working beneath the surface', 'Challenges on the horizon', 'Opportunities approaching', 'Guidance for the coming period', 'The overall direction unfolding'],
      fr: ['Expériences récentes qui façonnent le présent', 'L\'énergie de vie actuelle', 'Ce qui œuvre sous la surface', 'Défis à l\'horizon', 'Opportunités qui approchent', 'Guidance pour la période à venir', 'La direction générale qui se déploie'],
    },
  },
  // Category 5: Family & Personal Relationships
  family_dynamics: {
    id: 'family_dynamics',
    labelEn: 'Family Dynamics',
    labelFr: 'Dynamiques Familiales',
    taglineEn: 'Navigating complex family relationships? This spread illuminates patterns, tensions, and pathways toward greater understanding.',
    taglineFr: 'Vous naviguez des relations familiales complexes? Ce tirage illumine les schémas, tensions, et chemins vers une meilleure compréhension.',
    positions: {
      en: ['Family patterns from the past', 'The current family dynamic', 'Unspoken tensions or expectations', 'What\'s causing friction', 'Your unmet needs', 'How to bring more harmony', 'Potential for healing'],
      fr: ['Schémas familiaux du passé', 'La dynamique familiale actuelle', 'Tensions ou attentes non-dites', 'Ce qui cause des frictions', 'Vos besoins non satisfaits', 'Comment apporter plus d\'harmonie', 'Potentiel de guérison'],
    },
  },
  parenting: {
    id: 'parenting',
    labelEn: 'Children & Parenting',
    labelFr: 'Enfants & Parentalité',
    taglineEn: 'Questions about children or the parenting journey? Gain insight into the relationship, challenges, and how to nurture connection.',
    taglineFr: 'Des questions sur les enfants ou le parcours parental? Obtenez des insights sur la relation, les défis, et comment nourrir la connexion.',
    positions: {
      en: ['The foundation of this bond', 'The current parent-child dynamic', 'What the child may need', 'Challenges in the relationship', 'External pressures on the family', 'How to deepen understanding', 'The relationship\'s potential'],
      fr: ['Les fondations de ce lien', 'La dynamique parent-enfant actuelle', 'Ce dont l\'enfant peut avoir besoin', 'Défis dans la relation', 'Pressions extérieures sur la famille', 'Comment approfondir la compréhension', 'Le potentiel de la relation'],
    },
  },
  friendships: {
    id: 'friendships',
    labelEn: 'Friendships',
    labelFr: 'Amitiés',
    taglineEn: 'Reflecting on a friendship? Explore the connection\'s health, what it offers, and whether it still serves both people.',
    taglineFr: 'Vous réfléchissez à une amitié? Explorez la santé de la connexion, ce qu\'elle offre, et si elle sert encore les deux personnes.',
    positions: {
      en: ['How this friendship began', 'The current state of the bond', 'What this friendship provides', 'What may be straining it', 'The other person\'s experience', 'How to nurture or release', 'Where this friendship is heading'],
      fr: ['Comment cette amitié a commencé', 'L\'état actuel du lien', 'Ce que cette amitié apporte', 'Ce qui peut la fragiliser', 'L\'expérience de l\'autre personne', 'Comment nourrir ou lâcher prise', 'Où cette amitié se dirige'],
    },
  },
  difficult_relatives: {
    id: 'difficult_relatives',
    labelEn: 'Difficult Relatives',
    labelFr: 'Relations Difficiles',
    taglineEn: 'Struggling with a challenging family member? Understand the deeper dynamics at play and find peace within the situation.',
    taglineFr: 'Vous avez du mal avec un membre de famille difficile? Comprenez les dynamiques profondes en jeu et trouvez la paix dans cette situation.',
    positions: {
      en: ['History of this relationship', 'The current tension', 'What drives their behaviour', 'Triggers present in this dynamic', 'Boundaries that may be needed', 'How to protect inner peace', 'What acceptance could look like'],
      fr: ['Histoire de cette relation', 'La tension actuelle', 'Ce qui motive leur comportement', 'Déclencheurs présents dans cette dynamique', 'Limites qui peuvent être nécessaires', 'Comment protéger la paix intérieure', 'À quoi l\'acceptation pourrait ressembler'],
    },
  },
  // Category: Personal Growth
  personal_patterns: {
    id: 'personal_patterns',
    labelEn: 'Personal Patterns',
    labelFr: 'Schémas Personnels',
    taglineEn: 'Uncover the repeating patterns in your life and understand what they\'re teaching you.',
    taglineFr: 'Découvrez les schémas répétitifs de votre vie et comprenez ce qu\'ils vous enseignent.',
    positions: {
      en: ['The pattern\'s origin', 'How it shows up now', 'What it\'s trying to protect', 'What it costs you', 'The lesson within it', 'How to begin shifting', 'Who you become without it'],
      fr: ['L\'origine du schéma', 'Comment il se manifeste maintenant', 'Ce qu\'il essaie de protéger', 'Ce qu\'il vous coûte', 'La leçon qu\'il contient', 'Comment commencer à changer', 'Qui vous devenez sans lui'],
    },
  },
  habit_transformation: {
    id: 'habit_transformation',
    labelEn: 'Habit Transformation',
    labelFr: 'Transformation des Habitudes',
    taglineEn: 'Ready to break old habits or build new ones? Understand the forces at play and find your path to lasting change.',
    taglineFr: 'Prêt à briser de vieilles habitudes ou en créer de nouvelles ? Comprenez les forces en jeu et trouvez votre chemin vers un changement durable.',
    positions: {
      en: ['The habit\'s roots', 'Its current hold on you', 'What triggers it', 'What you really need instead', 'Hidden strengths to draw on', 'The first step forward', 'The person you\'re becoming'],
      fr: ['Les racines de l\'habitude', 'Son emprise actuelle', 'Ce qui la déclenche', 'Ce dont vous avez vraiment besoin', 'Forces cachées à mobiliser', 'Le premier pas en avant', 'La personne que vous devenez'],
    },
  },
  self_discovery_deep: {
    id: 'self_discovery_deep',
    labelEn: 'Deep Self-Discovery',
    labelFr: 'Découverte de Soi Profonde',
    taglineEn: 'Journey inward to understand who you truly are beneath the roles you play.',
    taglineFr: 'Voyagez en vous-même pour comprendre qui vous êtes vraiment sous les rôles que vous jouez.',
    positions: {
      en: ['The mask you wear', 'What lies beneath', 'Your deepest strength', 'Your growing edge', 'What you\'ve been avoiding', 'What wants to emerge', 'Your authentic self'],
      fr: ['Le masque que vous portez', 'Ce qui se cache dessous', 'Votre force la plus profonde', 'Votre zone de croissance', 'Ce que vous avez évité', 'Ce qui veut émerger', 'Votre moi authentique'],
    },
  },
  growth_catalyst: {
    id: 'growth_catalyst',
    labelEn: 'Growth Catalyst',
    labelFr: 'Catalyseur de Croissance',
    taglineEn: 'Something is pushing you to evolve. Discover what\'s catalyzing your growth and how to work with it.',
    taglineFr: 'Quelque chose vous pousse à évoluer. Découvrez ce qui catalyse votre croissance et comment travailler avec.',
    positions: {
      en: ['Where you\'ve been', 'Where you are now', 'The catalyst for change', 'What resists the growth', 'Unexpected resources', 'The courage needed', 'Where this growth leads'],
      fr: ['Où vous avez été', 'Où vous êtes maintenant', 'Le catalyseur du changement', 'Ce qui résiste à la croissance', 'Ressources inattendues', 'Le courage nécessaire', 'Où cette croissance mène'],
    },
  },
};

// Category configurations
export const HORSESHOE_CATEGORIES: HorseshoeCategoryConfig[] = [
  {
    id: 'love',
    labelEn: 'Love & Relationships',
    labelFr: 'Amour & Relations',
    taglineEn: 'Exploring connections of the heart',
    taglineFr: 'Explorer les connexions du cœur',
    iconName: 'Heart',
    colorClass: 'rose',
    layouts: ['new_connection', 'relationship_checkin', 'relationship_troubles', 'breakup_moving_on'],
    defaultLayout: 'new_connection',
  },
  {
    id: 'career',
    labelEn: 'Career & Calling',
    labelFr: 'Carrière & Vocation',
    taglineEn: 'Navigating professional paths',
    taglineFr: 'Naviguer les chemins professionnels',
    iconName: 'Briefcase',
    colorClass: 'blue',
    layouts: ['career_crossroads', 'career_purpose', 'workplace_conflicts', 'starting_business'],
    defaultLayout: 'career_crossroads',
  },
  {
    id: 'general',
    labelEn: 'General Guidance',
    labelFr: 'Guidance Générale',
    taglineEn: 'Insight on any topic',
    taglineFr: 'Éclairage sur tout sujet',
    iconName: 'MessageCircle',
    colorClass: 'purple',
    layouts: ['right_path', 'life_transitions', 'major_decisions', 'whats_ahead'],
    defaultLayout: 'whats_ahead',
  },
  {
    id: 'life_path',
    labelEn: 'Spiritual / Wellbeing',
    labelFr: 'Spirituel / Bien-être',
    taglineEn: 'Inner peace and soul purpose',
    taglineFr: 'Paix intérieure et mission de vie',
    iconName: 'Sun',
    colorClass: 'purple',
    layouts: ['right_path', 'life_transitions', 'major_decisions', 'whats_ahead'],
    defaultLayout: 'right_path',
  },
  {
    id: 'growth',
    labelEn: 'Personal Growth',
    labelFr: 'Développement Personnel',
    taglineEn: 'Self-development and transformation',
    taglineFr: 'Développement de soi et transformation',
    iconName: 'Sprout',
    colorClass: 'teal',
    layouts: ['personal_patterns', 'habit_transformation', 'self_discovery_deep', 'growth_catalyst'],
    defaultLayout: 'personal_patterns',
  },
];

// Layout-specific questions (all questions are layout-specific for horseshoe)
export const HORSESHOE_LAYOUT_QUESTIONS: Record<HorseshoeLayoutId, HorseshoeQuestion[]> = {
  // Love & Relationships
  new_connection: [
    { id: 'hs_nc1', textEn: 'What is my soul really searching for in this connection?', textFr: 'Que cherche vraiment mon âme dans cette connexion ?' },
    { id: 'hs_nc2', textEn: 'What unspoken feelings are shaping the energy between us?', textFr: 'Quels sentiments non-dits façonnent l\'énergie entre nous ?' },
    { id: 'hs_nc3', textEn: 'What does this relationship want to teach me about myself?', textFr: 'Qu\'est-ce que cette relation veut m\'apprendre sur moi-même ?' },
  ],
  relationship_checkin: [
    { id: 'hs_rc1', textEn: 'What is my soul really searching for in this connection?', textFr: 'Que cherche vraiment mon âme dans cette connexion ?' },
    { id: 'hs_rc2', textEn: 'What unspoken feelings are shaping the energy between us?', textFr: 'Quels sentiments non-dits façonnent l\'énergie entre nous ?' },
    { id: 'hs_rc3', textEn: 'What does this relationship want to teach me about myself?', textFr: 'Qu\'est-ce que cette relation veut m\'apprendre sur moi-même ?' },
  ],
  relationship_troubles: [
    { id: 'hs_rt1', textEn: 'What is my soul really searching for in this connection?', textFr: 'Que cherche vraiment mon âme dans cette connexion ?' },
    { id: 'hs_rt2', textEn: 'What unspoken feelings are shaping the energy between us?', textFr: 'Quels sentiments non-dits façonnent l\'énergie entre nous ?' },
    { id: 'hs_rt3', textEn: 'What does this relationship want to teach me about myself?', textFr: 'Qu\'est-ce que cette relation veut m\'apprendre sur moi-même ?' },
  ],
  breakup_moving_on: [
    { id: 'hs_bm1', textEn: 'What is my soul really searching for in this connection?', textFr: 'Que cherche vraiment mon âme dans cette connexion ?' },
    { id: 'hs_bm2', textEn: 'What unspoken feelings are shaping the energy between us?', textFr: 'Quels sentiments non-dits façonnent l\'énergie entre nous ?' },
    { id: 'hs_bm3', textEn: 'What does this relationship want to teach me about myself?', textFr: 'Qu\'est-ce que cette relation veut m\'apprendre sur moi-même ?' },
  ],

  // Career & Calling
  career_crossroads: [
    { id: 'hs_cc1', textEn: 'What forces are shaping the next chapter of my professional journey?', textFr: 'Quelles forces façonnent le prochain chapitre de mon parcours professionnel ?' },
    { id: 'hs_cc2', textEn: 'What bridge is forming between where I am and where I\'m meant to be?', textFr: 'Quel pont se forme entre là où je suis et là où je suis destiné(e) à être ?' },
    { id: 'hs_cc3', textEn: 'What do I need to release to step fully into my calling?', textFr: 'De quoi ai-je besoin de me libérer pour embrasser pleinement ma vocation ?' },
  ],
  career_purpose: [
    { id: 'hs_cp1', textEn: 'What forces are shaping the next chapter of my professional journey?', textFr: 'Quelles forces façonnent le prochain chapitre de mon parcours professionnel ?' },
    { id: 'hs_cp2', textEn: 'What bridge is forming between where I am and where I\'m meant to be?', textFr: 'Quel pont se forme entre là où je suis et là où je suis destiné(e) à être ?' },
    { id: 'hs_cp3', textEn: 'What do I need to release to step fully into my calling?', textFr: 'De quoi ai-je besoin de me libérer pour embrasser pleinement ma vocation ?' },
  ],
  workplace_conflicts: [
    { id: 'hs_wc1', textEn: 'What forces are shaping the next chapter of my professional journey?', textFr: 'Quelles forces façonnent le prochain chapitre de mon parcours professionnel ?' },
    { id: 'hs_wc2', textEn: 'What bridge is forming between where I am and where I\'m meant to be?', textFr: 'Quel pont se forme entre là où je suis et là où je suis destiné(e) à être ?' },
    { id: 'hs_wc3', textEn: 'What do I need to release to step fully into my calling?', textFr: 'De quoi ai-je besoin de me libérer pour embrasser pleinement ma vocation ?' },
  ],
  starting_business: [
    { id: 'hs_sb1', textEn: 'What forces are shaping the next chapter of my professional journey?', textFr: 'Quelles forces façonnent le prochain chapitre de mon parcours professionnel ?' },
    { id: 'hs_sb2', textEn: 'What bridge is forming between where I am and where I\'m meant to be?', textFr: 'Quel pont se forme entre là où je suis et là où je suis destiné(e) à être ?' },
    { id: 'hs_sb3', textEn: 'What do I need to release to step fully into my calling?', textFr: 'De quoi ai-je besoin de me libérer pour embrasser pleinement ma vocation ?' },
  ],

  // Wealth & Alignment
  financial_stability: [
    { id: 'hs_fs1', textEn: 'What invisible patterns are influencing my financial path?', textFr: 'Quels schémas invisibles influencent mon chemin financier ?' },
    { id: 'hs_fs2', textEn: 'What is the universe trying to show me about giving and receiving?', textFr: 'Qu\'est-ce que l\'univers essaie de me montrer sur le fait de donner et de recevoir ?' },
    { id: 'hs_fs3', textEn: 'What old fear around money is ready to be gently released?', textFr: 'Quelle ancienne peur liée à l\'argent est prête à être doucement libérée ?' },
  ],
  abundance_blocks: [
    { id: 'hs_ab1', textEn: 'What invisible patterns are influencing my financial path?', textFr: 'Quels schémas invisibles influencent mon chemin financier ?' },
    { id: 'hs_ab2', textEn: 'What is the universe trying to show me about giving and receiving?', textFr: 'Qu\'est-ce que l\'univers essaie de me montrer sur le fait de donner et de recevoir ?' },
    { id: 'hs_ab3', textEn: 'What old fear around money is ready to be gently released?', textFr: 'Quelle ancienne peur liée à l\'argent est prête à être doucement libérée ?' },
  ],
  money_decisions: [
    { id: 'hs_md1', textEn: 'What invisible patterns are influencing my financial path?', textFr: 'Quels schémas invisibles influencent mon chemin financier ?' },
    { id: 'hs_md2', textEn: 'What is the universe trying to show me about giving and receiving?', textFr: 'Qu\'est-ce que l\'univers essaie de me montrer sur le fait de donner et de recevoir ?' },
    { id: 'hs_md3', textEn: 'What old fear around money is ready to be gently released?', textFr: 'Quelle ancienne peur liée à l\'argent est prête à être doucement libérée ?' },
  ],
  financial_recovery: [
    { id: 'hs_fr1', textEn: 'What invisible patterns are influencing my financial path?', textFr: 'Quels schémas invisibles influencent mon chemin financier ?' },
    { id: 'hs_fr2', textEn: 'What is the universe trying to show me about giving and receiving?', textFr: 'Qu\'est-ce que l\'univers essaie de me montrer sur le fait de donner et de recevoir ?' },
    { id: 'hs_fr3', textEn: 'What old fear around money is ready to be gently released?', textFr: 'Quelle ancienne peur liée à l\'argent est prête à être doucement libérée ?' },
  ],

  // Life Path
  right_path: [
    { id: 'hs_rp1', textEn: 'What turning point is quietly taking shape in my life?', textFr: 'Quel tournant prend forme silencieusement dans ma vie ?' },
    { id: 'hs_rp2', textEn: 'What do I need to understand about the journey I\'m on?', textFr: 'Que dois-je comprendre sur le voyage que je suis en train de vivre ?' },
    { id: 'hs_rp3', textEn: 'What is life asking me to trust, even without seeing the full picture?', textFr: 'Qu\'est-ce que la vie me demande de croire, même sans voir le chemin entier ?' },
  ],
  life_transitions: [
    { id: 'hs_lt1', textEn: 'What turning point is quietly taking shape in my life?', textFr: 'Quel tournant prend forme silencieusement dans ma vie ?' },
    { id: 'hs_lt2', textEn: 'What do I need to understand about the journey I\'m on?', textFr: 'Que dois-je comprendre sur le voyage que je suis en train de vivre ?' },
    { id: 'hs_lt3', textEn: 'What is life asking me to trust, even without seeing the full picture?', textFr: 'Qu\'est-ce que la vie me demande de croire, même sans voir le chemin entier ?' },
  ],
  major_decisions: [
    { id: 'hs_mj1', textEn: 'What turning point is quietly taking shape in my life?', textFr: 'Quel tournant prend forme silencieusement dans ma vie ?' },
    { id: 'hs_mj2', textEn: 'What do I need to understand about the journey I\'m on?', textFr: 'Que dois-je comprendre sur le voyage que je suis en train de vivre ?' },
    { id: 'hs_mj3', textEn: 'What is life asking me to trust, even without seeing the full picture?', textFr: 'Qu\'est-ce que la vie me demande de croire, même sans voir le chemin entier ?' },
  ],
  whats_ahead: [
    { id: 'hs_wa1', textEn: 'What turning point is quietly taking shape in my life?', textFr: 'Quel tournant prend forme silencieusement dans ma vie ?' },
    { id: 'hs_wa2', textEn: 'What do I need to understand about the journey I\'m on?', textFr: 'Que dois-je comprendre sur le voyage que je suis en train de vivre ?' },
    { id: 'hs_wa3', textEn: 'What is life asking me to trust, even without seeing the full picture?', textFr: 'Qu\'est-ce que la vie me demande de croire, même sans voir le chemin entier ?' },
  ],

  // Hearth & Home
  family_dynamics: [
    { id: 'hs_fd1', textEn: 'What invisible thread is shaping the bonds within my family?', textFr: 'Quel fil invisible façonne les liens au sein de ma famille ?' },
    { id: 'hs_fd2', textEn: 'What do my roots need from me right now?', textFr: 'De quoi mes racines ont-elles besoin de ma part en ce moment ?' },
    { id: 'hs_fd3', textEn: 'What old family pattern is ready to be transformed with love?', textFr: 'Quel ancien schéma familial est prêt à être transformé avec amour ?' },
  ],
  parenting: [
    { id: 'hs_pa1', textEn: 'What invisible thread is shaping the bonds within my family?', textFr: 'Quel fil invisible façonne les liens au sein de ma famille ?' },
    { id: 'hs_pa2', textEn: 'What do my roots need from me right now?', textFr: 'De quoi mes racines ont-elles besoin de ma part en ce moment ?' },
    { id: 'hs_pa3', textEn: 'What old family pattern is ready to be transformed with love?', textFr: 'Quel ancien schéma familial est prêt à être transformé avec amour ?' },
  ],
  friendships: [
    { id: 'hs_fn1', textEn: 'What invisible thread is shaping the bonds within my family?', textFr: 'Quel fil invisible façonne les liens au sein de ma famille ?' },
    { id: 'hs_fn2', textEn: 'What do my roots need from me right now?', textFr: 'De quoi mes racines ont-elles besoin de ma part en ce moment ?' },
    { id: 'hs_fn3', textEn: 'What old family pattern is ready to be transformed with love?', textFr: 'Quel ancien schéma familial est prêt à être transformé avec amour ?' },
  ],
  difficult_relatives: [
    { id: 'hs_dr1', textEn: 'What invisible thread is shaping the bonds within my family?', textFr: 'Quel fil invisible façonne les liens au sein de ma famille ?' },
    { id: 'hs_dr2', textEn: 'What do my roots need from me right now?', textFr: 'De quoi mes racines ont-elles besoin de ma part en ce moment ?' },
    { id: 'hs_dr3', textEn: 'What old family pattern is ready to be transformed with love?', textFr: 'Quel ancien schéma familial est prêt à être transformé avec amour ?' },
  ],

  // Personal Growth
  personal_patterns: [
    { id: 'hs_pp1', textEn: 'What repeating pattern in my life is ready to be understood?', textFr: 'Quel schéma répétitif dans ma vie est prêt à être compris ?' },
    { id: 'hs_pp2', textEn: 'What is my strongest unconscious habit teaching me?', textFr: 'Que m\'enseigne mon habitude inconsciente la plus forte ?' },
    { id: 'hs_pp3', textEn: 'What part of myself am I ready to outgrow?', textFr: 'Quelle part de moi-même suis-je prêt(e) à dépasser ?' },
  ],
  habit_transformation: [
    { id: 'hs_ht1', textEn: 'What habit no longer serves who I am becoming?', textFr: 'Quelle habitude ne sert plus la personne que je deviens ?' },
    { id: 'hs_ht2', textEn: 'What hidden need is my most stubborn habit trying to meet?', textFr: 'Quel besoin caché mon habitude la plus tenace essaie-t-elle de satisfaire ?' },
    { id: 'hs_ht3', textEn: 'What new practice would support my growth right now?', textFr: 'Quelle nouvelle pratique soutiendrait ma croissance en ce moment ?' },
  ],
  self_discovery_deep: [
    { id: 'hs_sd1', textEn: 'What truth about myself am I only just beginning to see?', textFr: 'Quelle vérité sur moi-même suis-je en train de commencer à voir ?' },
    { id: 'hs_sd2', textEn: 'What strength do I possess that I haven\'t fully claimed?', textFr: 'Quelle force est-ce que je possède sans l\'avoir pleinement revendiquée ?' },
    { id: 'hs_sd3', textEn: 'What would change if I truly accepted who I am?', textFr: 'Qu\'est-ce qui changerait si j\'acceptais vraiment qui je suis ?' },
  ],
  growth_catalyst: [
    { id: 'hs_gc1', textEn: 'What is the universe catalyzing in my personal evolution?', textFr: 'Que catalyse l\'univers dans mon évolution personnelle ?' },
    { id: 'hs_gc2', textEn: 'What resistance in me is actually pointing toward my next breakthrough?', textFr: 'Quelle résistance en moi pointe en réalité vers ma prochaine percée ?' },
    { id: 'hs_gc3', textEn: 'What would I dare to become if fear wasn\'t a factor?', textFr: 'Que deviendrais-je si la peur n\'était pas un facteur ?' },
  ],
};

// Helper text for custom questions
export const HORSESHOE_CUSTOM_QUESTION_HELPER = {
  en: 'Open-ended questions work best. Try "What do I need to understand about..." or "How can I..."',
  fr: 'Les questions ouvertes fonctionnent mieux. Essayez "Que dois-je comprendre sur..." ou "Comment puis-je..."',
};

// Helper to get category config by id
export function getHorseshoeCategory(id: HorseshoeCategory): HorseshoeCategoryConfig | undefined {
  return HORSESHOE_CATEGORIES.find(c => c.id === id);
}

// Helper to get questions for a layout
export function getHorseshoeQuestions(layoutId: HorseshoeLayoutId): HorseshoeQuestion[] {
  return HORSESHOE_LAYOUT_QUESTIONS[layoutId] || [];
}