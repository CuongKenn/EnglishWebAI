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
  AlertCircle
} from 'lucide-react';
import './WritingExercise.css';

const WritingExercise = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [userEssay, setUserEssay] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Mock data cho bài writing - sẽ được thay thế bằng API call
  const writingData = {
    id: lessonId || '1',
    title: 'Writing Unit 1',
    courseTitle: 'Writing Lớp 3',
    difficulty: 'Beginner',
    estimatedTime: 30, // minutes
    wordLimit: 350,
    currentQuestion: 1,
    totalQuestions: 1,
    question: {
      id: 1,
      type: 'essay',
      instruction: 'Write a body paragraph to answer this question below',
      prompt: 'The best way to solve the traffic and transportation problem is to encourage people to live in cities rather than suburbs or countryside. Do you agree or disagree?',
      additionalInstruction: 'You do not need to write the Introduction or conclusion to this essay.',
      wordLimit: 350,
      gradingCriteria: [
        'Content and Ideas (40%)',
        'Organization and Structure (25%)',
        'Language Use (25%)',
        'Mechanics (10%)'
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
        setTimeout(() => setIsSaved(false), 2000);
      }
    }, 3000);

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

  // Submit essay
  const submitEssay = () => {
    if (wordCount < 50) {
      alert('Bài viết phải có ít nhất 50 từ');
      return;
    }
    
    setIsCompleted(true);
    // TODO: API call to submit essay
    console.log('Essay submitted:', userEssay);
  };

  // Reset exercise
  const resetExercise = () => {
    setUserEssay('');
    setIsCompleted(false);
    setTimeSpent(0);
  };

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
            <div className="question-number">
              <span className="question-label">Question {writingData.currentQuestion}</span>
              <div className="question-icon">
                <FileText size={20} />
              </div>
            </div>

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
                <div className="grading-criteria">
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
                Để đánh giá chính xác kết quả học tập của học viên, Prep không hỗ trợ việc sử dụng trợ giúp từ AI hoặc đạo văn dưới bất kỳ hình thức nào. 
                Nếu phát hiện vi phạm, Prep rất tiếc sẽ không chấm điểm cho bài nộp này.
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
            disabled={isCompleted || wordCount < 50}
          >
            <Target size={16} />
            {isCompleted ? 'Đã nộp bài' : 'Nộp bài'}
          </button>
        </div>
      </div>

      {/* Completion Message */}
      {isCompleted && (
        <div className="completion-message">
          <div className="completion-content">
            <Award size={32} />
            <h3>Chúc mừng!</h3>
            <p>Bạn đã hoàn thành bài viết thành công.</p>
            <div className="completion-stats">
              <div className="stat-item">
                <BookOpen size={20} />
                <span>{wordCount} từ</span>
              </div>
              <div className="stat-item">
                <Clock size={20} />
                <span>{formatTime(timeSpent)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingExercise;
