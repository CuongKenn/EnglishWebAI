import { useState, useEffect } from 'react';
import { UI_CONFIG } from '../config/constants';

/**
 * useDebounce Hook
 * Delays updating a value until after the user has stopped typing for a specified delay
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: UI_CONFIG.SEARCH_DEBOUNCE)
 * @returns {any} - The debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm);
 * 
 * useEffect(() => {
 *   // This will only run after user stops typing for 300ms
 *   if (debouncedSearchTerm) {
 *     fetchSearchResults(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */
export function useDebounce(value, delay = UI_CONFIG.SEARCH_DEBOUNCE) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes before delay expires
    // This prevents the debounced value from updating too frequently
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback Hook
 * Returns a debounced version of a callback function
 * 
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds (default: UI_CONFIG.INPUT_DEBOUNCE)
 * @returns {Function} - The debounced callback
 * 
 * @example
 * const handleSearch = useDebouncedCallback((term) => {
 *   fetchSearchResults(term);
 * });
 * 
 * <input onChange={(e) => handleSearch(e.target.value)} />
 */
export function useDebouncedCallback(callback, delay = UI_CONFIG.INPUT_DEBOUNCE) {
  const [timeoutId, setTimeoutId] = useState(null);

  const debouncedCallback = (...args) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}

export default useDebounce;
