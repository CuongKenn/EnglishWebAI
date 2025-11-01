import React from 'react';
import { FileText, Sparkles, Upload } from 'lucide-react';
import { INPUT_METHODS } from '../constants';

/**
 * Input method selector component
 * Tabs for manual input, AI generation, or file import
 */
const InputMethodSelector = React.memo(({ inputMethod, onInputMethodChange }) => {
  const getIcon = (iconName, size = 18) => {
    const icons = {
      FileText: FileText,
      Sparkles: Sparkles,
      Upload: Upload,
    };
    const IconComponent = icons[iconName] || FileText;
    return <IconComponent size={size} />;
  };

  return (
    <div className="input-method-tabs">
      {INPUT_METHODS.map((method) => (
        <button
          key={method.value}
          className={`tab-button ${inputMethod === method.value ? 'active' : ''}`}
          onClick={() => onInputMethodChange(method.value)}
          type="button"
        >
          {getIcon(method.icon)}
          {method.label}
        </button>
      ))}
    </div>
  );
});

InputMethodSelector.displayName = 'InputMethodSelector';

export default InputMethodSelector;
