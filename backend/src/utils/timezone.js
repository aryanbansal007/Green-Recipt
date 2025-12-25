/**
 * IST (Indian Standard Time) Timezone Utilities
 * All timestamps in this application must be in IST (UTC+05:30)
 * 
 * This module provides utilities to:
 * - Get current IST time
 * - Convert any date to IST
 * - Normalize incoming timestamps to IST
 * - Format dates for storage and display
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
 * Normalize incoming timestamp to IST for storage
 * Handles various input formats and ensures IST output
 * @param {Date|string|number} input - Input timestamp
 * @returns {Date} Normalized IST Date
 */
export const normalizeToIST = (input) => {
  if (!input) return getNowIST();
  
  // If it's already a Date object
  if (input instanceof Date) {
    return toIST(input);
  }
  
  // If it's a string, try to parse it
  if (typeof input === 'string') {
    // Handle ISO strings
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return toIST(parsed);
    }
    return getNowIST();
  }
  
  // If it's a timestamp number
  if (typeof input === 'number') {
    return toIST(new Date(input));
  }
  
  return getNowIST();
};

/**
 * Format IST date as ISO string (YYYY-MM-DD)
 * @param {Date} date - Date in IST
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
 * Format IST date and time as ISO-like string
 * @param {Date} date - Date in IST
 * @returns {string} Full datetime string
 */
export const formatISTDateTime = (date) => {
  const d = date instanceof Date ? date : toIST(date);
  return `${formatISTDate(d)}T${formatISTTime(d)}:00+05:30`;
};

/**
 * Get IST date ranges for analytics
 * All ranges are in IST
 * @returns {Object} Object containing various IST date ranges
 */
export const getISTDateRanges = () => {
  const now = getNowIST();
  
  // Start of today in IST
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  
  // Start of this month in IST
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  
  // Start of last month in IST
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  
  // End of last month in IST
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  
  // Start of this year in IST
  const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  
  // Start of this week (Sunday) in IST
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Start of last week in IST
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  
  // End of last week in IST
  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setMilliseconds(-1);
  
  return {
    now,
    startOfToday,
    startOfMonth,
    startOfLastMonth,
    endOfLastMonth,
    startOfYear,
    startOfWeek,
    startOfLastWeek,
    endOfLastWeek,
  };
};

/**
 * Get today's date string in IST (YYYY-MM-DD)
 * @returns {string} Today's date in IST
 */
export const getTodayIST = () => formatISTDate(getNowIST());

/**
 * Get current time string in IST (HH:MM)
 * @returns {string} Current time in IST
 */
export const getCurrentTimeIST = () => formatISTTime(getNowIST());

/**
 * Parse a date string and return IST Date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Date} Date object in IST
 */
export const parseISTDate = (dateStr) => {
  if (!dateStr) return getNowIST();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export default {
  getNowIST,
  toIST,
  normalizeToIST,
  formatISTDate,
  formatISTTime,
  formatISTDateTime,
  getISTDateRanges,
  getTodayIST,
  getCurrentTimeIST,
  parseISTDate,
  IST_OFFSET_MS,
};
