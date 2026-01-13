/**
 * Date formatting utilities for consistent date display across the application
 */

/**
 * Formats a date string as a relative date (Today, Yesterday, X days ago, or formatted date)
 * @param dateString - ISO date string to format
 * @param t - Translation function
 * @param language - Current language ('en' | 'fr')
 * @returns Formatted date string
 */
export const formatRelativeDate = (
  dateString: string,
  t: (key: string, fallback: string) => string,
  language: 'en' | 'fr'
): string => {
  const date = new Date(dateString);
  const now = new Date();

  const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / MILLISECONDS_PER_DAY);

  if (diffDays === 0) return t('common.today', 'Today');
  if (diffDays === 1) return t('common.yesterday', 'Yesterday');
  if (diffDays < 7) {
    const daysAgoKey = diffDays === 1 ? 'common.day_ago' : 'common.days_ago';
    return `${diffDays} ${t(daysAgoKey, 'days ago')}`;
  }

  return date.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
