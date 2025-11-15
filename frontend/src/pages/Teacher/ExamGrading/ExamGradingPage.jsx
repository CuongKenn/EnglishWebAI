import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Clock, User, CheckCircle, XCircle, Eye, Edit, 
  Sparkles, Download, Filter, Search, Award, AlertCircle, 
  TrendingUp, BookOpen, Calendar, Users, Loader2, Camera
} from 'lucide-react';
import './ExamGradingPage.css';
import { apiV1 } from '../../../services/api';
import examService from '../../../services/examService';
import Toast from '../../../components/Toast/Toast';
import useToast from '../../../hooks/useToast';
import ProctoringLogsViewer from '../../../components/exam/ProctoringLogsViewer';

export default function ExamGradingPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('answers'); // 'answers' or 'proctoring'
  const { toast, showSuccess, showError, hideToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchExams();
      fetchSubmissions();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedExam) {
      fetchSubmissions();
    }
  }, [selectedExam]);

  const fetchClasses = async () => {
    try {
      const response = await apiV1.get('/classes/teaching');
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      showError('Lỗi khi tải danh sách lớp');
    }
  };

  const fetchExams = async () => {
    if (!selectedClass) return;
    try {
      const data = await examService.getClassExams(selectedClass);
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      showError('Lỗi khi tải danh sách đề thi');
    }
  };

  const fetchSubmissions = async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedExam) params.append('exam_id', selectedExam);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await apiV1.get(
        `/exam-assessments/submissions/class/${selectedClass}?${params.toString()}`
      );
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      showError('Lỗi khi tải bài làm');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setScoreInput(submission.score?.toString() || submission.ai_score?.toString() || '');
    setFeedbackInput(submission.feedback || submission.ai_feedback || '');
    setShowGradingModal(true);
  };

  const runAutoGrade = async () => {
    if (!selectedSubmission) return;
    setAiLoading(true);
    try {
      const response = await apiV1.post(
        `/exam-assessments/submissions/${selectedSubmission.id}/auto-grade`
      );
      const updated = response.data.submission;
      setSelectedSubmission(updated);
      setScoreInput(updated.ai_score?.toString() || '');
      setFeedbackInput(updated.ai_feedback || '');
      showSuccess('Chấm tự động thành công!');
    } catch (error) {
      console.error('Auto-grade error:', error);
      showError('Lỗi khi chấm tự động!');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    
    const score = parseFloat(scoreInput);
    if (isNaN(score) || score < 0 || score > 10) {
      showError('Điểm số không hợp lệ (0-10)');
      return;
    }

    setLoading(true);
    try {
      await examService.gradeSubmission(selectedSubmission.id, {
        score: score,
        feedback: feedbackInput,
        rubrics_scores: selectedSubmission.rubrics_scores || null
      });
      
      showSuccess('Lưu điểm thành công!');
      setShowGradingModal(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Error saving grade:', error);
      showError('Lỗi khi lưu điểm!');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      in_progress: { label: 'Đang làm', color: '#6b7280', icon: Clock },
      submitted: { label: 'Chờ chấm', color: '#f59e0b', icon: Clock },
      pending_review: { label: 'AI đã chấm', color: '#3b82f6', icon: Sparkles },
      graded: { label: 'Đã chấm', color: '#10b981', icon: CheckCircle }
    };
    const statusInfo = statuses[status] || statuses.submitted;
    const Icon = statusInfo.icon;
    
    return (
      <span className="status-badge" style={{ background: statusInfo.color }}>
        <Icon size={14} />
        {statusInfo.label}
      </span>
    );
  };

  const getExamTypeBadge = (examType) => {
    const types = {
      midterm: { label: 'Giữa kỳ', color: '#f59e0b' },
      final: { label: 'Cuối kỳ', color: '#ef4444' },
      quiz: { label: 'Kiểm tra', color: '#3b82f6' },
      practice: { label: 'Luyện tập', color: '#10b981' }
    };
    const typeInfo = types[examType] || types.quiz;
    
    return (
      <span className="exam-type-badge" style={{ background: typeInfo.color }}>
        {typeInfo.label}
      </span>
    );
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = searchQuery === '' || 
      sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'submitted' || s.status === 'pending_review').length,
    graded: submissions.filter(s => s.status === 'graded').length,
    averageScore: submissions.filter(s => s.score !== null).length > 0
      ? (submissions.filter(s => s.score !== null).reduce((sum, s) => sum + s.score, 0) / 
         submissions.filter(s => s.score !== null).length).toFixed(2)
      : '0'
  };

  const renderGradingModal = () => {
    if (!selectedSubmission) return null;

    const rubrics = selectedSubmission.rubrics_scores || {};
    const autoResults = rubrics.auto_grade_results || {};

    return (
      <div className="grading-modal-overlay" onClick={() => setShowGradingModal(false)}>
        <div className="grading-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>Chấm bài thi: {selectedSubmission.exam_title}</h2>
              <p className="modal-subtitle">
                {selectedSubmission.student_name} • {selectedSubmission.student_email}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                className="btn-secondary"
                onClick={() => navigate(`/teacher/grading/${selectedSubmission.id}?examId=${selectedSubmission.exam_id}&classId=${selectedClass}`)}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                <Eye size={16} /> Xem chi tiết
              </button>
              <button className="modal-close" onClick={() => setShowGradingModal(false)}>×</button>
            </div>
          </div>

          <div className="modal-body">
            {/* Student Info */}
            <div className="student-info-card">
              <div className="info-row">
                <User size={20} />
                <span>{selectedSubmission.student_name}</span>
              </div>
              <div className="info-row">
                <Clock size={16} />
                <span>Nộp: {new Date(selectedSubmission.submitted_at).toLocaleString('vi-VN')}</span>
              </div>
              <div className="info-row">
                {getExamTypeBadge(selectedSubmission.exam_type)}
                {getStatusBadge(selectedSubmission.status)}
              </div>
            </div>

            {/* Tabs for Answers and Proctoring */}
            <div className="grading-tabs">
              <button 
                className={`tab-button ${activeTab === 'answers' ? 'active' : ''}`}
                onClick={() => setActiveTab('answers')}
              >
                <FileText size={16} />
                Câu trả lời
              </button>
              <button 
                className={`tab-button ${activeTab === 'proctoring' ? 'active' : ''}`}
                onClick={() => setActiveTab('proctoring')}
              >
                <Camera size={16} />
                Giám sát thi
              </button>
            </div>

            {activeTab === 'answers' && (
              <div className="grading-content">
              {/* Left: Answers & Results */}
              <div className="grading-main">
                {/* Auto-graded Results */}
                {Object.keys(autoResults).length > 0 && (
                  <div className="auto-grade-section">
                    <div className="section-header">
                      <Sparkles size={18} />
                      <h3>Kết quả chấm tự động</h3>
                      <span className="auto-grade-summary">
                        {rubrics.auto_graded_count}/{rubrics.total_questions} câu
                      </span>
                    </div>
                    
                    <div className="questions-list">
                      {Object.entries(autoResults).map(([qId, result]) => (
                        <div 
                          key={qId} 
                          className={`question-card ${result.correct ? 'correct' : 
                            result.status === 'pending_review' ? 'pending' : 'incorrect'}`}
                        >
                          <div className="question-header">
                            <span className="question-id">Câu {qId}</span>
                            <span className="question-points">
                              {result.earned !== undefined 
                                ? `${result.earned}/${result.points} điểm` 
                                : `${result.points} điểm`
                              }
                            </span>
                          </div>
                          
                          <div className="question-body">
                            {result.type !== 'short_answer' && result.type !== 'essay' ? (
                              <>
                                <div className="answer-row">
                                  <span className="label">Trả lời:</span>
                                  <span className={result.correct ? 'answer correct' : 'answer incorrect'}>
                                    {result.student_answer || '(Chưa trả lời)'}
                                    {result.correct !== undefined && (result.correct ? ' ✓' : ' ✗')}
                                  </span>
                                </div>
                                {!result.correct && result.correct_answer && (
                                  <div className="answer-row">
                                    <span className="label">Đáp án:</span>
                                    <span className="answer correct">{result.correct_answer}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="essay-answer">
                                <span className="label">Câu trả lời:</span>
                                <p className="essay-text">{result.student_answer || '(Chưa trả lời)'}</p>
                                <span className="pending-badge">⏳ Cần chấm thủ công</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No results yet */}
                {Object.keys(autoResults).length === 0 && (
                  <div className="empty-state">
                    <AlertCircle size={48} />
                    <p>Chưa có kết quả chấm tự động</p>
                    <button className="btn-primary" onClick={runAutoGrade} disabled={aiLoading}>
                      {aiLoading ? (
                        <>
                          <Loader2 className="spinner" size={18} /> Đang chấm...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} /> Chấm tự động
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Grading Panel */}
              <div className="grading-sidebar">
                {/* AI Score */}
                {selectedSubmission.ai_score !== null && (
                  <div className="ai-score-card">
                    <div className="ai-score-header">
                      <Sparkles size={18} />
                      <span>Điểm AI</span>
                    </div>
                    <div className="ai-score-value">
                      {selectedSubmission.ai_score}/10
                    </div>
                    {selectedSubmission.ai_feedback && (
                      <p className="ai-feedback">{selectedSubmission.ai_feedback}</p>
                    )}
                    <button 
                      className="btn-use-ai" 
                      onClick={() => {
                        setScoreInput(selectedSubmission.ai_score.toString());
                        setFeedbackInput(selectedSubmission.ai_feedback || '');
                      }}
                    >
                      <CheckCircle size={16} /> Dùng điểm AI
                    </button>
                  </div>
                )}

              {/* Auto-grade AI button - Removed */}

                {/* Manual Grading Form */}
                <div className="manual-grade-card">
                  <h4>Chấm điểm cuối cùng</h4>
                  
                  <label>Điểm số (/10)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="10" 
                    step="0.1" 
                    value={scoreInput} 
                    onChange={(e) => setScoreInput(e.target.value)}
                    className="score-input"
                  />
                  
                  <label>Nhận xét</label>
                  <textarea 
                    value={feedbackInput} 
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    className="feedback-input"
                    rows={5}
                    placeholder="Nhận xét của giáo viên..."
                  />
                  
                  <button 
                    className="btn-save-grade" 
                    onClick={handleSaveGrade} 
                    disabled={loading}
                  >
                    <CheckCircle size={18} /> Xác nhận & lưu điểm
                  </button>
                </div>
              </div>
            </div>
            )}

            {activeTab === 'proctoring' && (
              <div className="proctoring-tab-content">
                <ProctoringLogsViewer submissionId={selectedSubmission.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="exam-grading-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>Chấm bài thi Giữa kỳ & Cuối kỳ</h1>
          <p>Quản lý và chấm điểm các bài thi chính thức</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <Download size={18} />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff' }}>
            <FileText size={24} style={{ color: '#4f46e5' }} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Tổng bài nộp</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Clock size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Chờ chấm</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <CheckCircle size={24} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.graded}</div>
            <div className="stat-label">Đã chấm</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <TrendingUp size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.averageScore}</div>
            <div className="stat-label">Điểm TB</div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* Sidebar: Class & Exam Selection */}
        <div className="sidebar">
          {/* Class Selector */}
          <div className="sidebar-section">
            <h3>Lớp học</h3>
            <div className="class-list">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`class-item ${selectedClass === cls.id ? 'active' : ''}`}
                  onClick={() => setSelectedClass(cls.id)}
                >
                  <Users size={16} />
                  <span>{cls.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Filter */}
          <div className="sidebar-section">
            <h3>Đề thi</h3>
            <div className="exam-list">
              <div
                className={`exam-item ${!selectedExam ? 'active' : ''}`}
                onClick={() => setSelectedExam(null)}
              >
                <BookOpen size={16} />
                <span>Tất cả đề thi</span>
              </div>
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className={`exam-item ${selectedExam === exam.id ? 'active' : ''}`}
                  onClick={() => setSelectedExam(exam.id)}
                >
                  <FileText size={16} />
                  <div className="exam-item-content">
                    <span>{exam.title}</span>
                    {getExamTypeBadge(exam.exam_type)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content: Submissions */}
        <div className="main-content">
          {/* Filters */}
          <div className="filters-bar">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm học sinh..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select 
              className="filter-select" 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="submitted">Chờ chấm</option>
              <option value="pending_review">AI đã chấm</option>
              <option value="graded">Đã chấm</option>
            </select>
          </div>

          {/* Submissions Table */}
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={48} />
              <p>Đang tải...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} />
              <h3>Chưa có bài nộp</h3>
              <p>Chưa có học sinh nào nộp bài cho đề thi này</p>
            </div>
          ) : (
            <div className="submissions-table">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="submission-row">
                  <div className="submission-left">
                    <div className="student-avatar">
                      <User size={20} />
                    </div>
                    <div className="submission-info">
                      <h4>{submission.student_name}</h4>
                      <p className="submission-meta">
                        <FileText size={12} />
                        {submission.exam_title}
                        {getExamTypeBadge(submission.exam_type)}
                      </p>
                      <p className="submission-time">
                        <Clock size={12} />
                        {new Date(submission.submitted_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="submission-center">
                    {getStatusBadge(submission.status)}
                    {submission.status === 'graded' && submission.score !== null && (
                      <div className="score-display">
                        <Award size={16} />
                        <span>{submission.score}/10</span>
                      </div>
                    )}
                    {submission.ai_score !== null && submission.status !== 'graded' && (
                      <div className="ai-score-badge">
                        <Sparkles size={14} />
                        AI: {submission.ai_score}/10
                      </div>
                    )}
                  </div>
                  
                  <div className="submission-actions">
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {showGradingModal && renderGradingModal()}

      {/* Toast */}
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
