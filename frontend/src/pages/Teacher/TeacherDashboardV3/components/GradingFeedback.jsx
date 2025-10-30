
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Clock, User, CheckCircle, XCircle, Eye, Edit, 
  Sparkles, Download, Filter, Search, Award, MessageSquare,
  TrendingUp, AlertCircle, PlayCircle, FileAudio, FileImage, Loader2
} from 'lucide-react';
import './GradingFeedback.css';
import { apiV1 } from '../../../../services/api';
import Toast from '../../../../components/Toast/Toast';
import useToast from '../../../../hooks/useToast';

export default function GradingFeedback() {
  const [exercises, setExercises] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  // Remove mode toggle; always show AI results when available and allow confirm
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const navigate = useNavigate();

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
    // Navigate to dedicated grading page with context
    const q = new URLSearchParams({ exerciseId: String(submission.exercise_id), classId: String(selectedClass || '') });
    navigate(`/teacher-grading/submissions/${submission.id}?${q.toString()}`);
  };

  const runAutoGrade = async () => {
    if (!selectedSubmission) return;
    setLoading(true);
    setAiLoading(true);
    try {
      const res = await apiV1.post(`/exercises/teacher-grading/submissions/${selectedSubmission.id}/auto-grade`);
      const updated = res.data;
      // Update modal state with AI results
      setSelectedSubmission(prev => ({ ...prev, ...updated }));
      setScoreInput((updated.ai_score ?? updated.score ?? '').toString());
      setFeedbackInput(updated.ai_feedback ?? updated.feedback ?? '');
    } catch (error) {
      console.error('Auto-grade error:', error);
      showError('Lỗi khi chấm tự động!');
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  const applyAIResultToForm = () => {
    if (!selectedSubmission) return;
    if (typeof selectedSubmission.ai_score === 'number') {
      setScoreInput(String(selectedSubmission.ai_score));
    }
    if (selectedSubmission.ai_feedback) {
      setFeedbackInput(selectedSubmission.ai_feedback);
    }
  };

  const handleManualSave = async (score, feedback) => {
    if (!selectedSubmission) return;
    
    setLoading(true);
    try {
      await apiV1.post(`/exercises/${selectedSubmission.exercise_id}/submissions/${selectedSubmission.id}/grade`, {
        score,
        feedback,
        rubrics_scores: selectedSubmission.rubrics_scores || null
      });
      
      showSuccess('Lưu điểm thành công!');
      setShowGradingModal(false);
      fetchSubmissions(); // Refresh
    } catch (error) {
      console.error('Error saving grade:', error);
      showError('Lỗi khi lưu điểm!');
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

  const hasAI = typeof selectedSubmission.ai_score === 'number';

    // Determine if the generic submission content card should be shown
    const showSubmissionContent = Boolean(selectedSubmission.content_text)
      || (
        selectedSubmission.content_url &&
        !selectedSubmission.content_url.startsWith('blob:') &&
        // If this is a speaking submission with assessment, we'll show audio in the speaking section instead
        !selectedSubmission.rubrics_scores?.speaking_assessment
      )
      || (
        selectedSubmission.answers &&
        Object.keys(selectedSubmission.answers || {}).length > 0
      );

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

          <div className="modal-body-grading grading-grid">
            {/* Student Info */}
            <div className="student-info-card">
              <div className="student-row">
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
            </div>

            {/* Left column: main content */}
            <div className="grading-main">
              {/* Submission Content (only render if there is something to show) */}
              {showSubmissionContent && (
                <div className="submission-content-section card">
                  <div className="section-title">
                    <span>📝 Bài làm của học sinh</span>
                  </div>
                
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
                        <div className="file-line">
                          <FileAudio size={20} />
                          <audio controls src={selectedSubmission.content_url} className="audio-player" />
                        </div>
                      ) : (
                        <div className="file-line">
                          <FileImage size={20} />
                          <a href={selectedSubmission.content_url} target="_blank" rel="noopener noreferrer">
                            Xem file đính kèm
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                
                  {/* Answers */}
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
                </div>
              )}

              {/* Speaking Assessment (Azure Speech) */}
              {selectedSubmission.rubrics_scores?.speaking_assessment && (
                <div className="speaking-assessment-section card">
                <div className="assessment-header">
                  <Sparkles size={18} style={{ color: '#8b5cf6' }} />
                  <span>Đánh giá Speaking (Azure Speech API)</span>
                </div>

                {/* New horizontal speaking layout: Left = audio, Center = AI ring + KPIs, Right = texts */}
                <div className="speaking-assessment-grid">
                  {/* Left: Audio */}
                  <div className="speaking-left">
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
                  </div>

                  {/* Center: AI ring + actions + compact KPIs */}
                  <div className="speaking-center">
                    {typeof selectedSubmission.ai_score === 'number' && (
                      <div className="overall-ai-score">
                        <div className="score-ring">
                          <div className="ring-inner">
                            <div className="ring-value">{selectedSubmission.ai_score}</div>
                            <div className="ring-max">/10</div>
                          </div>
                        </div>
                        <div className="overall-actions">
                          <button className="btn-mini" onClick={applyAIResultToForm}>
                            <CheckCircle size={14} /> Dùng điểm AI
                          </button>
                          <button className={`btn-mini outline ${aiLoading ? 'loading' : ''}`} onClick={runAutoGrade} disabled={loading}>
                            {aiLoading ? <><Loader2 className="spinner" size={14} /> Đang chấm...</> : <><Sparkles size={14} /> Chấm lại</>}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="kpi-row">
                      {['pronunciation','fluency','completeness','accuracy'].map((key) => {
                        const val = selectedSubmission.rubrics_scores?.speaking_assessment?.[key];
                        const map = {
                          pronunciation: { name: 'Phát âm', color: '#f59e0b' },
                          fluency: { name: 'Trôi chảy', color: '#3b82f6' },
                          completeness: { name: 'Hoàn chỉnh', color: '#10b981' },
                          accuracy: { name: 'Chính xác', color: '#ef4444' }
                        };
                        const info = map[key];
                        if (typeof val !== 'number') return null;
                        return (
                          <div key={key} className="kpi-item" style={{ borderColor: info.color }}>
                            <div className="kpi-value" style={{ color: info.color }}>{val.toFixed(1)}</div>
                            <div className="kpi-label">{info.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Recognized text + detailed feedback */}
                  <div className="speaking-right">
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
                </div>
                </div>
              )}
            
              {/* Writing Assessment (Gemini) */}
              {selectedSubmission.rubrics_scores?.writing_assessment && (
                <div className="writing-assessment-section card">
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

              {/* Objective/Auto-graded Results (MC/TF/FillBlank) */}
              {selectedSubmission.rubrics_scores?.auto_grade_results && (
                <div className="auto-grade-results-section card">
                <div className="auto-grade-summary">
                  <span>
                    Tự động chấm: {selectedSubmission.rubrics_scores.auto_graded_count}/{selectedSubmission.rubrics_scores.total_questions} câu
                    {selectedSubmission.rubrics_scores.has_short_answer && (
                      <span style={{ color: '#f59e0b', marginLeft: '8px' }}>
                        ({selectedSubmission.rubrics_scores.total_questions - selectedSubmission.rubrics_scores.auto_graded_count} câu tự luận chờ chấm)
                      </span>
                    )}
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
            </div>

            {/* Right column: sticky sidebar */}
            <div className="grading-sidebar">
              <div className="sidebar-card">
                <div className="section-title small">
                  <span>✨ Chấm tự động (AI)</span>
                </div>
                {hasAI && (
                  <div className="ai-summary">
                    <div className="ai-score-pill">
                      <Sparkles size={14} />
                      <span>{selectedSubmission.ai_score}/10</span>
                    </div>
                    {selectedSubmission.ai_feedback && (
                      <p className="ai-summary-text">{selectedSubmission.ai_feedback}</p>
                    )}
                  </div>
                )}
                <button className={`btn-ai-grade full ${aiLoading ? 'loading' : ''}`} onClick={runAutoGrade} disabled={loading}>
                  {aiLoading ? (
                    <>
                      <Loader2 className="spinner" size={18} /> Đang chấm...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> {hasAI ? 'Chấm lại bằng AI' : 'Chấm tự động (AI)'}
                    </>
                  )}
                </button>
              </div>

              <div className="sidebar-card">
                <div className="section-title small">
                  <span>✅ Kết quả & Xác nhận</span>
                </div>
                <div className="manual-grading-form">
                  <label>Điểm số (/10)</label>
                  <input type="number" min="0" max="10" step="0.1" value={scoreInput} onChange={(e)=>setScoreInput(e.target.value)} />
                  <label>Nhận xét</label>
                  <textarea value={feedbackInput} onChange={(e)=>setFeedbackInput(e.target.value)} />
                  {typeof selectedSubmission?.ai_score === 'number' && (
                    <button className="btn-use-ai full" type="button" onClick={applyAIResultToForm}>
                      <Sparkles size={16} /> Dùng gợi ý AI
                    </button>
                  )}
                  <button className="btn-save-grade full" onClick={() => handleManualSave(parseFloat(scoreInput), feedbackInput)} disabled={loading}>
                    <CheckCircle size={18} /> Xác nhận & lưu điểm
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer-grading">
            <button className="btn-cancel-grading" onClick={() => setShowGradingModal(false)}>
              Hủy
            </button>
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
                          {typeof submission.ai_score === 'number' && submission.status === 'pending_review' && (
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </div>
  );
}

