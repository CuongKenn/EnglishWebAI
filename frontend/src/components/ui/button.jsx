import React from 'react';

export const Button = React.forwardRef(
  ({ className = '', variant = 'default', size = 'default', children, disabled, style = {}, ...props }, ref) => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      fontWeight: 500,
      transition: 'all 0.2s',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      border: 'none',
      outline: 'none',
    };
    
    const variantStyles = {
      default: {
        backgroundColor: '#2563eb',
        color: 'white',
      },
      outline: {
        border: '1px solid #d1d5db',
        backgroundColor: 'white',
        color: '#374151',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#374151',
      },
    };
    
    const sizeStyles = {
      default: {
        height: '40px',
        padding: '0 16px',
        fontSize: '14px',
      },
      sm: {
        height: '36px',
        padding: '0 12px',
        fontSize: '13px',
      },
      icon: {
        height: '40px',
        width: '40px',
        padding: 0,
      },
    };
    
    const combinedStyles = {
      ...baseStyles,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style, // User custom styles override everything
    };
    
    return (
      <button
        ref={ref}
        style={combinedStyles}
        className={className}
        disabled={disabled}
        onMouseEnter={(e) => {
          if (!disabled) {
            if (variant === 'default') e.target.style.backgroundColor = '#1d4ed8';
            if (variant === 'outline') e.target.style.backgroundColor = '#f3f4f6';
            if (variant === 'ghost') e.target.style.backgroundColor = '#f3f4f6';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            if (variant === 'default') {
              // Check if custom background was provided
              e.target.style.backgroundColor = style.background || style.backgroundColor || '#2563eb';
            }
            if (variant === 'outline') e.target.style.backgroundColor = 'white';
            if (variant === 'ghost') e.target.style.backgroundColor = 'transparent';
          }
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
