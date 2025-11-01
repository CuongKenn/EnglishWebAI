import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  RotateCcw,
  HelpCircle,
  Target,
  Award,
  Star,
  BookOpen,
  FileText,
  Save,
  AlertCircle,
  X
} from 'lucide-react';
import './WritingExercise.css';
import { coursesAPI } from '../../services/api';
import { aiAPI } from '../../services/api';
import Toast from '../../components/Toast/Toast';
import useToast from '../../hooks/useToast';
import { UI_CONFIG } from '../../config/constants';

const WritingExercise = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { toast, showError, showWarning, hideToast } = useToast();

  // State management
  const [userEssay, setUserEssay] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Real data from server
  const [writingData, setWritingData] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [unitData, setUnitData] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Load real data from server
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load course data
        const course = await coursesAPI.getCourse(courseId);
        setCourseData(course);

        // Load units
        const units = await coursesAPI.getUnits(courseId);
        const unit = units.find(u => u.id === parseInt(lessonId));
        if (!unit) {
          throw new Error('Không tìm thấy bài học');
        }
        setUnitData(unit);

        // Load questions
        const qs = await coursesAPI.getQuestions(parseInt(lessonId));
        setQuestions(qs || []);

        // Build writingData structure
        const firstQuestion = qs && qs.length > 0 ? qs[0] : null;
        setWritingData({
          id: lessonId,
          title: unit.title,
          courseTitle: course.title,
          difficulty: course.level || 'Intermediate',
          estimatedTime: 30,
          wordLimit: 350,
          currentQuestion: 1,
          totalQuestions: qs?.length || 1,
          question: firstQuestion ? {
            id: firstQuestion.id,
            type: firstQuestion.type || 'essay',
            instruction: 'Viết bài luận theo yêu cầu dưới đây',
            prompt: firstQuestion.prompt || '',
            additionalInstruction: firstQuestion.answer_json ? JSON.parse(firstQuestion.answer_json).instruction : '',
            wordLimit: 350,
            gradingCriteria: [
              'Nội dung và ý tưởng (40%)',
              'Tổ chức và cấu trúc (25%)',
              'Sử dụng ngôn ngữ (25%)',
              'Cơ học viết (10%)'
            ]
          } : null
        });

      } catch (err) {
        console.error('Error loading writing exercise:', err);
        setError(err?.detail || err?.message || 'Không thể tải bài tập');
      } finally {
        setLoading(false);
      }
    };

    if (courseId && lessonId) {
      loadData();
    }
  }, [courseId, lessonId]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Word and sentence count effect
  useEffect(() => {
    const words = userEssay.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = userEssay.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);

    setWordCount(words.length);
    setSentenceCount(sentences.length);
  }, [userEssay]);

  // Auto-save effect
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (userEssay.trim().length > 0) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), UI_CONFIG.SUCCESS_INDICATOR_DURATION);
      }
    }, UI_CONFIG.NOTIFICATION_DURATION);

    return () => clearTimeout(autoSave);
  }, [userEssay]);

  // Handle essay change
  const handleEssayChange = (e) => {
    const value = e.target.value;
    if (value.length <= writingData.wordLimit * 6) { // Rough character limit
      setUserEssay(value);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate score (mock for now - in real app this would come from AI evaluation)
  const calculateScore = () => {
    // Mock score based on word count and basic criteria
    let score = 60; // Base score

    // Bonus for word count
    if (wordCount >= writingData.wordLimit) {
      score += 20;
    } else if (wordCount >= writingData.wordLimit * 0.8) {
      score += 10;
    }

    // Bonus for sentence count (good structure)
    if (sentenceCount >= 8) {
      score += 10;
    }

    return Math.min(score, 100); // Cap at 100
  };

  // Submit essay
  const submitEssay = async () => {
    if (wordCount < 50) {
      showWarning('Bài viết phải có ít nhất 50 từ');
      return;
    }

    try {
      setSubmitting(true);

      // Call AI to grade writing first
      const result = await aiAPI.checkWriting(
        userEssay,
        'essay',
        writingData?.difficulty?.toLowerCase() || 'intermediate'
      );

      setAiResult(result);

      // Submit to course API with AI result
      await coursesAPI.submitUnitAnswers(parseInt(lessonId), {
        content_text: userEssay,
        content_url: null
      });

      setIsCompleted(true);
      setIsSaved(true);

      // Calculate score and save completion data
      const score = result?.score || calculateScore();
      const completionData = {
        lessonId,
        courseId,
        score,
        completedAt: new Date().toISOString(),
        type: 'writing',
        wordCount,
        timeSpent,
        aiResult: result
      };

      // Save to localStorage
      const key = `course_${courseId}_completed_lessons`;
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      existing[lessonId] = completionData;
      localStorage.setItem(key, JSON.stringify(existing));

      // Show completion message
      setShowCompletionMessage(true);

    } catch (error) {
      console.error('Error submitting essay:', error);
      showError('Lỗi khi nộp bài: ' + (error?.detail || error?.message || 'Vui lòng thử lại'));
    } finally {
      setSubmitting(false);
    }
  };

  // Reset exercise
  const resetExercise = () => {
    setUserEssay('');
    setIsCompleted(false);
    setTimeSpent(0);
    setAiResult(null);
  };

  if (loading) {
    return (
      <div className="writing-exercise-page">
        <div className="writing-header">
          <div className="header-left">
            <button className="writing-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
              Quay lại
            </button>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Đang tải bài tập...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="writing-exercise-page">
        <div className="writing-header">
          <div className="header-left">
            <button className="writing-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
              Quay lại
            </button>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          <AlertCircle size={48} style={{ marginBottom: '16px' }} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!writingData || !writingData.question) {
    return (
      <div className="writing-exercise-page">
        <div className="writing-header">
          <div className="header-left">
            <button className="writing-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
              Quay lại
            </button>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Không có câu hỏi nào trong bài này</p>
        </div>
      </div>
    );
  }

  return (
    <div className="writing-exercise-page">
      {/* Header */}
      <div className="writing-header">
        <div className="header-left">
          <button
            className="writing-back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>

        <div className="course-info">
          <h1 className="course-title">{writingData.courseTitle}</h1>
          <p className="course-subtitle">{writingData.title}</p>
        </div>

        <div className="header-right">
          <div className="timer-info">
            <Clock size={16} />
            <span>{formatTime(timeSpent)}</span>
          </div>
          <div className="difficulty-badge">
            {writingData.difficulty}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="writing-content">
        {/* Left Column - Question */}
        <div className="question-panel">
          <div className="question-header">
            <h2 className="question-title">Bài chấm viết đoạn</h2>
            <div className="question-controls">
              <button
                className="hint-btn"
                onClick={() => setShowHint(!showHint)}
              >
                <HelpCircle size={16} />
                Hint
              </button>
            </div>
          </div>

          <div className="question-content">

            <div className="question-instruction">
              <p>{writingData.question.instruction}</p>
            </div>

            <div className="question-prompt">
              <p>{writingData.question.prompt}</p>
            </div>

            <div className="question-additional">
              <p>{writingData.question.additionalInstruction}</p>
            </div>

            {showHint && (
              <div className="hint-content">
                <div className="hint-header">
                  <AlertCircle size={16} />
                  <span>Gợi ý</span>
                </div>
                <div className="hint-tips">
                  <h4>Tiêu chí chấm điểm:</h4>
                  <ul>
                    {writingData.question.gradingCriteria.map((criteria, index) => (
                      <li key={index}>{criteria}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Essay Writing */}
        <div className="essay-panel">
          <div className="essay-header">
            <h2 className="essay-title">Bài viết của bạn</h2>
            <div className="essay-stats">
              <span className="word-count">{wordCount} từ</span>
              <span className="sentence-count">{sentenceCount} câu</span>
              {isSaved && (
                <div className="save-indicator">
                  <Save size={14} />
                  <span>Đã lưu</span>
                </div>
              )}
            </div>
          </div>

          <div className="essay-content">
            <textarea
              className="essay-textarea"
              placeholder="Nhập bài viết của bạn..."
              value={userEssay}
              onChange={handleEssayChange}
              disabled={isCompleted}
              rows={20}
            />

            <div className="word-limit-info">
              <span>Giới hạn bài viết là <strong>{writingData.wordLimit} từ</strong></span>
            </div>

            <div className="disclaimer">
              <p>
                Để đánh giá chính xác kết quả học tập của học viên, hệ thống không hỗ trợ việc sử dụng trợ giúp từ AI hoặc đạo văn dưới bất kỳ hình thức nào.
                Nếu phát hiện vi phạm, chúng tôi sẽ không chấm điểm cho bài nộp này.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="exercise-actions">
        <div className="action-buttons">
          <button
            className="reset-btn"
            onClick={resetExercise}
            disabled={isCompleted}
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            className="submit-btn"
            onClick={submitEssay}
            disabled={wordCount < 50 || submitting}
          >
            <Target size={16} />
            {submitting ? 'Đang nộp...' : (isCompleted ? 'Xem kết quả' : 'Nộp bài')}
          </button>
        </div>
      </div>

      {/* Completion Message */}
      {showCompletionMessage && (
        <div className="completion-message">
          <div className="completion-content">
            <button
              className="completion-close-btn"
              onClick={() => {
                setShowCompletionMessage(false);
                setIsCompleted(false); // Allow re-submission
              }}
            >
              <X size={24} />
            </button>

            <CheckCircle size={64} color="#10b981" />
            <h3>Hoàn thành bài tập!</h3>
            <p>Bài viết của bạn đã được nộp thành công và chấm bởi AI.</p>

            <div className="completion-stats">
              <div className="stat-item">
                <FileText size={16} />
                <span>{wordCount} từ</span>
              </div>
              <div className="stat-item">
                <Clock size={16} />
                <span>{formatTime(timeSpent)}</span>
              </div>
              <div className="stat-item">
                <Award size={16} />
                <span>{aiResult?.score || calculateScore()} điểm</span>
              </div>
            </div>

            {aiResult && (
              <div className="ai-feedback-section">
                <h4>📝 Phản hồi từ AI</h4>
                {aiResult.feedback && (
                  <div className="ai-feedback-text">
                    <p><strong>Nhận xét chung:</strong></p>
                    <p>{aiResult.feedback}</p>
                  </div>
                )}
                {aiResult.breakdown && (
                  <div className="ai-breakdown">
                    <p><strong>Chi tiết đánh giá:</strong></p>
                    <ul>
                      {Object.entries(aiResult.breakdown).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiResult.strengths && aiResult.strengths.length > 0 && (
                  <div className="ai-strengths">
                    <p><strong>✅ Điểm mạnh:</strong></p>
                    <ul>
                      {aiResult.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiResult.improvements && aiResult.improvements.length > 0 && (
                  <div className="ai-improvements">
                    <p><strong>📈 Cần cải thiện:</strong></p>
                    <ul>
                      {aiResult.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiResult.corrections && aiResult.corrections.length > 0 && (
                  <div className="ai-corrections">
                    <p><strong>✏️ Sửa lỗi:</strong></p>
                    <ul>
                      {aiResult.corrections.map((correction, idx) => (
                        <li key={idx}>{correction}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="completion-actions">
              <button
                className="back-to-profile-btn"
                onClick={() => navigate('/learning-profile')}
              >
                <ArrowLeft size={16} />
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}

    </div>
  );
};

export default WritingExercise;
