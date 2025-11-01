import React from 'react';
import './LoadingSpinner.css';

/**
 * Loading Spinner Component
 * Elegant loading indicator with multiple sizes and variants
 */
export const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary',
  fullScreen = false,
  text = ''
}) => {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: 'spinner-md',
    lg: 'spinner-lg',
    xl: 'spinner-xl',
  };

  const variantClasses = {
    primary: 'spinner-primary',
    secondary: 'spinner-secondary',
    white: 'spinner-white',
  };

  const spinnerContent = (
    <div className={`loading-spinner ${sizeClasses[size]} ${variantClasses[variant]}`}>
      <div className="spinner-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-spinner-fullscreen">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

/**
 * Skeleton Loader Component
 * Shows placeholder content while loading
 */
export const SkeletonLoader = ({ 
  type = 'text',
  count = 1,
  width = '100%',
  height = '20px',
}) => {
  const types = {
    text: 'skeleton-text',
    title: 'skeleton-title',
    circle: 'skeleton-circle',
    rectangle: 'skeleton-rectangle',
    card: 'skeleton-card',
  };

  if (type === 'card') {
    return (
      <div className="skeleton-card-wrapper">
        <div className="skeleton-card-header">
          <div className="skeleton-circle" style={{ width: '48px', height: '48px' }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton-title" style={{ width: '60%' }}></div>
            <div className="skeleton-text" style={{ width: '40%' }}></div>
          </div>
        </div>
        <div className="skeleton-card-body">
          <div className="skeleton-text" style={{ width: '100%' }}></div>
          <div className="skeleton-text" style={{ width: '90%' }}></div>
          <div className="skeleton-text" style={{ width: '80%' }}></div>
        </div>
      </div>
    );
  }

  const items = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`skeleton ${types[type]}`}
      style={{ width, height }}
    />
  ));

  return <div className="skeleton-wrapper">{items}</div>;
};

/**
 * Loading Overlay Component
 * Shows loading state over existing content
 */
export const LoadingOverlay = ({ isLoading, children, text = 'Đang tải...' }) => {
  return (
    <div className="loading-overlay-container">
      {children}
      {isLoading && (
        <div className="loading-overlay">
          <LoadingSpinner size="lg" variant="white" text={text} />
        </div>
      )}
    </div>
  );
};

/**
 * Pulse Loader Component
 * Simple dots animation
 */
export const PulseLoader = ({ color = '#3b82f6' }) => {
  return (
    <div className="pulse-loader">
      <div className="pulse-dot" style={{ background: color }}></div>
      <div className="pulse-dot" style={{ background: color }}></div>
      <div className="pulse-dot" style={{ background: color }}></div>
    </div>
  );
};

/**
 * Progress Bar Component
 * Linear progress indicator
 */
export const ProgressBar = ({ 
  progress = 0, 
  showLabel = true,
  variant = 'primary',
  height = '8px'
}) => {
  const variantColors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  };

  return (
    <div className="progress-bar-container" style={{ height }}>
      <div 
        className="progress-bar-fill"
        style={{ 
          width: `${Math.min(100, Math.max(0, progress))}%`,
          background: variantColors[variant]
        }}
      >
        {showLabel && (
          <span className="progress-label">{Math.round(progress)}%</span>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
