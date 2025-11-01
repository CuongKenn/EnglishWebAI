import React from 'react';
import logger from '../../utils/logger';
import './ErrorBoundary.css';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Logs error details and displays a fallback UI
 */
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

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Optional: Send error to monitoring service
    // this.sendErrorToMonitoring(error, errorInfo);
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

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      const { error, errorInfo } = this.state;
      const isDev = import.meta.env.DEV;

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">Oops! Something went wrong</h1>
            <p className="error-message">
              {this.props.fallbackMessage || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'}
            </p>

            <div className="error-actions">
              <button 
                onClick={this.handleReset} 
                className="btn-reset"
              >
                Thử lại
              </button>
              <button 
                onClick={this.handleReload} 
                className="btn-reload"
              >
                Tải lại trang
              </button>
            </div>

            {/* Show error details in development */}
            {isDev && error && (
              <details className="error-details">
                <summary>Chi tiết lỗi (chỉ hiển thị trong development)</summary>
                <div className="error-stack">
                  <h3>Error:</h3>
                  <pre>{error.toString()}</pre>
                  
                  {errorInfo && (
                    <>
                      <h3>Component Stack:</h3>
                      <pre>{errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for easier usage with hooks
 */
export const withErrorBoundary = (Component, fallbackMessage) => {
  return function WithErrorBoundaryWrapper(props) {
    return (
      <ErrorBoundary fallbackMessage={fallbackMessage}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

export default ErrorBoundary;
