/**
 * Utility functions for formatting data display
 */

/**
 * Format a currency amount for display
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatAmount = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format a currency amount without the currency symbol
 * @param amount - The amount to format
 * @returns Formatted number string with 2 decimal places
 */
export const formatCurrency = (amount: number): string => {
  return amount.toFixed(2);
};

/**
 * Format a percentage for display
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a date for display
 * @param date - The date to format
 * @param format - The format type ('short', 'medium', 'long')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const optionsMap = {
    short: { month: 'short' as const, day: 'numeric' as const },
    medium: { month: 'short' as const, day: 'numeric' as const, year: 'numeric' as const },
    long: { weekday: 'long' as const, month: 'long' as const, day: 'numeric' as const, year: 'numeric' as const }
  };
  
  const options: Intl.DateTimeFormatOptions = optionsMap[format];
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Format a number for display with proper separators
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};