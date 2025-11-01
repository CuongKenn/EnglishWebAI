import React from 'react';

export const ScrollArea = React.memo(({ className = '', children, ...props }) => {
  return (
    <div
      className={`overflow-auto ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
