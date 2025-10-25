import React from 'react';

export const Textarea = React.forwardRef(
  ({ className = '', disabled, ...props }, ref) => {
    const textareaStyle = {
      display: 'flex',
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
      fontFamily: 'inherit',
    };
    
    return (
      <textarea
        ref={ref}
        style={textareaStyle}
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

Textarea.displayName = 'Textarea';
