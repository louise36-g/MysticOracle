/**
 * API Service - Unified export for all API modules
 *
 * This module re-exports all API functions and types from the individual
 * domain-specific modules for backwards compatibility.
 */

// Core client
export { apiRequest, apiEndpoint, generateIdempotencyKey, API_URL, ApiError } from './client';
export type { ApiOptions, ParamValue } from './client';

// User API
export {
  fetchUserProfile,
  updateUserProfile,
  markWelcomeCompleted,
  fetchUserCredits,
  claimDailyBonus,
  getInvoiceHtml,
  openInvoice,
  fetchUserReadings,
  fetchUnifiedReadings,
  createReading,
  addFollowUpQuestion,
  updateReadingReflection,
  fetchUserTransactions,
  checkUsernameAvailability,
  updateUsername,
} from './user';
export type {
  UserProfile,
  ReadingCard,
  ReadingData,
  PaginatedResponse,
  Transaction,
  UnifiedReadingData,
  ReadingType,
  ReadingTypeFilter,
} from './user';

// Payments API
export {
  fetchCreditPackages,
  createStripeCheckout,
  verifyStripePayment,
  createPayPalOrder,
  capturePayPalOrder,
  fetchPurchaseHistory,
  checkHealth,
} from './payments';
export type { CreditPackage } from './payments';

// Horoscope API
export { fetchHoroscope, askHoroscopeQuestion } from './horoscope';

// AI API
export {
  summarizeQuestion,
  generateTarotReading,
  generateTarotFollowUp,
  generateClarificationCard,
  generateYearEnergyReading,
} from './ai';

// Year Energy API
export {
  getYearEnergy,
  getCurrentYearEnergy,
  getCachedPersonalYearReading,
  generatePersonalYearReading,
  getThresholdStatus,
  getCachedThresholdReading,
  generateThresholdReading,
} from './yearEnergy';
export type {
  YearEnergyResponse,
  PersonalYearReadingResponse,
  CachedPersonalYearReading,
  ThresholdStatusResponse,
  ThresholdReadingResponse,
} from './yearEnergy';

// Admin API
export {
  fetchAdminStats,
  fetchAdminRevenue,
  fetchAdminAnalytics,
  fetchAdminReadingStats,
  fetchAdminAIConfig,
  fetchAdminUsers,
  fetchAdminUserDetail,
  updateUserStatus,
  adjustUserCredits,
  toggleUserAdmin,
  deleteUser,
  fetchAdminTransactions,
  fetchAdminPackages,
  createAdminPackage,
  updateAdminPackage,
  deleteAdminPackage,
  seedAdminPackages,
  fetchAdminEmailTemplates,
  fetchAdminEmailTemplatesCRUD,
  createAdminEmailTemplate,
  updateAdminEmailTemplate,
  deleteAdminEmailTemplate,
  seedAdminEmailTemplates,
  fetchAdminHealth,
  fetchAdminErrorLogs,
  clearAdminErrorLogs,
  fetchAdminPrompts,
  fetchAdminPrompt,
  updateAdminPrompt,
  resetAdminPrompt,
  seedAdminPrompts,
  fetchAdminServices,
  fetchAdminSettings,
  updateAdminSetting,
  fetchRevenueMonths,
  getRevenueExportUrl,
} from './admin';
export type {
  AdminStats,
  AdminUser,
  AdminUserList,
  AdminRevenue,
  AdminAnalytics,
  EmailTemplate,
  AdminCreditPackage,
  AdminEmailTemplate,
  SystemHealth,
  ErrorLogEntry,
  ErrorLogsResponse,
  AdminPrompt,
  ServiceConfig,
  SystemSetting,
  RevenueMonth,
} from './admin';

// Tarot Articles API
export {
  fetchTarotArticle,
  fetchTarotArticles,
  fetchTarotOverview,
  createTarotArticle,
  updateTarotArticle,
  deleteTarotArticle,
  fetchAdminTarotArticle,
  previewTarotArticle,
} from './tarotArticles';
export type {
  FAQItem,
  CTAItem,
  TarotArticle,
  TarotArticlesListResponse,
  TarotOverviewCard,
  TarotOverviewData,
} from './tarotArticles';

// Blog API
export {
  fetchBlogPosts,
  fetchBlogPost,
  fetchBlogCategories,
  fetchBlogPostPreview,
  fetchAdminBlogPosts,
  fetchAdminBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  reorderBlogPost,
  fetchAdminBlogMedia,
  uploadBlogMedia,
  deleteBlogMedia,
  restoreBlogPost,
  permanentlyDeleteBlogPost,
  emptyBlogTrash,
  importBlogArticles,
} from './blog';
export type {
  BlogCategory,
  BlogTag,
  BlogPost,
  CreateBlogPostData,
  UpdateBlogPostData,
  BlogMedia,
  BlogPostListResponse,
  ImportArticle,
  ImportOptions,
  ImportResult,
} from './blog';

// Taxonomy API
export {
  fetchUnifiedCategories,
  createUnifiedCategory,
  updateUnifiedCategory,
  deleteUnifiedCategory,
  fetchUnifiedTags,
  createUnifiedTag,
  updateUnifiedTag,
  deleteUnifiedTag,
  reorderUnifiedCategory,
} from './taxonomy';
export type {
  UnifiedCategory,
  UnifiedTag,
  CategoryInput,
  TagInput,
} from './taxonomy';

// Yes/No API
export { fetchYesNoCards, purchaseThreeCardSpread } from './yesNo';
export type { YesNoCardData, YesNoCardMap, ThreeCardResponse } from './yesNo';

// Links API
export { fetchLinkRegistry } from './links';
export type {
  LinkRegistryItem,
  TarotLinkItem,
  SpreadLinkItem,
  HoroscopeLinkItem,
  LinkRegistry,
} from './links';

