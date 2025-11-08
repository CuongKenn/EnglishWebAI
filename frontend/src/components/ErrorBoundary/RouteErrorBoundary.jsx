import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error in development
    if (isDev) {
      // eslint-disable-next-line no-console
      console.error('RouteErrorBoundary:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { routeName = 'this page' } = this.props;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Unable to load {routeName}</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Something went wrong while loading this page. Please try again.
            </p>

            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors w-full justify-center"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            {isDev && this.state.error && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-gray-500">Error Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
