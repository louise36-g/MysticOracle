/**
 * API Service - Unified export for all API modules
 *
 * This module re-exports all API functions and types from the individual
 * domain-specific modules for backwards compatibility.
 */

// Core client
export { apiRequest, apiEndpoint, generateIdempotencyKey, API_URL } from './client';
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
  generateYearEnergyReading,
  getCachedBirthCardSynthesis,
  generateBirthCardSynthesis,
} from './ai';
export type { CachedBirthCardSynthesis } from './ai';

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
  fetchAdminTarotArticles,
  fetchAdminTarotArticle,
  previewTarotArticle,
  updateTarotArticleStatus,
  restoreTarotArticle,
  permanentlyDeleteTarotArticle,
  emptyTarotArticlesTrash,
  reorderTarotArticle,
} from './tarotArticles';
export type {
  FAQItem,
  CTAItem,
  TarotArticle,
  TarotArticlesListResponse,
  AdminTarotArticlesListResponse,
  TarotOverviewCard,
  TarotOverviewData,
} from './tarotArticles';

// Blog API
export {
  fetchBlogPosts,
  fetchBlogPost,
  fetchBlogCategories,
  fetchBlogTags,
  fetchBlogPostPreview,
  fetchAdminBlogPosts,
  fetchAdminBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  reorderBlogPost,
  fetchAdminBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  fetchAdminBlogTags,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag,
  fetchAdminBlogMedia,
  uploadBlogMedia,
  deleteBlogMedia,
  restoreBlogPost,
  permanentlyDeleteBlogPost,
  emptyBlogTrash,
  seedBlogData,
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
} from './taxonomy';
export type {
  UnifiedCategory,
  UnifiedTag,
  CategoryInput,
  TagInput,
} from './taxonomy';

// Links API
export { fetchLinkRegistry } from './links';
export type {
  LinkRegistryItem,
  TarotLinkItem,
  SpreadLinkItem,
  HoroscopeLinkItem,
  LinkRegistry,
} from './links';

// Import modules for default export
import * as userApi from './user';
import * as paymentsApi from './payments';
import * as adminApi from './admin';
import * as taxonomyApi from './taxonomy';

// Default export for backwards compatibility
export default {
  // User
  fetchUserProfile: userApi.fetchUserProfile,
  updateUserProfile: userApi.updateUserProfile,
  fetchUserCredits: userApi.fetchUserCredits,
  claimDailyBonus: userApi.claimDailyBonus,
  fetchUserReadings: userApi.fetchUserReadings,
  createReading: userApi.createReading,
  addFollowUpQuestion: userApi.addFollowUpQuestion,
  fetchUserTransactions: userApi.fetchUserTransactions,
  // Payments
  fetchCreditPackages: paymentsApi.fetchCreditPackages,
  createStripeCheckout: paymentsApi.createStripeCheckout,
  verifyStripePayment: paymentsApi.verifyStripePayment,
  createPayPalOrder: paymentsApi.createPayPalOrder,
  capturePayPalOrder: paymentsApi.capturePayPalOrder,
  fetchPurchaseHistory: paymentsApi.fetchPurchaseHistory,
  checkHealth: paymentsApi.checkHealth,
  // Admin
  fetchAdminStats: adminApi.fetchAdminStats,
  fetchAdminUsers: adminApi.fetchAdminUsers,
  fetchAdminUserDetail: adminApi.fetchAdminUserDetail,
  updateUserStatus: adminApi.updateUserStatus,
  adjustUserCredits: adminApi.adjustUserCredits,
  toggleUserAdmin: adminApi.toggleUserAdmin,
  deleteUser: adminApi.deleteUser,
  fetchAdminTransactions: adminApi.fetchAdminTransactions,
  fetchAdminRevenue: adminApi.fetchAdminRevenue,
  fetchAdminReadingStats: adminApi.fetchAdminReadingStats,
  fetchAdminAIConfig: adminApi.fetchAdminAIConfig,
  fetchAdminAnalytics: adminApi.fetchAdminAnalytics,
  fetchAdminEmailTemplates: adminApi.fetchAdminEmailTemplates,
  // Admin Prompts
  fetchAdminPrompts: adminApi.fetchAdminPrompts,
  fetchAdminPrompt: adminApi.fetchAdminPrompt,
  updateAdminPrompt: adminApi.updateAdminPrompt,
  resetAdminPrompt: adminApi.resetAdminPrompt,
  seedAdminPrompts: adminApi.seedAdminPrompts,
  // Unified Taxonomy
  fetchUnifiedCategories: taxonomyApi.fetchUnifiedCategories,
  createUnifiedCategory: taxonomyApi.createUnifiedCategory,
  updateUnifiedCategory: taxonomyApi.updateUnifiedCategory,
  deleteUnifiedCategory: taxonomyApi.deleteUnifiedCategory,
  fetchUnifiedTags: taxonomyApi.fetchUnifiedTags,
  createUnifiedTag: taxonomyApi.createUnifiedTag,
  updateUnifiedTag: taxonomyApi.updateUnifiedTag,
  deleteUnifiedTag: taxonomyApi.deleteUnifiedTag,
};
