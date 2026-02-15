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

const router = Router();

// ============================================
// USERS MANAGEMENT
// ============================================

// List users with pagination, search, and sorting
router.get('/', async (req, res) => {
  try {
    const params = listUsersSchema.parse(req.query);
    const listUsersUseCase = req.container.resolve('listUsersUseCase');
    const result = await listUsersUseCase.execute(params);
    res.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user with full details
router.get('/:userId', async (req, res) => {
  try {
    const getUserUseCase = req.container.resolve('getUserUseCase');
    const result = await getUserUseCase.execute({ userId: req.params.userId });

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result.user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user status
router.patch('/:userId/status', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Adjust user credits
router.post('/:userId/credits', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('[Admin Credits] Error adjusting credits:', error);
    res.status(500).json({ error: 'Failed to adjust credits' });
  }
});

// Toggle admin status
router.patch('/:userId/admin', async (req, res) => {
  try {
    const { userId } = req.params;
    const adminUserId = req.auth.userId;

    // Can't demote yourself
    if (userId === adminUserId) {
      return res.status(400).json({ error: 'Cannot change your own admin status' });
    }

    // Get current user state to toggle
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
  } catch (error) {
    console.error('Error toggling admin:', error);
    res.status(500).json({ error: 'Failed to toggle admin status' });
  }
});

// Delete user permanently
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const adminUserId = req.auth.userId;

    // Can't delete yourself
    if (userId === adminUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user from database (cascades to related records)
    await prisma.user.delete({ where: { id: userId } });

    console.log(`[Admin] User ${userId} deleted by admin ${adminUserId}`);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
