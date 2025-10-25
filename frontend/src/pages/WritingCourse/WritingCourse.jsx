import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Send, RotateCcw, Clock, FileText, 
  Target, Award, BookOpen, HelpCircle, AlertTriangle,
  CheckCircle, XCircle, Edit3, Type, BarChart3
} from 'lucide-react';
import './WritingCourse.css';

const WritingCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  
  const [essay, setEssay] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Dữ liệu mô phỏng cho khóa học Writing
  const writingData = {
    id: courseId || 'writing-001',
    title: courseId === 'g3_writing' ? 'Writing Cơ Bản Plus 2' : 'Essay Writing Mastery',
    level: courseId === 'g3_writing' ? 'Pre-Intermediate' : 'Intermediate',
    duration: courseId === 'g3_writing' ? '30 minutes' : '45 minutes',
    wordLimit: courseId === 'g3_writing' ? 200 : 350,
    lessons: courseId === 'g3_writing' ? [
      {
        id: 1,
        title: 'My Favorite Animal',
        question: {
          number: 1,
          instruction: 'Write a short paragraph about your favorite animal',
          topic: 'What is your favorite animal? Why do you like it? Describe what it looks like and what it can do.',
          note: 'Write 3-4 sentences about your favorite animal.'
        },
        requirements: {
          wordLimit: 200,
          timeLimit: 30,
          focus: 'Simple paragraph'
        },
        tips: [
          'Start with "My favorite animal is..."',
          'Describe what the animal looks like',
          'Tell why you like this animal',
          'Use simple words and short sentences'
        ],
        sampleStructure: {
          topicSentence: 'My favorite animal is a dog.',
          supportingPoints: [
            'Dogs are friendly and loyal',
            'They can be trained to do tricks',
            'They make good pets for families'
          ],
          conclusion: 'That is why I like dogs the most.'
        }
      }
    ] : [
      {
        id: 1,
        title: 'Traffic and Transportation Essay',
        question: {
          number: 1,
          instruction: 'Write a body paragraph to answer this question below',
          topic: 'The best way to solve the traffic and transportation problem is to encourage people to live in cities rather than suburbs or countryside. Do you agree or disagree?',
          note: 'You do not need to write the Introduction or conclusion to this essay.'
        },
        requirements: {
          wordLimit: 350,
          timeLimit: 45,
          focus: 'Body paragraph only'
        },
        tips: [
          'Start with a clear topic sentence that states your position',
          'Provide 2-3 supporting arguments with examples',
          'Use transition words to connect your ideas',
          'End with a concluding sentence that reinforces your main point'
        ],
        sampleStructure: {
          topicSentence: 'I agree/disagree that encouraging urban living is the best solution to traffic problems because...',
          supportingPoints: [
            'Urban living reduces commuting distances',
            'Better public transportation in cities',
            'More efficient use of resources'
          ],
          conclusion: 'Therefore, urban living offers the most effective approach to solving traffic issues.'
        }
      }
    ]
  };

  const currentLesson = writingData.lessons[0];

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Word and sentence counting
  useEffect(() => {
    const text = essay.trim();
    const words = text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
    const sentences = text ? text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length : 0;
    
    setWordCount(words);
    setSentenceCount(sentences);
  }, [essay]);

  const handleEssayChange = (e) => {
    setEssay(e.target.value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success message
    alert('Bài viết đã được lưu thành công!');
  };

  const handleSubmit = () => {
    if (wordCount < 50) {
      alert('Bài viết quá ngắn. Vui lòng viết ít nhất 50 từ.');
      return;
    }
    
    if (wordCount > currentLesson.requirements.wordLimit) {
      alert(`Bài viết vượt quá giới hạn ${currentLesson.requirements.wordLimit} từ.`);
      return;
    }

    setIsSubmitted(true);
    alert('Bài viết đã được nộp thành công! Kết quả sẽ được chấm bởi AI chấm bài.');
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ bài viết?')) {
      setEssay('');
      setIsSubmitted(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordCountColor = () => {
    const percentage = (wordCount / currentLesson.requirements.wordLimit) * 100;
    if (percentage < 50) return '#ef4444';
    if (percentage < 80) return '#f59e0b';
    if (percentage <= 100) return '#10b981';
    return '#ef4444';
  };

  const isWordLimitExceeded = wordCount > currentLesson.requirements.wordLimit;

  return (
    <div className="writing-course">
      {/* Header */}
      <div className="writing-header">
        <div className="header-left">
          <button 
            className="back-btn"
            onClick={() => navigate('/lessons')}
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <div className="course-info">
            <h1>{writingData.title}</h1>
            <div className="course-meta">
              <span className="level">{writingData.level}</span>
              <span className="duration">
                <Clock size={16} />
                {writingData.duration}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <div className="time-display">
            <Clock size={16} />
            {formatTime(timeSpent)}
          </div>
          <div className="word-limit-info">
            <Target size={16} />
            {wordCount}/{currentLesson.requirements.wordLimit} từ
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="writing-content">
        {/* Left Panel - Question and Instructions */}
        <div className="writing-panel-left">
          <div className="question-section">
            <div className="question-header">
              <div className="question-number">
                <HelpCircle size={20} />
                <span>Question {currentLesson.question.number}</span>
              </div>
            </div>

            <div className="question-content">
              <p className="instruction">{currentLesson.question.instruction}</p>
              
              <div className="question-topic">
                <p className="topic-text">{currentLesson.question.topic}</p>
                <div className="question-note">
                  <span className="note-number">1</span>
                </div>
              </div>

              <div className="additional-note">
                <p>{currentLesson.question.note}</p>
              </div>
            </div>
          </div>

          {/* Writing Tips */}
          <div className="tips-section">
            <h3>Writing Tips</h3>
            <ul className="tips-list">
              {currentLesson.tips.map((tip, index) => (
                <li key={index} className="tip-item">
                  <CheckCircle size={16} />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sample Structure */}
          <div className="structure-section">
            <h3>Sample Structure</h3>
            <div className="structure-content">
              <div className="structure-item">
                <strong>Topic Sentence:</strong>
                <p>{currentLesson.sampleStructure.topicSentence}</p>
              </div>
              <div className="structure-item">
                <strong>Supporting Points:</strong>
                <ul>
                  {currentLesson.sampleStructure.supportingPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
              <div className="structure-item">
                <strong>Conclusion:</strong>
                <p>{currentLesson.sampleStructure.conclusion}</p>
              </div>
            </div>
          </div>

          {/* AI Assistant */}
          <div className="ai-assistant">
            <div className="assistant-avatar">
              <div className="ai-icon">🤖</div>
              <div className="assistant-name">AI chấm bài</div>
            </div>
            <div className="assistant-message">
              <p>Need help with your essay? I can provide feedback and suggestions!</p>
              <button 
                className="help-btn"
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle size={16} />
                {showHelp ? 'Hide Help' : 'Get Help'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Writing Area */}
        <div className="writing-panel-right">
          <div className="writing-header-right">
            <h2>Bài viết của bạn</h2>
            <div className="writing-stats">
              <div className="stat-item">
                <FileText size={16} />
                <span>{wordCount} từ</span>
              </div>
              <div className="stat-item">
                <Type size={16} />
                <span>{sentenceCount} câu</span>
              </div>
            </div>
          </div>

          <div className="writing-area">
            <textarea
              ref={textareaRef}
              value={essay}
              onChange={handleEssayChange}
              placeholder="Nhập bài viết của bạn..."
              className={`essay-textarea ${isWordLimitExceeded ? 'exceeded' : ''}`}
              disabled={isSubmitted}
            />
            
            <div className="word-counter">
              <span 
                className="word-count"
                style={{ color: getWordCountColor() }}
              >
                {wordCount} từ
              </span>
              <span className="word-limit">/ {currentLesson.requirements.wordLimit} từ</span>
            </div>
          </div>

          <div className="word-limit-notice">
            <AlertTriangle size={16} />
            <span>Giới hạn bài viết là {currentLesson.requirements.wordLimit} từ</span>
          </div>

          <div className="policy-notice">
            <p>
              Để đánh giá chính xác kết quả học tập của học viên, Prep không hỗ trợ việc sử dụng trợ giúp từ AI hoặc đạo văn dưới bất kỳ hình thức nào. 
              Nếu phát hiện vi phạm, Prep rất tiếc sẽ không chấm điểm cho bài nộp này.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving || isSubmitted}
            >
              <Save size={20} />
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </button>

            <button 
              className="reset-btn"
              onClick={handleReset}
              disabled={isSubmitted}
            >
              <RotateCcw size={20} />
              Xóa
            </button>

            <button 
              className={`submit-btn ${isSubmitted ? 'submitted' : ''}`}
              onClick={handleSubmit}
              disabled={isSubmitted || wordCount < 50 || isWordLimitExceeded}
            >
              {isSubmitted ? (
                <>
                  <CheckCircle size={20} />
                  Đã nộp
                </>
              ) : (
                <>
                  <Send size={20} />
                  Nộp bài
                </>
              )}
            </button>
          </div>

          {/* Progress Stats */}
          <div className="progress-stats">
            <h4>Tiến độ của bạn</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <FileText size={20} />
                <div className="stat-info">
                  <span className="stat-value">{wordCount}</span>
                  <span className="stat-label">Từ đã viết</span>
                </div>
              </div>
              <div className="stat-item">
                <Clock size={20} />
                <div className="stat-info">
                  <span className="stat-value">{formatTime(timeSpent)}</span>
                  <span className="stat-label">Thời gian</span>
                </div>
              </div>
              <div className="stat-item">
                <Target size={20} />
                <div className="stat-info">
                  <span className="stat-value">{Math.round((wordCount / currentLesson.requirements.wordLimit) * 100)}%</span>
                  <span className="stat-label">Hoàn thành</span>
                </div>
              </div>
              <div className="stat-item">
                <Award size={20} />
                <div className="stat-info">
                  <span className="stat-value">{isSubmitted ? 'Đã nộp' : 'Chưa nộp'}</span>
                  <span className="stat-label">Trạng thái</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="help-modal">
          <div className="help-content">
            <div className="help-header">
              <h3>Writing Help</h3>
              <button 
                className="close-help"
                onClick={() => setShowHelp(false)}
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="help-body">
              <h4>Essay Structure Guide:</h4>
              <ol>
                <li><strong>Topic Sentence:</strong> State your position clearly</li>
                <li><strong>Supporting Arguments:</strong> Provide 2-3 reasons with examples</li>
                <li><strong>Evidence:</strong> Use specific examples or data</li>
                <li><strong>Conclusion:</strong> Restate your main point</li>
              </ol>
              <h4>Useful Phrases:</h4>
              <ul>
                <li>I believe that...</li>
                <li>Furthermore, ...</li>
                <li>For example, ...</li>
                <li>In conclusion, ...</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingCourse;
