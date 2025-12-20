
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
  
  language: Language;
}

export interface ReadingHistoryItem {
  id: string;
  date: string;
  spreadType: SpreadType;
  cards: number[]; // IDs of drawn cards
  interpretation: string;
  userId?: string; // Optional for backwards compatibility
}
