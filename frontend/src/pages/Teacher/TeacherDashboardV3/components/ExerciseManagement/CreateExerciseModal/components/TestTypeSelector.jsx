import React from 'react';
import { FileText, Clock, Award } from 'lucide-react';
import { TEST_TYPES } from '../constants';

/**
 * Test type selector component
 * Displays cards for selecting exercise/test type
 */
const TestTypeSelector = React.memo(({ testType, onTestTypeChange }) => {
  const getIcon = (iconName) => {
    const icons = {
      FileText: FileText,
      Clock: Clock,
      Award: Award,
    };
    const IconComponent = icons[iconName] || FileText;
    return <IconComponent size={24} />;
  };

  return (
    <div className="form-section-ex">
      <label className="form-label-ex">Loại bài tập</label>
      <div className="test-type-grid">
        {TEST_TYPES.map((type) => (
          <button
            key={type.value}
            className={`test-type-card ${testType === type.value ? 'active' : ''}`}
            onClick={() => onTestTypeChange(type.value)}
            type="button"
          >
            {getIcon(type.icon)}
            <span className="type-title">{type.label}</span>
            <span className="type-desc">{type.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

TestTypeSelector.displayName = 'TestTypeSelector';

export default TestTypeSelector;
