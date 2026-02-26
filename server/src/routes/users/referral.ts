/**
 * Users Routes - Referral System
 *
 * Endpoints:
 * - POST /me/redeem-referral - Redeem a referral code for +5 credits (both users)
 * - POST /me/referral-invite - Send a referral invitation email
 */

import {
  Router,
  z,
  prisma,
  requireAuth,
  creditService,
  CREDIT_COSTS,
  NotFoundError,
  ConflictError,
  logger,
} from './shared.js';
import { sendReferralInviteEmail, sendReferralRedeemedEmail } from '../../services/email.js';

const router = Router();

// ============================================
// REDEEM REFERRAL CODE
// ============================================

const redeemSchema = z.object({
  code: z.string().min(1).max(20).trim().toUpperCase(),
});

router.post('/me/redeem-referral', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { code } = redeemSchema.parse(req.body);

    // 1. Find the current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, referralCode: true, referredById: true },
    });

    if (!currentUser) {
      throw new NotFoundError('User', userId);
    }

    // 2. Check if already redeemed a referral
    if (currentUser.referredById) {
      throw new ConflictError('You have already redeemed a referral code');
    }

    // 3. Cannot use your own code
    if (currentUser.referralCode === code) {
      return res.status(400).json({
        error: 'Cannot use your own referral code',
      });
    }

    // 4. Find the referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, username: true, email: true, language: true },
    });

    if (!referrer) {
      return res.status(404).json({
        error: 'Invalid referral code',
      });
    }

    // 5. Award credits to both users and set referredById (atomic)
    const bonusAmount = CREDIT_COSTS.REFERRAL_BONUS;

    // Award to referee (current user)
    const refereeResult = await creditService.addCredits({
      userId,
      amount: bonusAmount,
      type: 'REFERRAL_BONUS',
      description: `Referral bonus - used code from ${referrer.username}`,
    });

    if (!refereeResult.success) {
      throw new Error(refereeResult.error || 'Failed to award referral bonus');
    }

    // Award to referrer
    const referrerResult = await creditService.addCredits({
      userId: referrer.id,
      amount: bonusAmount,
      type: 'REFERRAL_BONUS',
      description: `Referral bonus - ${currentUser.referralCode} used your code`,
    });

    if (!referrerResult.success) {
      logger.warn(`Failed to award referrer bonus to ${referrer.id}: ${referrerResult.error}`);
    }

    // Set referredById
    await prisma.user.update({
      where: { id: userId },
      data: { referredById: referrer.id },
    });

    logger.info(`Referral redeemed: ${userId} used code ${code} from ${referrer.id}`);

    // 7. Notify the referrer by email (fire-and-forget, don't block the response)
    if (referrer.email) {
      const referrerLang = (referrer.language === 'fr' ? 'fr' : 'en') as 'en' | 'fr';
      sendReferralRedeemedEmail(
        referrer.email,
        referrer.username,
        currentUser.username,
        bonusAmount,
        referrerLang
      ).catch(err => {
        logger.warn(`Failed to send referral redeemed email to ${referrer.id}: ${err}`);
      });
    }

    res.json({
      success: true,
      message: `Referral code redeemed! You and ${referrer.username} each earned ${bonusAmount} credits.`,
      creditsAwarded: bonusAmount,
      newBalance: refereeResult.newBalance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid referral code format' });
    }
    next(error);
  }
});

// ============================================
// SEND REFERRAL INVITATION EMAIL
// ============================================

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  friendName: z.string().max(50).optional(),
});

router.post('/me/referral-invite', requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { email, friendName } = inviteSchema.parse(req.body);

    // 1. Fetch the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, referralCode: true, language: true },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // 2. Send the email
    const language = (user.language === 'fr' ? 'fr' : 'en') as 'en' | 'fr';
    const success = await sendReferralInviteEmail(
      email,
      friendName || '',
      user.username,
      user.referralCode,
      language
    );

    if (!success) {
      return res.status(500).json({ error: 'Failed to send invitation email' });
    }

    logger.info(`Referral invite sent by ${userId} to ${email}`);

    res.json({
      success: true,
      message:
        language === 'fr' ? 'Invitation envoyée avec succès !' : 'Invitation sent successfully!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Invalid input' });
    }
    next(error);
  }
});

export default router;
