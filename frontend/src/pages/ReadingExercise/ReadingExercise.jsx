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
  Loader,
  AlertCircle
} from 'lucide-react';
import './ReadingExercise.css';
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

  // Load data from API
  const [readingData, setReadingData] = useState({
    id: lessonId || '1',
    title: 'Loading...',
    courseTitle: 'Reading Học bài',
    difficulty: 'Beginner',
    estimatedTime: 15,
    totalQuestions: 0,
    passage: {
      title: 'Loading...',
      subtitle: '',
      paragraphs: []
    }
  });
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Load unit data from API
  useEffect(() => {
    const loadUnitData = async () => {
      if (!lessonId) return;
      
      setApiLoading(true);
      try {
        const questions = await coursesAPI.getQuestions(lessonId);
        
        if (!questions || questions.length === 0) {
          setApiError('Bài học chưa có câu hỏi');
          return;
        }

        // Get passage text from first question's prompt (teacher should put passage in first question)
        const passageText = questions[0]?.media_url || questions[0]?.prompt || 'No passage provided';

        // Convert questions to the format expected by the UI
        const formattedQuestions = questions.map((q, index) => ({
          id: q.id,
          type: 'multiple-choice',
          instruction: q.prompt,
          options: q.options || [],
          correctAnswer: q.answer?.correct || 0
        }));

        setReadingData({
          id: lessonId,
          title: `Reading Unit ${lessonId}`,
          courseTitle: 'Reading Học bài',
          difficulty: 'Beginner',
          estimatedTime: questions.length * 2,
          totalQuestions: questions.length,
          passage: {
            title: 'Reading Passage',
            subtitle: '',
            paragraphs: [
              {
                id: 'A',
                content: passageText,
                heading: 'Reading Passage',
                questions: formattedQuestions
              }
            ]
          }
        });
      } catch (error) {
        console.error('Error loading reading unit:', error);
        setApiError(error?.detail || 'Không thể tải bài học');
      } finally {
        setApiLoading(false);
      }
    };
    
    loadUnitData();
  }, [lessonId]);

  // OLD MOCK DATA BELOW - keeping structure for reference
  const oldMockData = {
    passage: {
      title: 'The rainmakers',
      subtitle: 'Science and technology work with nature to bring rain when and where it is needed.',
      paragraphs: [
        {
          id: 'A',
          content: 'Gang Liu, a wheat farmer in Luohe, China, was worried. His crops were failing because there was no rain. But then scientists fired silver iodide (AgI) into the clouds using rockets. This process, called cloud seeding, makes moisture drops turn into ice. The ice falls as rain. Gang Liu\'s wheat was saved.',
          heading: 'A worried farmer',
          questions: [
            {
              id: 1,
              type: 'matching',
              instruction: 'Match the heading with paragraph A',
              options: [
                { id: 1, text: 'A worried farmer' },
                { id: 2, text: 'Questions about effectiveness' },
                { id: 3, text: 'Research and technology' },
                { id: 4, text: 'Future possibilities' },
                { id: 5, text: 'Challenges ahead' }
              ],
              correctAnswer: 1
            }
          ]
        },
        {
          id: 'B',
          content: 'But does cloud seeding really work? Some experts think it might just be a coincidence when it rains after seeding. They say we don\'t know how effective it is because rain might have happened naturally anyway. Despite this, more than 150 weather-modifying projects are happening in over 40 countries. Not all are for making rain. In the USA, microwaves are used to prevent tornadoes. In Russia, they make sure there\'s sunshine for national events.',
          heading: 'Questions about effectiveness',
          questions: [
            {
              id: 2,
              type: 'multiple-choice',
              instruction: 'What is cloud seeding?',
              options: [
                'A process that makes clouds disappear',
                'A technique that uses silver iodide to make rain',
                'A method to prevent all rain',
                'A way to control tornadoes'
              ],
              correctAnswer: 1
            },
            {
              id: 3,
              type: 'multiple-choice',
              instruction: 'How many weather-modifying projects are happening worldwide?',
              options: [
                'More than 50',
                'More than 100',
                'More than 150',
                'More than 200'
              ],
              correctAnswer: 2
            }
          ]
        },
        {
          id: 'C',
          content: 'Rainmaking dominates research programs. They often use trials with seeded and unseeded clouds. Arlen Huggins from the Desert Research Institute is leading a project in Australia. He says advanced weather-monitoring technology lets them measure human impact on weather better. His team\'s findings are promising. They suggest cloud seeding works. There are two years left on their six-year project.',
          heading: 'Research and technology',
          questions: [
            {
              id: 4,
              type: 'multiple-choice',
              instruction: 'What technology is mentioned for future weather modification?',
              options: [
                'Virtual reality',
                'Artificial intelligence',
                'Blockchain',
                'Quantum computing'
              ],
              correctAnswer: 1
            }
          ]
        },
        {
          id: 'D',
          content: 'The future of weather modification looks bright. New technologies are being developed to make cloud seeding more precise and effective. Scientists are using artificial intelligence to predict the best times and places for seeding. This could help farmers like Gang Liu around the world.',
          heading: 'Future possibilities',
          questions: [
            {
              id: 4,
              type: 'multiple-choice',
              instruction: 'What technology is mentioned for improving cloud seeding?',
              options: [
                'Artificial intelligence',
                'Robots',
                'Satellites',
                'Drones'
              ],
              correctAnswer: 0
            },
            {
              id: 5,
              type: 'multiple-choice',
              instruction: 'Who could benefit from improved weather modification?',
              options: [
                'Only scientists',
                'Only farmers in China',
                'Farmers around the world',
                'Only government officials'
              ],
              correctAnswer: 2
            }
          ]
        },
        {
          id: 'E',
          content: 'However, there are still challenges. Weather modification requires careful planning and international cooperation. Different countries have different rules about changing the weather. Some people worry about the environmental effects. More research is needed to understand the long-term impacts.',
          heading: 'Challenges ahead',
          questions: [
            {
              id: 6,
              type: 'multiple-choice',
              instruction: 'What is one challenge mentioned about weather modification?',
              options: [
                'It\'s too expensive',
                'It requires international cooperation',
                'It doesn\'t work at all',
                'It\'s too simple'
              ],
              correctAnswer: 1
            }
          ]
        }
      ]
    }
  };

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

  // Handle answer selection (legacy)
  const handleAnswerSelect = (questionId, answerId) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  // Handle paragraph matching (legacy)
  const handleParagraphMatch = (paragraphId, headingId) => {
    setUserAnswers(prev => ({
      ...prev,
      [`paragraph_${paragraphId}`]: headingId
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
  const handleComplete = () => {
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
  if (apiLoading) {
    return (
      <div className="reading-exercise-page">
        <div className="reading-header">
          <button className="back-btn reading-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>
        <div className="reading-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader className="animate-spin" size={48} style={{ margin: '0 auto 16px' }} />
            <h2>Đang tải bài học...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (apiError) {
    return (
      <div className="reading-exercise-page">
        <div className="reading-header">
          <button className="back-btn reading-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>
        <div className="reading-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h2>{apiError}</h2>
            <button onClick={() => navigate(-1)} style={{ marginTop: '16px' }}>
              Quay lại
            </button>
          </div>
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
        {readingData.passage.paragraphs.map((paragraph, paragraphIndex) => (
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
