import React from 'react';

export const Card = ({ className = '', children, ...props }) => {
  const cardStyle = {
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  };
  
  return (
    <div
      style={cardStyle}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};
