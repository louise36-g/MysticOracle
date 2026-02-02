/**
 * Date formatting utilities for consistent date display across the application
 */

/**
 * Gets the start of day (midnight) for a given date in local timezone
 */
const getStartOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Calculates the difference in calendar days between two dates
 * (ignores time component, compares dates at midnight)
 */
const getCalendarDaysDiff = (date1: Date, date2: Date): number => {
  const startOfDay1 = getStartOfDay(date1);
  const startOfDay2 = getStartOfDay(date2);
  const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay1.getTime() - startOfDay2.getTime()) / MILLISECONDS_PER_DAY);
};

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

  // Calculate difference in calendar days (not elapsed time)
  const diffDays = getCalendarDaysDiff(now, date);

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
