/**
 * ExportUserData Use Case
 * GDPR Article 20 - Right to data portability
 * Returns all user data in a portable format
 */

import { PrismaClient } from '@prisma/client';
import type { IUserRepository } from '../../ports/repositories/IUserRepository.js';

export interface ExportUserDataInput {
  userId: string;
}

export interface ExportedUserProfile {
  email: string;
  username: string;
  language: string;
  createdAt: string;
  credits: number;
  totalReadings: number;
  totalQuestions: number;
  loginStreak: number;
  lastLoginDate: string;
}

export interface ExportedReading {
  id: string;
  spreadType: string;
  interpretationStyle: string;
  question: string | null;
  interpretation: string;
  themes: string[];
  userReflection: string | null;
  creditCost: number;
  createdAt: string;
  followUps: Array<{
    question: string;
    answer: string;
    createdAt: string;
  }>;
}

export interface ExportedTransaction {
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface ExportedAchievement {
  achievementId: string;
  unlockedAt: string;
}

export interface ExportUserDataResult {
  success: boolean;
  data?: {
    profile: ExportedUserProfile;
    readings: ExportedReading[];
    transactions: ExportedTransaction[];
    achievements: ExportedAchievement[];
    exportedAt: string;
  };
  error?: string;
  errorCode?: 'USER_NOT_FOUND' | 'INTERNAL_ERROR';
}

export class ExportUserDataUseCase {
  constructor(
    private prisma: PrismaClient,
    private userRepository: IUserRepository
  ) {}

  async execute(input: ExportUserDataInput): Promise<ExportUserDataResult> {
    try {
      // Fetch user with all related data in a single query
      const user = await this.prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          achievements: true,
          readings: {
            include: { followUps: true },
            orderBy: { createdAt: 'desc' },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          errorCode: 'USER_NOT_FOUND',
        };
      }

      // Format data for export (exclude internal fields like isAdmin, accountStatus)
      const exportData = {
        profile: {
          email: user.email,
          username: user.username,
          language: user.language,
          createdAt: user.createdAt.toISOString(),
          credits: user.credits,
          totalReadings: user.totalReadings,
          totalQuestions: user.totalQuestions,
          loginStreak: user.loginStreak,
          lastLoginDate: user.lastLoginDate.toISOString(),
        },
        readings: user.readings.map(r => ({
          id: r.id,
          spreadType: r.spreadType,
          interpretationStyle: r.interpretationStyle,
          question: r.question,
          interpretation: r.interpretation,
          themes: r.themes,
          userReflection: r.userReflection,
          creditCost: r.creditCost,
          createdAt: r.createdAt.toISOString(),
          followUps: r.followUps.map(f => ({
            question: f.question,
            answer: f.answer,
            createdAt: f.createdAt.toISOString(),
          })),
        })),
        transactions: user.transactions.map(t => ({
          type: t.type,
          amount: t.amount,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        })),
        achievements: user.achievements.map(a => ({
          achievementId: a.achievementId,
          unlockedAt: a.unlockedAt.toISOString(),
        })),
        exportedAt: new Date().toISOString(),
      };

      return { success: true, data: exportData };
    } catch (error) {
      console.error('[ExportUserData] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export data',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export default ExportUserDataUseCase;
