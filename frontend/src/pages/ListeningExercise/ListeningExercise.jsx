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
  Headphones,
  X
} from 'lucide-react';
import { getListeningLesson, submitListeningAnswers } from '../../services/aiService';
import './ListeningExercise.css';

const ListeningExercise = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  // State management
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [notes, setNotes] = useState({});
  const [showHint, setShowHint] = useState(false);

  const [listeningData, setListeningData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('intermediate');

  const [notification, setNotification] = useState(null);


  // Refs
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const speechSynthRef = useRef(null);
  const utteranceRef = useRef(null);

  // Load listening data from API
  useEffect(() => {
    const fetchListeningData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getListeningLesson(selectedLevel);
        // Transform API response to match expected format
        const transformedData = {
          id: data.id,
          title: data.title,
          courseTitle: 'AI Listening Exercise',
          difficulty: data.level,
          estimatedTime: parseInt(data.duration.split(':')[0]) || 5,
          totalQuestions: data.questions.length,
          audioUrl: data.audio_url,
          duration: parseDuration(data.duration),
          transcript: data.transcript,
          questions: data.questions.map((q, idx) => ({
            id: idx + 1,
            question: q.question,
            options: q.options,
            correctAnswer: q.correct,
            explanation: `Correct answer is ${String.fromCharCode(65 + q.correct)}.`
          }))
        };
        setListeningData(transformedData);
      } catch (err) {
        console.error('Error loading listening exercise:', err);
        let errorMessage = 'Không thể tải bài tập. Vui lòng thử lại sau.';
        
        // Check for specific error messages
        if (err.response?.status === 503) {
          errorMessage = 'AI service chưa được cấu hình. Vui lòng liên hệ quản trị viên để thêm GEMINI_API_KEY.';
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.message === 'Network Error') {
          errorMessage = 'Không thể kết nối với server. Vui lòng kiểm tra xem backend đang chạy.';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchListeningData();
  }, [selectedLevel]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Helper function to parse duration string to seconds
  const parseDuration = (durationStr) => {
    const parts = durationStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 180; // default 3 minutes
  };

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

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
    }
    
    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  // Audio controls with Text-to-Speech fallback
  const togglePlayPause = () => {
    // Use audio element if audio URL exists
    if (listeningData?.audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } 
    // Use Web Speech API as fallback
    else if (listeningData?.transcript && speechSynthRef.current) {
      if (isPlaying) {
        // Stop speaking
        speechSynthRef.current.cancel();
        setIsPlaying(false);
      } else {
        // Start speaking
        const utterance = new SpeechSynthesisUtterance(listeningData.transcript);
        utterance.lang = 'en-US';
        utterance.rate = speed[0];
        utterance.volume = isMuted ? 0 : volume;
        
        // Get English voice
        const voices = speechSynthRef.current.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        // Update progress during speech
        let words = listeningData.transcript.split(' ');
        let currentWord = 0;
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            currentWord++;
            const progressPercent = (currentWord / words.length) * 100;
            setAudioProgress((progressPercent / 100) * listeningData.duration);
          }
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
          setAudioProgress(0);
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsPlaying(false);
        };
        
        utteranceRef.current = utterance;
        speechSynthRef.current.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  const skipBackward = () => {
    if (audioRef.current && listeningData?.audioUrl) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    } else if (speechSynthRef.current && isPlaying) {
      // Restart speech for skip backward
      speechSynthRef.current.cancel();
      setIsPlaying(false);
      setTimeout(() => togglePlayPause(), 100);
    }
  };

  const skipForward = () => {
    if (audioRef.current && listeningData?.audioUrl) {
      audioRef.current.currentTime = Math.min(audioDuration, audioRef.current.currentTime + 10);
    }
    // Skip forward not supported for speech synthesis
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current && listeningData?.audioUrl) {
      audioRef.current.volume = newVolume;
    }
    // Volume change during speech not supported, will apply on next play
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current && listeningData?.audioUrl) {
      if (isMuted) {
        audioRef.current.volume = volume;
      } else {
        audioRef.current.volume = 0;
      }
    }
    // Mute change during speech not supported, will apply on next play
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
  const submitExercise = async () => {
    const answeredQuestions = Object.keys(selectedAnswers).length;
    if (answeredQuestions < listeningData.totalQuestions) {
      setNotification({
        type: 'error',
        message: `Vui lòng trả lời tất cả ${listeningData.totalQuestions} câu hỏi trước khi nộp bài`
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      // Submit to API
      await submitListeningAnswers(listeningData.id, selectedAnswers);

      // Calculate results
      let correctCount = 0;
      const detailedResults = listeningData.questions.map(q => {
        const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
        if (isCorrect) correctCount++;
        return {
          questionId: q.id,
          question: q.question,
          userAnswer: selectedAnswers[q.id],
          correctAnswer: q.correctAnswer,
          isCorrect: isCorrect,
          explanation: q.explanation
        };
      });

      const score = Math.round((correctCount / listeningData.totalQuestions) * 100);
      
      setResults({
        score: score,
        totalQuestions: listeningData.totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: listeningData.totalQuestions - correctCount,
        timeSpent: timeSpent,
        detailedResults: detailedResults
      });

      setShowResults(true);
      setIsCompleted(true);
      setShowCompletionMessage(true);
    } catch (error) {
      console.error('Error submitting exercise:', error);
      alert('Có lỗi khi nộp bài. Vui lòng thử lại.');
    }
  };

  // Reset exercise
  const resetExercise = async () => {
    setCurrentQuestion(0);
    setIsPlaying(false);
    setIsCompleted(false);
    setShowResults(false);
    setSelectedAnswers({});
    setNotes({});
    setTimeSpent(0);
    setAudioProgress(0);
    setResults(null);
    
    // Stop audio or speech
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }

    // Load new exercise
    try {
      setLoading(true);
      setError(null);
      const data = await getListeningLesson(selectedLevel);
      const transformedData = {
        id: data.id,
        title: data.title,
        courseTitle: 'AI Listening Exercise',
        difficulty: data.level,
        estimatedTime: parseInt(data.duration.split(':')[0]) || 5,
        totalQuestions: data.questions.length,
        audioUrl: data.audio_url,
        duration: parseDuration(data.duration),
        transcript: data.transcript,
        questions: data.questions.map((q, idx) => ({
          id: idx + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correct,
          explanation: `Correct answer is ${String.fromCharCode(65 + q.correct)}.`
        }))
      };
      setListeningData(transformedData);
    } catch (err) {
      console.error('Error loading new exercise:', err);
      let errorMessage = 'Không thể tải bài tập mới. Vui lòng thử lại.';
      
      if (err.response?.status === 503) {
        errorMessage = 'AI service chưa được cấu hình. Vui lòng liên hệ quản trị viên để thêm GEMINI_API_KEY.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message === 'Network Error') {
        errorMessage = 'Không thể kết nối với server. Vui lòng kiểm tra xem backend đang chạy.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="listening-exercise-page">
        <div className="loading-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <RefreshCw size={48} className="animate-spin" style={{ color: '#10b981' }} />
          <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Đang sinh đề bài listening với AI...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !listeningData) {
    return (
      <div className="listening-exercise-page">
        <div className="error-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <AlertCircle size={48} style={{ color: '#ef4444' }} />
          <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>{error || 'Không thể tải bài tập.'}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

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
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Chọn cấp độ:</span>
            <button
              onClick={() => setSelectedLevel('beginner')}
              disabled={loading}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '0.375rem',
                border: selectedLevel === 'beginner' ? '2px solid #10b981' : '1px solid #d1d5db',
                backgroundColor: selectedLevel === 'beginner' ? '#d1fae5' : 'white',
                color: selectedLevel === 'beginner' ? '#065f46' : '#6b7280',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: selectedLevel === 'beginner' ? '600' : '400'
              }}
            >
              Beginner
            </button>
            <button
              onClick={() => setSelectedLevel('intermediate')}
              disabled={loading}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '0.375rem',
                border: selectedLevel === 'intermediate' ? '2px solid #10b981' : '1px solid #d1d5db',
                backgroundColor: selectedLevel === 'intermediate' ? '#d1fae5' : 'white',
                color: selectedLevel === 'intermediate' ? '#065f46' : '#6b7280',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: selectedLevel === 'intermediate' ? '600' : '400'
              }}
            >
              Intermediate
            </button>
            <button
              onClick={() => setSelectedLevel('advanced')}
              disabled={loading}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '0.375rem',
                border: selectedLevel === 'advanced' ? '2px solid #10b981' : '1px solid #d1d5db',
                backgroundColor: selectedLevel === 'advanced' ? '#d1fae5' : 'white',
                color: selectedLevel === 'advanced' ? '#065f46' : '#6b7280',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: selectedLevel === 'advanced' ? '600' : '400'
              }}
            >
              Advanced
            </button>
          </div>
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
          {!listeningData.audioUrl && (
            <div style={{
              backgroundColor: '#fef3c7',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Volume2 size={20} style={{ color: '#d97706' }} />
              <span style={{ fontSize: '0.875rem', color: '#92400e' }}>
                Đang sử dụng giọng đọc tự động của trình duyệt (Text-to-Speech)
              </span>
            </div>
          )}
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
                <h3 className="question-text">{question.id}. {question.question}</h3>
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
        {showResults && results && (
          <div className="results-section">
            <div className="results-header">
              <h3 className="results-title">Kết quả bài làm</h3>
              <div className="score-display">
                <span className="score-number">{results.score}</span>
                <span className="score-label">/100</span>
              </div>
            </div>

            <div className="results-summary">
              <div className="summary-item correct">
                <CheckCircle size={20} />
                <span>{results.correctAnswers} câu đúng</span>
              </div>
              <div className="summary-item incorrect">
                <AlertCircle size={20} />
                <span>{results.incorrectAnswers} câu sai</span>
              </div>
              <div className="summary-item time">
                <Clock size={20} />
                <span>{formatTime(results.timeSpent)}</span>
              </div>
            </div>

            <div className="detailed-results">
              <h4>Chi tiết từng câu hỏi:</h4>
              {results.detailedResults.map((result, index) => (
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
                  score: results?.score || 0,
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
      {showCompletionMessage && results && (
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
                <span>{results.score}/100 điểm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <AlertCircle size={20} />
          <span>{notification.message}</span>
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
