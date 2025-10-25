import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, RotateCcw, 
  CheckCircle, XCircle, Clock, BookOpen, Target, Award,
  ChevronRight, ChevronLeft, Eye, EyeOff, HelpCircle
} from 'lucide-react';
import './ReadingCourse.css';

const ReadingCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [currentLesson, setCurrentLesson] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  // Dữ liệu mô phỏng cho bài học Reading
  const readingData = {
    id: courseId || 'g3_reading',
    title: courseId === 'g3_reading' ? 'Grade 3 Reading Comprehension' : 'Traffic Congestion: A Global Problem',
    level: courseId === 'g3_reading' ? 'Grade 3' : 'Intermediate',
    duration: '15 minutes',
    lessons: courseId === 'g3_reading' ? [
      {
        id: 1,
        title: 'Geography Quiz - Vietnam',
        paragraphs: [
          {
            id: 'A',
            content: 'Vietnam is a beautiful country in Southeast Asia. It has a long coastline along the South China Sea and shares borders with China, Laos, and Cambodia. The country is known for its rich history, delicious food, and friendly people.',
            heading: 'About Vietnam'
          },
          {
            id: 'B', 
            content: 'Hanoi is the capital city of Vietnam. It is located in the northern part of the country and has been the capital for over 1000 years. Hanoi is famous for its ancient temples, beautiful lakes, and traditional architecture.',
            heading: 'The Capital City'
          },
          {
            id: 'C',
            content: 'Ho Chi Minh City, also known as Saigon, is the largest city in Vietnam. It is located in the south and is the economic center of the country. Many people visit this city for business and tourism.',
            heading: 'The Largest City'
          },
          {
            id: 'D',
            content: 'Vietnam has many other important cities like Da Nang, Hue, and Can Tho. Each city has its own special characteristics and attractions that make Vietnam a diverse and interesting country to visit.',
            heading: 'Other Cities'
          }
        ],
        exercise: {
          type: 'multiple-choice',
          instruction: 'What is the capital of Vietnam?',
          question: 'What is the capital of Vietnam?',
          options: [
            { id: 1, text: 'Hanoi' },
            { id: 2, text: 'Ho Chi Minh City' },
            { id: 3, text: 'Da Nang' },
            { id: 4, text: 'Hue' }
          ],
          correctAnswer: 1
        },
        image: {
          url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          alt: 'Hanoi, the capital of Vietnam'
        },
        audio: {
          url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
          duration: 180
        }
      }
    ] : [
      {
        id: 1,
        title: 'Understanding Traffic Problems',
        paragraphs: [
          {
            id: 'A',
            content: 'Traffic congestion has become one of the most pressing issues in urban areas worldwide. Cities like New York, London, Tokyo, and Mumbai face daily gridlocks that waste millions of hours and gallons of fuel. The problem affects not only commuters but also the economy, environment, and quality of life in these metropolitan areas.',
            heading: 'A global problem'
          },
          {
            id: 'B', 
            content: 'Several factors contribute to traffic congestion. Rapid urbanization has led to more people living in cities, increasing the number of vehicles on the road. Poor urban planning often results in inadequate road infrastructure that cannot handle the growing traffic volume. Additionally, the lack of efficient public transportation systems forces more people to rely on private vehicles.',
            heading: 'Causes of congestion'
          },
          {
            id: 'C',
            content: 'The economic impact of traffic congestion is staggering. Studies show that traffic jams cost the U.S. economy over $160 billion annually in lost productivity and wasted fuel. Workers spend hours stuck in traffic instead of being productive, while businesses face increased costs for goods transportation. The environmental cost is equally concerning, with increased emissions from idling vehicles.',
            heading: 'Economic consequences'
          },
          {
            id: 'D',
            content: 'Technology offers promising solutions to combat traffic congestion. Smart traffic management systems use real-time data to optimize traffic flow and reduce bottlenecks. Autonomous vehicles could potentially reduce accidents and improve traffic efficiency. Ride-sharing apps and carpooling services help reduce the number of vehicles on the road.',
            heading: 'Technological solutions'
          },
          {
            id: 'E',
            content: 'Governments and city planners are implementing various strategies to address traffic congestion. These include expanding public transportation networks, building more bike lanes, implementing congestion pricing, and promoting telecommuting. Some cities have also invested in smart city technologies to better manage urban mobility and reduce traffic problems.',
            heading: 'Government initiatives'
          }
        ],
        exercise: {
          type: 'matching',
          instruction: 'Read and match the following headings with paragraphs A-E',
          headings: [
            { id: 1, text: 'A global problem' },
            { id: 2, text: 'Causes of congestion' },
            { id: 3, text: 'Economic consequences' },
            { id: 4, text: 'Technological solutions' },
            { id: 5, text: 'Government initiatives' }
          ],
          correctAnswers: {
            'A': 1,
            'B': 2, 
            'C': 3,
            'D': 4,
            'E': 5
          }
        },
        image: {
          url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
          alt: 'Traffic congestion in a busy city'
        },
        audio: {
          url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
          duration: 180
        }
      }
    ]
  };

  const currentLessonData = readingData.lessons[currentLesson];

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAnswerSelect = (paragraphId, headingId) => {
    setUserAnswers(prev => ({
      ...prev,
      [paragraphId]: headingId
    }));
  };

  const checkAnswers = () => {
    if (currentLessonData.exercise.type === 'multiple-choice') {
      const isCorrect = userAnswers['question'] === currentLessonData.exercise.correctAnswer;
      const newScore = isCorrect ? 100 : 0;
      setScore(newScore);
    } else {
      const correctAnswers = currentLessonData.exercise.correctAnswers;
      let correctCount = 0;
      
      Object.keys(correctAnswers).forEach(paragraphId => {
        if (userAnswers[paragraphId] === correctAnswers[paragraphId]) {
          correctCount++;
        }
      });
      
      const newScore = Math.round((correctCount / Object.keys(correctAnswers).length) * 100);
      setScore(newScore);
    }
    
    setShowAnswers(true);
  };

  const resetExercise = () => {
    setUserAnswers({});
    setScore(0);
    setShowAnswers(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnswerStatus = (paragraphId, headingId) => {
    if (!showAnswers) return 'pending';
    const correctAnswer = currentLessonData.exercise.correctAnswers[paragraphId];
    if (userAnswers[paragraphId] === headingId) {
      return headingId === correctAnswer ? 'correct' : 'incorrect';
    }
    return headingId === correctAnswer ? 'correct-unselected' : 'neutral';
  };

  return (
    <div className="reading-course">
      {/* Header */}
      <div className="reading-header">
        <div className="header-left">
          <button 
            className="back-btn"
            onClick={() => navigate('/lessons')}
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <div className="course-info">
            <h1>{readingData.title}</h1>
            <div className="course-meta">
              <span className="level">{readingData.level}</span>
              <span className="duration">
                <Clock size={16} />
                {readingData.duration}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <div className="time-display">
            <Clock size={16} />
            {formatTime(timeSpent)}
          </div>
          <div className="progress-indicator">
            <span>{currentLesson + 1}/{readingData.lessons.length}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="reading-content">
        {/* Left Panel - Reading Content */}
        <div className="reading-panel-left">
          <div className="lesson-header">
            <h2>{currentLessonData.title}</h2>
            <div className="lesson-controls">
              <button 
                className="audio-btn"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button 
                className="mute-btn"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
          </div>

          {/* Reading Text */}
          <div className="reading-text">
            {currentLessonData.paragraphs.map(paragraph => (
              <div key={paragraph.id} className="paragraph">
                <div className="paragraph-label">Paragraph {paragraph.id}</div>
                <div className="paragraph-content">
                  {paragraph.content}
                </div>
              </div>
            ))}
          </div>

          {/* Exercise Section */}
          <div className="exercise-section">
            <div className="exercise-header">
              <h3>Exercise</h3>
              <div className="exercise-controls">
                <button 
                  className="show-answers-btn"
                  onClick={() => setShowAnswers(!showAnswers)}
                >
                  {showAnswers ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showAnswers ? 'Hide Answers' : 'Show Answers'}
                </button>
                <button 
                  className="reset-btn"
                  onClick={resetExercise}
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
              </div>
            </div>

            <div className="exercise-instruction">
              <p>{currentLessonData.exercise.instruction}</p>
            </div>

            {/* Exercise Content */}
            {currentLessonData.exercise.type === 'multiple-choice' ? (
              <div className="multiple-choice-exercise">
                <div className="question-container">
                  <h4 className="question-title">{currentLessonData.exercise.question}</h4>
                  <div className="options-grid">
                    {currentLessonData.exercise.options.map(option => (
                      <button
                        key={option.id}
                        className={`option-btn ${
                          userAnswers['question'] === option.id ? 'selected' : ''
                        } ${
                          showAnswers
                            ? option.id === currentLessonData.exercise.correctAnswer
                              ? 'correct'
                              : userAnswers['question'] === option.id
                              ? 'incorrect'
                              : ''
                            : ''
                        }`}
                        onClick={() => handleAnswerSelect('question', option.id)}
                        disabled={showAnswers}
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="matching-exercise">
                {currentLessonData.paragraphs.map(paragraph => (
                  <div key={paragraph.id} className="paragraph-match">
                    <div className="paragraph-section">
                      <div className="paragraph-header">
                        <span className="paragraph-id">Paragraph {paragraph.id}</span>
                        <div className="answer-status">
                          {showAnswers && userAnswers[paragraph.id] && (
                            userAnswers[paragraph.id] === currentLessonData.exercise.correctAnswers[paragraph.id] ? (
                              <CheckCircle size={20} className="status-correct" />
                            ) : (
                              <XCircle size={20} className="status-incorrect" />
                            )
                          )}
                        </div>
                      </div>
                      <div className="paragraph-text">
                        {paragraph.content.substring(0, 100)}...
                      </div>
                    </div>
                    
                    <div className="heading-options">
                      {currentLessonData.exercise.headings.map(heading => (
                        <button
                          key={heading.id}
                          className={`heading-option ${getAnswerStatus(paragraph.id, heading.id)} ${
                            userAnswers[paragraph.id] === heading.id ? 'selected' : ''
                          }`}
                          onClick={() => handleAnswerSelect(paragraph.id, heading.id)}
                          disabled={showAnswers}
                        >
                          <span className="heading-number">{heading.id}</span>
                          <span className="heading-text">{heading.text}</span>
                          {showAnswers && heading.id === currentLessonData.exercise.correctAnswers[paragraph.id] && (
                            <CheckCircle size={16} className="correct-indicator" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Section */}
            <div className="submit-section">
              <button 
                className="submit-btn"
                onClick={checkAnswers}
                disabled={Object.keys(userAnswers).length === 0}
              >
                <Target size={20} />
                Check Answers
              </button>
              
              {showAnswers && (
                <div className="score-display">
                  <div className="score-circle">
                    <span className="score-number">{score}</span>
                    <span className="score-label">%</span>
                  </div>
                  <div className="score-message">
                    {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good job!' : 'Keep practicing!'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Visual Content */}
        <div className="reading-panel-right">
          <div className="visual-content">
            <div className="image-container">
              <img 
                src={currentLessonData.image.url} 
                alt={currentLessonData.image.alt}
                className="lesson-image"
              />
              <div className="image-overlay">
                <div className="image-caption">
                  <h4>Traffic Congestion</h4>
                  <p>Heavy traffic in a busy metropolitan area</p>
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="ai-assistant">
              <div className="assistant-avatar">
                <div className="bee-icon">🤖</div>
                <div className="assistant-name">AI chấm bài</div>
              </div>
              <div className="assistant-message">
                <p>Need help with this reading? I can explain difficult words or concepts!</p>
                <button className="help-btn">
                  <HelpCircle size={16} />
                  Ask for help
                </button>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="progress-stats">
              <h4>Your Progress</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <BookOpen size={20} />
                  <div className="stat-info">
                    <span className="stat-value">1</span>
                    <span className="stat-label">Lessons</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Target size={20} />
                  <div className="stat-info">
                    <span className="stat-value">{score}%</span>
                    <span className="stat-label">Score</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Clock size={20} />
                  <div className="stat-info">
                    <span className="stat-value">{formatTime(timeSpent)}</span>
                    <span className="stat-label">Time</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Award size={20} />
                  <div className="stat-info">
                    <span className="stat-value">0</span>
                    <span className="stat-label">Streak</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="reading-footer">
        <button 
          className="nav-btn prev-btn"
          disabled={currentLesson === 0}
          onClick={() => setCurrentLesson(prev => Math.max(0, prev - 1))}
        >
          <ChevronLeft size={20} />
          Previous
        </button>
        
        <div className="lesson-indicator">
          <span>Lesson {currentLesson + 1} of {readingData.lessons.length}</span>
        </div>
        
        <button 
          className="nav-btn next-btn"
          disabled={currentLesson === readingData.lessons.length - 1}
          onClick={() => setCurrentLesson(prev => Math.min(readingData.lessons.length - 1, prev + 1))}
        >
          Next
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ReadingCourse;
