import React from 'react';

export const Avatar = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const AvatarFallback = ({ className = '', children, ...props }) => {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-sm font-medium ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
