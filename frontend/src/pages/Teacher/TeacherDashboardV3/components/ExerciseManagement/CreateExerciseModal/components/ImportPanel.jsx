import React, { useRef } from 'react';
import { FileUp, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

/**
 * Import Panel component
 * Handles importing exercises from Word documents with AI processing
 */
const ImportPanel = React.memo(({
  title,
  onTitleChange,
  classId,
  onClassIdChange,
  classes,
  dueDate,
  onDueDateChange,
  maxScore,
  onMaxScoreChange,
  importFile,
  onImportFileChange,
  onImportWordFile,
  isProcessing,
  importPreview,
}) => {
  const importFileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFileChange(file);
    }
  };

  const removeFile = () => {
    onImportFileChange(null);
    if (importFileInputRef.current) {
      importFileInputRef.current.value = '';
    }
  };

  return (
    <div className="import-form-content">
      <div className="import-form-header">
        <div className="import-header-icon">
          <FileUp size={32} />
        </div>
        <div className="import-header-text">
          <h4>Import đề thi từ Word</h4>
          <p>Upload file Word (.docx) để tự động chuyển đổi thành bài tập</p>
        </div>
      </div>
      
      {/* Basic Information */}
      <div className="form-section-ex">
        <label className="form-label-ex">Tiêu đề đề thi *</label>
        <input 
          type="text" 
          className="form-input-ex" 
          placeholder="Ví dụ: Đề kiểm tra giữa kỳ I - Khối 10"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      
      {/* Class Selection */}
      <div className="form-row-ex">
        <div className="form-section-ex">
          <label className="form-label-ex">Lớp học <span className="required">*</span></label>
          <select 
            className="form-select-ex" 
            value={classId} 
            onChange={(e) => onClassIdChange(e.target.value)}
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.grade && `(Khối ${cls.grade})`}
              </option>
            ))}
          </select>
        </div>
        <div className="form-section-ex">
          <label className="form-label-ex">Hạn nộp</label>
          <input 
            type="datetime-local" 
            className="form-input-ex"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />
        </div>
        <div className="form-section-ex">
          <label className="form-label-ex">Điểm tối đa</label>
          <input 
            type="number" 
            className="form-input-ex"
            value={maxScore}
            onChange={(e) => onMaxScoreChange(Number(e.target.value))}
            min="1"
            max="10"
          />
        </div>
      </div>
      
      {/* File Upload */}
      <div className="form-section-ex">
        <label className="form-label-ex">Upload file Word (.docx) *</label>
        <div 
          className="file-upload-zone-import" 
          onClick={() => !importFile && importFileInputRef.current?.click()}
          style={{ cursor: importFile ? 'default' : 'pointer' }}
        >
          <input 
            ref={importFileInputRef}
            type="file"
            accept=".docx"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          {!importFile ? (
            <>
              <FileUp size={48} />
              <p>Click để chọn file Word</p>
              <span className="upload-hint">Chỉ hỗ trợ .docx</span>
            </>
          ) : (
            <div className="uploaded-file-display">
              <div className="file-icon-large">📄</div>
              <div className="file-info">
                <h5>{importFile.name}</h5>
                <p>{(importFile.size / 1024).toFixed(2)} KB</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }} 
                className="btn-remove-file"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Import Instructions */}
      <div className="info-box-warning">
        <AlertCircle size={20} />
        <div className="info-content">
          <h5>Lưu ý khi import từ Word:</h5>
          <ul>
            <li>File phải có cấu trúc rõ ràng với tiêu đề câu hỏi và đáp án</li>
            <li>AI sẽ phân tích và chuyển đổi tự động (có thể mất 3-5 phút)</li>
            <li>Bạn có thể chỉnh sửa lại sau khi import thành công</li>
            <li>Hỗ trợ các dạng: trắc nghiệm, điền từ, đúng/sai, tự luận</li>
          </ul>
        </div>
      </div>
      
      {/* Processing Status */}
      {isProcessing && (
        <div className="info-box-processing">
          <div className="loading-spinner" />
          <div className="info-content">
            <h5>Đang xử lý file...</h5>
            <p>AI đang phân tích và chuyển đổi nội dung. Vui lòng đợi trong giây lát.</p>
            <div className="estimate-time">
              <Clock size={16} />
              <span>Thời gian ước tính: 3-5 phút</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Preview */}
      {importPreview && (
        <div className="import-preview-section">
          <div className="preview-header">
            <CheckCircle size={20} color="#10b981" />
            <h5>Xem trước kết quả import</h5>
          </div>
          <div className="preview-content">
            <div className="preview-stats">
              <div className="stat-item">
                <span className="stat-label">Tổng câu hỏi:</span>
                <span className="stat-value">{importPreview.totalQuestions || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Trắc nghiệm:</span>
                <span className="stat-value">{importPreview.multipleChoice || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Điền từ:</span>
                <span className="stat-value">{importPreview.fillBlank || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tự luận:</span>
                <span className="stat-value">{importPreview.essay || 0}</span>
              </div>
            </div>
            {importPreview.errors && importPreview.errors.length > 0 && (
              <div className="preview-errors">
                <h6>⚠️ Một số vấn đề cần kiểm tra:</h6>
                <ul>
                  {importPreview.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Import Button */}
      <div className="import-action-section">
        <button 
          className="btn-import-word"
          onClick={onImportWordFile}
          disabled={!importFile || !classId || isProcessing}
          type="button"
        >
          {isProcessing ? (
            <>
              <div className="loading-spinner" />
              Đang xử lý...
            </>
          ) : (
            <>
              <FileUp size={18} />
              Import và xử lý bằng AI
            </>
          )}
        </button>
      </div>
    </div>
  );
});

ImportPanel.displayName = 'ImportPanel';

export default ImportPanel;
