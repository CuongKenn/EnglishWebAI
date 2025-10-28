
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
      fetchSubmissions();
    }
  }, [selectedClass]);

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

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      console.log('Fetching all submissions for class:', selectedClass);
      // Get all submissions for the class (no exercise filter)
      const response = await apiV1.get(`/exercises/teacher-grading/classes/${selectedClass}/submissions`);
      console.log('Submissions response:', response.data);
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = (classId) => {
    setSelectedClass(classId);
    setSelectedSubmission(null);
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

    // Debug: Log submission data
    console.log('Selected submission:', selectedSubmission);
    console.log('Rubrics scores:', selectedSubmission.rubrics_scores);
    console.log('Speaking assessment:', selectedSubmission.rubrics_scores?.speaking_assessment);
    console.log('Writing assessment:', selectedSubmission.rubrics_scores?.writing_assessment);

    const hasAI = selectedSubmission.ai_score;

    return (
      <div className="grading-modal-overlay" onClick={() => setShowGradingModal(false)}>
        <div className="grading-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header-grading">
            <div>
              <h2>Chấm điểm Bài tập</h2>
              <p className="modal-subtitle">{selectedSubmission.student_name} • Bài tập ID: {selectedSubmission.exercise_id}</p>
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
              
              {/* File/Audio Content - Hide audio if speaking assessment exists */}
              {selectedSubmission.content_url && 
               !selectedSubmission.content_url.startsWith('blob:') && 
               !selectedSubmission.rubrics_scores?.speaking_assessment && (
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

            {/* Speaking Assessment (Azure Speech) - Always visible */}
            {selectedSubmission.rubrics_scores?.speaking_assessment && (
              <div className="speaking-assessment-section">
                <div className="assessment-header">
                  <Sparkles size={18} style={{ color: '#8b5cf6' }} />
                  <span>Đánh giá Speaking (Azure Speech API)</span>
                </div>
                
                {/* Audio Player for Speaking Submission */}
                {selectedSubmission.content_url && !selectedSubmission.content_url.startsWith('blob:') && (
                  <div className="speaking-audio-player">
                    <div className="audio-player-header">
                      <PlayCircle size={20} style={{ color: '#8b5cf6' }} />
                      <span>Bài nói của học sinh</span>
                    </div>
                    <audio controls src={selectedSubmission.content_url} className="audio-player-control" controlsList="nodownload">
                      Trình duyệt không hỗ trợ phát audio
                    </audio>
                  </div>
                )}
                
                <div className="speaking-scores-grid">
                  {Object.entries(selectedSubmission.rubrics_scores.speaking_assessment).map(([key, value]) => {
                    const labels = {
                      pronunciation: { name: 'Phát âm', icon: '🗣️', color: '#f59e0b' },
                      fluency: { name: 'Độ trôi chảy', icon: '💫', color: '#3b82f6' },
                      completeness: { name: 'Tính hoàn chỉnh', icon: '✅', color: '#10b981' },
                      accuracy: { name: 'Độ chính xác', icon: '🎯', color: '#ef4444' }
                    };
                    
                    const label = labels[key];
                    if (!label) return null;
                    
                    return (
                      <div key={key} className="speaking-score-card">
                        <div className="score-card-header">
                          <span className="score-icon">{label.icon}</span>
                          <span className="score-name">{label.name}</span>
                        </div>
                        <div className="score-card-body">
                          <div className="score-circle" style={{ borderColor: label.color }}>
                            <span className="score-value" style={{ color: label.color }}>
                              {typeof value === 'number' ? value.toFixed(1) : value}
                            </span>
                            <span className="score-max">/100</span>
                          </div>
                          <div className="score-bar">
                            <div 
                              className="score-fill" 
                              style={{ 
                                width: `${typeof value === 'number' ? value : 0}%`,
                                backgroundColor: label.color 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {selectedSubmission.rubrics_scores.recognized_text && (
                  <div className="recognized-text-box">
                    <h5>📝 Văn bản nhận dạng:</h5>
                    <p className="recognized-text">{selectedSubmission.rubrics_scores.recognized_text}</p>
                  </div>
                )}
                
                {selectedSubmission.rubrics_scores.detailed_feedback && (
                  <div className="detailed-feedback-box">
                    <h5>💡 Nhận xét chi tiết:</h5>
                    <div className="feedback-content">
                      {selectedSubmission.rubrics_scores.detailed_feedback.split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Writing Assessment (Gemini) - Always visible */}
            {selectedSubmission.rubrics_scores?.writing_assessment && (
              <div className="writing-assessment-section">
                <div className="assessment-header">
                  <Edit size={18} style={{ color: '#f59e0b' }} />
                  <span>Đánh giá Writing (Gemini AI)</span>
                </div>
                
                <div className="writing-scores-grid">
                  {Object.entries(selectedSubmission.rubrics_scores.writing_assessment).map(([key, value]) => (
                    <div key={key} className="writing-criterion">
                      <div className="criterion-header">
                        <span className="criterion-name">{value.name}</span>
                        <span className="criterion-weight">({(value.weight * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="criterion-score">
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ width: `${value.score}%` }}
                          />
                        </div>
                        <span className="score-text">{value.score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedSubmission.rubrics_scores.word_count && (
                  <div className="word-count-box">
                    <span>📊 Số từ: {selectedSubmission.rubrics_scores.word_count}</span>
                  </div>
                )}
                
                {selectedSubmission.rubrics_scores.strengths && selectedSubmission.rubrics_scores.strengths.length > 0 && (
                  <div className="strengths-box">
                    <h5>✅ Điểm mạnh:</h5>
                    <ul>
                      {selectedSubmission.rubrics_scores.strengths.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedSubmission.rubrics_scores.improvements && selectedSubmission.rubrics_scores.improvements.length > 0 && (
                  <div className="improvements-box">
                    <h5>⚠️ Cần cải thiện:</h5>
                    <ul>
                      {selectedSubmission.rubrics_scores.improvements.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedSubmission.rubrics_scores.corrections && selectedSubmission.rubrics_scores.corrections.length > 0 && (
                  <div className="corrections-box">
                    <h5>🔧 Sửa lỗi:</h5>
                    <ul>
                      {selectedSubmission.rubrics_scores.corrections.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedSubmission.rubrics_scores.suggestions && (
                  <div className="suggestions-box">
                    <h5>💡 Gợi ý:</h5>
                    <p>{selectedSubmission.rubrics_scores.suggestions}</p>
                  </div>
                )}
              </div>
            )}

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
                    <label>Điểm số (/10)</label>
                    <input
                      type="number"
                      className="form-input-grading"
                      placeholder="0"
                      min="0"
                      max={10}
                      step="0.5"
                      defaultValue={selectedSubmission.score}
                      id="score-input"
                    />
                  </div>
                </div>

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
                        <div className="ai-score-value">{selectedSubmission.ai_score}/10</div>
                        <div className="ai-score-label">Điểm AI đề xuất</div>
                      </div>
                    </div>
                  </div>

                  {selectedSubmission.rubrics_scores && (
                    <div className="ai-rubrics-display">
                      <h4>Chi tiết đánh giá:</h4>
                      
                      {/* Auto-grading results */}
                      {selectedSubmission.rubrics_scores.auto_grade_results && (
                        <div className="auto-grade-section">
                          <div className="auto-grade-header">
                            <CheckCircle size={18} style={{ color: '#10b981' }} />
                            <span>
                              Tự động chấm: {selectedSubmission.rubrics_scores.auto_graded_count}/{selectedSubmission.rubrics_scores.total_questions} câu
                              {selectedSubmission.rubrics_scores.has_short_answer && 
                                <span style={{ color: '#f59e0b', marginLeft: '8px' }}>
                                  ({selectedSubmission.rubrics_scores.total_questions - selectedSubmission.rubrics_scores.auto_graded_count} câu tự luận chờ chấm)
                                </span>
                              }
                            </span>
                          </div>
                          
                          <div className="auto-grade-questions">
                            {Object.entries(selectedSubmission.rubrics_scores.auto_grade_results).map(([qId, result]) => (
                              <div key={qId} className={`auto-grade-question ${result.correct ? 'correct' : result.status === 'pending_review' ? 'pending' : 'incorrect'}`}>
                                <div className="question-header">
                                  <span className="question-id">Câu {qId}</span>
                                  <span className="question-points">
                                    {result.earned !== undefined 
                                      ? `${result.earned}/${result.points} điểm` 
                                      : `${result.points} điểm (chờ chấm)`
                                    }
                                  </span>
                                </div>
                                
                                {result.type !== 'short_answer' ? (
                                  <div className="question-details">
                                    <div className="answer-row">
                                      <span className="label">Trả lời:</span>
                                      <span className={result.correct ? 'answer correct' : 'answer incorrect'}>
                                        {result.student_answer || '(Chưa trả lời)'}
                                        {result.correct ? ' ✓' : ' ✗'}
                                      </span>
                                    </div>
                                    {!result.correct && (
                                      <div className="answer-row">
                                        <span className="label">Đáp án:</span>
                                        <span className="answer correct">{result.correct_answer}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="question-details">
                                    <div className="essay-answer">
                                      <span className="label">Câu trả lời tự luận:</span>
                                      <p className="essay-text">{result.student_answer || '(Chưa trả lời)'}</p>
                                      <span className="pending-badge">⏳ Đợi giáo viên chấm</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Legacy rubrics display */}
                      {!selectedSubmission.rubrics_scores.auto_grade_results && 
                       !selectedSubmission.rubrics_scores.speaking_assessment &&
                       !selectedSubmission.rubrics_scores.writing_assessment &&
                       Object.entries(selectedSubmission.rubrics_scores).map(([skill, score]) => (
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
        {/* Class List Sidebar */}
        <div className="exercise-list-sidebar">
          <div className="sidebar-title-grading">
            <FileText size={20} />
            <span>Danh sách lớp</span>
          </div>
          
          <div className="exercise-list-grading">
            {loading ? (
              <div className="loading-state">Đang tải lớp học...</div>
            ) : classes.length === 0 ? (
              <div className="empty-state">Chưa có lớp nào</div>
            ) : (
              classes.map((classItem) => {
                const pending = submissions.filter(s => s.status === 'submitted' || s.status === 'pending_review').length;
                const graded = submissions.filter(s => s.status === 'graded').length;
                
                return (
                  <div
                    key={classItem.id}
                    className={`exercise-item-grading ${selectedClass === classItem.id ? 'active' : ''}`}
                    onClick={() => handleSelectClass(classItem.id)}
                  >
                    <div className="exercise-item-header">
                      <h4>{classItem.name}</h4>
                      <span className="class-badge">
                        Lớp thầy Trung
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
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Submissions Panel */}
        <div className="submissions-panel">
          {!selectedClass ? (
            <div className="empty-state-grading">
              <FileText size={80} strokeWidth={1} />
              <h3>Chọn lớp học</h3>
              <p>Chọn một lớp học bên trái để xem danh sách bài nộp</p>
            </div>
          ) : (
            <>
              {/* Panel Header */}
              <div className="panel-header-grading">
                <div className="panel-header-left">
                  <h2>{classes.find(c => c.id === selectedClass)?.name || 'Lớp học'}</h2>
                  <div className="panel-stats">
                    <span className="stat-badge total">
                      {submissions.length} bài nộp
                    </span>
                    <span className="stat-badge pending">
                      {submissions.filter(s => s.status === 'submitted' || s.status === 'pending_review').length} chờ chấm
                    </span>
                  </div>
                </div>
                <div className="panel-header-actions">
                  <button className="btn-action-grading">
                    <Download size={18} />
                    Xuất Excel
                  </button>
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
                  submissions.map((submission) => {
                    // Get exercise info from submission data
                    const exerciseTitle = `Bài tập ID: ${submission.exercise_id}`;
                    
                    return (
                      <div key={submission.id} className="submission-row">
                        <div className="submission-row-left">
                          <div className="student-avatar-small">
                            <User size={20} />
                          </div>
                          <div className="submission-info">
                            <h4>{submission.student_name}</h4>
                            <p className="exercise-title-small">
                              <FileText size={12} />
                              {exerciseTitle}
                            </p>
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
                              <span>{submission.score}/10</span>
                            </div>
                          )}
                          {submission.ai_score && submission.status === 'pending_review' && (
                            <div className="ai-score-badge">
                              <Sparkles size={14} />
                              AI: {submission.ai_score}/10
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
                    );
                  })
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

