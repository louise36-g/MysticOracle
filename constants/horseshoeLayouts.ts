// constants/horseshoeLayouts.ts

export type HorseshoeCategory =
  | 'love'
  | 'career'
  | 'money'
  | 'life_path'
  | 'family';

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
  | 'difficult_relatives';

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
    labelEn: 'Career & Work',
    labelFr: 'Carrière & Travail',
    taglineEn: 'Navigating professional paths',
    taglineFr: 'Naviguer les chemins professionnels',
    iconName: 'Briefcase',
    colorClass: 'blue',
    layouts: ['career_crossroads', 'career_purpose', 'workplace_conflicts', 'starting_business'],
    defaultLayout: 'career_crossroads',
  },
  {
    id: 'money',
    labelEn: 'Money & Finances',
    labelFr: 'Argent & Finances',
    taglineEn: 'Understanding abundance and security',
    taglineFr: 'Comprendre l\'abondance et la sécurité',
    iconName: 'Coins',
    colorClass: 'amber',
    layouts: ['financial_stability', 'abundance_blocks', 'money_decisions', 'financial_recovery'],
    defaultLayout: 'financial_stability',
  },
  {
    id: 'life_path',
    labelEn: 'Life Path & Major Decisions',
    labelFr: 'Chemin de Vie & Décisions',
    taglineEn: 'Finding direction and clarity',
    taglineFr: 'Trouver direction et clarté',
    iconName: 'Compass',
    colorClass: 'purple',
    layouts: ['right_path', 'life_transitions', 'major_decisions', 'whats_ahead'],
    defaultLayout: 'right_path',
  },
  {
    id: 'family',
    labelEn: 'Family & Personal',
    labelFr: 'Famille & Personnel',
    taglineEn: 'Nurturing important bonds',
    taglineFr: 'Nourrir les liens importants',
    iconName: 'Users',
    colorClass: 'teal',
    layouts: ['family_dynamics', 'parenting', 'friendships', 'difficult_relatives'],
    defaultLayout: 'family_dynamics',
  },
];