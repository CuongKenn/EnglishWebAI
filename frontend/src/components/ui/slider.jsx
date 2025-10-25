import React from 'react';

export const Slider = ({ 
  value = [50], 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1,
  className = '',
  ...props 
}) => {
  const handleChange = (e) => {
    if (onValueChange) {
      onValueChange([Number(e.target.value)]);
    }
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={handleChange}
      className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 ${className}`}
      {...props}
    />
  );
};
