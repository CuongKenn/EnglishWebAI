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
  Mic,
  MicOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react';
import './SpeakingExercise.css';

const SpeakingExercise = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  // State management
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Handle completion
  const handleComplete = () => {
    // Calculate final score (mock calculation based on mock results)
    const finalScore = Math.round((mockResults.fluency + mockResults.grammar + mockResults.pronunciation + mockResults.vocabulary) / 4 * 10) / 10;

    // Save completion data to localStorage
    const completionData = {
      lessonId: lessonId,
      courseId: courseId,
      score: finalScore,
      completedAt: new Date().toISOString(),
      timeSpent: timeSpent,
      type: 'speaking'
    };

    const existingData = JSON.parse(localStorage.getItem(`course_${courseId}_completed_lessons`) || '{}');
    existingData[lessonId] = completionData;
    localStorage.setItem(`course_${courseId}_completed_lessons`, JSON.stringify(existingData));

    // Navigate to learning profile page
    navigate('/learning-profile');
  };

  // Mock data cho bài speaking - sẽ được thay thế bằng API call
  const speakingData = {
    id: lessonId || '1',
    title: 'Speaking Unit 1',
    courseTitle: 'Speaking Học bài',
    difficulty: 'Beginner',
    estimatedTime: 10, // minutes
    totalQuestions: 4,
    questions: [
      {
        id: 1,
        question: "Are you a student?",
        instruction: "Ghi âm câu trả lời của bạn cho câu hỏi IELTS Speaking sau đây",
        timeLimit: 60, // seconds
        minSentences: 2,
        audioUrl: null // Will be loaded from backend
      },
      {
        id: 2,
        question: "What type of films do you like best?",
        instruction: "Ghi âm câu trả lời của bạn cho câu hỏi IELTS Speaking sau đây",
        timeLimit: 60,
        minSentences: 2,
        audioUrl: null
      },
      {
        id: 3,
        question: "Do you prefer to study alone or with others?",
        instruction: "Ghi âm câu trả lời của bạn cho câu hỏi IELTS Speaking sau đây",
        timeLimit: 60,
        minSentences: 2,
        audioUrl: null
      },
      {
        id: 4,
        question: "What is your favorite subject?",
        instruction: "Ghi âm câu trả lời của bạn cho câu hỏi IELTS Speaking sau đây",
        timeLimit: 60,
        minSentences: 2,
        audioUrl: null
      }
    ]
  };

  // Mock results data - sẽ được thay thế bằng API response
  const mockResults = {
    transcription: "Yeah, I'm student. I'm studying information and technologies in Information and Technologies University in Thanh Nguyen City.",
    score: 75,
    feedback: {
      generalComments: 6,
      goodExpressions: 1,
      errors: 9
    },
    detailedFeedback: [
      { type: 'error', text: 'student', position: 1, suggestion: 'a student' },
      { type: 'good', text: 'I\'m studying information', position: 2 },
      { type: 'error', text: 'and technologies', position: 3, suggestion: 'technology' },
      { type: 'error', text: 'in Information and', position: 4, suggestion: 'at' },
      { type: 'error', text: 'Technologies', position: 5, suggestion: 'Technology' },
      { type: 'error', text: 'University', position: 6, suggestion: 'University' }
    ],
    pronunciation: 7.5,
    fluency: 6.8,
    grammar: 7.2,
    vocabulary: 7.0
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= speakingData.questions[currentQuestion].timeLimit) {
            stopRecording();
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, currentQuestion]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Play audio
  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Submit recording
  const submitRecording = async () => {
    if (!audioBlob) {
      alert('Vui lòng ghi âm trước khi nộp bài');
      return;
    }

    // TODO: API call to submit recording
    console.log('Submitting recording:', audioBlob);

    // Simulate API response
    setTimeout(() => {
      setShowResults(true);
    }, 2000);
  };

  // Calculate score from results
  const calculateScore = () => {
    // Aggregate score from pronunciation, fluency, grammar, vocabulary
    const totalScore = mockResults.pronunciation + mockResults.fluency + mockResults.grammar + mockResults.vocabulary;
    return Math.round(totalScore / 4); // Average out of 100
  };

  // Next question
  const nextQuestion = () => {
    if (currentQuestion < speakingData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowResults(false);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
    } else {
      // Exercise completed - save to localStorage and navigate
      const score = calculateScore();
      const completionData = {
        lessonId,
        score,
        completedAt: new Date().toISOString(),
        type: 'speaking'
      };

      // Save to localStorage
      const key = `course_${courseId}_completed_lessons`;
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      existing[lessonId] = completionData;
      localStorage.setItem(key, JSON.stringify(existing));

      // Navigate to learning profile page
      navigate('/learning-profile');
    }
  };

  // Reset exercise
  const resetExercise = () => {
    setCurrentQuestion(0);
    setIsRecording(false);
    setIsCompleted(false);
    setShowResults(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setTimeSpent(0);
    setShowCompletionMessage(false);
  };

  const currentQuestionData = speakingData.questions[currentQuestion];

  return (
    <div className="speaking-exercise-page">
      {/* Header */}
      <div className="speaking-header">
        <div className="header-left">
          <button
            className="speaking-back-btn"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>

        <div className="course-info">
          <h1 className="course-title">{speakingData.courseTitle}</h1>
          <p className="course-subtitle">{speakingData.title}</p>
        </div>

        <div className="header-right">
          <div className="timer-info">
            <Clock size={16} />
            <span>{formatTime(timeSpent)}</span>
          </div>
          <div className="difficulty-badge">
            {speakingData.difficulty}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="speaking-content">
        {/* Question Section */}
        <div className="question-section">
          <div className="question-header">
            <h2 className="question-title">Questions {currentQuestion + 1} - {speakingData.totalQuestions}</h2>
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
              <p>{currentQuestionData.instruction}</p>
            </div>

            <div className="question-prompt">
              <div className="question-number">
                <span>{currentQuestion + 1}</span>
              </div>
              <p>{currentQuestionData.question}</p>
            </div>

            {showHint && (
              <div className="hint-content">
                <div className="hint-header">
                  <AlertCircle size={16} />
                  <span>Gợi ý</span>
                </div>
                <div className="hint-tips">
                  <h4>Mẹo trả lời:</h4>
                  <ul>
                    <li>Trả lời tối thiểu {currentQuestionData.minSentences} câu</li>
                    <li>Nói rõ ràng và tự nhiên</li>
                    <li>Sử dụng từ vựng phong phú</li>
                    <li>Tránh im lặng quá lâu</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recording Section */}
        {!showResults && (
          <div className="recording-section">
            <div className="recording-header">
              <h3 className="recording-title">Câu trả lời của bạn</h3>
            </div>

            <div className="recording-interface">
              <div className="recording-button-container">
                <button
                  className={`recording-btn ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isCompleted}
                >
                  {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
                <p className="recording-instruction">
                  {isRecording ? 'Đang ghi âm...' : 'Nhấn để bắt đầu ghi âm'}
                </p>
                <p className="recording-limit">
                  Giới hạn ghi âm là {formatTime(currentQuestionData.timeLimit)}
                </p>
                <p className="recording-timer">
                  {formatTime(recordingTime)}
                </p>
              </div>

              <div className="recording-info">
                <p>Hệ thống sẽ tự động xử lý bài nói của bạn</p>
              </div>

              <div className="recording-note">
                <AlertCircle size={16} />
                <span>Lưu ý: Bạn nên trả lời tối thiểu {currentQuestionData.minSentences} câu</span>
              </div>
            </div>

            {/* Audio Player (if recorded) */}
            {audioUrl && (
              <div className="audio-player">
                <div className="audio-controls">
                  <button
                    className="play-btn"
                    onClick={playAudio}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <div className="audio-info">
                    <span>Bản ghi âm của bạn</span>
                    <span>{formatTime(recordingTime)}</span>
                  </div>
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {showResults && (
          <div className="results-section">
            <div className="results-header">
              <h3 className="results-title">Kết quả</h3>
              <div className="results-tabs">
                <button className="tab-btn active">Nhận xét chung</button>
                <button className="tab-btn">
                  <span className="tab-number good">{mockResults.feedback.goodExpressions}</span>
                  Diễn đạt hay
                </button>
                <button className="tab-btn">
                  <span className="tab-number error">{mockResults.feedback.errors}</span>
                  Lỗi trong bài
                </button>
              </div>
            </div>

            <div className="results-content">
              <div className="transcription-section">
                <p className="transcription-text">
                  {mockResults.detailedFeedback.map((item, index) => (
                    <span
                      key={index}
                      className={`transcription-word ${item.type}`}
                      title={item.suggestion || ''}
                    >
                      {item.text}
                      {item.position && <sup>{item.position}</sup>}
                    </span>
                  ))}
                </p>
              </div>

              <div className="feedback-summary">
                <p>{mockResults.feedback.generalComments} nhận xét trên nội dung bài nói</p>
              </div>

              <div className="score-breakdown">
                <div className="score-item">
                  <span className="score-label">Pronunciation</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(mockResults.pronunciation / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{mockResults.pronunciation}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Fluency</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(mockResults.fluency / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{mockResults.fluency}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Grammar</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(mockResults.grammar / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{mockResults.grammar}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Vocabulary</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(mockResults.vocabulary / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{mockResults.vocabulary}/10</span>
                </div>
              </div>
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
              onClick={submitRecording}
              disabled={!audioBlob || isCompleted}
            >
              <Target size={16} />
              Nộp bài
            </button>
          ) : (
          <button
            className="next-btn"
            onClick={currentQuestion < speakingData.questions.length - 1 ? nextQuestion : handleComplete}
          >
            <RefreshCw size={16} />
            {currentQuestion < speakingData.questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
          </button>
          )}
        </div>
      </div>


    </div>
  );
};

export default SpeakingExercise;
