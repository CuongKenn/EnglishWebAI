import { useState, useEffect } from 'react';
import { 
  FileText, Clock, User, CheckCircle, XCircle, Eye, Edit, 
  Sparkles, Download, Filter, Search, Award, MessageSquare,
  TrendingUp, AlertCircle, PlayCircle, FileAudio, FileImage
} from 'lucide-react';
import './GradingFeedback.css';

export default function GradingFeedback() {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingMode, setGradingMode] = useState('manual'); // manual | ai
  const [loading, setLoading] = useState(false);

  // Mock data - exercises
  const mockExercises = [
    {
      id: 1,
      title: 'Bài tập Nghe Hiểu - Unit 5',
      type: 'skill_exercise',
      skill: 'listening',
      class: 'Lớp 10A1',
      dueDate: '2025-11-05',
      maxScore: 10,
      totalStudents: 25,
      submitted: 20,
      graded: 12,
      pending: 8,
      enableAiGrading: true
    },
    {
      id: 2,
      title: 'Kiểm tra 15 phút - Kỹ năng Viết',
      type: 'test_15min',
      skill: 'writing',
      class: 'Lớp 10A2',
      dueDate: '2025-11-03',
      maxScore: 10,
      totalStudents: 22,
      submitted: 22,
      graded: 20,
      pending: 2,
      enableAiGrading: true
    },
    {
      id: 3,
      title: 'Kiểm tra Cuối kì',
      type: 'final',
      skill: null,
      class: 'Lớp 10A1',
      dueDate: '2025-12-20',
      maxScore: 100,
      totalStudents: 25,
      submitted: 0,
      graded: 0,
      pending: 0,
      enableAiGrading: false
    }
  ];

  // Mock data - submissions
  const mockSubmissions = [
    {
      id: 1,
      student: {
        id: 1,
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@gmail.com',
        avatar: null
      },
      submittedAt: '2025-11-04 14:30',
      contentText: 'Bài làm của học sinh về listening...',
      contentUrl: null,
      status: 'submitted',
      score: null,
      feedback: null,
      aiScore: 8.5,
      aiFeedback: 'Học sinh nghe hiểu tốt các ý chính...',
      aiRubrics: {
        listening: 8.5
      }
    },
    {
      id: 2,
      student: {
        id: 2,
        name: 'Trần Thị B',
        email: 'tranthib@gmail.com',
        avatar: null
      },
      submittedAt: '2025-11-04 15:20',
      contentText: 'Bài làm của học sinh...',
      contentUrl: '/uploads/audio_submission.mp3',
      status: 'graded',
      score: 9.0,
      feedback: 'Làm tốt! Phát âm chuẩn.',
      aiScore: 8.7,
      aiFeedback: 'Phát âm tốt, ngữ điệu tự nhiên...',
      aiRubrics: {
        speaking: 8.7
      }
    },
    {
      id: 3,
      student: {
        id: 3,
        name: 'Lê Văn C',
        email: 'levanc@gmail.com',
        avatar: null
      },
      submittedAt: '2025-11-04 10:15',
      contentText: null,
      contentUrl: null,
      status: 'late',
      score: null,
      feedback: null
    }
  ];

  useEffect(() => {
    setExercises(mockExercises);
  }, []);

  useEffect(() => {
    if (selectedExercise) {
      // Filter submissions for selected exercise
      setSubmissions(mockSubmissions);
    }
  }, [selectedExercise]);

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowGradingModal(true);
  };

  const handleAIGrade = async () => {
    setLoading(true);
    // Simulate AI grading
    setTimeout(() => {
      setLoading(false);
      alert('AI đã chấm điểm thành công!');
      setShowGradingModal(false);
    }, 2000);
  };

  const handleManualSave = () => {
    alert('Lưu điểm thành công!');
    setShowGradingModal(false);
  };

  const getStatusBadge = (status) => {
    const statuses = {
      submitted: { label: 'Chờ chấm', color: '#f59e0b', icon: Clock },
      graded: { label: 'Đã chấm', color: '#10b981', icon: CheckCircle },
      late: { label: 'Nộp muộn', color: '#ef4444', icon: AlertCircle }
    };
    const statusInfo = statuses[status] || statuses.submitted;
    const Icon = statusInfo.icon;
    
    return (
      <span className="status-badge-grading" style={{ background: statusInfo.color }}>
        <Icon size={14} />
        {statusInfo.label}
      </span>
    );
  };

  const renderGradingModal = () => {
    if (!selectedSubmission) return null;

    const hasAI = selectedExercise?.enableAiGrading && selectedSubmission.aiScore;

    return (
      <div className="grading-modal-overlay" onClick={() => setShowGradingModal(false)}>
        <div className="grading-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header-grading">
            <div>
              <h2>Chấm điểm Bài tập</h2>
              <p className="modal-subtitle">{selectedSubmission.student.name} • {selectedExercise?.title}</p>
            </div>
            <button className="modal-close-grading" onClick={() => setShowGradingModal(false)}>×</button>
          </div>

          <div className="modal-body-grading">
            {/* Student Info */}
            <div className="student-info-card">
              <div className="student-avatar-grading">
                <User size={24} />
              </div>
              <div className="student-details">
                <h4>{selectedSubmission.student.name}</h4>
                <p>{selectedSubmission.student.email}</p>
              </div>
              <div className="submission-time">
                <Clock size={16} />
                <span>Nộp lúc: {selectedSubmission.submittedAt}</span>
              </div>
            </div>

            {/* Submission Content */}
            <div className="submission-content-section">
              <h3>📝 Bài làm của học sinh</h3>
              {selectedSubmission.contentText && (
                <div className="content-text-box">
                  {selectedSubmission.contentText}
                </div>
              )}
              {selectedSubmission.contentUrl && (
                <div className="content-file-box">
                  {selectedSubmission.contentUrl.endsWith('.mp3') ? (
                    <>
                      <FileAudio size={24} />
                      <audio controls src={selectedSubmission.contentUrl} className="audio-player" />
                    </>
                  ) : (
                    <>
                      <FileImage size={24} />
                      <a href={selectedSubmission.contentUrl} target="_blank" rel="noopener noreferrer">
                        Xem file đính kèm
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Grading Mode Toggle */}
            <div className="grading-mode-section">
              <h3>Chọn phương thức chấm điểm</h3>
              <div className="grading-mode-tabs">
                <button
                  className={`mode-tab-grading ${gradingMode === 'manual' ? 'active' : ''}`}
                  onClick={() => setGradingMode('manual')}
                >
                  <Edit size={18} />
                  <span>Chấm thủ công</span>
                </button>
                {hasAI && (
                  <button
                    className={`mode-tab-grading ${gradingMode === 'ai' ? 'active' : ''}`}
                    onClick={() => setGradingMode('ai')}
                  >
                    <Sparkles size={18} />
                    <span>Xem gợi ý AI</span>
                  </button>
                )}
              </div>
            </div>

            {/* Manual Grading */}
            {gradingMode === 'manual' && (
              <div className="manual-grading-section">
                <div className="form-row-grading">
                  <div className="form-group-grading">
                    <label>Điểm số (/{selectedExercise?.maxScore})</label>
                    <input
                      type="number"
                      className="form-input-grading"
                      placeholder="0"
                      min="0"
                      max={selectedExercise?.maxScore}
                      step="0.5"
                      defaultValue={selectedSubmission.score}
                    />
                  </div>
                </div>

                {selectedExercise?.skill && (
                  <div className="skill-rubric-section">
                    <h4>Đánh giá theo kỹ năng: {selectedExercise.skill}</h4>
                    <div className="rubric-sliders">
                      <div className="rubric-item">
                        <label>
                          {selectedExercise.skill === 'listening' && '🎧 Nghe hiểu'}
                          {selectedExercise.skill === 'speaking' && '🗣️ Nói'}
                          {selectedExercise.skill === 'reading' && '📖 Đọc hiểu'}
                          {selectedExercise.skill === 'writing' && '✍️ Viết'}
                        </label>
                        <input type="range" min="0" max="10" step="0.5" className="rubric-slider" />
                        <span className="rubric-value">8.5/10</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group-grading">
                  <label>Nhận xét và phản hồi</label>
                  <textarea
                    className="form-textarea-grading"
                    rows="6"
                    placeholder="Nhập nhận xét chi tiết cho học sinh..."
                    defaultValue={selectedSubmission.feedback}
                  />
                </div>
              </div>
            )}

            {/* AI Grading View */}
            {gradingMode === 'ai' && hasAI && (
              <div className="ai-grading-section">
                <div className="ai-result-card">
                  <div className="ai-header">
                    <Sparkles size={24} />
                    <h3>Kết quả chấm điểm AI</h3>
                  </div>
                  
                  <div className="ai-score-display">
                    <div className="ai-score-main">
                      <Award size={32} />
                      <div>
                        <div className="ai-score-value">{selectedSubmission.aiScore}/10</div>
                        <div className="ai-score-label">Điểm AI đề xuất</div>
                      </div>
                    </div>
                  </div>

                  {selectedSubmission.aiRubrics && (
                    <div className="ai-rubrics-display">
                      <h4>Chi tiết đánh giá:</h4>
                      {Object.entries(selectedSubmission.aiRubrics).map(([skill, score]) => (
                        <div key={skill} className="ai-rubric-item">
                          <span className="skill-label">
                            {skill === 'listening' && '🎧 Nghe'}
                            {skill === 'speaking' && '🗣️ Nói'}
                            {skill === 'reading' && '📖 Đọc'}
                            {skill === 'writing' && '✍️ Viết'}
                          </span>
                          <div className="progress-bar-ai">
                            <div className="progress-fill-ai" style={{ width: `${score * 10}%` }} />
                          </div>
                          <span className="skill-score">{score}/10</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="ai-feedback-box">
                    <h4>💬 Nhận xét của AI:</h4>
                    <p>{selectedSubmission.aiFeedback}</p>
                  </div>

                  <div className="ai-actions">
                    <button className="btn-use-ai">
                      <CheckCircle size={18} />
                      Sử dụng điểm AI
                    </button>
                    <button className="btn-edit-ai" onClick={() => setGradingMode('manual')}>
                      <Edit size={18} />
                      Chỉnh sửa trước khi lưu
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* No AI Available */}
            {gradingMode === 'ai' && !hasAI && (
              <div className="no-ai-message">
                <AlertCircle size={48} />
                <h4>AI chưa chấm bài này</h4>
                <p>Bài tập không bật AI chấm điểm hoặc AI chưa xử lý xong.</p>
                <button className="btn-trigger-ai" onClick={handleAIGrade}>
                  <Sparkles size={18} />
                  Yêu cầu AI chấm điểm
                </button>
              </div>
            )}
          </div>

          <div className="modal-footer-grading">
            <button className="btn-cancel-grading" onClick={() => setShowGradingModal(false)}>
              Hủy
            </button>
            {gradingMode === 'manual' && (
              <button className="btn-save-grading" onClick={handleManualSave}>
                <CheckCircle size={18} />
                Lưu điểm
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grading-feedback-container">
      {/* Header */}
      <div className="grading-header">
        <div className="grading-header-left">
          <h1>Chấm điểm & Phản hồi</h1>
          <p>Chấm bài thủ công hoặc sử dụng AI để chấm tự động</p>
        </div>
      </div>

      <div className="grading-content-wrapper">
        {/* Exercise List Sidebar */}
        <div className="exercise-list-sidebar">
          <div className="sidebar-title-grading">
            <FileText size={20} />
            <span>Bài tập cần chấm</span>
          </div>
          
          <div className="exercise-list-grading">
            {mockExercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`exercise-item-grading ${selectedExercise?.id === exercise.id ? 'active' : ''}`}
                onClick={() => handleSelectExercise(exercise)}
              >
                <div className="exercise-item-header">
                  <h4>{exercise.title}</h4>
                  <span className="class-badge">{exercise.class}</span>
                </div>
                <div className="exercise-item-stats">
                  <div className="stat-item-grading pending">
                    <Clock size={14} />
                    <span>{exercise.pending} chờ chấm</span>
                  </div>
                  <div className="stat-item-grading graded">
                    <CheckCircle size={14} />
                    <span>{exercise.graded} đã chấm</span>
                  </div>
                </div>
                {exercise.enableAiGrading && (
                  <div className="ai-badge-small">
                    <Sparkles size={12} />
                    AI
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submissions Panel */}
        <div className="submissions-panel">
          {!selectedExercise ? (
            <div className="empty-state-grading">
              <FileText size={80} strokeWidth={1} />
              <h3>Chọn bài tập</h3>
              <p>Chọn một bài tập bên trái để xem danh sách bài nộp</p>
            </div>
          ) : (
            <>
              {/* Panel Header */}
              <div className="panel-header-grading">
                <div className="panel-header-left">
                  <h2>{selectedExercise.title}</h2>
                  <div className="panel-stats">
                    <span className="stat-badge total">{selectedExercise.submitted} bài nộp</span>
                    <span className="stat-badge pending">{selectedExercise.pending} chờ chấm</span>
                  </div>
                </div>
                <div className="panel-header-actions">
                  <button className="btn-action-grading">
                    <Download size={18} />
                    Xuất Excel
                  </button>
                  {selectedExercise.enableAiGrading && (
                    <button className="btn-action-grading primary">
                      <Sparkles size={18} />
                      AI Chấm tất cả
                    </button>
                  )}
                </div>
              </div>

              {/* Search & Filter */}
              <div className="search-filter-bar">
                <div className="search-box-grading">
                  <Search size={18} />
                  <input type="text" placeholder="Tìm kiếm học sinh..." />
                </div>
                <select className="filter-select-grading">
                  <option>Tất cả trạng thái</option>
                  <option>Chờ chấm</option>
                  <option>Đã chấm</option>
                  <option>Nộp muộn</option>
                </select>
              </div>

              {/* Submissions Table */}
              <div className="submissions-table">
                {submissions.length === 0 ? (
                  <div className="empty-submissions">
                    <AlertCircle size={48} strokeWidth={1} />
                    <p>Chưa có bài nộp nào</p>
                  </div>
                ) : (
                  submissions.map((submission) => (
                    <div key={submission.id} className="submission-row">
                      <div className="submission-row-left">
                        <div className="student-avatar-small">
                          <User size={20} />
                        </div>
                        <div className="submission-info">
                          <h4>{submission.student.name}</h4>
                          <p>
                            <Clock size={12} />
                            {submission.submittedAt}
                          </p>
                        </div>
                      </div>
                      <div className="submission-row-center">
                        {getStatusBadge(submission.status)}
                        {submission.status === 'graded' && (
                          <div className="score-display">
                            <Award size={16} />
                            <span>{submission.score}/{selectedExercise.maxScore}</span>
                          </div>
                        )}
                        {submission.aiScore && submission.status === 'submitted' && (
                          <div className="ai-score-badge">
                            <Sparkles size={14} />
                            AI: {submission.aiScore}/10
                          </div>
                        )}
                      </div>
                      <div className="submission-row-actions">
                        <button
                          className="btn-grade"
                          onClick={() => handleGradeSubmission(submission)}
                        >
                          {submission.status === 'graded' ? (
                            <>
                              <Eye size={16} />
                              Xem chi tiết
                            </>
                          ) : (
                            <>
                              <Edit size={16} />
                              Chấm điểm
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {showGradingModal && renderGradingModal()}

      {/* Info Box */}
      <div className="info-box-grading">
        <div className="info-icon-grading">
          <Sparkles size={24} />
        </div>
        <div className="info-content-grading">
          <h4>💡 Hướng dẫn chấm điểm</h4>
          <ul>
            <li><strong>Chấm thủ công:</strong> Nhập điểm và nhận xét trực tiếp</li>
            <li><strong>AI gợi ý:</strong> Xem điểm và feedback từ AI, có thể chỉnh sửa trước khi lưu</li>
            <li><strong>Rubrics:</strong> Với bài tập kỹ năng, có thể chấm chi tiết theo từng tiêu chí</li>
            <li><strong>Xuất Excel:</strong> Export điểm của 1 bài hoặc nhiều bài để báo cáo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
