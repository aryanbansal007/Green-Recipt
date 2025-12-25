/**
 * IST (Indian Standard Time) Timezone Utilities for Frontend
 * All timestamps in this application must be in IST (UTC+05:30)
 * 
 * This module provides utilities to:
 * - Get current IST time
 * - Convert any date to IST
 * - Format dates for display
 * - Create IST-aware date inputs
 */

const IST_OFFSET_HOURS = 5;
const IST_OFFSET_MINUTES = 30;
const IST_OFFSET_MS = (IST_OFFSET_HOURS * 60 + IST_OFFSET_MINUTES) * 60 * 1000;

/**
 * Get current date/time in IST
 * @returns {Date} Current IST time as a Date object
 */
export const getNowIST = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET_MS);
};

/**
 * Convert any date to IST
 * @param {Date|string|number} date - Date to convert
 * @returns {Date} Date converted to IST
 */
export const toIST = (date) => {
  if (!date) return getNowIST();
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return getNowIST();
  
  // Convert to UTC first, then add IST offset
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + IST_OFFSET_MS);
};

/**
 * Format IST date as ISO string (YYYY-MM-DD)
 * @param {Date} date - Date in IST (or will be converted)
 * @returns {string} ISO date string
 */
export const formatISTDate = (date) => {
  const d = date instanceof Date ? date : toIST(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format IST time as HH:MM
 * @param {Date} date - Date in IST
 * @returns {string} Time string in HH:MM format
 */
export const formatISTTime = (date) => {
  const d = date instanceof Date ? date : toIST(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format date for display in IST locale
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatISTDisplay = (date, options = {}) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    ...options
  };
  
  return d.toLocaleString('en-IN', defaultOptions);
};

/**
 * Format date for display (short format)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date (e.g., "25 Dec 2025")
 */
export const formatISTDateDisplay = (date) => {
  return formatISTDisplay(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format time for display in IST
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time (e.g., "14:30")
 */
export const formatISTTimeDisplay = (date) => {
  return formatISTDisplay(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Format time for display in IST (12-hour format)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export const formatISTTime12Display = (date) => {
  return formatISTDisplay(date, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get today's date string in IST (YYYY-MM-DD)
 * For use in date inputs
 * @returns {string} Today's date in IST
 */
export const getTodayIST = () => formatISTDate(getNowIST());

/**
 * Get current time string in IST (HH:MM)
 * @returns {string} Current time in IST
 */
export const getCurrentTimeIST = () => formatISTTime(getNowIST());

/**
 * Get current IST datetime for API calls
 * @returns {string} ISO-like datetime string with IST offset
 */
export const getISTDateTime = () => {
  const now = getNowIST();
  return `${formatISTDate(now)}T${formatISTTime(now)}:00+05:30`;
};

/**
 * Get IST year
 * @returns {number} Current year in IST
 */
export const getISTYear = () => getNowIST().getFullYear();

/**
 * Get IST month (0-indexed)
 * @returns {number} Current month in IST (0 = January)
 */
export const getISTMonth = () => getNowIST().getMonth();

/**
 * Get IST date of month
 * @returns {number} Current date in IST
 */
export const getISTDateOfMonth = () => getNowIST().getDate();

/**
 * Parse a date string and return Date object
 * Assumes input is already in IST context
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Date} Date object
 */
export const parseISTDate = (dateStr) => {
  if (!dateStr) return getNowIST();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * All calculations done in IST context
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTimeIST = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const now = getNowIST();
  const diffMs = now.getTime() - toIST(d).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatISTDateDisplay(d);
};

export default {
  getNowIST,
  toIST,
  formatISTDate,
  formatISTTime,
  formatISTDisplay,
  formatISTDateDisplay,
  formatISTTimeDisplay,
  formatISTTime12Display,
  getTodayIST,
  getCurrentTimeIST,
  getISTDateTime,
  getISTYear,
  getISTMonth,
  getISTDateOfMonth,
  parseISTDate,
  getRelativeTimeIST,
  IST_OFFSET_MS,
};
