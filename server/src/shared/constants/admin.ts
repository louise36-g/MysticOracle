/**
 * Admin Constants
 * Default data for seeding and configuration
 */

// Types for credit packages
export interface DefaultPackage {
  credits: number;
  priceEur: number;
  nameEn: string;
  nameFr: string;
  labelEn: string;
  labelFr: string;
  discount: number;
  badge: string | null;
  sortOrder: number;
}

// Types for email templates
export interface DefaultEmailTemplate {
  slug: string;
  subjectEn: string;
  subjectFr: string;
  bodyEn: string;
  bodyFr: string;
}

// Types for editable settings
export interface EditableSetting {
  key: string;
  isSecret: boolean;
  descriptionEn: string;
  descriptionFr: string;
}

/**
 * Default credit packages for seeding
 */
export const DEFAULT_PACKAGES: DefaultPackage[] = [
  {
    credits: 10,
    priceEur: 5.0,
    nameEn: 'Starter',
    nameFr: 'Démarrage',
    labelEn: 'Try It Out',
    labelFr: 'Essayez',
    discount: 0,
    badge: null,
    sortOrder: 0,
  },
  {
    credits: 25,
    priceEur: 10.0,
    nameEn: 'Basic',
    nameFr: 'Basique',
    labelEn: 'Popular',
    labelFr: 'Populaire',
    discount: 20,
    badge: null,
    sortOrder: 1,
  },
  {
    credits: 60,
    priceEur: 20.0,
    nameEn: 'Popular',
    nameFr: 'Populaire',
    labelEn: 'Best Value',
    labelFr: 'Meilleur Valeur',
    discount: 40,
    badge: 'POPULAR',
    sortOrder: 2,
  },
  {
    credits: 100,
    priceEur: 30.0,
    nameEn: 'Value',
    nameFr: 'Valeur',
    labelEn: 'Most Savings',
    labelFr: "Plus d'économies",
    discount: 40,
    badge: 'BEST_VALUE',
    sortOrder: 3,
  },
  {
    credits: 200,
    priceEur: 50.0,
    nameEn: 'Premium',
    nameFr: 'Premium',
    labelEn: 'Ultimate Pack',
    labelFr: 'Pack Ultime',
    discount: 50,
    badge: null,
    sortOrder: 4,
  },
];

/**
 * Default email templates for seeding
 */
export const DEFAULT_EMAIL_TEMPLATES: DefaultEmailTemplate[] = [
  {
    slug: 'welcome',
    subjectEn: 'Welcome to MysticOracle - Your Journey Begins!',
    subjectFr: 'Bienvenue sur MysticOracle - Votre Voyage Commence!',
    bodyEn:
      '<h2>Welcome, {{params.username}}!</h2><p>The stars have aligned to welcome you to MysticOracle. Your mystical journey begins now with <strong>10 free credits</strong> to explore the ancient wisdom of Tarot.</p>',
    bodyFr:
      '<h2>Bienvenue, {{params.username}}!</h2><p>Les étoiles se sont alignées pour vous accueillir sur MysticOracle. Votre voyage mystique commence maintenant avec <strong>10 crédits gratuits</strong> pour explorer la sagesse ancienne du Tarot.</p>',
  },
  {
    slug: 'purchase_confirmation',
    subjectEn: 'Payment Confirmed - {{params.credits}} Credits Added',
    subjectFr: 'Paiement Confirmé - {{params.credits}} Crédits Ajoutés',
    bodyEn:
      '<h2>Payment Confirmed!</h2><p>Thank you for your purchase, {{params.username}}. Your credits have been added to your account.</p><p><strong>Credits Added:</strong> +{{params.credits}}<br><strong>Amount Paid:</strong> {{params.amount}}<br><strong>New Balance:</strong> {{params.newBalance}} credits</p>',
    bodyFr:
      '<h2>Paiement Confirmé!</h2><p>Merci pour votre achat, {{params.username}}. Vos crédits ont été ajoutés à votre compte.</p><p><strong>Crédits Ajoutés:</strong> +{{params.credits}}<br><strong>Montant Payé:</strong> {{params.amount}}<br><strong>Nouveau Solde:</strong> {{params.newBalance}} crédits</p>',
  },
  {
    slug: 'low_credits_reminder',
    subjectEn: 'Your MysticOracle Credits are Running Low',
    subjectFr: 'Vos Crédits MysticOracle sont Presque Épuisés',
    bodyEn:
      "<h2>Don't let your journey end, {{params.username}}</h2><p>You have only <strong>{{params.credits}} credits</strong> remaining. Top up now to continue receiving mystical guidance.</p>",
    bodyFr:
      "<h2>Ne laissez pas votre voyage s'arrêter, {{params.username}}</h2><p>Il ne vous reste que <strong>{{params.credits}} crédits</strong>. Rechargez maintenant pour continuer à recevoir des conseils mystiques.</p>",
  },
];

/**
 * Editable settings (can be stored in DB to override env vars)
 */
export const EDITABLE_SETTINGS: EditableSetting[] = [
  {
    key: 'OPENROUTER_API_KEY',
    isSecret: true,
    descriptionEn: 'OpenRouter API Key',
    descriptionFr: 'Clé API OpenRouter',
  },
  {
    key: 'AI_MODEL',
    isSecret: false,
    descriptionEn: 'AI Model (e.g., openai/gpt-4o-mini)',
    descriptionFr: 'Modèle IA',
  },
  {
    key: 'BREVO_API_KEY',
    isSecret: true,
    descriptionEn: 'Brevo Email API Key',
    descriptionFr: 'Clé API Brevo',
  },
];
