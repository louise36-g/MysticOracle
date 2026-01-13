/**
 * Date filtering utilities for consistent date range filtering across the application
 */

export type DateRangeOption = 'all' | 'today' | 'week' | 'month';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Gets the number of days to subtract for a given date range
 * @param range - Date range option
 * @returns Number of days to subtract from today
 */
const getDaysToSubtract = (range: DateRangeOption): number => {
  const daysMap: Record<Exclude<DateRangeOption, 'all'>, number> = {
    today: 0,
    week: 7,
    month: 30
  };
  return daysMap[range as keyof typeof daysMap] || 0;
};

/**
 * Filters an array of items by date range
 * @param items - Array of items to filter
 * @param dateRange - Date range option ('all', 'today', 'week', 'month')
 * @param dateField - Name of the date field in the item object
 * @returns Filtered array of items
 */
export const filterByDateRange = <T extends Record<string, any>>(
  items: T[],
  dateRange: DateRangeOption,
  dateField: keyof T
): T[] => {
  if (dateRange === 'all') return items;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const daysToSubtract = getDaysToSubtract(dateRange);
  const startDate = new Date(today.getTime() - daysToSubtract * MILLISECONDS_PER_DAY);

  return items.filter(item => new Date(item[dateField] as string) >= startDate);
};
