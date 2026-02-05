import { SpreadConfig, SpreadType, TarotCard } from './types';

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, nameEn: "The Fool", nameFr: "Le Mat", image: "https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg", keywordsEn: ["Beginnings", "Innocence", "Spontaneity"], keywordsFr: ["Commencement", "Innocence", "Spontanéité"] },
  { id: 1, nameEn: "The Magician", nameFr: "Le Bateleur", image: "https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg", keywordsEn: ["Manifestation", "Power", "Action"], keywordsFr: ["Manifestation", "Pouvoir", "Action"] },
  { id: 2, nameEn: "The High Priestess", nameFr: "La Papesse", image: "https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg", keywordsEn: ["Intuition", "Mystery", "Subconscious"], keywordsFr: ["Intuition", "Mystère", "Subconscient"] },
  { id: 3, nameEn: "The Empress", nameFr: "L'Impératrice", image: "https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg", keywordsEn: ["Fertility", "Nature", "Abundance"], keywordsFr: ["Fertilité", "Nature", "Abondance"] },
  { id: 4, nameEn: "The Emperor", nameFr: "L'Empereur", image: "https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg", keywordsEn: ["Authority", "Structure", "Control"], keywordsFr: ["Autorité", "Structure", "Contrôle"] },
  { id: 5, nameEn: "The Hierophant", nameFr: "Le Pape", image: "https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg", keywordsEn: ["Tradition", "Conformity", "Morality"], keywordsFr: ["Tradition", "Conformité", "Moralité"] },
  { id: 6, nameEn: "The Lovers", nameFr: "L'Amoureux", image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/RWS_Tarot_06_Lovers.jpg", keywordsEn: ["Love", "Harmony", "Choices"], keywordsFr: ["Amour", "Harmonie", "Choix"] },
  { id: 7, nameEn: "The Chariot", nameFr: "Le Chariot", image: "https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg", keywordsEn: ["Control", "Willpower", "Victory"], keywordsFr: ["Contrôle", "Volonté", "Victoire"] },
  { id: 8, nameEn: "Strength", nameFr: "La Force", image: "https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg", keywordsEn: ["Courage", "Persuasion", "Influence"], keywordsFr: ["Courage", "Persuasion", "Influence"] },
  { id: 9, nameEn: "The Hermit", nameFr: "L'Hermite", image: "https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg", keywordsEn: ["Introspection", "Solitude", "Guidance"], keywordsFr: ["Introspection", "Solitude", "Guidance"] },
  { id: 10, nameEn: "Wheel of Fortune", nameFr: "La Roue de Fortune", image: "https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg", keywordsEn: ["Luck", "Karma", "Cycles"], keywordsFr: ["Chance", "Karma", "Cycles"] },
  { id: 11, nameEn: "Justice", nameFr: "La Justice", image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg", keywordsEn: ["Justice", "Truth", "Law"], keywordsFr: ["Justice", "Vérité", "Loi"] },
  { id: 12, nameEn: "The Hanged Man", nameFr: "Le Pendu", image: "https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg", keywordsEn: ["Sacrifice", "Release", "New Perspective"], keywordsFr: ["Sacrifice", "Lâcher-prise", "Nouvelle Perspective"] },
  { id: 13, nameEn: "Death", nameFr: "L'Arcane sans nom", image: "https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg", keywordsEn: ["Endings", "Change", "Transformation"], keywordsFr: ["Fins", "Changement", "Transformation"] },
  { id: 14, nameEn: "Temperance", nameFr: "Tempérance", image: "https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg", keywordsEn: ["Balance", "Moderation", "Patience"], keywordsFr: ["Équilibre", "Modération", "Patience"] },
  { id: 15, nameEn: "The Devil", nameFr: "Le Diable", image: "https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg", keywordsEn: ["Shadow Self", "Attachment", "Restriction"], keywordsFr: ["Ombre", "Attachement", "Restriction"] },
  { id: 16, nameEn: "The Tower", nameFr: "La Maison Dieu", image: "https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg", keywordsEn: ["Sudden Change", "Upheaval", "Chaos"], keywordsFr: ["Changement Soudain", "Bouleversement", "Chaos"] },
  { id: 17, nameEn: "The Star", nameFr: "L'Étoile", image: "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg", keywordsEn: ["Hope", "Faith", "Purpose"], keywordsFr: ["Espoir", "Foi", "But"] },
  { id: 18, nameEn: "The Moon", nameFr: "La Lune", image: "https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg", keywordsEn: ["Illusion", "Fear", "Anxiety"], keywordsFr: ["Illusion", "Peur", "Anxiété"] },
  { id: 19, nameEn: "The Sun", nameFr: "Le Soleil", image: "https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg", keywordsEn: ["Positivity", "Fun", "Warmth"], keywordsFr: ["Positivité", "Amusement", "Chaleur"] },
  { id: 20, nameEn: "Judgement", nameFr: "Le Jugement", image: "https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg", keywordsEn: ["Judgement", "Rebirth", "Inner Calling"], keywordsFr: ["Jugement", "Renaissance", "Appel Intérieur"] },
  { id: 21, nameEn: "The World", nameFr: "Le Monde", image: "https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg", keywordsEn: ["Completion", "Integration", "Accomplishment"], keywordsFr: ["Achèvement", "Intégration", "Accomplissement"] },
];

// Minor Arcana Generation
const SUITS = [
  { nameEn: 'Wands', nameFr: 'Bâtons', icon: '🪄' },
  { nameEn: 'Cups', nameFr: 'Coupes', icon: '🏆' },
  { nameEn: 'Swords', nameFr: 'Épées', icon: '⚔️' },
  { nameEn: 'Pentacles', nameFr: 'Deniers', icon: '🪙' }
];

const RANKS = [
  { nameEn: 'Ace', nameFr: 'As', value: 1 },
  { nameEn: 'Two', nameFr: 'Deux', value: 2 },
  { nameEn: 'Three', nameFr: 'Trois', value: 3 },
  { nameEn: 'Four', nameFr: 'Quatre', value: 4 },
  { nameEn: 'Five', nameFr: 'Cinq', value: 5 },
  { nameEn: 'Six', nameFr: 'Six', value: 6 },
  { nameEn: 'Seven', nameFr: 'Sept', value: 7 },
  { nameEn: 'Eight', nameFr: 'Huit', value: 8 },
  { nameEn: 'Nine', nameFr: 'Neuf', value: 9 },
  { nameEn: 'Ten', nameFr: 'Dix', value: 10 },
  { nameEn: 'Page', nameFr: 'Valet', value: 11 },
  { nameEn: 'Knight', nameFr: 'Cavalier', value: 12 },
  { nameEn: 'Queen', nameFr: 'Reine', value: 13 },
  { nameEn: 'King', nameFr: 'Roi', value: 14 }
];

export const MINOR_ARCANA: TarotCard[] = [];

let idCounter = 22;

SUITS.forEach(suit => {
  RANKS.forEach(rank => {
    MINOR_ARCANA.push({
      id: idCounter++,
      nameEn: `${rank.nameEn} of ${suit.nameEn}`,
      nameFr: `${rank.nameFr} de ${suit.nameFr}`,
      // We use a prefix 'placeholder:' to let the Card component know to render a generated UI
      // since we don't have stable URLs for all 56 Minor Arcana cards yet.
      image: `placeholder:${suit.icon}`, 
      keywordsEn: [suit.nameEn, rank.nameEn, 'Minor Arcana'],
      keywordsFr: [suit.nameFr, rank.nameFr, 'Arcanes Mineurs']
    });
  });
});

export const FULL_DECK: TarotCard[] = [...MAJOR_ARCANA, ...MINOR_ARCANA];

// Active spreads available for selection (LOVE and CAREER now available as 5-card layouts)
export const SPREADS: Partial<Record<SpreadType, SpreadConfig>> = {
  [SpreadType.SINGLE]: {
    id: SpreadType.SINGLE,
    nameEn: "Single Card Spreads",
    nameFr: "Tirages à Carte Unique",
    cost: 1,
    positions: 1,
    positionMeaningsEn: ["Guidance"],
    positionMeaningsFr: ["Guidance"]
  },
  [SpreadType.THREE_CARD]: {
    id: SpreadType.THREE_CARD,
    nameEn: "3 Card Spreads",
    nameFr: "Tirages à 3 Cartes",
    cost: 3,
    positions: 3,
    positionMeaningsEn: ["The Past", "The Present", "The Future"],
    positionMeaningsFr: ["Le Passé", "Le Présent", "Le Futur"]
  },
  [SpreadType.FIVE_CARD]: {
    id: SpreadType.FIVE_CARD,
    nameEn: "5 Card Spreads",
    nameFr: "Tirages à 5 Cartes",
    cost: 5,
    positions: 5,
    // Default positions - these get overridden by layout selection
    positionMeaningsEn: ["First", "Second", "Third", "Fourth", "Fifth"],
    positionMeaningsFr: ["Premier", "Deuxième", "Troisième", "Quatrième", "Cinquième"]
  },
  // Note: LOVE and CAREER spread types kept in SpreadType enum for backward compatibility
  // but removed from SPREADS display - now available as 5-card layouts
  [SpreadType.HORSESHOE]: {
    id: SpreadType.HORSESHOE,
    nameEn: "Horseshoe Spreads",
    nameFr: "Tirages en Fer à Cheval",
    cost: 7,
    positions: 7,
    positionMeaningsEn: ["Past", "Present", "Hidden Influences", "Obstacles", "External Influences", "Advice", "Outcome"],
    positionMeaningsFr: ["Passé", "Présent", "Influences Cachées", "Obstacles", "Influences Externes", "Conseil", "Résultat"]
  },
  [SpreadType.CELTIC_CROSS]: {
    id: SpreadType.CELTIC_CROSS,
    nameEn: "Celtic Cross",
    nameFr: "Croix Celtique",
    cost: 10,
    positions: 10,
    positionMeaningsEn: ["Present", "Challenge", "Past", "Future", "Above", "Below", "Advice", "External Influences", "Hopes/Fears", "Outcome"],
    positionMeaningsFr: ["Présent", "Défi", "Passé", "Futur", "Dessus", "Dessous", "Conseil", "Influences Externes", "Espoirs/Peurs", "Résultat"]
  }
};
