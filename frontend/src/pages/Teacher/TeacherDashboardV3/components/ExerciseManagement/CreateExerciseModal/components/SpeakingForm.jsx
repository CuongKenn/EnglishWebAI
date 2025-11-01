import React from 'react';
import { Plus, X } from 'lucide-react';

/**
 * Speaking form component
 * Handles prompt, instructions, prep time, and speak time
 */
const SpeakingForm = React.memo(({
  speakingPrompt,
  onSpeakingPromptChange,
  speakingInstructions,
  onInstructionChange,
  onAddInstruction,
  onRemoveInstruction,
  prepTime,
  onPrepTimeChange,
  speakTime,
  onSpeakTimeChange,
}) => {
  return (
    <div className="speaking-form-content">
      <h4 className="section-title">🗣️ Nội dung bài Nói</h4>
      
      {/* Prompt */}
      <div className="form-section-ex">
        <label className="form-label-ex">Đề bài *</label>
        <textarea 
          className="form-textarea-ex"
          rows="4"
          placeholder="Ví dụ: Describe your favorite book and explain why you like it."
          value={speakingPrompt}
          onChange={(e) => onSpeakingPromptChange(e.target.value)}
        />
      </div>
      
      {/* Instructions */}
      <div className="form-section-ex">
        <label className="form-label-ex">Hướng dẫn chi tiết</label>
        {speakingInstructions.map((inst, idx) => (
          <div key={idx} className="instruction-row">
            <input 
              type="text"
              className="form-input-ex"
              placeholder={`Hướng dẫn ${idx + 1}`}
              value={inst}
              onChange={(e) => onInstructionChange(idx, e.target.value)}
            />
            {speakingInstructions.length > 1 && (
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
      
      {/* Time Settings */}
      <div className="form-row-ex">
        <div className="form-section-ex">
          <label className="form-label-ex">Thời gian chuẩn bị (giây)</label>
          <input 
            type="number" 
            className="form-input-ex"
            value={prepTime}
            onChange={(e) => onPrepTimeChange(Number(e.target.value))}
            min="0"
          />
        </div>
        <div className="form-section-ex">
          <label className="form-label-ex">Thời gian nói (giây)</label>
          <input 
            type="number" 
            className="form-input-ex"
            value={speakTime}
            onChange={(e) => onSpeakTimeChange(Number(e.target.value))}
            min="0"
          />
        </div>
      </div>
    </div>
  );
});

SpeakingForm.displayName = 'SpeakingForm';

export default SpeakingForm;
