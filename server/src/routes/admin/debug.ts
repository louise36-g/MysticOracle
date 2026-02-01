/**
 * Admin Routes - Debug Endpoints for Error Scenario Testing
 */

import { Router, z, prisma, creditService } from './shared.js';
import { SpreadType, InterpretationStyle } from '@prisma/client';
import { logError } from './maintenance.js';

const router = Router();

// ============================================
// DEBUG SCHEMAS
// ============================================

const debugDeductSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().min(1),
  simulateFailure: z.boolean().optional(),
});

const debugRefundSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().min(1),
  reason: z.string().min(1),
  originalTransactionId: z.string().optional(),
});

const debugReadingSchema = z.object({
  userId: z.string().min(1),
  spreadType: z.string().default('SINGLE'),
  simulateReadingFailure: z.boolean().optional(),
  simulateAIFailure: z.boolean().optional(),
});

const debugFollowUpSchema = z.object({
  userId: z.string().min(1),
  readingId: z.string().min(1),
  simulateFailure: z.boolean().optional(),
});

// ============================================
// DEBUG ENDPOINTS
// ============================================

// GET /api/admin/debug/info
// Returns information about available debug endpoints
router.get('/info', (req, res) => {
  res.json({
    description: 'Debug endpoints for testing error handling scenarios',
    endpoints: [
      {
        method: 'POST',
        path: '/debug/credit-deduction',
        description: 'Test credit deduction with optional simulated failure',
        params: { userId: 'string', amount: 'number', simulateFailure: 'boolean?' },
      },
      {
        method: 'POST',
        path: '/debug/credit-refund',
        description: 'Test manual credit refund',
        params: {
          userId: 'string',
          amount: 'number',
          reason: 'string',
          originalTransactionId: 'string?',
        },
      },
      {
        method: 'POST',
        path: '/debug/reading-creation',
        description: 'Test reading creation with optional failures',
        params: {
          userId: 'string',
          spreadType: 'string?',
          simulateReadingFailure: 'boolean?',
          simulateAIFailure: 'boolean?',
        },
      },
      {
        method: 'POST',
        path: '/debug/follow-up-creation',
        description: 'Test follow-up creation with optional failure',
        params: { userId: 'string', readingId: 'string', simulateFailure: 'boolean?' },
      },
      {
        method: 'GET',
        path: '/debug/user-credit-history/:userId',
        description: 'Get recent credit transactions for a user',
      },
    ],
    warning: 'These endpoints modify real data. Use with caution.',
  });
});

// POST /api/admin/debug/credit-deduction
// Test credit deduction scenario
router.post('/credit-deduction', async (req, res) => {
  try {
    const { userId, amount, simulateFailure } = debugDeductSchema.parse(req.body);

    // Check user exists first
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If simulating failure, return a mock failure response
    if (simulateFailure) {
      logError({
        level: 'info',
        source: 'debug/credit-deduction',
        message: `Simulated deduction failure for user ${userId}`,
        details: JSON.stringify({ amount, simulatedFailure: true }),
        userId,
      });

      return res.json({
        success: false,
        simulated: true,
        error: 'Simulated credit deduction failure',
        errorCode: 'CREDIT_DEDUCTION_FAILED',
        beforeBalance: user.credits,
        afterBalance: user.credits,
        message: 'This was a simulated failure - no credits were deducted',
      });
    }

    // Perform real deduction
    const result = await creditService.deductCredits({
      userId,
      amount,
      type: 'READING',
      description: `[DEBUG] Test deduction by admin`,
    });

    logError({
      level: 'info',
      source: 'debug/credit-deduction',
      message: `Debug credit deduction for user ${userId}: ${result.success ? 'success' : 'failed'}`,
      details: JSON.stringify({ amount, result }),
      userId,
    });

    res.json({
      success: result.success,
      simulated: false,
      beforeBalance: user.credits,
      afterBalance: result.newBalance,
      transactionId: result.transactionId,
      error: result.error,
    });
  } catch (error) {
    console.error('[Debug] Credit deduction error:', error);
    res.status(500).json({ error: 'Debug credit deduction failed' });
  }
});

// POST /api/admin/debug/credit-refund
// Test credit refund scenario
router.post('/credit-refund', async (req, res) => {
  try {
    const { userId, amount, reason, originalTransactionId } = debugRefundSchema.parse(req.body);

    // Check user exists first
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Perform refund
    const result = await creditService.refundCredits(
      userId,
      amount,
      `[DEBUG] ${reason}`,
      originalTransactionId
    );

    logError({
      level: 'info',
      source: 'debug/credit-refund',
      message: `Debug credit refund for user ${userId}: ${result.success ? 'success' : 'failed'}`,
      details: JSON.stringify({ amount, reason, result }),
      userId,
    });

    res.json({
      success: result.success,
      beforeBalance: user.credits,
      afterBalance: result.newBalance,
      transactionId: result.transactionId,
      error: result.error,
    });
  } catch (error) {
    console.error('[Debug] Credit refund error:', error);
    res.status(500).json({ error: 'Debug credit refund failed' });
  }
});

// POST /api/admin/debug/reading-creation
// Test reading creation with deduct-first pattern
router.post('/reading-creation', async (req, res) => {
  try {
    const { userId, spreadType, simulateReadingFailure, simulateAIFailure } =
      debugReadingSchema.parse(req.body);

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const initialBalance = user.credits;

    // Get credit cost for spread type
    const creditCost = creditService.getSpreadCost(spreadType);

    // Simulate AI failure before any credit operations
    if (simulateAIFailure) {
      logError({
        level: 'info',
        source: 'debug/reading-creation',
        message: `Simulated AI failure for user ${userId} - no credits deducted`,
        details: JSON.stringify({ spreadType, simulatedAIFailure: true }),
        userId,
      });

      return res.json({
        success: false,
        simulated: true,
        errorType: 'AI_FAILURE',
        error: 'Simulated AI generation failure',
        errorCode: 'AI_GENERATION_FAILED',
        creditCost,
        initialBalance,
        finalBalance: initialBalance,
        creditsDeducted: false,
        refunded: false,
        message: 'AI failures happen before credit deduction - no credits were affected',
      });
    }

    // Check sufficient credits
    const balanceCheck = await creditService.checkSufficientCredits(userId, creditCost);
    if (!balanceCheck.sufficient) {
      return res.json({
        success: false,
        error: `Insufficient credits: have ${balanceCheck.balance}, need ${creditCost}`,
        errorCode: 'INSUFFICIENT_CREDITS',
        creditCost,
        initialBalance,
        finalBalance: initialBalance,
      });
    }

    // Step 1: Deduct credits FIRST
    const deductResult = await creditService.deductCredits({
      userId,
      amount: creditCost,
      type: 'READING',
      description: `[DEBUG] ${spreadType} reading test`,
    });

    if (!deductResult.success) {
      return res.json({
        success: false,
        error: deductResult.error,
        errorCode: 'CREDIT_DEDUCTION_FAILED',
        creditCost,
        initialBalance,
        finalBalance: initialBalance,
      });
    }

    // Step 2: Simulate reading creation
    if (simulateReadingFailure) {
      // Reading failed - REFUND credits
      const refundResult = await creditService.refundCredits(
        userId,
        creditCost,
        '[DEBUG] Simulated reading creation failure',
        deductResult.transactionId
      );

      logError({
        level: 'info',
        source: 'debug/reading-creation',
        message: `Simulated reading failure with refund for user ${userId}`,
        details: JSON.stringify({
          spreadType,
          creditCost,
          deductTransactionId: deductResult.transactionId,
          refundSuccess: refundResult.success,
          refundTransactionId: refundResult.transactionId,
        }),
        userId,
      });

      return res.json({
        success: false,
        simulated: true,
        errorType: 'READING_CREATION_FAILURE',
        error: 'Simulated reading creation failure - credits refunded',
        errorCode: 'INTERNAL_ERROR',
        creditCost,
        initialBalance,
        balanceAfterDeduct: deductResult.newBalance,
        finalBalance: refundResult.newBalance,
        creditsDeducted: true,
        refunded: refundResult.success,
        deductTransactionId: deductResult.transactionId,
        refundTransactionId: refundResult.transactionId,
        message: 'Deduct-first pattern working: credits were deducted, then refunded on failure',
      });
    }

    // Step 3: Create actual test reading
    const reading = await prisma.reading.create({
      data: {
        userId,
        spreadType: spreadType.toUpperCase() as SpreadType,
        interpretationStyle: InterpretationStyle.CLASSIC,
        question: '[DEBUG] Test reading for error scenario testing',
        interpretation: '[DEBUG] This is a test reading created by admin debug endpoint.',
        cards: [{ cardId: 0, position: 0, isReversed: false }],
        creditCost,
      },
    });

    logError({
      level: 'info',
      source: 'debug/reading-creation',
      message: `Debug reading created successfully for user ${userId}`,
      details: JSON.stringify({ readingId: reading.id, spreadType, creditCost }),
      userId,
    });

    res.json({
      success: true,
      simulated: false,
      readingId: reading.id,
      creditCost,
      initialBalance,
      finalBalance: deductResult.newBalance,
      transactionId: deductResult.transactionId,
      message: 'Reading created successfully with proper credit deduction',
    });
  } catch (error) {
    console.error('[Debug] Reading creation error:', error);
    res.status(500).json({ error: 'Debug reading creation failed' });
  }
});

// POST /api/admin/debug/follow-up-creation
// Test follow-up creation with deduct-first pattern
router.post('/follow-up-creation', async (req, res) => {
  try {
    const { userId, readingId, simulateFailure } = debugFollowUpSchema.parse(req.body);

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check reading exists and belongs to user
    const reading = await prisma.reading.findFirst({
      where: { id: readingId, userId },
    });
    if (!reading) {
      return res.status(404).json({ error: 'Reading not found or does not belong to user' });
    }

    const initialBalance = user.credits;
    const creditCost = 1; // Follow-up cost

    // Check sufficient credits
    const balanceCheck = await creditService.checkSufficientCredits(userId, creditCost);
    if (!balanceCheck.sufficient) {
      return res.json({
        success: false,
        error: `Insufficient credits: have ${balanceCheck.balance}, need ${creditCost}`,
        errorCode: 'INSUFFICIENT_CREDITS',
        creditCost,
        initialBalance,
        finalBalance: initialBalance,
      });
    }

    // Step 1: Deduct credits FIRST
    const deductResult = await creditService.deductCredits({
      userId,
      amount: creditCost,
      type: 'QUESTION',
      description: '[DEBUG] Follow-up question test',
    });

    if (!deductResult.success) {
      return res.json({
        success: false,
        error: deductResult.error,
        errorCode: 'CREDIT_DEDUCTION_FAILED',
        creditCost,
        initialBalance,
        finalBalance: initialBalance,
      });
    }

    // Step 2: Simulate follow-up creation
    if (simulateFailure) {
      // Follow-up failed - REFUND credits
      const refundResult = await creditService.refundCredits(
        userId,
        creditCost,
        '[DEBUG] Simulated follow-up creation failure',
        deductResult.transactionId
      );

      logError({
        level: 'info',
        source: 'debug/follow-up-creation',
        message: `Simulated follow-up failure with refund for user ${userId}`,
        details: JSON.stringify({
          readingId,
          creditCost,
          deductTransactionId: deductResult.transactionId,
          refundSuccess: refundResult.success,
        }),
        userId,
      });

      return res.json({
        success: false,
        simulated: true,
        error: 'Simulated follow-up creation failure - credits refunded',
        errorCode: 'INTERNAL_ERROR',
        creditCost,
        initialBalance,
        balanceAfterDeduct: deductResult.newBalance,
        finalBalance: refundResult.newBalance,
        creditsDeducted: true,
        refunded: refundResult.success,
        deductTransactionId: deductResult.transactionId,
        refundTransactionId: refundResult.transactionId,
        message: 'Deduct-first pattern working: credits were deducted, then refunded on failure',
      });
    }

    // Step 3: Create actual test follow-up
    const followUp = await prisma.followUpQuestion.create({
      data: {
        readingId,
        question: '[DEBUG] Test follow-up question for error scenario testing',
        answer: '[DEBUG] This is a test follow-up created by admin debug endpoint.',
        creditCost,
      },
    });

    logError({
      level: 'info',
      source: 'debug/follow-up-creation',
      message: `Debug follow-up created successfully for user ${userId}`,
      details: JSON.stringify({ followUpId: followUp.id, readingId, creditCost }),
      userId,
    });

    res.json({
      success: true,
      simulated: false,
      followUpId: followUp.id,
      readingId,
      creditCost,
      initialBalance,
      finalBalance: deductResult.newBalance,
      transactionId: deductResult.transactionId,
      message: 'Follow-up created successfully with proper credit deduction',
    });
  } catch (error) {
    console.error('[Debug] Follow-up creation error:', error);
    res.status(500).json({ error: 'Debug follow-up creation failed' });
  }
});

// GET /api/admin/debug/user-credit-history/:userId
// Get recent credit transactions for debugging
router.get('/user-credit-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        credits: true,
        totalCreditsEarned: true,
        totalCreditsSpent: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        paymentStatus: true,
        createdAt: true,
      },
    });

    res.json({
      user,
      transactions,
      summary: {
        currentBalance: user.credits,
        totalEarned: user.totalCreditsEarned,
        totalSpent: user.totalCreditsSpent,
        recentTransactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error('[Debug] User credit history error:', error);
    res.status(500).json({ error: 'Failed to fetch user credit history' });
  }
});

export default router;
