import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// Use Vite env flag instead of process.env (process is undefined in browser without polyfill)
const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (isDev) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // TODO: Send error to logging service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const { fallback, showDetails = false } = this.props;

      // If custom fallback is provided, use it
      if (fallback) {
        return fallback({
          error,
          errorInfo,
          resetError: this.handleReset,
          reloadPage: this.handleReload
        });
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold">Oops! Something went wrong</h1>
                  <p className="text-red-100 text-sm mt-1">
                    We encountered an unexpected error
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Don't worry, this happens sometimes. You can try one of the following options:
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go to Home
                </button>
              </div>

              {/* Error Details (Development/Debug Mode) */}
              {(showDetails || isDev) && error && (
                <details className="mt-6 bg-gray-50 rounded-lg overflow-hidden">
                  <summary className="px-4 py-3 cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-gray-700">
                    Technical Details (for developers)
                  </summary>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-red-600 mb-1">Error Message:</h3>
                      <pre className="bg-white p-3 rounded border border-red-200 text-sm overflow-x-auto">
                        {error.toString()}
                      </pre>
                    </div>

                    {errorInfo && errorInfo.componentStack && (
                      <div>
                        <h3 className="font-semibold text-red-600 mb-1">Component Stack:</h3>
                        <pre className="bg-white p-3 rounded border border-red-200 text-xs overflow-x-auto max-h-64">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}

                    {errorCount > 1 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-yellow-800 text-sm">
                          ⚠️ This error has occurred {errorCount} times. Consider reloading the page.
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Help Text */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  If this problem persists, please contact support or try again later.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
