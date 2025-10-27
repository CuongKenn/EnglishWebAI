import React, { useState, useEffect, useRef } from 'react';
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
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  SkipBack,
  SkipForward,
  Headphones
} from 'lucide-react';
import './ListeningExercise.css';

const ListeningExercise = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  // State management
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [notes, setNotes] = useState({});
  const [showHint, setShowHint] = useState(false);

  // Refs
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Mock data cho bài listening - sẽ được thay thế bằng API call
  const listeningData = {
    id: lessonId || '1',
    title: 'Listening Unit 1',
    courseTitle: 'Listening Học bài',
    difficulty: 'Beginner',
    estimatedTime: 15, // minutes
    totalQuestions: 5,
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Mock audio URL
    duration: 148, // seconds
    questions: [
      {
        id: 1,
        question: "When are the experimental areas closed to the public?",
        options: [
          "All the year round",
          "Almost all the year",
          "A short time every year"
        ],
        correctAnswer: 2,
        explanation: "The experimental areas are closed for only a short time every year for maintenance."
      },
      {
        id: 2,
        question: "How can you move around the park?",
        options: [
          "By tram, walking or bicycle",
          "By solar car or bicycle",
          "By bicycle, walking or bus"
        ],
        correctAnswer: 0,
        explanation: "Visitors can move around the park by tram, walking, or bicycle."
      },
      {
        id: 3,
        question: "The rare breed animals kept in the park include",
        options: [
          "Lions and tigers",
          "Elephants and giraffes",
          "Endangered species from local area"
        ],
        correctAnswer: 2,
        explanation: "The park focuses on keeping rare breed animals that are endangered species from the local area."
      },
      {
        id: 4,
        question: "What is the main purpose of the visitor center?",
        options: [
          "To sell souvenirs",
          "To provide information about the park",
          "To house the animals"
        ],
        correctAnswer: 1,
        explanation: "The visitor center's main purpose is to provide information about the park to visitors."
      },
      {
        id: 5,
        question: "How often are guided tours available?",
        options: [
          "Every hour",
          "Twice daily",
          "Only on weekends"
        ],
        correctAnswer: 0,
        explanation: "Guided tours are available every hour for visitors."
      }
    ]
  };

  // Mock results data - sẽ được thay thế bằng API response
  const mockResults = {
    score: 80,
    totalQuestions: listeningData.totalQuestions,
    correctAnswers: 4,
    incorrectAnswers: 1,
    timeSpent: timeSpent,
    detailedResults: listeningData.questions.map(q => ({
      questionId: q.id,
      question: q.question,
      userAnswer: selectedAnswers[q.id],
      correctAnswer: q.correctAnswer,
      isCorrect: selectedAnswers[q.id] === q.correctAnswer,
      explanation: q.explanation
    }))
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setAudioProgress(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio controls
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioDuration, audioRef.current.currentTime + 10);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
      } else {
        audioRef.current.volume = 0;
      }
      setIsMuted(!isMuted);
    }
  };

  const handleProgressClick = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * audioDuration;
      audioRef.current.currentTime = newTime;
    }
  };

  // Answer handling
  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNoteChange = (questionId, optionIndex, note) => {
    setNotes(prev => ({
      ...prev,
      [`${questionId}_${optionIndex}`]: note
    }));
  };

  // Submit exercise
  const submitExercise = () => {
    const answeredQuestions = Object.keys(selectedAnswers).length;
    if (answeredQuestions < listeningData.totalQuestions) {
      alert(`Vui lòng trả lời tất cả ${listeningData.totalQuestions} câu hỏi trước khi nộp bài`);
      return;
    }

    // TODO: API call to submit answers
    console.log('Submitting answers:', selectedAnswers);
    console.log('Notes:', notes);

    // Simulate API response
    setTimeout(() => {
      setShowResults(true);
      setIsCompleted(true);
    }, 2000);
  };

  // Reset exercise
  const resetExercise = () => {
    setCurrentQuestion(0);
    setIsPlaying(false);
    setIsCompleted(false);
    setShowResults(false);
    setSelectedAnswers({});
    setNotes({});
    setTimeSpent(0);
    setAudioProgress(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const currentQuestionData = listeningData.questions[currentQuestion];

  return (
    <div className="listening-exercise-page">
      {/* Header */}
      <div className="listening-header">
        <div className="header-left">
          <button
            className="listening-back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>

        <div className="course-info">
          <h1 className="course-title">{listeningData.courseTitle}</h1>
          <p className="course-subtitle">{listeningData.title}</p>
        </div>

        <div className="header-right">
          <div className="timer-info">
            <Clock size={16} />
            <span>{formatTime(timeSpent)}</span>
          </div>
          <div className="difficulty-badge">
            {listeningData.difficulty}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="listening-content">
        {/* Instructions */}
        <div className="instructions-section">
          <div className="instructions-header">
            <h2 className="instructions-title">
              Exercise {currentQuestion + 1}: Nghe và chọn đáp án đúng để trả lời cho các câu hỏi sau
            </h2>
            <div className="instructions-controls">
              <button
                className="hint-btn"
                onClick={() => setShowHint(!showHint)}
              >
                <HelpCircle size={16} />
                Hint
              </button>
            </div>
          </div>

          <div className="instructions-content">
            <div className="instruction-text">
              <AlertCircle size={16} />
              <p>
                Lưu ý: Các bạn chú ý gạch chân keywords trong câu hỏi trước khi nghe,
                và take note vào ô trống bên cạnh từng đáp án trong quá trình nghe để làm bài một cách chính xác nhất nhé!
              </p>
            </div>

            {showHint && (
              <div className="hint-content">
                <div className="hint-header">
                  <AlertCircle size={16} />
                  <span>Gợi ý</span>
                </div>
                <div className="hint-tips">
                  <h4>Mẹo làm bài Listening:</h4>
                  <ul>
                    <li>Đọc kỹ câu hỏi trước khi nghe</li>
                    <li>Gạch chân các từ khóa quan trọng</li>
                    <li>Ghi chú nhanh khi nghe</li>
                    <li>Chú ý đến các từ đồng nghĩa và paraphrase</li>
                    <li>Kiểm tra lại đáp án sau khi nghe xong</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audio Player */}
        <div className="audio-player-section">
          <div className="audio-player">
            <div className="audio-controls">
              <button
                className="skip-btn"
                onClick={skipBackward}
                title="Lùi 10 giây"
              >
                <SkipBack size={20} />
                <span>10</span>
              </button>

              <button
                className="play-pause-btn"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} />}
              </button>

              <button
                className="skip-btn"
                onClick={skipForward}
                title="Tới 10 giây"
              >
                <SkipForward size={20} />
                <span>10</span>
              </button>
            </div>

            <div className="progress-container">
              <div className="time-display">
                <span>{formatTime(audioProgress)}</span>
              </div>
              <div
                className="progress-bar"
                onClick={handleProgressClick}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
                ></div>
              </div>
              <div className="time-display">
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

            <div className="volume-controls">
              <button
                className="volume-btn"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
              <button className="settings-btn">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="questions-section">
          {listeningData.questions.map((question, index) => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <div className="question-number">
                  <span>{question.id}</span>
                </div>
                <h3 className="question-text">{question.question}</h3>
              </div>

              <div className="options-container">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="option-item">
                    <div className="option-content">
                      <div className="option-letter">
                        <span>{String.fromCharCode(65 + optionIndex)}</span>
                      </div>
                      <div className="option-text">
                        <span>{option}</span>
                      </div>
                      <div className="option-radio">
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          id={`q${question.id}_${optionIndex}`}
                          checked={selectedAnswers[question.id] === optionIndex}
                          onChange={() => handleAnswerSelect(question.id, optionIndex)}
                        />
                        <label htmlFor={`q${question.id}_${optionIndex}`}></label>
                      </div>
                    </div>
                    <div className="note-section">
                      <textarea
                        placeholder="Ghi chú..."
                        value={notes[`${question.id}_${optionIndex}`] || ''}
                        onChange={(e) => handleNoteChange(question.id, optionIndex, e.target.value)}
                        className="note-textarea"
                        rows="2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Results Section */}
        {showResults && (
          <div className="results-section">
            <div className="results-header">
              <h3 className="results-title">Kết quả bài làm</h3>
              <div className="score-display">
                <span className="score-number">{mockResults.score}</span>
                <span className="score-label">/100</span>
              </div>
            </div>

            <div className="results-summary">
              <div className="summary-item correct">
                <CheckCircle size={20} />
                <span>{mockResults.correctAnswers} câu đúng</span>
              </div>
              <div className="summary-item incorrect">
                <AlertCircle size={20} />
                <span>{mockResults.incorrectAnswers} câu sai</span>
              </div>
              <div className="summary-item time">
                <Clock size={20} />
                <span>{formatTime(mockResults.timeSpent)}</span>
              </div>
            </div>

            <div className="detailed-results">
              <h4>Chi tiết từng câu hỏi:</h4>
              {mockResults.detailedResults.map((result, index) => (
                <div key={index} className={`result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="result-question">
                    <span className="result-number">{result.questionId}.</span>
                    <span className="result-text">{result.question}</span>
                  </div>
                  <div className="result-answer">
                    <span className="answer-label">Đáp án của bạn:</span>
                    <span className="answer-text">
                      {String.fromCharCode(65 + result.userAnswer)}. {listeningData.questions[index].options[result.userAnswer]}
                    </span>
                  </div>
                  <div className="result-explanation">
                    <span className="explanation-label">Giải thích:</span>
                    <span className="explanation-text">{result.explanation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

          {!showResults ? (
            <button
              className="submit-btn"
              onClick={submitExercise}
              disabled={isCompleted}
            >
              <Target size={16} />
              Nộp bài
            </button>
          ) : (
            <button
              className="next-btn"
              onClick={() => {
                // Save completion data to localStorage
                const completionData = {
                  lessonId: lessonId,
                  courseId: courseId,
                  score: mockResults.score,
                  completedAt: new Date().toISOString(),
                  timeSpent: timeSpent,
                  type: 'listening'
                };

                const existingData = JSON.parse(localStorage.getItem(`course_${courseId}_completed_lessons`) || '{}');
                existingData[lessonId] = completionData;
                localStorage.setItem(`course_${courseId}_completed_lessons`, JSON.stringify(existingData));

                // Navigate to learning profile page
                navigate('/learning-profile');
              }}
            >
              <RefreshCw size={16} />
              Hoàn thành
            </button>
          )}
        </div>
      </div>

      {/* Completion Message */}
      {isCompleted && (
        <div className="completion-message">
          <div className="completion-content">
            <Award size={32} />
            <h3>Chúc mừng!</h3>
            <p>Bạn đã hoàn thành bài Listening thành công.</p>
            <div className="completion-stats">
              <div className="stat-item">
                <BookOpen size={20} />
                <span>{listeningData.totalQuestions} câu hỏi</span>
              </div>
              <div className="stat-item">
                <Clock size={20} />
                <span>{formatTime(timeSpent)}</span>
              </div>
              <div className="stat-item">
                <Star size={20} />
                <span>{mockResults.score}/100 điểm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={listeningData.audioUrl}
        preload="metadata"
      />
    </div>
  );
};

export default ListeningExercise;
