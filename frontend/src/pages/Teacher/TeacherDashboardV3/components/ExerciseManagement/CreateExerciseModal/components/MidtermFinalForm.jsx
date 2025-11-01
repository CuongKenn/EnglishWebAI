import React from 'react';
import ListeningForm from './ListeningForm';
import ReadingForm from './ReadingForm';
import WritingForm from './WritingForm';
import SpeakingForm from './SpeakingForm';

/**
 * Midterm/Final comprehensive test form component
 * Contains all four skill sections
 */
const MidtermFinalForm = React.memo(({
  testType,
  inputMethod,
  onInputMethodChange,
  // Listening props
  listeningProps,
  // Reading props
  readingProps,
  // Writing props
  writingProps,
  // Speaking props
  speakingProps,
  // AI and Import renders
  renderAIForm,
  renderImportForm,
}) => {
  return (
    <div className="midterm-final-form">
      <h4 className="section-title">📝 Câu hỏi kiểm tra</h4>
      <p className="section-desc">
        Thêm các câu hỏi cho đề {testType === 'midterm' ? 'giữa kỳ' : 'cuối kỳ'}
      </p>
      
      {/* Input Method Selection */}
      <div className="form-section-ex">
        <div className="input-method-selector">
          <label className="method-option">
            <input 
              type="radio" 
              name="inputMethod" 
              value="manual" 
              checked={inputMethod === 'manual'}
              onChange={() => onInputMethodChange('manual')}
            />
            <span>✍️ Tạo thủ công</span>
          </label>
          <label className="method-option">
            <input 
              type="radio" 
              name="inputMethod" 
              value="ai" 
              checked={inputMethod === 'ai'}
              onChange={() => onInputMethodChange('ai')}
            />
            <span>🤖 AI Sinh đề</span>
          </label>
          <label className="method-option">
            <input 
              type="radio" 
              name="inputMethod" 
              value="import" 
              checked={inputMethod === 'import'}
              onChange={() => onInputMethodChange('import')}
            />
            <span>📄 Import từ File</span>
          </label>
        </div>
      </div>
      
      {/* Render based on selected method */}
      {inputMethod === 'manual' && (
        <>
          <p className="section-desc">Tạo đề thi toàn diện với 4 kỹ năng</p>
          
          {/* Listening Section */}
          <div className="comprehensive-section">
            <h5 className="section-subtitle">🎧 Phần Nghe (Listening)</h5>
            <ListeningForm {...listeningProps} />
          </div>
          
          {/* Reading Section */}
          <div className="comprehensive-section">
            <h5 className="section-subtitle">📖 Phần Đọc (Reading)</h5>
            <ReadingForm {...readingProps} />
          </div>
          
          {/* Writing Section */}
          <div className="comprehensive-section">
            <h5 className="section-subtitle">✍️ Phần Viết (Writing)</h5>
            <WritingForm {...writingProps} />
          </div>
          
          {/* Speaking Section */}
          <div className="comprehensive-section">
            <h5 className="section-subtitle">🗣️ Phần Nói (Speaking)</h5>
            <SpeakingForm {...speakingProps} />
          </div>
          
          <div className="info-box-note">
            <span className="info-icon">💡</span>
            <p>Đề thi toàn diện bao gồm cả 4 kỹ năng. Mỗi phần có câu hỏi riêng.</p>
          </div>
        </>
      )}
      
      {inputMethod === 'ai' && renderAIForm && renderAIForm()}
      {inputMethod === 'import' && renderImportForm && renderImportForm()}
    </div>
  );
});

MidtermFinalForm.displayName = 'MidtermFinalForm';

export default MidtermFinalForm;
