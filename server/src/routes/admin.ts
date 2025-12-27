import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

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
    const { amount, reason } = adjustCreditsSchema.parse(req.body);

    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: { increment: amount },
          ...(amount > 0 ? { totalCreditsEarned: { increment: amount } } : {})
        }
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: amount > 0 ? 'REFUND' : 'READING', // Use REFUND for admin adjustments
          amount,
          description: `Admin adjustment: ${reason}`
        }
      })
    ]);

    res.json({ success: true, newBalance: user.credits });
  } catch (error) {
    console.error('Error adjusting credits:', error);
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

// Get current AI configuration (stored in memory/env for now)
router.get('/config/ai', (req, res) => {
  res.json({
    model: process.env.AI_MODEL || 'openai/gpt-4o-mini',
    provider: process.env.AI_PROVIDER || 'openrouter',
    hasApiKey: !!process.env.OPENROUTER_API_KEY
  });
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
        docsUrl: 'https://www.prisma.io/docs/concepts/database-connectors/postgresql'
      },
      {
        id: 'clerk',
        nameEn: 'Clerk Authentication',
        nameFr: 'Authentification Clerk',
        descriptionEn: 'User authentication and session management',
        descriptionFr: 'Authentification utilisateur et gestion de session',
        envVars: ['CLERK_SECRET_KEY', 'CLERK_WEBHOOK_SECRET', 'VITE_CLERK_PUBLISHABLE_KEY'],
        configured: !!process.env.CLERK_SECRET_KEY,
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
        docsUrl: 'https://stripe.com/docs'
      },
      {
        id: 'paypal',
        nameEn: 'PayPal Payments',
        nameFr: 'Paiements PayPal',
        descriptionEn: 'PayPal payment processing',
        descriptionFr: 'Traitement des paiements PayPal',
        envVars: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MODE'],
        configured: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
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
        docsUrl: 'https://developers.brevo.com/'
      },
      {
        id: 'openrouter',
        nameEn: 'OpenRouter AI',
        nameFr: 'OpenRouter IA',
        descriptionEn: 'AI model for tarot readings and horoscopes',
        descriptionFr: 'Modèle IA pour les lectures de tarot et horoscopes',
        envVars: ['OPENROUTER_API_KEY', 'AI_MODEL'],
        configured: !!process.env.OPENROUTER_API_KEY,
        docsUrl: 'https://openrouter.ai/docs'
      }
    ]
  });
});

// ============================================
// SYSTEM HEALTH
// ============================================

router.get('/health', async (req, res) => {
  const health: Record<string, { status: string; message?: string }> = {};

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

  // Brevo
  health.brevo = {
    status: process.env.BREVO_API_KEY ? 'ok' : 'not_configured'
  };

  // OpenRouter
  health.openrouter = {
    status: process.env.OPENROUTER_API_KEY ? 'ok' : 'not_configured'
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

// Note: Updating AI config would require environment variable management
// which is typically handled through deployment platform (Render, etc.)

export default router;
