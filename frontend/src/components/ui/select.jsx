import React, { createContext, useContext, useState } from 'react';

const SelectContext = createContext();

export const Select = ({ value, onValueChange, children }) => {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, selectedLabel, setSelectedLabel }}>
      <div style={{ position: 'relative' }}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = ({ children, className = '' }) => {
  const { setOpen } = useContext(SelectContext);
  
  const buttonStyle = {
    display: 'flex',
    height: '40px',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    padding: '8px 12px',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s',
  };
  
  return (
    <button
      type="button"
      onClick={() => setOpen(prev => !prev)}
      style={buttonStyle}
      className={className}
      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
    >
      {children}
      <svg style={{ width: '16px', height: '16px', opacity: 0.5, marginLeft: '8px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

export const SelectValue = ({ placeholder = 'Select...' }) => {
  const { selectedLabel } = useContext(SelectContext);
  
  return <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabel || placeholder}</span>;
};

export const SelectContent = ({ children }) => {
  const { open, setOpen } = useContext(SelectContext);
  
  if (!open) return null;
  
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
  };
  
  const contentStyle = {
    position: 'absolute',
    top: '100%',
    zIndex: 50,
    marginTop: '4px',
    maxHeight: '240px',
    width: '100%',
    overflowY: 'auto',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  };
  
  return (
    <>
      <div style={overlayStyle} onClick={() => setOpen(false)} />
      <div style={contentStyle}>
        {children}
      </div>
    </>
  );
};

export const SelectItem = ({ value, children }) => {
  const { value: selectedValue, onValueChange, setOpen, setSelectedLabel } = useContext(SelectContext);
  const isSelected = selectedValue === value;
  
  const itemStyle = {
    cursor: 'pointer',
    padding: '8px 12px',
    fontSize: '14px',
    backgroundColor: isSelected ? '#eff6ff' : 'white',
    color: isSelected ? '#2563eb' : 'inherit',
    fontWeight: isSelected ? 500 : 'normal',
    transition: 'background-color 0.15s',
  };
  
  // Set initial selected label
  React.useEffect(() => {
    if (isSelected) {
      setSelectedLabel(children);
    }
  }, [isSelected, children, setSelectedLabel]);
  
  return (
    <div
      style={itemStyle}
      onClick={() => {
        onValueChange(value);
        setSelectedLabel(children);
        setOpen(false);
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.target.style.backgroundColor = '#f3f4f6';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.target.style.backgroundColor = 'white';
      }}
    >
      {children}
    </div>
  );
};
