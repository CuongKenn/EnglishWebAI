import React from 'react';

export const Input = React.forwardRef(
  ({ className = '', type = 'text', disabled, ...props }, ref) => {
    const inputStyle = {
      display: 'flex',
      height: '40px',
      width: '100%',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      padding: '8px 12px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s',
      cursor: disabled ? 'not-allowed' : 'text',
      opacity: disabled ? 0.5 : 1,
    };
    
    return (
      <input
        ref={ref}
        type={type}
        style={inputStyle}
        className={className}
        disabled={disabled}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
