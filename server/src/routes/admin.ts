import { Router } from 'express';
import { z } from 'zod';
import { SpreadType, InterpretationStyle } from '@prisma/client';
import prisma from '../db/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import cacheService from '../services/cache.js';
import { clearAISettingsCache } from '../services/aiSettings.js';
import { creditService } from '../services/CreditService.js';
import {
  DEFAULT_PACKAGES,
  DEFAULT_EMAIL_TEMPLATES,
  EDITABLE_SETTINGS,
} from '../shared/constants/index.js';

const router = Router();

// All admin routes require authentication AND admin privileges
router.use(requireAuth);
router.use(requireAdmin);

// ============================================
// DASHBOARD STATS
// ============================================

router.get('/stats', async (req, res) => {
  try {
    const adminStatsService = req.container.resolve('adminStatsService');
    const stats = await adminStatsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================
// USERS MANAGEMENT
// ============================================

const listUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'FLAGGED', 'SUSPENDED']).optional(),
  sortBy: z.enum(['createdAt', 'credits', 'totalReadings', 'username']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

router.get('/users', async (req, res) => {
  try {
    const params = listUsersSchema.parse(req.query);
    const { page, limit, search, status, sortBy, sortOrder } = params;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status) {
      where.accountStatus = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          credits: true,
          totalReadings: true,
          totalCreditsEarned: true,
          totalCreditsSpent: true,
          loginStreak: true,
          lastLoginDate: true,
          accountStatus: true,
          isAdmin: true,
          createdAt: true,
          _count: {
            select: { achievements: true, readings: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user with full details
router.get('/users/:userId', async (req, res) => {
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
const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'FLAGGED', 'SUSPENDED'])
});

router.patch('/users/:userId/status', async (req, res) => {
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
const adjustCreditsSchema = z.object({
  amount: z.number().int(),
  reason: z.string().min(1)
});

router.post('/users/:userId/credits', async (req, res) => {
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
router.patch('/users/:userId/admin', async (req, res) => {
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

// ============================================
// TRANSACTIONS & REVENUE
// ============================================

router.get('/transactions', async (req, res) => {
  try {
    const params = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(50),
      type: z.enum(['PURCHASE', 'READING', 'QUESTION', 'DAILY_BONUS', 'ACHIEVEMENT', 'REFERRAL_BONUS', 'REFUND']).optional()
    }).parse(req.query);

    const where: any = {};
    if (params.type) {
      where.type = params.type;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: { select: { username: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Revenue analytics
router.get('/revenue', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, last30Days, byProvider] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'PURCHASE', paymentStatus: 'COMPLETED' },
        _sum: { paymentAmount: true },
        _count: true
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'PURCHASE',
          paymentStatus: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo }
        },
        _sum: { paymentAmount: true },
        _count: true
      }),
      prisma.transaction.groupBy({
        by: ['paymentProvider'],
        where: { type: 'PURCHASE', paymentStatus: 'COMPLETED' },
        _sum: { paymentAmount: true },
        _count: true
      })
    ]);

    res.json({
      totalRevenue: total._sum.paymentAmount || 0,
      totalTransactions: total._count,
      last30Days: {
        revenue: last30Days._sum.paymentAmount || 0,
        transactions: last30Days._count
      },
      byProvider
    });
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ error: 'Failed to fetch revenue' });
  }
});

// ============================================
// READINGS ANALYTICS
// ============================================

router.get('/readings/stats', async (req, res) => {
  try {
    const [bySpreadType, recentReadings] = await Promise.all([
      prisma.reading.groupBy({
        by: ['spreadType'],
        _count: true
      }),
      prisma.reading.findMany({
        select: {
          id: true,
          spreadType: true,
          creditCost: true,
          createdAt: true,
          user: { select: { username: true } }
          // Note: NOT including question or interpretation for privacy
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    res.json({
      bySpreadType,
      recentReadings
    });
  } catch (error) {
    console.error('Error fetching reading stats:', error);
    res.status(500).json({ error: 'Failed to fetch reading stats' });
  }
});

// ============================================
// ANALYTICS
// ============================================

router.get('/analytics', async (req, res) => {
  try {
    const adminAnalyticsService = req.container.resolve('adminAnalyticsService');
    const analytics = await adminAnalyticsService.getAnalytics(7);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ============================================
// SYSTEM CONFIGURATION
// ============================================

// Get current AI configuration (checks DB settings first, then env vars)
router.get('/config/ai', async (req, res) => {
  try {
    // Check database for overridden settings
    const dbSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ['AI_MODEL', 'OPENROUTER_API_KEY'] } }
    });
    const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

    const model = settingsMap.get('AI_MODEL') || process.env.AI_MODEL || 'openai/gpt-4o-mini';
    const hasApiKey = !!(settingsMap.get('OPENROUTER_API_KEY') || process.env.OPENROUTER_API_KEY);

    res.json({
      model,
      provider: process.env.AI_PROVIDER || 'openrouter',
      hasApiKey
    });
  } catch (error) {
    console.error('Error fetching AI config:', error);
    res.status(500).json({ error: 'Failed to fetch AI config' });
  }
});

// ============================================
// CREDIT PACKAGES CRUD
// ============================================

// List all packages
router.get('/packages', async (req, res) => {
  try {
    const packages = await prisma.creditPackage.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.json({ packages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Create package
const createPackageSchema = z.object({
  credits: z.number().int().min(1),
  priceEur: z.number().min(0.01),
  nameEn: z.string().min(1),
  nameFr: z.string().min(1),
  labelEn: z.string().default(''),
  labelFr: z.string().default(''),
  discount: z.number().int().min(0).max(100).default(0),
  badge: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

router.post('/packages', async (req, res) => {
  try {
    const data = createPackageSchema.parse(req.body);
    const pkg = await prisma.creditPackage.create({
      data: {
        credits: data.credits,
        priceEur: data.priceEur,
        nameEn: data.nameEn,
        nameFr: data.nameFr,
        labelEn: data.labelEn,
        labelFr: data.labelFr,
        discount: data.discount,
        badge: data.badge,
        isActive: data.isActive,
        sortOrder: data.sortOrder
      }
    });
    res.json({ success: true, package: pkg });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// Update package
router.patch('/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = createPackageSchema.partial().parse(req.body);

    const pkg = await prisma.creditPackage.update({
      where: { id },
      data
    });
    res.json({ success: true, package: pkg });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// Delete package
router.delete('/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.creditPackage.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

// ============================================
// EMAIL TEMPLATES CRUD
// ============================================

// List all templates
router.get('/email-templates', async (req, res) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { slug: 'asc' }
    });
    res.json({
      templates,
      brevoConfigured: !!process.env.BREVO_API_KEY
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create template
const createTemplateSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z_]+$/, 'Slug must be lowercase with underscores only'),
  subjectEn: z.string().min(1),
  bodyEn: z.string().min(1),
  subjectFr: z.string().min(1),
  bodyFr: z.string().min(1),
  isActive: z.boolean().default(true)
});

router.post('/email-templates', async (req, res) => {
  try {
    const data = createTemplateSchema.parse(req.body);
    const template = await prisma.emailTemplate.create({
      data: {
        slug: data.slug,
        subjectEn: data.subjectEn,
        bodyEn: data.bodyEn,
        subjectFr: data.subjectFr,
        bodyFr: data.bodyFr,
        isActive: data.isActive
      }
    });
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.patch('/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = createTemplateSchema.partial().parse(req.body);

    const template = await prisma.emailTemplate.update({
      where: { id },
      data
    });
    res.json({ success: true, template });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/email-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.emailTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ============================================
// SEED DEFAULT DATA
// ============================================

router.post('/seed/packages', async (req, res) => {
  try {
    const existing = await prisma.creditPackage.count();
    if (existing > 0) {
      return res.status(400).json({ error: 'Packages already exist. Delete them first if you want to reseed.' });
    }

    await prisma.creditPackage.createMany({
      data: DEFAULT_PACKAGES.map(pkg => ({ ...pkg, isActive: true }))
    });

    const packages = await prisma.creditPackage.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, packages, count: packages.length });
  } catch (error) {
    console.error('Error seeding packages:', error);
    res.status(500).json({ error: 'Failed to seed packages' });
  }
});

router.post('/seed/email-templates', async (req, res) => {
  try {
    const existing = await prisma.emailTemplate.count();
    if (existing > 0) {
      return res.status(400).json({ error: 'Email templates already exist. Delete them first if you want to reseed.' });
    }

    await prisma.emailTemplate.createMany({
      data: DEFAULT_EMAIL_TEMPLATES.map(t => ({ ...t, isActive: true }))
    });

    const templates = await prisma.emailTemplate.findMany({ orderBy: { slug: 'asc' } });
    res.json({ success: true, templates, count: templates.length });
  } catch (error) {
    console.error('Error seeding email templates:', error);
    res.status(500).json({ error: 'Failed to seed email templates' });
  }
});

// ============================================
// SERVICE CONFIGURATION
// ============================================

router.get('/services', async (req, res) => {
  try {
    const systemHealthService = req.container.resolve('systemHealthService');
    const services = await systemHealthService.getServiceStatuses();
    res.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// ============================================
// ERROR LOG (in-memory)
// ============================================

interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  source: string;
  message: string;
  details?: string;
  userId?: string;
  path?: string;
}

// In-memory error log (last 100 entries)
const MAX_ERROR_LOG_SIZE = 100;
const errorLog: ErrorLogEntry[] = [];

// Helper to add an error to the log
export function logError(entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>): void {
  const newEntry: ErrorLogEntry = {
    id: Math.random().toString(36).substring(2, 15),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  errorLog.unshift(newEntry);

  // Keep only the last N entries
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.pop();
  }
}

// Get error logs
router.get('/error-logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, MAX_ERROR_LOG_SIZE);
  const level = req.query.level as string;
  const source = req.query.source as string;

  let filteredLogs = errorLog;

  if (level) {
    filteredLogs = filteredLogs.filter(log => log.level === level);
  }

  if (source) {
    filteredLogs = filteredLogs.filter(log => log.source.toLowerCase().includes(source.toLowerCase()));
  }

  res.json({
    logs: filteredLogs.slice(0, limit),
    total: filteredLogs.length,
    maxSize: MAX_ERROR_LOG_SIZE,
  });
});

// Clear error logs
router.delete('/error-logs', (req, res) => {
  errorLog.length = 0;
  res.json({ success: true, message: 'Error logs cleared' });
});

// ============================================
// SYSTEM HEALTH
// ============================================

router.get('/health', async (req, res) => {
  try {
    const systemHealthService = req.container.resolve('systemHealthService');
    const health = await systemHealthService.checkHealth();
    res.json(health);
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({ error: 'Failed to check health' });
  }
});

// ============================================
// SYSTEM SETTINGS CRUD
// ============================================

// Get all editable settings
router.get('/settings', async (req, res) => {
  try {
    const getSettingsUseCase = req.container.resolve('getSettingsUseCase');
    const result = await getSettingsUseCase.execute();
    res.json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update a setting
const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string()
});

router.post('/settings', async (req, res) => {
  try {
    const { key, value } = updateSettingSchema.parse(req.body);

    // Handle empty value (delete setting to fall back to env var)
    if (value === '') {
      await prisma.systemSetting.deleteMany({ where: { key } });
      if (key === 'OPENROUTER_API_KEY' || key === 'AI_MODEL') {
        clearAISettingsCache();
      }
      return res.json({ success: true });
    }

    const updateSettingUseCase = req.container.resolve('updateSettingUseCase');
    const result = await updateSettingUseCase.execute({ key, value });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Clear AI settings cache if an AI-related setting was changed
    if (key === 'OPENROUTER_API_KEY' || key === 'AI_MODEL') {
      clearAISettingsCache();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// ============================================
// REVENUE EXPORT
// ============================================

router.get('/revenue/export', async (req, res) => {
  try {
    const params = z.object({
      year: z.coerce.number().min(2020).max(2100),
      month: z.coerce.number().min(1).max(12)
    }).parse(req.query);

    const revenueExportService = req.container.resolve('revenueExportService');
    const data = await revenueExportService.exportToCSV(params.year, params.month);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${data.filename}"`);
    res.send(data.csv);
  } catch (error) {
    console.error('Error exporting revenue:', error);
    res.status(500).json({ error: 'Failed to export revenue' });
  }
});

// Get available months for export
router.get('/revenue/months', async (req, res) => {
  try {
    const revenueExportService = req.container.resolve('revenueExportService');
    const months = await revenueExportService.getAvailableMonths();
    res.json({ months });
  } catch (error) {
    console.error('Error fetching revenue months:', error);
    res.status(500).json({ error: 'Failed to fetch months' });
  }
});

// ============================================
// CACHE MANAGEMENT
// ============================================

// GET /api/admin/cache/stats
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = cacheService.getStats();
    const lastPurge = cacheService.getLastPurge();

    res.json({
      ...stats,
      lastPurge: lastPurge?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

// POST /api/admin/cache/purge
router.post('/cache/purge', async (req, res) => {
  try {
    await cacheService.flush();
    res.json({ success: true, message: 'Cache purged successfully' });
  } catch (error) {
    console.error('Error purging cache:', error);
    res.status(500).json({ error: 'Failed to purge cache' });
  }
});

// ============================================
// MAINTENANCE
// ============================================

// POST /api/admin/maintenance/normalize-readings
router.post('/maintenance/normalize-readings', async (req, res) => {
  try {
    // Import dynamically to avoid circular dependency issues
    const { normalizeExistingReadings } = await import('../jobs/normalizeReadingCards.js');
    const result = await normalizeExistingReadings();

    res.json({
      success: true,
      ...result,
      message: `Normalized ${result.processed} readings (${result.skipped} skipped, ${result.errors} errors)`
    });
  } catch (error) {
    console.error('Error normalizing readings:', error);
    res.status(500).json({ error: 'Failed to normalize readings' });
  }
});

// POST /api/admin/maintenance/cleanup-horoscopes
router.post('/maintenance/cleanup-horoscopes', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.horoscopeCache.deleteMany({
      where: { date: { lt: sevenDaysAgo } }
    });

    res.json({
      success: true,
      deleted: result.count,
      message: `Deleted ${result.count} old horoscope cache entries`
    });
  } catch (error) {
    console.error('Error cleaning up horoscopes:', error);
    res.status(500).json({ error: 'Failed to cleanup horoscope cache' });
  }
});

// ============================================
// DEBUG: ERROR SCENARIO TESTING
// ============================================
// These endpoints allow admins to test error handling scenarios
// to verify credits are properly handled in failure cases.

// Debug schemas
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

// GET /api/admin/debug/info
// Returns information about available debug endpoints
router.get('/debug/info', (req, res) => {
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
        params: { userId: 'string', amount: 'number', reason: 'string', originalTransactionId: 'string?' },
      },
      {
        method: 'POST',
        path: '/debug/reading-creation',
        description: 'Test reading creation with optional failures',
        params: { userId: 'string', spreadType: 'string?', simulateReadingFailure: 'boolean?', simulateAIFailure: 'boolean?' },
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
router.post('/debug/credit-deduction', async (req, res) => {
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
router.post('/debug/credit-refund', async (req, res) => {
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
router.post('/debug/reading-creation', async (req, res) => {
  try {
    const { userId, spreadType, simulateReadingFailure, simulateAIFailure } = debugReadingSchema.parse(req.body);

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
router.post('/debug/follow-up-creation', async (req, res) => {
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
router.get('/debug/user-credit-history/:userId', async (req, res) => {
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
