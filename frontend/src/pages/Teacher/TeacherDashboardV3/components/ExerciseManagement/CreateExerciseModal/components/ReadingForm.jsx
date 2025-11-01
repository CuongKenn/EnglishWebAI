import React, { useRef } from 'react';
import { FileText, Upload, File, Trash2 } from 'lucide-react';

/**
 * Reading form component
 * Handles passage text input or file upload
 */
const ReadingForm = React.memo(({
  passageText,
  onPassageTextChange,
  readingInputMethod,
  onReadingInputMethodChange,
  passageFile,
  onPassageFileChange,
  onPassageFileRemove,
  renderQuestions,
}) => {
  const passageFileInputRef = useRef(null);

  const handlePassageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && onPassageFileChange) {
      onPassageFileChange(file);
    }
  };

  const handleRemoveFile = (e) => {
    if (e) e.stopPropagation();
    if (onPassageFileRemove) {
      onPassageFileRemove();
    }
    if (passageFileInputRef.current) {
      passageFileInputRef.current.value = '';
    }
  };

  const wordCount = passageText.split(/\s+/).filter(w => w).length;
  const charCount = passageText.length;

  return (
    <div className="reading-form-content">
      <h4 className="section-title">📖 Nội dung bài Đọc</h4>
      
      {/* Input Method Tabs */}
      <div className="input-method-tabs">
        <button 
          className={`method-tab ${readingInputMethod === 'text' ? 'active' : ''}`}
          onClick={() => onReadingInputMethodChange('text')}
          type="button"
        >
          <FileText size={18} />
          Nhập văn bản
        </button>
        <button 
          className={`method-tab ${readingInputMethod === 'upload' ? 'active' : ''}`}
          onClick={() => onReadingInputMethodChange('upload')}
          type="button"
        >
          <Upload size={18} />
          Upload file
        </button>
      </div>
      
      {/* Text Input */}
      {readingInputMethod === 'text' && (
        <div className="form-section-ex">
          <label className="form-label-ex">Đoạn văn *</label>
          <textarea 
            className="form-textarea-ex"
            rows="15"
            placeholder="Nhập hoặc paste đoạn văn..."
            value={passageText}
            onChange={(e) => onPassageTextChange(e.target.value)}
          />
          <div className="text-stats">
            <span>📊 {wordCount} từ</span>
            <span>📄 {charCount} ký tự</span>
          </div>
        </div>
      )}
      
      {/* File Upload */}
      {readingInputMethod === 'upload' && (
        <div className="form-section-ex">
          <label className="form-label-ex">Upload file (.pdf, .docx, .txt)</label>
          <div 
            className="file-upload-zone" 
            onClick={() => passageFileInputRef.current?.click()}
          >
            <input 
              ref={passageFileInputRef}
              type="file" 
              accept=".pdf,.doc,.docx,.txt"
              onChange={handlePassageFileUpload}
              style={{ display: 'none' }}
            />
            {!passageFile ? (
              <>
                <File size={40} className="upload-icon" />
                <p>Click để chọn file</p>
                <span className="upload-hint">PDF, Word, hoặc Text - Tối đa 10MB</span>
              </>
            ) : (
              <div className="file-preview-box">
                <File size={28} />
                <div className="file-info">
                  <span className="file-name">{passageFile.name}</span>
                  <span className="file-size">{(passageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button 
                  onClick={handleRemoveFile}
                  className="btn-remove-file"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Questions */}
      {renderQuestions && renderQuestions()}
    </div>
  );
});

ReadingForm.displayName = 'ReadingForm';

export default ReadingForm;
