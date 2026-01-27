// Route path constants - single source of truth
export const ROUTES = {
  HOME: '/',

  // Auth
  PROFILE: '/profile',

  // Reading flow
  READING: '/reading',
  READING_SPREAD: '/reading/:spreadType',  // e.g., /reading/single, /reading/three-card
  READING_PHASE: '/reading/:spreadType/:phase',  // e.g., /reading/single/drawing
  READING_VIEW: '/reading/view/:id',  // View saved reading

  // Horoscopes
  HOROSCOPES: '/horoscopes',
  HOROSCOPE_SIGN: '/horoscopes/:sign',

  // Blog
  BLOG: '/blog',
  BLOG_POST: '/blog/:slug',

  // Tarot
  TAROT_CARDS: '/tarot/cards',
  TAROT_CARDS_ALL: '/tarot/cards/all',
  TAROT_CARDS_CATEGORY: '/tarot/cards/:category',
  TAROT_CARD: '/tarot/cards/:category/:card',
  TAROT_ARTICLE: '/tarot/:slug',
  TAROT_ARTICLE_LEGACY: '/tarot/articles/:slug', // Legacy URL format used in blog content

  // Legal
  PRIVACY: '/privacy',
  TERMS: '/terms',
  COOKIES: '/cookies',

  // Info
  FAQ: '/faq',
  ABOUT: '/about',
  HOW_CREDITS_WORK: '/how-credits-work',

  // Payment
  PAYMENT_SUCCESS: '/payment/success',
  PAYMENT_CANCELLED: '/payment/cancelled',

  // Admin
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_TRANSACTIONS: '/admin/transactions',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_PACKAGES: '/admin/packages',
  ADMIN_EMAIL_TEMPLATES: '/admin/email-templates',
  ADMIN_TRANSLATIONS: '/admin/translations',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_HEALTH: '/admin/health',

  // Admin Blog
  ADMIN_BLOG: '/admin/blog',
  ADMIN_BLOG_NEW: '/admin/blog/new',
  ADMIN_BLOG_EDIT: '/admin/blog/:id/edit',
  ADMIN_BLOG_CATEGORIES: '/admin/blog/categories',
  ADMIN_BLOG_TAGS: '/admin/blog/tags',
  ADMIN_BLOG_MEDIA: '/admin/blog/media',
  ADMIN_BLOG_TRASH: '/admin/blog/trash',

  // Admin Tarot Articles
  ADMIN_TAROT: '/admin/tarot-articles',
  ADMIN_TAROT_NEW: '/admin/tarot-articles/new',
  ADMIN_TAROT_EDIT: '/admin/tarot-articles/:id/edit',
  ADMIN_TAROT_CATEGORIES: '/admin/tarot-articles/categories',
  ADMIN_TAROT_TAGS: '/admin/tarot-articles/tags',
  ADMIN_TAROT_TRASH: '/admin/tarot-articles/trash',
} as const;

// Helper to build dynamic routes
export function buildRoute(route: string, params: Record<string, string>): string {
  let result = route;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
}
