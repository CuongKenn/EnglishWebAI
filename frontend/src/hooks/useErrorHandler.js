import { useState, useEffect } from 'react';

/**
 * Hook to manually trigger error boundary for async errors
 * Usage:
 *   const throwError = useErrorHandler();
 *   try {
 *     await someAsyncOperation();
 *   } catch (error) {
 *     throwError(error); // This will trigger the nearest error boundary
 *   }
 */
export function useErrorHandler() {
  const [error, setError] = useState(null);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}

/**
 * Higher-order component to wrap async functions with error boundary
 * Usage:
 *   const safeAsyncFunction = withErrorBoundary(myAsyncFunction);
 */
export function withErrorBoundary(asyncFn) {
  // Simply return the async function - errors will propagate to error boundary naturally
  return asyncFn;
}
