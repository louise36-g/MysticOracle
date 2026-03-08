/**
 * Admin Routes - User Management
 */

import {
  Router,
  prisma,
  listUsersSchema,
  updateStatusSchema,
  adjustCreditsSchema,
} from './shared.js';
import { createClerkClient } from '@clerk/backend';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { NotFoundError, ValidationError } from '../../shared/errors/ApplicationError.js';

const router = Router();

// ============================================
// USERS MANAGEMENT
// ============================================

// List users with pagination, search, and sorting
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = listUsersSchema.parse(req.query);
    const listUsersUseCase = req.container.resolve('listUsersUseCase');
    const result = await listUsersUseCase.execute(params);
    res.json(result);
  })
);

// Get single user with full details
router.get(
  '/:userId',
  asyncHandler(async (req, res) => {
    const getUserUseCase = req.container.resolve('getUserUseCase');
    const result = await getUserUseCase.execute({ userId: req.params.userId });

    if (!result.success) {
      throw new NotFoundError('User', req.params.userId);
    }

    res.json(result.user);
  })
);

// Update user status
router.patch(
  '/:userId/status',
  asyncHandler(async (req, res) => {
    const { status } = updateStatusSchema.parse(req.body);
    const updateUserStatusUseCase = req.container.resolve('updateUserStatusUseCase');
    const result = await updateUserStatusUseCase.execute({
      userId: req.params.userId,
      status,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, user: result.user });
  })
);

// Adjust user credits
router.post(
  '/:userId/credits',
  asyncHandler(async (req, res) => {
    const { amount, reason } = adjustCreditsSchema.parse(req.body);
    const adjustUserCreditsUseCase = req.container.resolve('adjustUserCreditsUseCase');
    const result = await adjustUserCreditsUseCase.execute({
      userId: req.params.userId,
      amount,
      reason,
      adminUserId: req.auth.userId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, newBalance: result.newBalance });
  })
);

// Toggle admin status
router.patch(
  '/:userId/admin',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const adminUserId = req.auth.userId;

    // Can't demote yourself
    if (userId === adminUserId) {
      throw new ValidationError('Cannot change your own admin status');
    }

    // Get current user state to toggle
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const toggleUserAdminUseCase = req.container.resolve('toggleUserAdminUseCase');
    const result = await toggleUserAdminUseCase.execute({
      userId,
      isAdmin: !user.isAdmin,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, isAdmin: result.user?.isAdmin });
  })
);

// Delete user permanently
router.delete(
  '/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const adminUserId = req.auth.userId;

    // Can't delete yourself
    if (userId === adminUserId) {
      throw new ValidationError('Cannot delete your own account');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Delete from Clerk first
    try {
      const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      await clerkClient.users.deleteUser(userId);
    } catch {
      // Continue even if Clerk deletion fails - user might already be deleted from Clerk
    }

    // Delete user from database (cascades to related records)
    await prisma.user.delete({ where: { id: userId } });

    res.json({ success: true, message: 'User deleted successfully' });
  })
);

export default router;
