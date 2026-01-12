/**
 * SystemHealthService - System health monitoring
 * Provides health checks and service status information
 */

import { PrismaClient } from '@prisma/client';

export interface ServiceHealth {
  status: 'ok' | 'error' | 'not_configured';
  message?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'partial' | 'degraded';
  services: Record<string, ServiceHealth>;
  timestamp: string;
}

export interface ServiceInfo {
  id: string;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  envVars: string[];
  configured: boolean;
  dashboardUrl: string;
  docsUrl: string;
}

export class SystemHealthService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check overall system health
   */
  async checkHealth(): Promise<HealthStatus> {
    const health: Record<string, ServiceHealth> = {};

    // Check database settings for overrides
    let dbSettings: Map<string, string> = new Map();
    try {
      const settings = await this.prisma.systemSetting.findMany();
      dbSettings = new Map(settings.map(s => [s.key, s.value]));
    } catch {
      // Ignore - will use env vars only
    }

    // Helper to check if a setting is configured (DB or env)
    const isConfigured = (key: string) => !!(dbSettings.get(key) || process.env[key]);

    // Database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.database = { status: 'ok' };
    } catch {
      health.database = { status: 'error', message: 'Connection failed' };
    }

    // Clerk
    health.clerk = {
      status: process.env.CLERK_SECRET_KEY ? 'ok' : 'not_configured',
    };

    // Stripe
    health.stripe = {
      status: process.env.STRIPE_SECRET_KEY ? 'ok' : 'not_configured',
    };

    // PayPal
    health.paypal = {
      status:
        process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? 'ok' : 'not_configured',
    };

    // Brevo (check DB and env)
    health.brevo = {
      status: isConfigured('BREVO_API_KEY') ? 'ok' : 'not_configured',
    };

    // OpenRouter (check DB and env)
    health.openrouter = {
      status: isConfigured('OPENROUTER_API_KEY') ? 'ok' : 'not_configured',
    };

    // Overall status
    const allOk = Object.values(health).every(h => h.status === 'ok');
    const hasErrors = Object.values(health).some(h => h.status === 'error');

    return {
      status: hasErrors ? 'degraded' : allOk ? 'healthy' : 'partial',
      services: health,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detailed service configuration status
   */
  async getServiceStatuses(): Promise<ServiceInfo[]> {
    // Get database settings to check if they override env vars
    const dbSettings = await this.prisma.systemSetting.findMany();
    const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));

    const isConfigured = (envVars: string[]) => {
      return envVars.some(v => settingsMap.has(v) || !!process.env[v]);
    };

    return [
      {
        id: 'database',
        nameEn: 'Database',
        nameFr: 'Base de données',
        descriptionEn: 'PostgreSQL database for storing all application data',
        descriptionFr: 'Base de données PostgreSQL pour stocker toutes les données',
        envVars: ['DATABASE_URL'],
        configured: !!process.env.DATABASE_URL,
        dashboardUrl: 'https://dashboard.render.com/',
        docsUrl: 'https://www.prisma.io/docs/concepts/database-connectors/postgresql',
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
        docsUrl: 'https://clerk.com/docs',
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
        docsUrl: 'https://stripe.com/docs',
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
        docsUrl: 'https://developer.paypal.com/docs',
      },
      {
        id: 'brevo',
        nameEn: 'Brevo Email',
        nameFr: 'Email Brevo',
        descriptionEn: 'Transactional and marketing emails',
        descriptionFr: 'Emails transactionnels et marketing',
        envVars: ['BREVO_API_KEY'],
        configured: isConfigured(['BREVO_API_KEY']),
        dashboardUrl: 'https://app.brevo.com/',
        docsUrl: 'https://developers.brevo.com/',
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
        docsUrl: 'https://openrouter.ai/docs',
      },
    ];
  }
}

export default SystemHealthService;
