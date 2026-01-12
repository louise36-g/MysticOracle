/**
 * GetUser Use Case
 * Gets detailed user information including achievements, readings, and transactions
 */

import { PrismaClient, User, UserAchievement, Reading, Transaction } from '@prisma/client';

export interface GetUserInput {
  userId: string;
}

export interface UserDetail extends User {
  achievements: UserAchievement[];
  readings: Pick<Reading, 'id' | 'spreadType' | 'createdAt' | 'creditCost'>[];
  transactions: Transaction[];
}

export interface GetUserResult {
  success: boolean;
  user?: UserDetail;
  error?: string;
}

export class GetUserUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(input: GetUserInput): Promise<GetUserResult> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          achievements: true,
          readings: {
            select: {
              id: true,
              spreadType: true,
              createdAt: true,
              creditCost: true,
              // Note: NOT including question or interpretation for privacy
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user: user as UserDetail,
      };
    } catch (error) {
      console.error('[GetUser] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user',
      };
    }
  }
}

export default GetUserUseCase;
