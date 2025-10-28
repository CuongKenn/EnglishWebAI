
import { useState, useEffect } from 'react';
import { 
  FileText, Clock, User, CheckCircle, XCircle, Eye, Edit, 
  Sparkles, Download, Filter, Search, Award, MessageSquare,
  TrendingUp, AlertCircle, PlayCircle, FileAudio, FileImage
} from 'lucide-react';
import './GradingFeedback.css';
import { apiV1 } from '../../../../services/api';

export default function GradingFeedback() {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingMode, setGradingMode] = useState('manual'); // manual | ai
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchExercises();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedExercise) {
      fetchSubmissions();
    }
  }, [selectedExercise]);

  const fetchClasses = async () => {
    try {
      console.log('Fetching classes...');
      const response = await apiV1.get('/classes/teaching');
      console.log('Classes response:', response.data);
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const fetchExercises = async () => {
    try {
      setLoading(true);
      console.log('Fetching exercises for class:', selectedClass);
      const response = await apiV1.get(`/exercises/by-class/${selectedClass}`);
      console.log('Exercises response:', response.data);
      setExercises(response.data);
      if (response.data.length > 0 && !selectedExercise) {
        setSelectedExercise(response.data[0]); // Set full object instead of just ID
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      console.log('Fetching submissions for class:', selectedClass, 'exercise:', selectedExercise?.id);
      const response = await apiV1.get(`/exercises/teacher-grading/classes/${selectedClass}/submissions`, {
        params: { exercise_id: selectedExercise?.id }
      });
      console.log('Submissions response:', response.data);
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExercise = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (exercise) {
      setSelectedExercise(exercise);
    }
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowGradingModal(true);
  };

  const handleAIGrade = async () => {
    if (!selectedSubmission) return;
    
    setLoading(true);
    try {
      // Call AI grading API
      await apiV1.post(`/exercises/teacher-grading/submissions/${selectedSubmission.id}/ai-grade`, {
        submission_id: selectedSubmission.id,
        ai_score: selectedSubmission.ai_score,
        ai_feedback: selectedSubmission.ai_feedback,
        rubrics_scores: selectedSubmission.rubrics_scores
      });
      
      alert('AI đã chấm điểm thành công!');
      setShowGradingModal(false);
      fetchSubmissions(); // Refresh
    } catch (error) {
      console.error('Error AI grading:', error);
      alert('Lỗi khi chấm điểm AI!');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async (score, feedback) => {
    if (!selectedSubmission) return;
    
    setLoading(true);
    try {
      await apiV1.post(`/exercises/${selectedSubmission.exercise_id}/submissions/${selectedSubmission.id}/grade`, {
        score,
        feedback
      });
      
      alert('Lưu điểm thành công!');
      setShowGradingModal(false);
      fetchSubmissions(); // Refresh
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Lỗi khi lưu điểm!');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      submitted: { label: 'Chờ chấm', color: '#f59e0b', icon: Clock },
      pending_review: { label: 'AI đã chấm', color: '#3b82f6', icon: Sparkles },
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

    const hasAI = selectedExercise?.enable_ai_grading && selectedSubmission.ai_score;

    return (
      <div className="grading-modal-overlay" onClick={() => setShowGradingModal(false)}>
        <div className="grading-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header-grading">
            <div>
              <h2>Chấm điểm Bài tập</h2>
              <p className="modal-subtitle">{selectedSubmission.student_name} • {selectedExercise?.title}</p>
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
                <h4>{selectedSubmission.student_name}</h4>
                <p>ID: {selectedSubmission.student_id}</p>
              </div>
              <div className="submission-time">
                <Clock size={16} />
                <span>Nộp lúc: {new Date(selectedSubmission.submitted_at).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            {/* Submission Content */}
            <div className="submission-content-section">
              <h3>📝 Bài làm của học sinh</h3>
              
              {/* Text Content */}
              {selectedSubmission.content_text && (
                <div className="content-text-box">
                  <strong>Nội dung văn bản:</strong>
                  <p>{selectedSubmission.content_text}</p>
                </div>
              )}
              
              {/* File/Audio Content */}
              {selectedSubmission.content_url && !selectedSubmission.content_url.startsWith('blob:') && (
                <div className="content-file-box">
                  {selectedSubmission.content_url.endsWith('.mp3') || selectedSubmission.content_url.endsWith('.wav') ? (
                    <>
                      <FileAudio size={24} />
                      <audio controls src={selectedSubmission.content_url} className="audio-player" />
                    </>
                  ) : (
                    <>
                      <FileImage size={24} />
                      <a href={selectedSubmission.content_url} target="_blank" rel="noopener noreferrer">
                        Xem file đính kèm
                      </a>
                    </>
                  )}
                </div>
              )}
              
              {/* Answers (for exercises with questions) */}
              {selectedSubmission.answers && Object.keys(selectedSubmission.answers).length > 0 && (
                <div className="answers-section">
                  <strong>Câu trả lời:</strong>
                  <div className="answers-list">
                    {Object.entries(selectedSubmission.answers).map(([questionId, answer]) => (
                      <div key={questionId} className="answer-item">
                        <span className="question-label">Câu {questionId}:</span>
                        <span className="answer-text">{typeof answer === 'object' ? JSON.stringify(answer) : answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty state */}
              {!selectedSubmission.content_text && 
               (!selectedSubmission.content_url || selectedSubmission.content_url.startsWith('blob:')) && 
               (!selectedSubmission.answers || Object.keys(selectedSubmission.answers).length === 0) && (
                <div className="empty-content">
                  <AlertCircle size={32} />
                  <p>Chưa có nội dung bài làm hoặc file đã bị xóa</p>
                  <small>File audio/video blob chỉ tồn tại tạm thời trong phiên làm bài</small>
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
                    <label>Điểm số (/{selectedExercise?.max_score || 10})</label>
                    <input
                      type="number"
                      className="form-input-grading"
                      placeholder="0"
                      min="0"
                      max={selectedExercise?.max_score || 10}
                      step="0.5"
                      defaultValue={selectedSubmission.score}
                      id="score-input"
                    />
                  </div>
                </div>

                {selectedExercise?.skill_type && (
                  <div className="skill-rubric-section">
                    <h4>Đánh giá theo kỹ năng: {selectedExercise.skill_type}</h4>
                    <div className="rubric-sliders">
                      <div className="rubric-item">
                        <label>
                          {selectedExercise.skill_type === 'listening' && '🎧 Nghe hiểu'}
                          {selectedExercise.skill_type === 'speaking' && '🗣️ Nói'}
                          {selectedExercise.skill_type === 'reading' && '📖 Đọc hiểu'}
                          {selectedExercise.skill_type === 'writing' && '✍️ Viết'}
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
                    id="feedback-textarea"
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
                        <div className="ai-score-value">{selectedSubmission.ai_score}/{selectedExercise?.max_score || 10}</div>
                        <div className="ai-score-label">Điểm AI đề xuất</div>
                      </div>
                    </div>
                  </div>

                  {selectedSubmission.rubrics_scores && (
                    <div className="ai-rubrics-display">
                      <h4>Chi tiết đánh giá:</h4>
                      {Object.entries(selectedSubmission.rubrics_scores).map(([skill, score]) => (
                        <div key={skill} className="ai-rubric-item">
                          <span className="skill-label">
                            {skill === 'listening' && '🎧 Nghe'}
                            {skill === 'speaking' && '🗣️ Nói'}
                            {skill === 'reading' && '📖 Đọc'}
                            {skill === 'writing' && '✍️ Viết'}
                          </span>
                          <div className="progress-bar-ai">
                            <div className="progress-fill-ai" style={{ width: `${(score / 10) * 100}%` }} />
                          </div>
                          <span className="skill-score">{score}/10</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="ai-feedback-box">
                    <h4>💬 Nhận xét của AI:</h4>
                    <p>{selectedSubmission.ai_feedback}</p>
                  </div>

                  <div className="ai-actions">
                    <button 
                      className="btn-use-ai"
                      onClick={() => {
                        document.getElementById('score-input').value = selectedSubmission.ai_score;
                        document.getElementById('feedback-textarea').value = selectedSubmission.ai_feedback || '';
                        setGradingMode('manual');
                      }}
                    >
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
              <button 
                className="btn-save-grading" 
                onClick={() => {
                  const score = parseFloat(document.getElementById('score-input').value);
                  const feedback = document.getElementById('feedback-textarea').value;
                  handleManualSave(score, feedback);
                }}
              >
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
            {loading ? (
              <div className="loading-state">Đang tải bài tập...</div>
            ) : exercises.length === 0 ? (
              <div className="empty-state">Chưa có bài tập nào</div>
            ) : (
              exercises.map((exercise) => {
                const pending = submissions.filter(s => s.exercise_id === exercise.id && (s.status === 'submitted' || s.status === 'pending_review')).length;
                const graded = submissions.filter(s => s.exercise_id === exercise.id && s.status === 'graded').length;
                
                return (
                  <div
                    key={exercise.id}
                    className={`exercise-item-grading ${selectedExercise?.id === exercise.id ? 'active' : ''}`}
                    onClick={() => handleSelectExercise(exercise.id)}
                  >
                    <div className="exercise-item-header">
                      <h4>{exercise.title}</h4>
                      <span className="class-badge">
                        {classes.find(c => c.id === exercise.class_id)?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="exercise-item-stats">
                      <div className="stat-item-grading pending">
                        <Clock size={14} />
                        <span>{pending} chờ chấm</span>
                      </div>
                      <div className="stat-item-grading graded">
                        <CheckCircle size={14} />
                        <span>{graded} đã chấm</span>
                      </div>
                    </div>
                    {exercise.enable_ai_grading && (
                      <div className="ai-badge-small">
                        <Sparkles size={12} />
                        AI
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
                    <span className="stat-badge total">
                      {submissions.filter(s => s.exercise_id === selectedExercise.id).length} bài nộp
                    </span>
                    <span className="stat-badge pending">
                      {submissions.filter(s => s.exercise_id === selectedExercise.id && (s.status === 'submitted' || s.status === 'pending_review')).length} chờ chấm
                    </span>
                  </div>
                </div>
                <div className="panel-header-actions">
                  <button className="btn-action-grading">
                    <Download size={18} />
                    Xuất Excel
                  </button>
                  {selectedExercise.enable_ai_grading && (
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
                {submissions.filter(s => s.exercise_id === selectedExercise.id).length === 0 ? (
                  <div className="empty-submissions">
                    <AlertCircle size={48} strokeWidth={1} />
                    <p>Chưa có bài nộp nào</p>
                  </div>
                ) : (
                  submissions
                    .filter(s => s.exercise_id === selectedExercise.id)
                    .map((submission) => (
                      <div key={submission.id} className="submission-row">
                        <div className="submission-row-left">
                          <div className="student-avatar-small">
                            <User size={20} />
                          </div>
                          <div className="submission-info">
                            <h4>{submission.student_name}</h4>
                            <p>
                              <Clock size={12} />
                              {new Date(submission.submitted_at).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <div className="submission-row-center">
                          {getStatusBadge(submission.status)}
                          {submission.status === 'graded' && submission.score !== null && (
                            <div className="score-display">
                              <Award size={16} />
                              <span>{submission.score}/{selectedExercise.max_score || 10}</span>
                            </div>
                          )}
                          {submission.ai_score && submission.status === 'pending_review' && (
                            <div className="ai-score-badge">
                              <Sparkles size={14} />
                              AI: {submission.ai_score}/{selectedExercise.max_score || 10}
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

