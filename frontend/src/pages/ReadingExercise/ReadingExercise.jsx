import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  HelpCircle,
  Target,
  Award,
  Star,
  X,
  BookOpen,
  Loader
} from 'lucide-react';
import './ReadingExercise.css';
import { getReadingPassage } from '../../api/courseContent';
import { coursesAPI } from '../../services/api';

const ReadingExercise = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  // State management
  const [userAnswers, setUserAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readingData, setReadingData] = useState(null);
  const [unitData, setUnitData] = useState(null);

  // Fetch reading passage từ API
  useEffect(() => {
    const fetchReadingData = async () => {
      if (!lessonId) return;
      
      setLoading(true);
      setError(null);

      if (courseId) {
        try {
          const units = await coursesAPI.getUnits(courseId);
          const matchedUnit = units.find((u) => u.id === parseInt(lessonId, 10));
          if (matchedUnit) {
            setUnitData(matchedUnit);
          }
        } catch (unitErr) {
          console.warn('Không thể tải thông tin unit Reading:', unitErr);
        }
      }
      
      // Try new Rich Content API first
      try {
        const data = await getReadingPassage(lessonId);
        
        // Transform API data vào format component cần
        const transformedData = {
          id: data.id,
          title: data.title,
          courseTitle: 'Reading',
          difficulty: data.difficulty || 'Beginner',
          estimatedTime: data.estimated_time || 15,
          totalQuestions: data.total_questions || 0,
          passage: {
            title: data.title,
            subtitle: data.subtitle || '',
            paragraphs: data.paragraphs?.map(para => ({
              id: para.paragraph_id,
              content: para.content,
              heading: para.heading || '',
              questions: para.questions?.map(q => {
                // Parse options_json if it's a string
                let options = q.options_json;
                if (typeof options === 'string') {
                  try {
                    options = JSON.parse(options);
                  } catch (e) {
                    console.error('Failed to parse options_json:', e);
                    options = [];
                  }
                }
                
                return {
                  id: q.id,
                  type: q.type,
                  instruction: q.instruction,
                  options: options || [],
                  correctAnswer: q.correct_answer
                };
              }) || []
            })) || []
          }
        };
        
        setReadingData(transformedData);
        setLoading(false);
        return; // Success - exit early
      } catch {
        // 404 is expected when no rich content - fallback silently to legacy data
        // Continue to fallback...
      }
      
      // Fallback: Load legacy CourseQuestion data (reading units) and transform
      try {
        const legacyQuestions = await coursesAPI.getQuestions(parseInt(lessonId, 10));
        const readingQuestions = Array.isArray(legacyQuestions)
          ? legacyQuestions.filter((q) => q && ['mcq', 'fill-blank', 'short'].includes(q.type))
          : [];

        let passageText = '';
        const normalizeLegacyQuestion = (question) => {
          if (!question) return null;

          let instructionText = question.prompt;
          if (typeof instructionText === 'string') {
            try {
              const parsedPrompt = JSON.parse(instructionText);
              if (parsedPrompt && typeof parsedPrompt === 'object') {
                if (!passageText && typeof parsedPrompt.passage === 'string') {
                  passageText = parsedPrompt.passage;
                }
                if (typeof parsedPrompt.question === 'string') {
                  instructionText = parsedPrompt.question;
                }
              }
            } catch (parseErr) {
              // eslint-disable-next-line no-console
              console.warn('Không thể parse prompt cho câu hỏi Reading:', parseErr);
            }
          }

          const options = Array.isArray(question.options) ? question.options.filter(Boolean) : [];
          if (options.length === 0) {
            // Legacy student UI hiện chỉ hỗ trợ multiple-choice, bỏ qua câu không có đáp án
            return null;
          }

          const correctAnswerIndex = typeof question.answer?.correct === 'number'
            ? question.answer.correct
            : null;

          return {
            id: question.id,
            type: 'multiple-choice',
            instruction: instructionText,
            options,
            correctAnswer: correctAnswerIndex,
          };
        };

        const normalizedQuestions = readingQuestions
          .map(normalizeLegacyQuestion)
          .filter(Boolean);

        if (normalizedQuestions.length > 0) {
          if (!passageText) {
            const firstPrompt = readingQuestions[0]?.prompt;
            if (typeof firstPrompt === 'string' && firstPrompt.trim()) {
              passageText = firstPrompt;
            } else {
              passageText = 'Đoạn văn chưa được cung cấp. Vui lòng liên hệ giáo viên.';
            }
          }

          const fallbackData = {
            id: lessonId || '1',
            title: unitData?.title || 'Reading Unit',
            courseTitle: 'Reading',
            difficulty: unitData?.level || 'Beginner',
            estimatedTime: unitData?.estimated_time || 15,
            totalQuestions: normalizedQuestions.length,
            passage: {
              title: unitData?.title || 'Reading Passage',
              subtitle: unitData?.description || '',
              paragraphs: [
                {
                  id: 'A',
                  content: passageText,
                  heading: 'Paragraph A',
                  questions: normalizedQuestions,
                },
              ],
            },
          };

          setReadingData(fallbackData);
          setLoading(false);
          return;
        }
      } catch (legacyErr) {
        console.warn('Không thể tải bài đọc từ dữ liệu legacy:', legacyErr);
      }

      // Không có dữ liệu legacy -> dùng thông điệp mặc định
      setReadingData({
        id: lessonId || '1',
        title: 'Reading Unit',
        courseTitle: 'Reading',
        difficulty: 'Beginner',
        estimatedTime: 15,
        totalQuestions: 1,
        passage: {
          title: 'Reading Practice',
          subtitle: 'Complete the reading exercise below',
          paragraphs: [
            {
              id: 'A',
              content: 'This is a practice reading passage. Rich content will be available once your teacher adds it.',
              heading: 'Practice Passage',
              questions: [
                {
                  id: 1,
                  type: 'multiple-choice',
                  instruction: 'This is a sample question. Real questions will appear once content is added.',
                  options: ['Option A', 'Option B', 'Option C', 'Option D'],
                  correctAnswer: 0,
                },
              ],
            },
          ],
        },
      });
      setLoading(false);
    };

    fetchReadingData();
  }, [lessonId]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle answer selection for new format
  const handleAnswerChange = (questionKey, answerId) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionKey]: answerId
    }));
  };

  // Check answers and calculate score
  const checkAnswers = () => {
    let correctCount = 0;
    let totalQuestions = 0;

    // Count questions from all paragraphs
    readingData.passage.paragraphs.forEach(paragraph => {
      if (paragraph.questions) {
        paragraph.questions.forEach(question => {
          totalQuestions++;
          const questionKey = `${paragraph.id}_${question.id}`;
          const userAnswer = userAnswers[questionKey];

          if (question.type === 'matching') {
            if (userAnswer === question.correctAnswer) {
              correctCount++;
            }
          } else if (question.type === 'multiple-choice') {
            if (userAnswer === question.correctAnswer) {
              correctCount++;
            }
          }
        });
      }
    });

    const newScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    setScore(newScore);
    setIsCompleted(true);
    setShowAnswers(true);
    setShowCompletionMessage(true);
  };

  // Handle completion
  const handleComplete = async () => {
    // Save completion data to localStorage
    const completionData = {
      lessonId: lessonId,
      courseId: courseId,
      score: score,
      completedAt: new Date().toISOString(),
      timeSpent: timeSpent,
      type: 'reading'
    };

    const existingData = JSON.parse(localStorage.getItem(`course_${courseId}_completed_lessons`) || '{}');
    existingData[lessonId] = completionData;
    localStorage.setItem(`course_${courseId}_completed_lessons`, JSON.stringify(existingData));

    let cupCapacity = Number(unitData?.max_cups);
    if (!Number.isFinite(cupCapacity) || cupCapacity <= 0) {
      cupCapacity = readingData?.totalQuestions || 1;
    }
    const cupsEarned = Math.min(cupCapacity, Math.round((score / 100) * cupCapacity));

    try {
      await coursesAPI.submitUnitAnswers(parseInt(lessonId, 10), {
        content_text: JSON.stringify(userAnswers),
        content_url: null,
        score: cupsEarned,
        time_spent: timeSpent
      });
    } catch (submitErr) {
      console.error('Không thể lưu kết quả Reading:', submitErr);
    }

    // Navigate to learning profile page
    navigate('/learning-profile');
  };

  // Reset exercise
  const resetExercise = () => {
    setUserAnswers({});
    setShowAnswers(false);
    setScore(0);
    setIsCompleted(false);
    setTimeSpent(0);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="reading-exercise-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
          <Loader size={48} className="animate-spin" style={{ color: '#4F46E5' }} />
          <p style={{ color: '#6B7280' }}>Đang tải bài đọc...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !readingData) {
    return (
      <div className="reading-exercise-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
          <XCircle size={48} style={{ color: '#EF4444' }} />
          <p style={{ color: '#EF4444' }}>{error || 'Không tìm thấy bài đọc'}</p>
          <button 
            onClick={() => navigate(`/course/${courseId}`)}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#4F46E5', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reading-exercise-page">
      {/* Header */}
      <div className="reading-header">
        <div className="header-left">
          <button
            className="back-btn reading-back-btn"
            onClick={() => navigate(`/course/${courseId}`)}
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>

        <div className="course-info">
          <h1>{readingData.courseTitle}</h1>
          <span className="lesson-title">{readingData.title}</span>
        </div>

        <div className="header-right">
          <div className="time-info">
            <Clock size={16} />
            <span>{formatTime(timeSpent)}</span>
          </div>
          <div className="difficulty-badge">
            {readingData.difficulty}
          </div>
        </div>
      </div>

      <div className="reading-content-new">
        {/* Passage Header */}
        <div className="passage-header">
          <h2 className="passage-title">{readingData.passage.title}</h2>
          <p className="passage-subtitle">{readingData.passage.subtitle}</p>
        </div>

        {/* Paragraphs with Questions */}
        {readingData.passage.paragraphs.map((paragraph) => (
          <div key={paragraph.id} className="paragraph-section">
            {/* Paragraph Content */}
            <div className="paragraph-container">
              <div className="paragraph-label">Paragraph {paragraph.id}</div>
              <div className="paragraph-text">
                {paragraph.content}
              </div>
            </div>

            {/* Questions for this paragraph */}
            {paragraph.questions && paragraph.questions.length > 0 && (
              <div className="questions-container">
                <div className="questions-header">
                  <h3>Questions for Paragraph {paragraph.id}</h3>
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

                <div className="questions-content">
                  {paragraph.questions.map((question, questionIndex) => (
                    <div key={question.id} className="question-item">
                      {question.type === 'matching' ? (
                        <div className="matching-exercise">
                          <p className="exercise-instruction">
                            {question.instruction}
                          </p>

                          <div className="paragraph-matching">
                            <div className="paragraph-match-item">
                              <div className="paragraph-label-small">
                                Paragraph {paragraph.id}
                              </div>
                              <select
                                className="matching-select"
                                value={userAnswers[`${paragraph.id}_${question.id}`] || ''}
                                onChange={(e) => handleAnswerChange(`${paragraph.id}_${question.id}`, parseInt(e.target.value))}
                              >
                                <option value="">Select heading...</option>
                                {question.options.map(option => (
                                  <option key={option.id} value={option.id}>
                                    {option.text}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="multiple-choice-exercise">
                          <p className="exercise-instruction">
                            {question.instruction}
                          </p>

                          <div className="options-list">
                            {question.options.map((option, index) => (
                              <button
                                key={index}
                                className={`option-btn ${userAnswers[`${paragraph.id}_${question.id}`] === index ? 'selected' : ''} ${
                                  showAnswers ? (index === question.correctAnswer ? 'correct' : 'wrong') : ''
                                }`}
                                onClick={() => handleAnswerChange(`${paragraph.id}_${question.id}`, index)}
                                disabled={showAnswers}
                              >
                                <div className="option-letter">{String.fromCharCode(65 + index)}</div>
                                <div className="option-text">{option}</div>
                                {showAnswers && index === question.correctAnswer && (
                                  <CheckCircle className="correct-icon" size={20} color="#28a745" />
                                )}
                                {showAnswers && userAnswers[`${paragraph.id}_${question.id}`] === index && index !== question.correctAnswer && (
                                  <XCircle className="wrong-icon" size={20} color="#dc3545" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Action Buttons */}
        <div className="exercise-actions">
          <div className="action-buttons">
            <button
              className="reset-btn"
              onClick={resetExercise}
            >
              <RotateCcw size={16} />
              Reset
            </button>

            {!isCompleted ? (
              <button
                className="submit-btn"
                onClick={checkAnswers}
              >
                <Target size={16} />
                Nộp bài
              </button>
            ) : (
              <button
                className="complete-btn"
                onClick={handleComplete}
              >
                <CheckCircle size={16} />
                Hoàn thành
              </button>
            )}
          </div>
        </div>

        {/* Completion Message */}
        {showCompletionMessage && (
          <div className="completion-message">
            <div className="completion-content">
              <button
                className="close-completion-btn"
                onClick={() => setShowCompletionMessage(false)}
              >
                <X size={24} />
              </button>
              <Award size={32} />
              <h3>Chúc mừng!</h3>
              <p>Bạn đã hoàn thành bài Reading thành công.</p>
              <div className="completion-stats">
                <div className="stat-item">
                  <BookOpen size={20} />
                  <span>{readingData.passage.paragraphs.reduce((total, p) => total + (p.questions ? p.questions.length : 0), 0)} câu hỏi</span>
                </div>
                <div className="stat-item">
                  <Clock size={20} />
                  <span>{formatTime(timeSpent)}</span>
                </div>
                <div className="stat-item">
                  <Star size={20} />
                  <span>{score}/100 điểm</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Score Display */}
        {isCompleted && (
          <div className="score-display">
            <div className="score-header">
              <Award size={24} />
              <h3>Kết quả của bạn</h3>
            </div>
            <div className="score-content">
              <div className="score-circle">
                <span className="score-number">{score}</span>
                <span className="score-label">điểm</span>
              </div>
              <div className="score-details">
                <p>Thời gian: {formatTime(timeSpent)}</p>
                <p>Câu đúng: {Math.round((score / 100) * readingData.passage.paragraphs.reduce((total, p) => total + (p.questions ? p.questions.length : 0), 0))}/{readingData.passage.paragraphs.reduce((total, p) => total + (p.questions ? p.questions.length : 0), 0)}</p>
                <div className="score-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.floor(score / 20) ? 'filled' : 'empty'}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingExercise;
