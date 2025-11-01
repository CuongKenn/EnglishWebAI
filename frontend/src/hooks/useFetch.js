import { useState, useCallback, useRef, useEffect } from 'react';
import logger from '../utils/logger';

/**
 * Custom hook for handling API requests with loading, error, and data states
 * Prevents memory leaks and provides clean API for async operations
 * 
 * @example
 * const { data, loading, error, execute, reset } = useFetch(api.getExercises);
 * 
 * // Call in useEffect or event handler
 * useEffect(() => {
 *   execute(classId);
 * }, [classId]);
 */
export function useFetch(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(...args);
      
      if (isMountedRef.current) {
        setData(result);
        setLoading(false);
      }
      
      return result;
    } catch (err) {
      logger.error('useFetch error:', err);
      
      if (isMountedRef.current) {
        setError(err.response?.data?.detail || err.message || 'An error occurred');
        setLoading(false);
      }
      
      throw err;
    }
  }, [apiFunction]);
  
  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setData(null);
      setError(null);
      setLoading(false);
    }
  }, []);
  
  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Custom hook for handling multiple API requests in parallel
 * Useful for loading multiple resources at once
 * 
 * @example
 * const { data, loading, errors, execute } = useFetchMultiple([
 *   () => api.getClasses(),
 *   () => api.getExercises(),
 * ]);
 */
export function useFetchMultiple(apiFunctions) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setErrors([]);
      
      const results = await Promise.allSettled(
        apiFunctions.map(fn => fn())
      );
      
      if (isMountedRef.current) {
        const successData = results.map(result => 
          result.status === 'fulfilled' ? result.value : null
        );
        
        const failedErrors = results
          .map((result, index) => 
            result.status === 'rejected' 
              ? { index, error: result.reason } 
              : null
          )
          .filter(Boolean);
        
        setData(successData);
        setErrors(failedErrors);
        setLoading(false);
      }
      
      return results;
    } catch (err) {
      logger.error('useFetchMultiple error:', err);
      
      if (isMountedRef.current) {
        setErrors([{ error: err }]);
        setLoading(false);
      }
      
      throw err;
    }
  }, [apiFunctions]);
  
  return {
    data,
    loading,
    errors,
    execute,
  };
}

/**
 * Custom hook for paginated data fetching
 * Handles page state and provides helpers for pagination
 * 
 * @example
 * const { data, loading, page, totalPages, nextPage, prevPage, goToPage } = usePaginatedFetch(
 *   api.getExercises,
 *   { pageSize: 20 }
 * );
 */
export function usePaginatedFetch(apiFunction, options = {}) {
  const { pageSize = 20, autoFetch = false } = options;
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const fetchPage = useCallback(async (pageNum, ...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction({
        page: pageNum,
        pageSize,
        ...args
      });
      
      if (isMountedRef.current) {
        setData(result.data || result.items || result);
        setTotalPages(result.totalPages || Math.ceil((result.total || 0) / pageSize));
        setTotalItems(result.total || 0);
        setPage(pageNum);
        setLoading(false);
      }
      
      return result;
    } catch (err) {
      logger.error('usePaginatedFetch error:', err);
      
      if (isMountedRef.current) {
        setError(err.response?.data?.detail || err.message || 'An error occurred');
        setLoading(false);
      }
      
      throw err;
    }
  }, [apiFunction, pageSize]);
  
  const nextPage = useCallback(() => {
    if (page < totalPages) {
      fetchPage(page + 1);
    }
  }, [page, totalPages, fetchPage]);
  
  const prevPage = useCallback(() => {
    if (page > 1) {
      fetchPage(page - 1);
    }
  }, [page, fetchPage]);
  
  const goToPage = useCallback((pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      fetchPage(pageNum);
    }
  }, [totalPages, fetchPage]);
  
  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setData([]);
      setError(null);
      setLoading(false);
      setPage(1);
      setTotalPages(1);
      setTotalItems(0);
    }
  }, []);
  
  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchPage(1);
    }
  }, [autoFetch, fetchPage]);
  
  return {
    data,
    loading,
    error,
    page,
    totalPages,
    totalItems,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    fetchPage,
    nextPage,
    prevPage,
    goToPage,
    reset,
  };
}

export default useFetch;
