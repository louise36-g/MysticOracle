
export type Language = 'en' | 'fr';

export interface TarotCard {
  id: number;
  nameEn: string;
  nameFr: string;
  image: string; // URL or placeholder identifier
  keywordsEn: string[];
  keywordsFr: string[];
}

export enum SpreadType {
  SINGLE = 'single',
  TWO_CARD = 'two_card',
  THREE_CARD = 'three_card',
  FIVE_CARD = 'five_card',
  LOVE = 'love',
  CAREER = 'career',
  HORSESHOE = 'horseshoe',
  CELTIC_CROSS = 'celtic_cross'
}

// Reading categories (category-first UX)
export type ReadingCategory = 'general' | 'love' | 'career' | 'life_path' | 'growth' | 'birth_cards';

// Depth options (maps to card counts)
export type ReadingDepth = 1 | 2 | 3 | 5 | 7 | 10;
export type BirthCardDepth = 1 | 2 | 3;

// Map depth to SpreadType
export const DEPTH_TO_SPREAD: Record<ReadingDepth, SpreadType> = {
  1: SpreadType.SINGLE,
  2: SpreadType.TWO_CARD,
  3: SpreadType.THREE_CARD,
  5: SpreadType.FIVE_CARD,
  7: SpreadType.HORSESHOE,
  10: SpreadType.CELTIC_CROSS,
};

export enum InterpretationStyle {
  CLASSIC = 'classic',
  SPIRITUAL = 'spiritual',
  PSYCHO_EMOTIONAL = 'psycho_emotional',
  NUMEROLOGY = 'numerology',
  ELEMENTAL = 'elemental'
}

export interface SpreadConfig {
  id: SpreadType;
  nameEn: string;
  nameFr: string;
  cost: number;
  positions: number; // Number of cards
  positionMeaningsEn: string[];
  positionMeaningsFr: string[];
}

export type AccountStatus = 'active' | 'flagged' | 'suspended';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // In a real app, this is hashed on backend. Here we simulate.
  credits: number;
  totalQuestionsAsked: number;
  totalReadings: number;
  referralCode: string;
  referredBy?: string;
  joinDate: string;
  lastLoginDate: string;
  loginStreak: number;

  // Verification & Security
  emailVerified: boolean;
  accountStatus: AccountStatus;
  verificationToken?: string;
  verificationTokenExpires?: number; // Timestamp
  verificationAttempts: number;
  lastVerificationAttempt?: number; // Timestamp

  // Achievements & Progress
  achievements: string[]; // IDs of unlocked achievements
  spreadsUsed: string[]; // SpreadTypes used (for "all spreads" achievement)

  // Admin
  isAdmin?: boolean;

  language: Language;
}

export interface ReadingCard {
  cardId: string;
  position: number;
  isReversed?: boolean;
}

export interface ReadingHistoryItem {
  id: string;
  date: string;
  spreadType: SpreadType;
  cards: ReadingCard[] | unknown; // Array of { cardId, position, isReversed } - flexible for legacy data
  interpretation: string;
  question?: string;
  userId?: string; // Optional for backwards compatibility
}

export interface Achievement {
  id: string;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  reward: number; // Credits
  unlocked: boolean;
  unlockedAt?: string;
}

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  { id: 'first_reading', nameEn: 'First Steps', nameFr: 'Premiers Pas', descriptionEn: 'Complete your first reading', descriptionFr: 'Complétez votre première lecture', reward: 3 },
  { id: 'five_readings', nameEn: 'Seeker', nameFr: 'Chercheur', descriptionEn: 'Complete 5 readings', descriptionFr: 'Complétez 5 lectures', reward: 5 },
  { id: 'ten_readings', nameEn: 'Adept', nameFr: 'Adepte', descriptionEn: 'Complete 10 readings', descriptionFr: 'Complétez 10 lectures', reward: 10 },
  { id: 'oracle', nameEn: 'Oracle', nameFr: 'Oracle', descriptionEn: 'Complete 25 readings', descriptionFr: 'Complétez 25 lectures', reward: 15 },
  { id: 'celtic_master', nameEn: 'Celtic Master', nameFr: 'Maître Celtique', descriptionEn: 'Complete a Celtic Cross reading', descriptionFr: 'Complétez une lecture Croix Celtique', reward: 5 },
  { id: 'all_spreads', nameEn: 'Spread Explorer', nameFr: 'Explorateur', descriptionEn: 'Try all spread types', descriptionFr: 'Essayez tous les types de tirage', reward: 10 },
  { id: 'week_streak', nameEn: 'Devoted', nameFr: 'Dévoué', descriptionEn: 'Login 7 days in a row', descriptionFr: 'Connectez-vous 7 jours de suite', reward: 10 },
  { id: 'true_believer', nameEn: 'True Believer', nameFr: 'Vrai Croyant', descriptionEn: 'Login 30 days in a row', descriptionFr: 'Connectez-vous 30 jours de suite', reward: 20 },
  { id: 'lunar_cycle', nameEn: 'Lunar Cycle', nameFr: 'Cycle Lunaire', descriptionEn: 'Complete readings in 4 different weeks', descriptionFr: 'Complétez des lectures sur 4 semaines différentes', reward: 10 },
  { id: 'question_seeker', nameEn: 'Question Seeker', nameFr: 'Chercheur de Réponses', descriptionEn: 'Ask a follow-up question', descriptionFr: 'Posez une question de suivi', reward: 2 },
  { id: 'full_moon_reader', nameEn: 'Full Moon Reader', nameFr: 'Lecteur de Pleine Lune', descriptionEn: 'Complete a reading during a full moon', descriptionFr: 'Complétez une lecture pendant la pleine lune', reward: 5 },
  { id: 'share_reading', nameEn: 'Sharing is Caring', nameFr: 'Partage', descriptionEn: 'Share a reading', descriptionFr: 'Partagez une lecture', reward: 3 },
];
