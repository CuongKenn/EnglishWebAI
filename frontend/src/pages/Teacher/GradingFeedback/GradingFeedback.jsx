import React, { useState, useEffect } from 'react';
import './GradingFeedback.css';
import { 
  CheckCircleIcon, 
  BoltIcon, 
  PencilSquareIcon, 
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const GradingFeedback = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeData, setGradeData] = useState({
    score: '',
    feedback: '',
    status: 'graded'
  });
  const [filterStatus, setFilterStatus] = useState('submitted');
  const [filterAssignment, setFilterAssignment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = () => {
    // Mock data - replace with API call
    setSubmissions([
      {
        id: 1,
        student_name: 'Nguyễn Văn A',
        student_email: 'nguyenvana@email.com',
        assignment_title: 'Writing Assignment - My Favorite Book',
        assignment_type: 'assignment',
        max_score: 20,
        score: null,
        content_text: 'My favorite book is Harry Potter. It is a very interesting story about a young wizard...',
        content_url: null,
        feedback: null,
        status: 'submitted',
        submitted_at: '2025-01-20T10:30:00',
        class_name: 'English 10A'
      },
      {
        id: 2,
        student_name: 'Trần Thị B',
        student_email: 'tranthib@email.com',
        assignment_title: 'Grammar Test Unit 5',
        assignment_type: 'quiz',
        max_score: 10,
        score: 8.5,
        content_text: 'Test answers...',
        feedback: 'Good job! Pay attention to present perfect tense.',
        status: 'graded',
        submitted_at: '2025-01-19T14:20:00',
        graded_at: '2025-01-20T09:00:00',
        class_name: 'English 10A'
      },
      {
        id: 3,
        student_name: 'Lê Văn C',
        student_email: 'levanc@email.com',
        assignment_title: 'Reading Comprehension',
        assignment_type: 'assignment',
        max_score: 15,
        score: null,
        content_text: 'The passage talks about environmental protection...',
        status: 'submitted',
        submitted_at: '2025-01-21T08:15:00',
        class_name: 'English 11B'
      },
      {
        id: 4,
        student_name: 'Phạm Thị D',
        student_email: 'phamthid@email.com',
        assignment_title: 'Writing Assignment - My Favorite Book',
        assignment_type: 'assignment',
        max_score: 20,
        score: null,
        content_text: null,
        content_url: '/uploads/submission_4.pdf',
        status: 'submitted',
        submitted_at: '2025-01-21T11:45:00',
        class_name: 'English 10A'
      }
    ]);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      // API call to grade submission
      // await apiClient.put(`/api/v1/submissions/${selectedSubmission.id}/grade`, gradeData);
      alert('Chấm điểm thành công!');
      setShowGradeModal(false);
      setSelectedSubmission(null);
      loadSubmissions();
    } catch {
      alert('Có lỗi xảy ra khi chấm điểm');
    }
  };

  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      score: submission.score || '',
      feedback: submission.feedback || '',
      status: 'graded'
    });
    setShowGradeModal(true);
  };

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.assignment_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesAssignment = filterAssignment === 'all' || s.assignment_title === filterAssignment;
    return matchesSearch && matchesStatus && matchesAssignment;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'submitted': return 'orange';
      case 'graded': return 'green';
      case 'late': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'submitted': return 'Chờ chấm';
      case 'graded': return 'Đã chấm';
      case 'late': return 'Nộp muộn';
      default: return status;
    }
  };

  const uniqueAssignments = [...new Set(submissions.map(s => s.assignment_title))];

  return (
    <div className="grading-feedback">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CheckCircleIcon className="w-6 h-6 inline-block mr-2" />
            Chấm điểm & Phản hồi
          </h1>
          <p className="page-subtitle">Chấm điểm bài làm và gửi phản hồi cho học sinh</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box orange">
          <div className="stat-icon">
            <ClockIcon className="w-8 h-8" />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {submissions.filter(s => s.status === 'submitted').length}
            </div>
            <div className="stat-label">Chờ chấm</div>
          </div>
        </div>
        <div className="stat-box green">
          <div className="stat-icon">
            <CheckCircleIcon className="w-8 h-8" />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {submissions.filter(s => s.status === 'graded').length}
            </div>
            <div className="stat-label">Đã chấm</div>
          </div>
        </div>
        <div className="stat-box blue">
          <div className="stat-icon">
            <ChartBarIcon className="w-8 h-8" />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {submissions.filter(s => s.score !== null).length > 0
                ? (submissions.filter(s => s.score !== null).reduce((sum, s) => sum + (s.score / s.max_score * 100), 0) / 
                   submissions.filter(s => s.score !== null).length).toFixed(1)
                : 0}%
            </div>
            <div className="stat-label">Điểm TB</div>
          </div>
        </div>
        <div className="stat-box purple">
          <div className="stat-icon">
            <BoltIcon className="w-8 h-8" />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {submissions.length}
            </div>
            <div className="stat-label">Tổng bài nộp</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </span>
          <input 
            type="text" 
            placeholder="Tìm kiếm học sinh hoặc bài tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="submitted">Chờ chấm</option>
          <option value="graded">Đã chấm</option>
          <option value="late">Nộp muộn</option>
        </select>
        <select 
          className="filter-select"
          value={filterAssignment}
          onChange={(e) => setFilterAssignment(e.target.value)}
        >
          <option value="all">Tất cả bài tập</option>
          {uniqueAssignments.map((assignment, index) => (
            <option key={index} value={assignment}>{assignment}</option>
          ))}
        </select>
      </div>

      {/* Submissions List */}
      <div className="submissions-list">
        {filteredSubmissions.map(submission => (
          <div key={submission.id} className="submission-card">
            <div className="submission-card-header">
              <div className="student-info">
                <div className="student-avatar">
                  {submission.student_name.charAt(0).toUpperCase()}
                </div>
                <div className="student-details">
                  <h3 className="student-name">{submission.student_name}</h3>
                  <p className="student-email">{submission.student_email}</p>
                </div>
              </div>
              <span className={`badge status ${getStatusColor(submission.status)}`}>
                {getStatusLabel(submission.status)}
              </span>
            </div>

            <div className="submission-card-body">
              <div className="assignment-info">
                <h4 className="assignment-title">
                  <DocumentTextIcon className="w-4 h-4 inline-block mr-1" />
                  {submission.assignment_title}
                </h4>
                <p className="assignment-class">🏫 {submission.class_name}</p>
              </div>

              <div className="submission-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Nộp lúc:</span>
                  <span className="meta-value">
                    {new Date(submission.submitted_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                {submission.graded_at && (
                  <div className="meta-item">
                    <span className="meta-label">Chấm lúc:</span>
                    <span className="meta-value">
                      {new Date(submission.graded_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}
                <div className="meta-item">
                  <span className="meta-label">Điểm:</span>
                  <span className="meta-value score">
                    {submission.score !== null ? (
                      <span className="score-display">{submission.score}/{submission.max_score}</span>
                    ) : (
                      <span className="not-graded">Chưa chấm</span>
                    )}
                  </span>
                </div>
              </div>

              {submission.content_text && (
                <div className="submission-content">
                  <p className="content-label">Nội dung:</p>
                  <p className="content-text">
                    {submission.content_text.substring(0, 200)}
                    {submission.content_text.length > 200 && '...'}
                  </p>
                </div>
              )}

              {submission.content_url && (
                <div className="submission-file">
                  <span className="file-icon">📎</span>
                  <a href={submission.content_url} target="_blank" rel="noopener noreferrer">
                    Xem tệp đính kèm
                  </a>
                </div>
              )}

              {submission.feedback && (
                <div className="feedback-preview">
                  <p className="feedback-label">💬 Phản hồi:</p>
                  <p className="feedback-text">{submission.feedback}</p>
                </div>
              )}
            </div>

            <div className="submission-card-actions">
              <button 
                className="action-btn primary"
                onClick={() => openGradeModal(submission)}
              >
                {submission.status === 'graded' ? (
                  <>
                    <PencilSquareIcon className="w-4 h-4 inline-block mr-1" />
                    Sửa điểm
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 inline-block mr-1" />
                    Chấm điểm
                  </>
                )}
              </button>
              <button className="action-btn">👁️ Xem chi tiết</button>
            </div>
          </div>
        ))}
      </div>

      {filteredSubmissions.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Không có bài nộp nào</h3>
          <p>Chưa có bài nộp nào cần chấm hoặc không khớp với bộ lọc</p>
        </div>
      )}

      {/* Grading Modal */}
      {showGradeModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <CheckCircleIcon className="w-5 h-5 inline-block mr-2" />
                Chấm điểm bài làm
              </h2>
              <button className="close-btn" onClick={() => setShowGradeModal(false)}>×</button>
            </div>

            <form onSubmit={handleGradeSubmit}>
              <div className="modal-body">
                {/* Student Info */}
                <div className="grading-student-info">
                  <div className="info-row">
                    <span className="info-label">Học sinh:</span>
                    <span className="info-value">{selectedSubmission.student_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Bài tập:</span>
                    <span className="info-value">{selectedSubmission.assignment_title}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Nộp lúc:</span>
                    <span className="info-value">
                      {new Date(selectedSubmission.submitted_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Submission Content */}
                <div className="grading-content">
                  <h4>📄 Nội dung bài làm:</h4>
                  {selectedSubmission.content_text && (
                    <div className="content-box">
                      {selectedSubmission.content_text}
                    </div>
                  )}
                  {selectedSubmission.content_url && (
                    <div className="content-file">
                      <a href={selectedSubmission.content_url} target="_blank" rel="noopener noreferrer">
                        📎 Xem tệp đính kèm
                      </a>
                    </div>
                  )}
                </div>

                {/* Grading Form */}
                <div className="grading-form">
                  <div className="form-group">
                    <label>Điểm <span className="required">*</span></label>
                    <div className="score-input-wrapper">
                      <input 
                        type="number"
                        required
                        min="0"
                        max={selectedSubmission.max_score}
                        step="0.5"
                        value={gradeData.score}
                        onChange={(e) => setGradeData({...gradeData, score: e.target.value})}
                        placeholder="0"
                      />
                      <span className="max-score">/ {selectedSubmission.max_score}</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Phản hồi chi tiết</label>
                    <textarea 
                      rows="6"
                      value={gradeData.feedback}
                      onChange={(e) => setGradeData({...gradeData, feedback: e.target.value})}
                      placeholder="Nhập phản hồi và nhận xét cho học sinh..."
                    />
                  </div>

                  {/* Quick Feedback Templates */}
                  <div className="quick-feedback">
                    <p className="quick-feedback-label">Mẫu phản hồi nhanh:</p>
                    <div className="quick-feedback-buttons">
                      <button 
                        type="button"
                        className="quick-btn"
                        onClick={() => setGradeData({...gradeData, feedback: 'Bài làm tốt! Giữ vững phong độ!'})}
                      >
                        👍 Tốt
                      </button>
                      <button 
                        type="button"
                        className="quick-btn"
                        onClick={() => setGradeData({...gradeData, feedback: 'Cần cải thiện thêm về ngữ pháp và từ vựng.'})}
                      >
                        <DocumentTextIcon className="w-4 h-4 inline-block mr-1" />
                        Cần cải thiện
                      </button>
                      <button 
                        type="button"
                        className="quick-btn"
                        onClick={() => setGradeData({...gradeData, feedback: 'Xuất sắc! Bài làm rất chi tiết và chính xác.'})}
                      >
                        ⭐ Xuất sắc
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowGradeModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  💾 Lưu điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingFeedback;

