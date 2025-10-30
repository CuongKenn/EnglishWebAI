/**
 * Exam Import Modal Component
 * Modal để import đề thi từ file Word
 */
import React, { useState, useEffect } from 'react';
import { X, FileText, Upload, AlertCircle } from 'lucide-react';
import examService from '../services/examService';
import './ExamImportModal.css';

const ExamImportModal = ({ classId: initialClassId, onClose, onSuccess }) => {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(initialClassId || '');
  const [file, setFile] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState('midterm');
  const [isPublished, setIsPublished] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Load classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await fetch('/api/v1/classes/teaching', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setClasses(data);
        if (data.length > 0 && !classId) {
          setClassId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    };
    loadClasses();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Chỉ chấp nhận file Word (.docx hoặc .doc)');
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
        setError('Chỉ chấp nhận file Word (.docx hoặc .doc)');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Vui lòng chọn file Word');
      return;
    }

    if (!examTitle.trim()) {
      setError('Vui lòng nhập tiêu đề bài tập');
      return;
    }

    if (!classId) {
      setError('Vui lòng chọn lớp học');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('exam_title', examTitle.trim());
      formData.append('class_id', classId);
      formData.append('exam_type', examType);
      formData.append('is_published', isPublished);
      if (startTime) formData.append('start_time', startTime);
      if (endTime) formData.append('end_time', endTime);

      const response = await examService.uploadExamFromWord(formData);

      if (response.success) {
        alert('✅ ' + response.message);
        if (onSuccess) onSuccess(response.exam);
        onClose();
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container exam-import-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Import Đề Thi Từ Word</h2>
              <p className="text-sm text-gray-600">AI sẽ tự động phân tích và tạo đề thi tương tác</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* File Upload Area */}
          <div
            className={`file-upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="word-file-input"
              accept=".docx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="word-file-input" className="upload-label">
              {file ? (
                <div className="file-info">
                  <FileText className="w-12 h-12 text-purple-600" />
                  <span className="file-name">{file.name}</span>
                  <button
                    type="button"
                    className="remove-file"
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-lg font-medium text-gray-700">Kéo thả file Word vào đây</p>
                  <p className="text-sm text-gray-500">hoặc click để chọn file</p>
                  <p className="text-xs text-gray-400 mt-2">Hỗ trợ: .docx và .doc (Word 97-2003)</p>
                  <p className="text-xs text-green-500 mt-1">✅ Cả 2 định dạng đều được hỗ trợ</p>
                </div>
              )}
            </label>
          </div>

          {/* Settings */}
          <div className="space-y-4 mt-6">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề bài tập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="VD: Kiểm tra Giữa kỳ 1 - Tiếng Anh 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lớp học <span className="text-red-500">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">-- Chọn lớp học --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.grade && `(Khối ${cls.grade})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại đề thi
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="midterm">Kiểm tra Giữa kỳ</option>
                <option value="final">Kiểm tra Cuối kỳ</option>
                <option value="quiz">Kiểm tra 15 phút</option>
                <option value="practice">Bài luyện tập</option>
              </select>
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Công bố ngay cho học sinh
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian bắt đầu (tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian kết thúc (tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-alert">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info */}
          <div className="info-box">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Lưu ý:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• File Word cần có cấu trúc rõ ràng với các phần Listening, Reading, Writing, Speaking</li>
              <li>• AI sẽ tự động trích xuất hình ảnh và phân tích câu hỏi</li>
              <li>• Bạn có thể chỉnh sửa đề thi sau khi import</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={uploading}
          >
            Hủy
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="spinner" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import & Tạo Đề Thi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamImportModal;

