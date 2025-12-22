
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
  THREE_CARD = 'three_card',
  LOVE = 'love',
  CAREER = 'career',
  WEEK_AHEAD = 'week_ahead',
  CELTIC_CROSS = 'celtic_cross'
}

export enum InterpretationStyle {
  CLASSIC = 'classic',
  SPIRITUAL = 'spiritual',
  PSYCHO_EMOTIONAL = 'psycho_emotional',
  METAPHYSICAL = 'metaphysical',
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

  language: Language;
}

export interface ReadingHistoryItem {
  id: string;
  date: string;
  spreadType: SpreadType;
  cards: number[]; // IDs of drawn cards
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
  { id: 'celtic_master', nameEn: 'Celtic Master', nameFr: 'Maître Celtique', descriptionEn: 'Complete a Celtic Cross reading', descriptionFr: 'Complétez une lecture Croix Celtique', reward: 5 },
  { id: 'all_spreads', nameEn: 'Spread Explorer', nameFr: 'Explorateur', descriptionEn: 'Try all spread types', descriptionFr: 'Essayez tous les types de tirage', reward: 10 },
  { id: 'week_streak', nameEn: 'Devoted', nameFr: 'Dévoué', descriptionEn: 'Login 7 days in a row', descriptionFr: 'Connectez-vous 7 jours de suite', reward: 10 },
  { id: 'share_reading', nameEn: 'Sharing is Caring', nameFr: 'Partage', descriptionEn: 'Share a reading', descriptionFr: 'Partagez une lecture', reward: 3 },
];
