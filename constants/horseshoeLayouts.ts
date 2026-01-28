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
