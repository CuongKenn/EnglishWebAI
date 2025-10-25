import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X, Play, Pause, RotateCcw, RotateCw, Volume2, 
  Settings, CheckCircle, AlertCircle, Mic, MicOff,
  ChevronLeft, ChevronRight, Star, Award, Clock,
  Target, Zap, Trophy, Heart, Sparkles, ArrowRight
} from 'lucide-react';
import './SpeakingExercise.css';

// Mock data cho các bài tập speaking
const speakingExercises = {
  'g3_speaking': {
    title: 'Speaking Cơ Bản Plus',
    exercises: [
      {
        id: 1,
        title: 'Exercise 1: Ghi âm cách bạn đọc các từ sau',
        type: 'word-pronunciation',
        words: ['Hello', 'World', 'English', 'Learning', 'Practice'],
        currentWord: 'Hello',
        userRecording: null,
        score: 0,
        isCompleted: false,
        difficulty: 'Beginner'
      },
      {
        id: 2,
        title: 'Exercise 2: Đọc câu hoàn chỉnh',
        type: 'sentence-reading',
        sentences: [
          'I love learning English.',
          'This is a beautiful day.',
          'How are you today?'
        ],
        currentSentence: 'I love learning English.',
        userRecording: null,
        score: 0,
        isCompleted: false,
        difficulty: 'Intermediate'
      },
      {
        id: 3,
        title: 'Exercise 3: Trả lời câu hỏi',
        type: 'question-answer',
        questions: [
          'What is your favorite color?',
          'Where do you live?',
          'What do you like to do in your free time?'
        ],
        currentQuestion: 'What is your favorite color?',
        userRecording: null,
        score: 0,
        isCompleted: false,
        difficulty: 'Advanced'
      },
      {
        id: 4,
        title: 'Exercise 4: Mô tả hình ảnh',
        type: 'picture-description',
        image: '/images/speaking/park-scene.jpg',
        description: 'Describe what you see in this picture',
        userRecording: null,
        score: 0,
        isCompleted: false,
        difficulty: 'Intermediate'
      },
      {
        id: 5,
        title: 'Exercise 5: Đối thoại tình huống',
        type: 'conversation',
        scenario: 'You are at a restaurant. Order food and ask questions about the menu.',
        userRecording: null,
        score: 0,
        isCompleted: false,
        difficulty: 'Advanced'
      }
    ]
  },
  'g5_speaking': {
    title: 'Conversation Skills',
    exercises: [
      {
        id: 1,
        title: 'Exercise 1: Phát âm từ khó',
        type: 'word-pronunciation',
        words: ['Pronunciation', 'Communication', 'Conversation', 'Opportunity', 'Environment'],
        currentWord: 'Pronunciation',
        userRecording: null,
        score: 0,
        isCompleted: false,
        difficulty: 'Advanced'
      },
      {
        id: 2,
        title: 'Exercise 2: Thuyết trình ngắn',
        type: 'presentation',
        topic: 'Talk about your favorite hobby for 2 minutes',
        userRecording: null,
        score: 0,
        isCompleted: false,
        difficulty: 'Advanced'
      }
    ]
  },
  'default': {
    title: 'Speaking Exercise',
    exercises: [
      {
        id: 1,
        title: 'Exercise 1: Ghi âm cách bạn đọc các từ sau',
        type: 'word-pronunciation',
        words: ['Life', 'Love', 'Learn', 'Live', 'Laugh'],
        currentWord: 'Life',
        userRecording: null,
        score: 0,
        isCompleted: false,
        difficulty: 'Beginner'
      }
    ]
  }
};

const SpeakingExercise = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  console.log('SpeakingExercise loaded with courseId:', courseId);
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  
  const exerciseData = speakingExercises[courseId] || speakingExercises['default'];
  const currentExercise = exerciseData.exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / exerciseData.exercises.length) * 100;

  // Mock audio duration (trong thực tế sẽ lấy từ file audio)
  useEffect(() => {
    setDuration(3); // 3 giây như trong hình
  }, [currentExercise]);

  const handleStartRecording = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          chunksRef.current = [];
          
          mediaRecorderRef.current.ondataavailable = (event) => {
            chunksRef.current.push(event.data);
          };
          
          mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(blob);
            setUserAnswer(audioUrl);
            // Mock score calculation
            const mockScore = Math.floor(Math.random() * 40) + 60; // 60-100
            setScore(mockScore);
          };
          
          mediaRecorderRef.current.start();
          setIsRecording(true);
        })
        .catch(err => {
          console.error('Error accessing microphone:', err);
          alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
        });
    } else {
      alert('Trình duyệt không hỗ trợ ghi âm.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handlePlayRecording = () => {
    if (userAnswer) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  const handlePauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exerciseData.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setUserAnswer('');
      setScore(0);
      setShowResults(false);
    } else {
      // Kết thúc tất cả bài tập
      setShowResults(true);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setUserAnswer('');
      setScore(0);
      setShowResults(false);
    }
  };

  const handleSubmitExercise = () => {
    if (userAnswer) {
      setShowResults(true);
    }
  };

  const handleExit = () => {
    if (window.confirm('Bạn có chắc muốn thoát? Tiến độ sẽ được lưu.')) {
      navigate('/my-courses');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return { status: 'Đạt', color: '#10b981' };
    if (score >= 60) return { status: 'Cần cải thiện', color: '#f59e0b' };
    return { status: 'Chưa đạt', color: '#ef4444' };
  };

  const scoreStatus = getScoreStatus(score);

  return (
    <div className="speaking-exercise-page">
      {/* Header với kết quả */}
      {showResults && (
        <div className="result-header">
          <div className="result-info">
            <div className="result-icon">
              <CheckCircle size={24} />
            </div>
            <span className="result-text">Đạt</span>
          </div>
          <div className="score-info">
            <span className="score-label">Số Questions đúng</span>
            <span className="score-value">6/10</span>
          </div>
        </div>
      )}

      {/* AI Grading Badge */}
      <div className="ai-grading-badge">
        <Sparkles size={16} />
        <span>Bài được chấm bởi AI</span>
      </div>

      {/* Main Content Container */}
      <div className="main-content-container">
        {/* Exercise Header */}
        <div className="exercise-header-section">
          <div className="exercise-progress-badge">
            Bài tập hiện tại: {currentExerciseIndex + 1}/{exerciseData.exercises.length}
          </div>
          <h1 className="exercise-title">{currentExercise.title}</h1>
          <p className="exercise-instruction">
            {currentExercise.type === 'word-pronunciation' && 'Nghe và luyện tập phát âm các từ khó'}
            {currentExercise.type === 'sentence-reading' && 'Đọc câu hoàn chỉnh với phát âm chính xác'}
            {currentExercise.type === 'question-answer' && 'Trả lời câu hỏi một cách tự nhiên'}
            {currentExercise.type === 'picture-description' && 'Mô tả hình ảnh bằng tiếng Anh'}
            {currentExercise.type === 'conversation' && 'Thực hành đối thoại trong tình huống thực tế'}
            {currentExercise.type === 'presentation' && 'Thuyết trình về chủ đề được giao'}
          </p>
        </div>

        {/* Pronunciation Task Card */}
        <div className="exercise-card">
          <div className="card-icon-wrapper speaker">
            <Volume2 size={24} color="white" />
          </div>
          <div className="card-content">
            <div className="card-title">Pronunciation</div>
            <div className="card-subtitle">Câu trả lời của bạn</div>
          </div>
        </div>

        {/* Current Word/Question Display */}
        <div className="current-item-display">
          {currentExercise.currentWord || currentExercise.currentSentence || currentExercise.currentQuestion || currentExercise.topic || currentExercise.scenario}
        </div>

        {/* Picture for picture description */}
        {currentExercise.type === 'picture-description' && currentExercise.image && (
          <div className="exercise-image-container">
            <img 
              src={currentExercise.image} 
              alt="Exercise visual" 
              className="exercise-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Description for picture description */}
        {currentExercise.type === 'picture-description' && currentExercise.description && (
          <div className="exercise-description">
            <p>{currentExercise.description}</p>
          </div>
        )}

        {/* Audio Player Card */}
        <div className="exercise-card">
          <div className="card-icon-wrapper play">
            <Play size={24} color="white" />
          </div>
          <div className="card-content">
            <div className="audio-player-controls">
              <button className="audio-control-btn" onClick={handlePlayRecording}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className="audio-progress-bar-container">
                <div 
                  className="audio-progress-fill" 
                  style={{ 
                    width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' 
                  }}
                ></div>
              </div>
              <div className="audio-time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="record-button-container">
          {!userAnswer ? (
            <button 
              className={`record-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
            >
              <Mic size={20} className="mic-icon" />
              {isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
            </button>
          ) : (
            <div className="recording-result">
              <div className="recording-info">
                <CheckCircle size={20} className="success-icon" />
                <span>Đã ghi âm thành công!</span>
                <button 
                  className="re-record-btn"
                  onClick={() => {
                    setUserAnswer('');
                    setScore(0);
                    setShowResults(false);
                  }}
                >
                  <Mic size={16} />
                  Ghi âm lại
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Score Display */}
        {showResults && (
          <div className="score-display">
            <div className="score-badge" style={{ backgroundColor: scoreStatus.color }}>
              <Trophy size={20} />
              <span className="score-text">Điểm số {score} / {scoreStatus.status}</span>
            </div>
          </div>
        )}

        {/* Pronunciation Results */}
        {showResults && (
          <div className="pronunciation-results-section">
            <h3 className="pronunciation-results-title">Kết quả chấm phát âm</h3>
            <div className="pronunciation-legend">
              <div className="legend-item">
                <div className="legend-color green"></div>
                <span>Đúng</span>
              </div>
              <div className="legend-item">
                <div className="legend-color yellow"></div>
                <span>Cần cải thiện</span>
              </div>
              <div className="legend-item">
                <div className="legend-color red"></div>
                <span>Chưa đúng</span>
              </div>
            </div>
            
            <div className="word-pronunciation-list">
              <div className="word-pronunciation-item correct">
                {currentExercise.currentWord || currentExercise.currentSentence || currentExercise.currentQuestion}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="navigation-controls">
        <button 
          className="nav-button prev"
          onClick={handlePreviousExercise}
          disabled={currentExerciseIndex === 0}
        >
          <ChevronLeft size={20} />
          Trước
        </button>

        <div className="progress-dots">
          {exerciseData.exercises.map((_, index) => (
            <div 
              key={index} 
              className={`dot ${index <= currentExerciseIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        {!showResults ? (
          <button 
            className="nav-button next"
            onClick={handleSubmitExercise}
            disabled={!userAnswer}
          >
            <Zap size={20} />
            Nộp bài
            <ArrowRight size={20} />
          </button>
        ) : (
          <button 
            className="nav-button next"
            onClick={handleNextExercise}
          >
            {currentExerciseIndex < exerciseData.exercises.length - 1 ? 'Tiếp theo' : 'Hoàn thành'}
            <ArrowRight size={20} />
          </button>
        )}
      </div>

      {/* Exit Button - Removed as requested */}

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={userAnswer}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
      />
    </div>
  );
};

export default SpeakingExercise;
