/**
 * Exam Upload Component
 * Upload Word document to create exam assessment
 */
import React, { useState } from 'react';
import examService from '../services/examService';
import './ExamUpload.css';

const ExamUpload = ({ classId, onSuccess, onCancel }) => {
  const [file, setFile] = useState(null);
  const [examType, setExamType] = useState('midterm');
  const [isPublished, setIsPublished] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Chỉ chấp nhận file Word (.docx, .doc)');
        setFile(null);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.docx') || droppedFile.name.endsWith('.doc')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Chỉ chấp nhận file Word (.docx, .doc)');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Vui lòng chọn file Word');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('class_id', classId);
      formData.append('exam_type', examType);
      formData.append('is_published', isPublished);
      if (startTime) formData.append('start_time', startTime);
      if (endTime) formData.append('end_time', endTime);

      const response = await examService.uploadExamFromWord(formData);

      if (response.success) {
        alert('✅ ' + response.message);
        if (onSuccess) onSuccess(response.exam);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi upload');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Lỗi khi upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="exam-upload-container">
      <h2>📄 Import Đề Thi Từ File Word</h2>

      {/* File Upload Area */}
      <div
        className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          accept=".doc,.docx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" className="file-upload-label">
          {file ? (
            <div className="file-selected">
              <span className="file-icon">📎</span>
              <span className="file-name">{file.name}</span>
              <button
                type="button"
                className="remove-file-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setFile(null);
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="file-placeholder">
              <span className="upload-icon">📤</span>
              <p>Kéo thả file Word vào đây hoặc click để chọn</p>
              <p className="file-hint">Chấp nhận: .docx, .doc</p>
            </div>
          )}
        </label>
      </div>

      {/* Exam Settings */}
      <div className="exam-settings">
        <div className="form-group">
          <label htmlFor="exam-type">Loại đề thi:</label>
          <select
            id="exam-type"
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
          >
            <option value="midterm">Giữa kỳ</option>
            <option value="final">Cuối kỳ</option>
            <option value="quiz">Kiểm tra</option>
            <option value="practice">Luyện tập</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Công bố ngay cho học sinh
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="start-time">Thời gian bắt đầu (tùy chọn):</label>
          <input
            type="datetime-local"
            id="start-time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="end-time">Thời gian kết thúc (tùy chọn):</label>
          <input
            type="datetime-local"
            id="end-time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="btn-cancel"
          onClick={onCancel}
          disabled={uploading}
        >
          Hủy
        </button>
        <button
          className="btn-upload"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? '⏳ Đang xử lý...' : '🚀 Upload & Tạo Đề Thi'}
        </button>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h4>📌 Hướng dẫn:</h4>
        <ul>
          <li>File Word cần chứa đề thi có cấu trúc rõ ràng</li>
          <li>Hệ thống sẽ sử dụng AI để phân tích và tạo đề thi tương tác</li>
          <li>Các hình ảnh trong đề sẽ được tự động trích xuất</li>
          <li>Bạn có thể chỉnh sửa đề sau khi import</li>
        </ul>
      </div>
    </div>
  );
};

export default ExamUpload;

