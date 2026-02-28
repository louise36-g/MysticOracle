/**
 * Environment Variable Validation
 * Validates required environment variables at startup
 * Fails fast if critical configuration is missing
 */

interface EnvConfig {
  // Required in all environments
  required: string[];
  // Required only in production
  requiredInProduction: string[];
  // Recommended in production (warn if missing)
  recommendedInProduction: string[];
  // Optional with defaults
  optional: Record<string, string>;
}

const envConfig: EnvConfig = {
  required: ['DATABASE_URL', 'CLERK_SECRET_KEY'],
  requiredInProduction: [
    'FRONTEND_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'CLERK_WEBHOOK_SECRET',
    'OPENROUTER_API_KEY',
    'BREVO_API_KEY',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
  ],
  recommendedInProduction: ['SENTRY_DSN', 'PAYPAL_MODE', 'PAYPAL_WEBHOOK_ID'],
  optional: {
    PORT: '3001',
    NODE_ENV: 'development',
    FRONTEND_URL: 'http://localhost:5173',
    STORAGE_PROVIDER: 'local',
  },
};

interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate environment variables
 * @returns ValidationResult with missing vars and warnings
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Check required variables
  for (const envVar of envConfig.required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check production-required variables
  if (isProduction) {
    for (const envVar of envConfig.requiredInProduction) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }
    // Warn about recommended but not required vars
    for (const envVar of envConfig.recommendedInProduction) {
      if (!process.env[envVar]) {
        warnings.push(`${envVar} not set (recommended for production)`);
      }
    }
  } else {
    // Warn about missing production vars in development
    for (const envVar of envConfig.requiredInProduction) {
      if (!process.env[envVar]) {
        warnings.push(`${envVar} not set (required in production)`);
      }
    }
  }

  // Apply defaults for optional variables
  for (const [envVar, defaultValue] of Object.entries(envConfig.optional)) {
    if (!process.env[envVar]) {
      process.env[envVar] = defaultValue;
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validate environment and exit if invalid
 * Call this at application startup
 */
export function validateEnvOrExit(): void {
  const result = validateEnv();

  // Log warnings (in development and production for recommended vars)
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  // Exit if missing required variables
  if (!result.valid) {
    console.error('❌ Missing required environment variables:');
    result.missing.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\nPlease set these variables in your .env file or environment.');
    process.exit(1);
  }
}

/**
 * Get a required environment variable (type-safe)
 * Throws if not set
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get an optional environment variable with default
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}
