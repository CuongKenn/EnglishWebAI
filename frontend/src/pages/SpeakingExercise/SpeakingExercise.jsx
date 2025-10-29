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
  RefreshCw,
  X,
  Loader
} from 'lucide-react';
import './SpeakingExercise.css';
import { coursesAPI } from '../../services/api';

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

  // Load data from API
  const [speakingData, setSpeakingData] = useState({
    id: lessonId || '1',
    title: 'Loading...',
    courseTitle: 'Speaking Học bài',
    difficulty: 'Beginner',
    estimatedTime: 10,
    totalQuestions: 0,
    questions: []
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

        setSpeakingData({
          id: lessonId,
          title: `Speaking Unit ${lessonId}`,
          courseTitle: 'Speaking Học bài',
          difficulty: 'Beginner',
          estimatedTime: questions.length * 2,
          totalQuestions: questions.length,
          questions: questions.map((q, index) => ({
            id: q.id,
            question: q.prompt,
            instruction: "Ghi âm câu trả lời của bạn cho câu hỏi sau đây",
            timeLimit: 60,
            minSentences: 2,
            audioUrl: q.media_url || null
          }))
        });
      } catch (error) {
        console.error('Error loading speaking unit:', error);
        setApiError(error?.detail || 'Không thể tải bài học');
      } finally {
        setApiLoading(false);
      }
    };
    
    loadUnitData();
  }, [lessonId]);

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
      
      // Try to use audio/webm;codecs=opus first, fallback to default
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ''; // Use default
      }
      
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create blob with proper mime type
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        console.log('[RECORDING] Created blob:', {
          size: blob.size,
          type: blob.type
        });
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
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submitRecording = async () => {
    if (!audioBlob) {
      alert('Vui lòng ghi âm trước khi nộp bài');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentQ = speakingData.questions[currentQuestion];
      const referenceText = currentQ.question || currentQ.question_text || currentQ.prompt || '';
      
      console.log('[SPEAKING] Submitting audio:', {
        audioSize: audioBlob.size,
        audioType: audioBlob.type,
        referenceText,
        unitId: lessonId
      });

      // Call real API with correct params order: (unitId, audioBlob, referenceText)
      const result = await coursesAPI.submitSpeakingAudio(parseInt(lessonId), audioBlob, referenceText);
      
      console.log('[SPEAKING] API Response:', result);
      
      // Store results
      setAssessmentResults(result);
      setShowResults(true);
      
    } catch (error) {
      console.error('[SPEAKING ERROR]', error);
      // Better error message extraction
      let errorMsg = 'Không xác định';
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          errorMsg = error.detail.map(e => e.msg || e.message).join(', ');
        } else {
          errorMsg = error.detail;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      alert(`Lỗi khi đánh giá: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate score from results
  const calculateScore = () => {
    if (assessmentResults) {
      return Math.round(assessmentResults.score * 10); // Convert to 0-100 scale
    }
    return 0;
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
      // Exercise completed - show completion message
      setShowCompletionMessage(true);
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

  // Loading state
  if (apiLoading) {
    return (
      <div className="speaking-exercise-page">
        <div className="speaking-header">
          <button className="speaking-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>
        <div className="speaking-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
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
      <div className="speaking-exercise-page">
        <div className="speaking-header">
          <button className="speaking-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>
        <div className="speaking-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
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
        {showResults && assessmentResults && (
          <div className="results-section">
            <div className="results-header">
              <h3 className="results-title">Kết quả</h3>
              <div className="results-tabs">
                <button className="tab-btn active">Nhận xét chung</button>
                <button className="tab-btn">
                  <span className="tab-number good">{assessmentResults.good_count || 0}</span>
                  Diễn đạt hay
                </button>
                <button className="tab-btn">
                  <span className="tab-number error">{assessmentResults.error_count || 0}</span>
                  Lỗi trong bài
                </button>
              </div>
            </div>

            <div className="results-content">
              <div className="transcription-section">
                <h4>Ghi âm của bạn:</h4>
                <p className="transcription-text">
                  {assessmentResults.words_feedback && assessmentResults.words_feedback.map((word, index) => (
                    <span
                      key={index}
                      className={`transcription-word ${word.type}`}
                      title={word.error_type !== 'None' ? `Accuracy: ${word.accuracy}%` : ''}
                    >
                      {word.text}{' '}
                    </span>
                  ))}
                </p>
                <p className="transcription-reference">
                  <strong>Văn bản nhận diện được:</strong> {assessmentResults.recognized_text || 'Không nhận diện được'}
                </p>
              </div>

              <div className="feedback-summary">
                <p>{assessmentResults.feedback || 'Bạn đã hoàn thành bài tập!'}</p>
                {assessmentResults.detailed_feedback && (
                  <p className="detailed-feedback">{assessmentResults.detailed_feedback}</p>
                )}
              </div>

              <div className="score-breakdown">
                <div className="score-item">
                  <span className="score-label">PRONUNCIATION</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(assessmentResults.breakdown.pronunciation / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{assessmentResults.breakdown.pronunciation.toFixed(1)}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">FLUENCY</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(assessmentResults.breakdown.fluency / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{assessmentResults.breakdown.fluency.toFixed(1)}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">GRAMMAR</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(assessmentResults.breakdown.accuracy / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{assessmentResults.breakdown.accuracy.toFixed(1)}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">VOCABULARY</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(assessmentResults.breakdown.completeness / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{assessmentResults.breakdown.completeness.toFixed(1)}/10</span>
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
              disabled={!audioBlob || isCompleted || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="spinning" />
                  Đang đánh giá...
                </>
              ) : (
                <>
                  <Target size={16} />
                  Nộp bài
                </>
              )}
            </button>
          ) : (
          <button
            className="next-btn"
            onClick={currentQuestion < speakingData.questions.length - 1 ? nextQuestion : () => setShowCompletionMessage(true)}
          >
            <RefreshCw size={16} />
            {currentQuestion < speakingData.questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'}
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
            <p>Bạn đã hoàn thành bài Speaking thành công.</p>
            <div className="completion-stats">
              <div className="stat-item">
                <BookOpen size={20} />
                <span>{speakingData.totalQuestions} câu hỏi</span>
              </div>
              <div className="stat-item">
                <Clock size={20} />
                <span>{formatTime(timeSpent)}</span>
              </div>
              <div className="stat-item">
                <Star size={20} />
                <span>{calculateScore()}/100 điểm</span>
              </div>
            </div>
            <div className="completion-actions">
              <button
                className="back-to-profile-btn"
                onClick={() => navigate('/learning-profile')}
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SpeakingExercise;
