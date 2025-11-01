/**
 * Logger Utility
 * Handles logging with environment-based filtering
 * - Development: All logs are shown
 * - Production: Only errors and warnings are shown
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Log general information (only in development)
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log debug information with prefix (only in development)
   */
  debug: (prefix, ...args) => {
    if (isDev) {
      console.log(`[${prefix}]`, ...args);
    }
  },

  /**
   * Log warnings (always shown)
   */
  warn: (...args) => {
    console.warn(...args);
  },

  /**
   * Log errors (always shown)
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log info with timestamp (only in development)
   */
  info: (...args) => {
    if (isDev) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}]`, ...args);
    }
  },

  /**
   * Group logs together (only in development)
   */
  group: (label, callback) => {
    if (isDev) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Table format (only in development)
   */
  table: (data) => {
    if (isDev) {
      console.table(data);
    }
  }
};

export default logger;
