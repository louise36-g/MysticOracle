import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import cacheService from '../services/cache.js';
import { clearAISettingsCache } from '../services/aiSettings.js';
import { creditService } from '../services/CreditService.js';

const router = Router();

// All admin routes require authentication AND admin privileges
router.use(requireAuth);
router.use(requireAdmin);

// ============================================
// DASHBOARD STATS
// ============================================

router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalReadings,
      totalRevenue,
      todayReadings,
      todaySignups
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
      prisma.reading.count(),
      prisma.transaction.aggregate({
        where: { type: 'PURCHASE', paymentStatus: 'COMPLETED' },
        _sum: { paymentAmount: true }
      }),
      prisma.reading.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      })
    ]);

    res.json({
      totalUsers,
      activeUsers,
      totalReadings,
      totalRevenue: totalRevenue._sum.paymentAmount || 0,
      todayReadings,
      todaySignups
    });
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
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: true,
        readings: {
          select: {
            id: true,
            spreadType: true,
            createdAt: true,
            creditCost: true
            // Note: NOT including question or interpretation for privacy
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
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
    const { userId } = req.params;
    const { status } = updateStatusSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { accountStatus: status }
    });

    res.json({ success: true, user });
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
    const { userId } = req.params;
    const authUserId = req.auth.userId;
    console.log('[Admin Credits] Request - target userId:', userId, 'auth userId:', authUserId);

    const { amount, reason } = adjustCreditsSchema.parse(req.body);
    console.log('[Admin Credits] Amount:', amount, 'Reason:', reason);

    // Get current balance before adjustment
    const beforeBalance = await creditService.getBalance(userId);
    console.log('[Admin Credits] Credits BEFORE update:', beforeBalance);

    // Use CreditService for credit adjustment
    const result = await creditService.adjustCredits(userId, amount, reason);

    if (!result.success) {
      console.error('[Admin Credits] Adjustment failed:', result.error);
      return res.status(400).json({ error: result.error || 'Failed to adjust credits' });
    }

    console.log('[Admin Credits] Credits AFTER update:', result.newBalance);

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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: !user.isAdmin }
    });

    res.json({ success: true, isAdmin: updated.isAdmin });
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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get readings grouped by day for last 7 days
    const readings = await prisma.reading.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });

    // Group readings by day
    const readingsByDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = readings.filter(r => {
        const date = new Date(r.createdAt);
        return date >= dayStart && date < dayEnd;
      }).length;

      readingsByDay.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        count
      });
    }

    // Top users by readings
    const topUsersByReadings = await prisma.user.findMany({
      orderBy: { totalReadings: 'desc' },
      take: 5,
      select: { id: true, username: true, totalReadings: true }
    });

    // Top users by credits
    const topUsersByCredits = await prisma.user.findMany({
      orderBy: { credits: 'desc' },
      take: 5,
      select: { username: true, credits: true }
    });

    // Top users by login streak
    const topUsersByStreak = await prisma.user.findMany({
      orderBy: { loginStreak: 'desc' },
      take: 5,
      select: { username: true, loginStreak: true }
    });

    res.json({
      readingsByDay,
      topUsers: topUsersByReadings.map(u => ({
        id: u.id,
        username: u.username,
        count: u.totalReadings
      })),
      topCreditUsers: topUsersByCredits.map(u => ({
        username: u.username,
        credits: u.credits
      })),
      topStreakUsers: topUsersByStreak.map(u => ({
        username: u.username,
        streak: u.loginStreak
      }))
    });
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

const DEFAULT_PACKAGES = [
  { credits: 10, priceEur: 5.00, nameEn: 'Starter', nameFr: 'Démarrage', labelEn: 'Try It Out', labelFr: 'Essayez', discount: 0, badge: null, sortOrder: 0 },
  { credits: 25, priceEur: 10.00, nameEn: 'Basic', nameFr: 'Basique', labelEn: 'Popular', labelFr: 'Populaire', discount: 20, badge: null, sortOrder: 1 },
  { credits: 60, priceEur: 20.00, nameEn: 'Popular', nameFr: 'Populaire', labelEn: 'Best Value', labelFr: 'Meilleur Valeur', discount: 40, badge: 'POPULAR', sortOrder: 2 },
  { credits: 100, priceEur: 30.00, nameEn: 'Value', nameFr: 'Valeur', labelEn: 'Most Savings', labelFr: 'Plus d\'économies', discount: 40, badge: 'BEST_VALUE', sortOrder: 3 },
  { credits: 200, priceEur: 50.00, nameEn: 'Premium', nameFr: 'Premium', labelEn: 'Ultimate Pack', labelFr: 'Pack Ultime', discount: 50, badge: null, sortOrder: 4 },
];

const DEFAULT_EMAIL_TEMPLATES = [
  {
    slug: 'welcome',
    subjectEn: 'Welcome to MysticOracle - Your Journey Begins!',
    subjectFr: 'Bienvenue sur MysticOracle - Votre Voyage Commence!',
    bodyEn: '<h2>Welcome, {{params.username}}!</h2><p>The stars have aligned to welcome you to MysticOracle. Your mystical journey begins now with <strong>10 free credits</strong> to explore the ancient wisdom of Tarot.</p>',
    bodyFr: '<h2>Bienvenue, {{params.username}}!</h2><p>Les étoiles se sont alignées pour vous accueillir sur MysticOracle. Votre voyage mystique commence maintenant avec <strong>10 crédits gratuits</strong> pour explorer la sagesse ancienne du Tarot.</p>',
  },
  {
    slug: 'purchase_confirmation',
    subjectEn: 'Payment Confirmed - {{params.credits}} Credits Added',
    subjectFr: 'Paiement Confirmé - {{params.credits}} Crédits Ajoutés',
    bodyEn: '<h2>Payment Confirmed!</h2><p>Thank you for your purchase, {{params.username}}. Your credits have been added to your account.</p><p><strong>Credits Added:</strong> +{{params.credits}}<br><strong>Amount Paid:</strong> {{params.amount}}<br><strong>New Balance:</strong> {{params.newBalance}} credits</p>',
    bodyFr: '<h2>Paiement Confirmé!</h2><p>Merci pour votre achat, {{params.username}}. Vos crédits ont été ajoutés à votre compte.</p><p><strong>Crédits Ajoutés:</strong> +{{params.credits}}<br><strong>Montant Payé:</strong> {{params.amount}}<br><strong>Nouveau Solde:</strong> {{params.newBalance}} crédits</p>',
  },
  {
    slug: 'low_credits_reminder',
    subjectEn: 'Your MysticOracle Credits are Running Low',
    subjectFr: 'Vos Crédits MysticOracle sont Presque Épuisés',
    bodyEn: '<h2>Don\'t let your journey end, {{params.username}}</h2><p>You have only <strong>{{params.credits}} credits</strong> remaining. Top up now to continue receiving mystical guidance.</p>',
    bodyFr: '<h2>Ne laissez pas votre voyage s\'arrêter, {{params.username}}</h2><p>Il ne vous reste que <strong>{{params.credits}} crédits</strong>. Rechargez maintenant pour continuer à recevoir des conseils mystiques.</p>',
  },
];

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
  // Get database settings to check if they override env vars
  const dbSettings = await prisma.systemSetting.findMany();
  const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

  const isConfigured = (envVars: string[]) => {
    return envVars.some(v => settingsMap.has(v) || !!process.env[v]);
  };

  res.json({
    services: [
      {
        id: 'database',
        nameEn: 'Database',
        nameFr: 'Base de données',
        descriptionEn: 'PostgreSQL database for storing all application data',
        descriptionFr: 'Base de données PostgreSQL pour stocker toutes les données',
        envVars: ['DATABASE_URL'],
        configured: !!process.env.DATABASE_URL,
        dashboardUrl: 'https://dashboard.render.com/',
        docsUrl: 'https://www.prisma.io/docs/concepts/database-connectors/postgresql'
      },
      {
        id: 'clerk',
        nameEn: 'Clerk Authentication',
        nameFr: 'Authentification Clerk',
        descriptionEn: 'User authentication and session management',
        descriptionFr: 'Authentification utilisateur et gestion de session',
        envVars: ['CLERK_SECRET_KEY', 'CLERK_WEBHOOK_SECRET'],
        configured: !!process.env.CLERK_SECRET_KEY,
        dashboardUrl: 'https://dashboard.clerk.com/',
        docsUrl: 'https://clerk.com/docs'
      },
      {
        id: 'stripe',
        nameEn: 'Stripe Payments',
        nameFr: 'Paiements Stripe',
        descriptionEn: 'Credit card payments processing',
        descriptionFr: 'Traitement des paiements par carte',
        envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
        configured: !!process.env.STRIPE_SECRET_KEY,
        dashboardUrl: 'https://dashboard.stripe.com/',
        docsUrl: 'https://stripe.com/docs'
      },
      {
        id: 'paypal',
        nameEn: 'PayPal Payments',
        nameFr: 'Paiements PayPal',
        descriptionEn: 'PayPal payment processing',
        descriptionFr: 'Traitement des paiements PayPal',
        envVars: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
        configured: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
        dashboardUrl: 'https://developer.paypal.com/dashboard/',
        docsUrl: 'https://developer.paypal.com/docs'
      },
      {
        id: 'brevo',
        nameEn: 'Brevo Email',
        nameFr: 'Email Brevo',
        descriptionEn: 'Transactional and marketing emails',
        descriptionFr: 'Emails transactionnels et marketing',
        envVars: ['BREVO_API_KEY'],
        configured: !!process.env.BREVO_API_KEY,
        dashboardUrl: 'https://app.brevo.com/',
        docsUrl: 'https://developers.brevo.com/'
      },
      {
        id: 'openrouter',
        nameEn: 'OpenRouter AI',
        nameFr: 'OpenRouter IA',
        descriptionEn: 'AI model for tarot readings and horoscopes',
        descriptionFr: 'Modèle IA pour les lectures de tarot et horoscopes',
        envVars: ['OPENROUTER_API_KEY', 'AI_MODEL'],
        configured: isConfigured(['OPENROUTER_API_KEY']),
        dashboardUrl: 'https://openrouter.ai/keys',
        docsUrl: 'https://openrouter.ai/docs'
      }
    ]
  });
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
  const health: Record<string, { status: string; message?: string }> = {};

  // Check database settings for overrides
  let dbSettings: Map<string, string> = new Map();
  try {
    const settings = await prisma.systemSetting.findMany();
    dbSettings = new Map(settings.map(s => [s.key, s.value]));
  } catch {
    // Ignore - will use env vars only
  }

  // Helper to check if a setting is configured (DB or env)
  const isConfigured = (key: string) => !!(dbSettings.get(key) || process.env[key]);

  // Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = { status: 'ok' };
  } catch (error) {
    health.database = { status: 'error', message: 'Connection failed' };
  }

  // Clerk
  health.clerk = {
    status: process.env.CLERK_SECRET_KEY ? 'ok' : 'not_configured'
  };

  // Stripe
  health.stripe = {
    status: process.env.STRIPE_SECRET_KEY ? 'ok' : 'not_configured'
  };

  // PayPal
  health.paypal = {
    status: process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? 'ok' : 'not_configured'
  };

  // Brevo (check DB and env)
  health.brevo = {
    status: isConfigured('BREVO_API_KEY') ? 'ok' : 'not_configured'
  };

  // OpenRouter (check DB and env)
  health.openrouter = {
    status: isConfigured('OPENROUTER_API_KEY') ? 'ok' : 'not_configured'
  };

  // Overall status
  const allOk = Object.values(health).every(h => h.status === 'ok');
  const hasErrors = Object.values(health).some(h => h.status === 'error');

  res.json({
    status: hasErrors ? 'degraded' : (allOk ? 'healthy' : 'partial'),
    services: health,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// SYSTEM SETTINGS CRUD
// ============================================

// Editable settings (can be stored in DB to override env vars)
const EDITABLE_SETTINGS = [
  { key: 'OPENROUTER_API_KEY', isSecret: true, descriptionEn: 'OpenRouter API Key', descriptionFr: 'Clé API OpenRouter' },
  { key: 'AI_MODEL', isSecret: false, descriptionEn: 'AI Model (e.g., openai/gpt-4o-mini)', descriptionFr: 'Modèle IA' },
  { key: 'BREVO_API_KEY', isSecret: true, descriptionEn: 'Brevo Email API Key', descriptionFr: 'Clé API Brevo' },
];

// Get all editable settings
router.get('/settings', async (req, res) => {
  try {
    const dbSettings = await prisma.systemSetting.findMany();
    const settingsMap = new Map(dbSettings.map(s => [s.key, s]));

    const settings = EDITABLE_SETTINGS.map(setting => {
      const dbSetting = settingsMap.get(setting.key);
      const envValue = process.env[setting.key];
      const value = dbSetting?.value || envValue || '';

      return {
        key: setting.key,
        value: setting.isSecret && value ? '••••••••' + value.slice(-4) : value,
        hasValue: !!value,
        isSecret: setting.isSecret,
        source: dbSetting ? 'database' : (envValue ? 'environment' : 'none'),
        descriptionEn: setting.descriptionEn,
        descriptionFr: setting.descriptionFr
      };
    });

    res.json({ settings });
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

    // Verify it's an allowed setting
    const settingDef = EDITABLE_SETTINGS.find(s => s.key === key);
    if (!settingDef) {
      return res.status(400).json({ error: 'Setting not allowed' });
    }

    if (value === '') {
      // Delete setting if empty (fall back to env var)
      await prisma.systemSetting.deleteMany({ where: { key } });
    } else {
      await prisma.systemSetting.upsert({
        where: { key },
        create: {
          key,
          value,
          isSecret: settingDef.isSecret,
          description: settingDef.descriptionEn
        },
        update: { value }
      });
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

    const startDate = new Date(params.year, params.month - 1, 1);
    const endDate = new Date(params.year, params.month, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'PURCHASE',
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: { select: { email: true, username: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Calculate totals
    const totals = {
      count: transactions.length,
      revenue: transactions.reduce((sum, t) => sum + (Number(t.paymentAmount) || 0), 0),
      credits: transactions.reduce((sum, t) => sum + t.amount, 0)
    };

    // Generate CSV
    const monthName = new Date(params.year, params.month - 1).toLocaleString('en', { month: 'long', year: 'numeric' });
    const csv = [
      `MysticOracle Revenue Report - ${monthName}`,
      '',
      'Date,User,Email,Payment Provider,Amount (EUR),Credits,Transaction ID',
      ...transactions.map(t => [
        new Date(t.createdAt).toISOString().split('T')[0],
        `"${t.user.username}"`,
        `"${t.user.email}"`,
        t.paymentProvider || 'N/A',
        Number(t.paymentAmount).toFixed(2),
        t.amount,
        t.paymentId || t.id
      ].join(',')),
      '',
      `Total Transactions,${totals.count}`,
      `Total Revenue (EUR),${totals.revenue.toFixed(2)}`,
      `Total Credits Sold,${totals.credits}`
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="mysticoracle-revenue-${params.year}-${String(params.month).padStart(2, '0')}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting revenue:', error);
    res.status(500).json({ error: 'Failed to export revenue' });
  }
});

// Get available months for export
router.get('/revenue/months', async (req, res) => {
  try {
    const firstTransaction = await prisma.transaction.findFirst({
      where: { type: 'PURCHASE', paymentStatus: 'COMPLETED' },
      orderBy: { createdAt: 'asc' }
    });

    if (!firstTransaction) {
      return res.json({ months: [] });
    }

    const months: { year: number; month: number; label: string }[] = [];
    const start = new Date(firstTransaction.createdAt);
    const now = new Date();

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= now) {
      months.push({
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        label: current.toLocaleString('en', { month: 'long', year: 'numeric' })
      });
      current.setMonth(current.getMonth() + 1);
    }

    res.json({ months: months.reverse() }); // Most recent first
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

export default router;
