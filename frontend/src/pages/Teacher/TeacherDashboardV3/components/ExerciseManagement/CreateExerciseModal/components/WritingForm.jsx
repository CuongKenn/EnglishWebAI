import React from 'react';
import { Plus, X } from 'lucide-react';
import { WRITING_TYPES } from '../constants';

/**
 * Writing form component
 * Handles prompt, type, instructions, and word limits
 */
const WritingForm = React.memo(({
  writingPrompt,
  onWritingPromptChange,
  writingType,
  onWritingTypeChange,
  writingInstructions,
  onInstructionChange,
  onAddInstruction,
  onRemoveInstruction,
  minWords,
  onMinWordsChange,
  maxWords,
  onMaxWordsChange,
}) => {
  return (
    <div className="writing-form-content">
      <h4 className="section-title">✍️ Nội dung bài Viết</h4>
      
      {/* Prompt */}
      <div className="form-section-ex">
        <label className="form-label-ex">Đề bài *</label>
        <textarea 
          className="form-textarea-ex"
          rows="4"
          placeholder="Ví dụ: Write an essay about the importance of learning English..."
          value={writingPrompt}
          onChange={(e) => onWritingPromptChange(e.target.value)}
        />
      </div>
      
      {/* Type */}
      <div className="form-section-ex">
        <label className="form-label-ex">Loại bài viết</label>
        <select 
          className="form-select-ex"
          value={writingType}
          onChange={(e) => onWritingTypeChange(e.target.value)}
        >
          {WRITING_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Instructions */}
      <div className="form-section-ex">
        <label className="form-label-ex">Hướng dẫn chi tiết</label>
        {writingInstructions.map((inst, idx) => (
          <div key={idx} className="instruction-row">
            <input 
              type="text"
              className="form-input-ex"
              placeholder={`Hướng dẫn ${idx + 1}`}
              value={inst}
              onChange={(e) => onInstructionChange(idx, e.target.value)}
            />
            {writingInstructions.length > 1 && (
              <button 
                onClick={() => onRemoveInstruction(idx)}
                className="btn-remove-item"
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        <button 
          onClick={onAddInstruction} 
          className="btn-add-item"
          type="button"
        >
          <Plus size={16} />
          Thêm hướng dẫn
        </button>
      </div>
      
      {/* Word Limit */}
      <div className="form-row-ex">
        <div className="form-section-ex">
          <label className="form-label-ex">Số từ tối thiểu</label>
          <input 
            type="number" 
            className="form-input-ex"
            value={minWords}
            onChange={(e) => onMinWordsChange(Number(e.target.value))}
            min="0"
          />
        </div>
        <div className="form-section-ex">
          <label className="form-label-ex">Số từ tối đa</label>
          <input 
            type="number" 
            className="form-input-ex"
            value={maxWords}
            onChange={(e) => onMaxWordsChange(Number(e.target.value))}
            min={minWords}
          />
        </div>
      </div>
    </div>
  );
});

WritingForm.displayName = 'WritingForm';

export default WritingForm;
