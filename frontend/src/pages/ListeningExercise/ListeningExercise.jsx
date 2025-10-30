import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  RefreshCw,
  SkipBack,
  SkipForward,
  Headphones,
  Info,
  ListChecks,
  BarChart2,
  X
} from 'lucide-react';
import { coursesAPI } from '../../services/api';
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

  const [notification, setNotification] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [unitData, setUnitData] = useState(null);
  const [questions, setQuestions] = useState([]);

  const totalQuestions = listeningData?.totalQuestions || 0;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const speechRate = 1;

  const lessonMeta = useMemo(() => {
    if (!listeningData) return null;

    return {
      courseTitle: listeningData.courseTitle,
      lessonTitle: listeningData.title,
      difficulty: listeningData.difficulty,
      questionCount: listeningData.totalQuestions,
      estimatedTime: listeningData.estimatedTime,
      hasAudio: Boolean(listeningData.audioUrl),
      completed: isCompleted,
      score: results?.score ?? null,
    };
  }, [listeningData, isCompleted, results]);

  const progressLabel = useMemo(() => {
    if (!totalQuestions) return '0 câu đã trả lời';
    if (!answeredCount) return 'Chưa trả lời câu nào';
    if (answeredCount === totalQuestions) return 'Hoàn thành tất cả câu hỏi';
    return `${answeredCount}/${totalQuestions} câu đã trả lời`;
  }, [answeredCount, totalQuestions]);


  // Refs
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const speechSynthRef = useRef(null);
  const utteranceRef = useRef(null);
  const questionRefs = useRef({});

  // Load listening data from server (not AI)
  useEffect(() => {
    const fetchListeningData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load course data
        const course = await coursesAPI.getCourse(courseId);
        setCourseData(course);

        // Load units
        const units = await coursesAPI.getUnits(courseId);
        const unit = units.find(u => u.id === parseInt(lessonId));
        if (!unit) {
          throw new Error('Không tìm thấy bài học');
        }
        setUnitData(unit);

        // Load questions from server
        const qs = await coursesAPI.getQuestions(parseInt(lessonId));
        setQuestions(qs || []);

        // Determine audio/transcript from unit/question data
        const getBackendBaseUrl = () => {
          const envUrl = import.meta.env.VITE_MEDIA_BASE_URL || import.meta.env.VITE_API_BASE_URL;
          if (envUrl) {
            try {
              const parsed = new URL(envUrl, window.location.origin);
              const origin = parsed.origin;
              const pathname = parsed.pathname.replace(/\/?api\/?v1\/?$/i, '').replace(/\/$/, '');
              return `${origin}${pathname}`;
            } catch (err) {
              console.warn('Không thể phân tích VITE_API_BASE_URL:', err);
            }
          }

          if (typeof window !== 'undefined') {
            const { protocol, hostname, port } = window.location;
            if (port && port !== '3000') {
              return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
            }
            // Mặc định backend cổng 8000 khi chạy dev
            return `${protocol}//${hostname}:8000`;
          }

          return 'http://localhost:8000';
        };

        const backendBase = getBackendBaseUrl().replace(/\/$/, '');
        const audioQuestion = (qs || []).find(q => q.media_url);
        const normalizeAudioUrl = (url) => {
          if (!url) return null;
          if (url.startsWith('http://') || url.startsWith('https://')) return url;
          const path = url.startsWith('/') ? url : `/${url}`;
          return `${backendBase}${path}`;
        };

        const audioUrl = normalizeAudioUrl(unit.audio_url) || normalizeAudioUrl(audioQuestion?.media_url) || null;

        // Parse question data (backend may return JSON fields already parsed)
        const parsedQuestions = (qs || []).map((q, idx) => {
          let options = [];
          if (Array.isArray(q.options)) {
            options = q.options;
          } else if (q.options_json) {
            try {
              options = JSON.parse(q.options_json);
            } catch (parseError) {
              console.error('Error parsing options_json:', parseError, q);
            }
          }

          let answerData = {};
          if (q.answer && typeof q.answer === 'object') {
            answerData = q.answer;
          } else if (q.answer_json) {
            try {
              answerData = JSON.parse(q.answer_json);
            } catch (parseError) {
              console.error('Error parsing answer_json:', parseError, q);
            }
          }

          const correctAnswer =
            typeof answerData.correct === 'number' ? answerData.correct : 0;

          return {
            id: q.id,
            number: idx + 1,
            question: q.prompt || `Câu ${idx + 1}`,
            options: options.length > 0 ? options : ['A', 'B', 'C', 'D'],
            correctAnswer,
            explanation:
              answerData.explanation ||
              `Đáp án đúng là ${String.fromCharCode(65 + correctAnswer)}.`,
            mediaUrl: normalizeAudioUrl(q.media_url) || null,
            points: q.points || null,
            type: q.type || null
          };
        });

        const estimatedMinutesRaw =
          unit.estimated_time ||
          unit.estimated_minutes ||
          unit.duration_minutes ||
          unit.duration ||
          5;
        const estimatedMinutes = Number(estimatedMinutesRaw);
        const safeEstimatedMinutes = Number.isFinite(estimatedMinutes) && estimatedMinutes > 0 ? estimatedMinutes : 5;

        // Build listeningData structure
        setListeningData({
          id: lessonId,
          title: unit.title,
          courseTitle: course.title,
          difficulty: course.level || unit.level || 'Intermediate',
          estimatedTime: safeEstimatedMinutes,
          totalQuestions: parsedQuestions.length,
          audioUrl,
          duration: audioQuestion?.duration || 0,
          transcript: '',
          questions: parsedQuestions
        });

      } catch (err) {
        console.error('Error loading listening exercise:', err);
        let errorMessage = 'Không thể tải bài tập. Vui lòng thử lại sau.';
        
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.message === 'Network Error') {
          errorMessage = 'Không thể kết nối với server. Vui lòng kiểm tra xem backend đang chạy.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && lessonId) {
      fetchListeningData();
    }
  }, [courseId, lessonId]);

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
      setAudioDuration(audio.duration || 0);
    };

    const handleCanPlay = () => {
      setAudioDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
    };

    const handleError = (event) => {
      console.error('Audio playback error:', event);
      setIsPlaying(false);
      setNotification({
        type: 'error',
        message: 'Không thể phát audio. Vui lòng kiểm tra lại file audio.'
      });
      setTimeout(() => setNotification(null), 3000);
    };

    // Metadata may be available before listeners attach (e.g., cached file)
    if (audio.readyState >= 1) {
      setAudioDuration(audio.duration || 0);
    }

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Reset audio state when URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setAudioProgress(0);
    setAudioDuration(0);
    setIsPlaying(false);

    if (listeningData?.audioUrl) {
      audio.pause();
      audio.currentTime = 0;
      // Force reload metadata for new source
      audio.load();
    }
  }, [listeningData?.audioUrl]);

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
    const audio = audioRef.current;
    if (listeningData?.audioUrl && audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              console.error('Audio play failed:', err);
              setIsPlaying(false);
              setNotification({
                type: 'error',
                message: 'Trình duyệt không thể phát file audio. Kiểm tra lại quyền truy cập hoặc định dạng.'
              });
              setTimeout(() => setNotification(null), 3000);
            });
        } else {
          setIsPlaying(true);
        }
      }
    } 
    // Use Web Speech API as fallback
    else if (!listeningData?.audioUrl && speechSynthRef.current) {
      if (isPlaying) {
        // Stop speaking
        speechSynthRef.current.cancel();
        setIsPlaying(false);
      } else {
        // Start speaking
        const transcriptFallback = 'Please listen carefully to the audio provided for this exercise.';
        const utterance = new SpeechSynthesisUtterance(transcriptFallback);
        utterance.lang = 'en-US';
        utterance.rate = speechRate;
        utterance.volume = isMuted ? 0 : volume;
        
        // Get English voice
        const voices = speechSynthRef.current.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        // Update progress during speech
        let words = transcriptFallback.split(' ');
        let currentWord = 0;
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            currentWord++;
            const progressPercent = (currentWord / words.length) * 100;
            setAudioProgress((progressPercent / 100) * (listeningData.duration || 60));
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

  const handleNavigateQuestion = (index) => {
    setCurrentQuestion(index);
    const question = listeningData?.questions?.[index];
    if (question && questionRefs.current[question.id]) {
      questionRefs.current[question.id].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
  const handleAnswerSelect = (questionId, answerIndex, index) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
    if (typeof index === 'number') {
      setCurrentQuestion(index);
    }
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
    if (answeredQuestions < totalQuestions) {
      setNotification({
        type: 'error',
        message: `Vui lòng trả lời tất cả ${totalQuestions} câu hỏi trước khi nộp bài`
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      // Calculate results locally
      let correctCount = 0;
      const detailedResults = listeningData.questions.map(q => {
        const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
        if (isCorrect) correctCount++;
        return {
          questionId: q.id,
          questionNumber: q.number,
          question: q.question,
          userAnswer: selectedAnswers[q.id],
          correctAnswer: q.correctAnswer,
          isCorrect,
          explanation: q.explanation,
          options: q.options
        };
      });

      const score = Math.round((correctCount / totalQuestions) * 100);

      // Submit answers as JSON to backend
      const answersJson = JSON.stringify(selectedAnswers);
      await coursesAPI.submitUnitAnswers(parseInt(lessonId), {
        content_text: answersJson,
        content_url: null
      });
      
      setResults({
        score: score,
        totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: totalQuestions - correctCount,
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
  const resetExercise = () => {
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
          <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Đang tải bài listening...</p>
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
  const audioProgressWidth = audioDuration > 0 ? (audioProgress / audioDuration) * 100 : 0;

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

      {/* Lesson Meta */}
      {lessonMeta && (
        <div className="lesson-meta-grid">
          <div className="lesson-meta-card">
            <div className="meta-icon" aria-hidden="true">
              <ListChecks size={20} />
            </div>
            <div className="meta-content">
              <span className="meta-label">Số câu hỏi</span>
              <strong className="meta-value">{lessonMeta.questionCount}</strong>
            </div>
          </div>
          <div className="lesson-meta-card">
            <div className="meta-icon" aria-hidden="true">
              <BarChart2 size={20} />
            </div>
            <div className="meta-content">
              <span className="meta-label">Tiến độ</span>
              <strong className="meta-value">{progressPercent}%</strong>
              <span className="meta-description">{progressLabel}</span>
            </div>
            <div className="meta-progress">
              <div className="meta-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <div className="lesson-meta-card">
            <div className="meta-icon" aria-hidden="true">
              <Clock size={20} />
            </div>
            <div className="meta-content">
              <span className="meta-label">Thời lượng ước tính</span>
              <strong className="meta-value">~{lessonMeta.estimatedTime} phút</strong>
              <span className="meta-description">Từ giáo trình</span>
            </div>
          </div>
          <div className="lesson-meta-card">
            <div className="meta-icon" aria-hidden="true">
              <Headphones size={20} />
            </div>
            <div className="meta-content">
              <span className="meta-label">Nguồn audio</span>
              <strong className="meta-value">{lessonMeta.hasAudio ? 'File gốc' : 'Trình duyệt đọc'}</strong>
              <span className="meta-description">{lessonMeta.hasAudio ? 'Đã có file audio chuẩn' : 'Chưa có file audio, dùng TTS'}</span>
            </div>
          </div>
          <div className="lesson-meta-card">
            <div className="meta-icon" aria-hidden="true">
              <Info size={20} />
            </div>
            <div className="meta-content">
              <span className="meta-label">Trạng thái bài</span>
              <strong className="meta-value">{lessonMeta.completed ? 'Đã hoàn thành' : 'Đang luyện tập'}</strong>
              <span className="meta-description">Ghi nhận tiến độ cá nhân</span>
            </div>
          </div>
          {lessonMeta.score !== null && (
            <div className="lesson-meta-card emphasis">
              <div className="meta-icon" aria-hidden="true">
                <Star size={20} />
              </div>
              <div className="meta-content">
                <span className="meta-label">Điểm gần nhất</span>
                <strong className="meta-value">{lessonMeta.score}/100</strong>
                <span className="meta-description">Tiếp tục luyện nghe để cải thiện</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="listening-content">
        {/* Instructions */}
        <div className="instructions-section">
          <div className="instructions-header">
            <div>
              <span className="exercise-badge">Bài nghe</span>
              <h2 className="instructions-title">Exercise {currentQuestion + 1}/{totalQuestions}</h2>
              <p className="instructions-subtitle">Nghe kỹ đoạn audio và chọn đáp án chính xác nhất cho từng câu hỏi.</p>
            </div>
            <div className="instructions-controls">
              <button
                className="hint-btn"
                onClick={() => setShowHint(!showHint)}
              >
                <HelpCircle size={16} />
                {showHint ? 'Ẩn gợi ý' : 'Hint'}
              </button>
            </div>
          </div>

          <div className="instructions-content">
            <div className="instruction-text">
              <AlertCircle size={16} />
              <p>
                Đọc câu hỏi trước khi nghe, gạch chân từ khóa và ghi chú nhanh khi nghe để bắt trọn thông tin quan trọng.
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
                    <li>Ghi chú nhanh khi nghe để không bỏ lỡ chi tiết</li>
                    <li>Chú ý từ đồng nghĩa/paraphrase</li>
                    <li>Kiểm tra lại đáp án trước khi nộp</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audio Player */}
        <div className="audio-player-section">
          {!listeningData.audioUrl && (
            <div className="audio-alert">
              <Volume2 size={20} aria-hidden="true" />
              <span>
                Đang sử dụng giọng đọc tự động (Text-to-Speech). Giáo viên hãy tải file audio lên trong ngân hàng câu hỏi để đạt chuẩn IELTS.
              </span>
            </div>
          )}
          <div className="audio-player">
            <div className="audio-summary">
              <div className="summary-icon" aria-hidden="true">
                <Headphones size={22} />
              </div>
              <div>
                <p className="summary-title">{listeningData.audioUrl ? 'Nghe file audio chuẩn' : 'Text-to-Speech đang hoạt động'}</p>
                <p className="summary-description">
                  {listeningData.audioUrl
                    ? 'Nhấn phát để luyện nghe. Có thể lùi/tiến 10 giây và điều chỉnh âm lượng.'
                    : 'Hệ thống sử dụng giọng đọc tự động mặc định. Hãy đảm bảo thiết bị đã bật âm thanh.'}
                </p>
              </div>
            </div>

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
                aria-label={isPlaying ? 'Tạm dừng audio' : 'Phát audio'}
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
                  style={{ width: `${audioProgressWidth}%` }}
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
                aria-label={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
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
                aria-label="Điều chỉnh âm lượng"
              />
              <button className="settings-btn" title="Thiết lập" aria-label="Thiết lập audio">
                <Settings size={20} />
              </button>
            </div>

          </div>
        </div>

        {/* Questions Section */}
        <div className="questions-section">
          {(!listeningData.questions || listeningData.questions.length === 0) && (
            <div className="empty-state">
              <AlertCircle size={20} aria-hidden="true" />
              <p>Không có câu hỏi nào cho bài nghe này. Vui lòng thêm câu hỏi trong trang quản trị.</p>
            </div>
          )}

          {listeningData.questions && listeningData.questions.length > 0 && (
            <div className="question-layout">
              <aside className="question-nav" aria-label="Danh sách câu hỏi">
                <h3>Danh sách câu hỏi</h3>
                <div className="question-nav-grid">
                  {listeningData.questions.map((question, index) => {
                    const answered = typeof selectedAnswers[question.id] === 'number';
                    const isActive = currentQuestion === index;
                    return (
                      <button
                        key={question.id}
                        type="button"
                        className={`question-nav-item ${isActive ? 'active' : ''} ${answered ? 'answered' : ''}`}
                        onClick={() => handleNavigateQuestion(index)}
                      >
                        <span className="question-nav-number">{index + 1}</span>
                        <span className="question-nav-status">{answered ? 'Đã trả lời' : 'Chưa trả lời'}</span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="question-list">
                {listeningData.questions.map((question, index) => {
                  const isSelectedAnswer = typeof selectedAnswers[question.id] === 'number';
                  return (
                    <div
                      key={question.id}
                      className={`question-card ${currentQuestion === index ? 'highlight' : ''}`}
                      ref={el => {
                        questionRefs.current[question.id] = el;
                      }}
                    >
                      <div className="question-header">
                        <div className="question-index">Câu {index + 1}</div>
                        {question.points && (
                          <span className="question-points">{question.points} điểm</span>
                        )}
                      </div>
                      <h3 className="question-text">{question.question}</h3>

                      {question.mediaUrl && (
                        <div className="question-media">
                          {(!listeningData?.audioUrl || listeningData.audioUrl !== question.mediaUrl) ? (
                            <audio controls src={question.mediaUrl} preload="metadata">
                              Trình duyệt không hỗ trợ audio.
                            </audio>
                          ) : (
                            <div className="question-media-info">
                              Audio đang được phát ở trình phát chính phía trên.
                            </div>
                          )}
                        </div>
                      )}

                      <div className="options-container">
                        {question.options && question.options.map((option, optionIndex) => {
                          const isSelected = selectedAnswers[question.id] === optionIndex;
                          return (
                            <div
                              key={optionIndex}
                              className={`option-item ${isSelected ? 'selected' : ''}`}
                            >
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
                                    checked={isSelected}
                                    onChange={() => handleAnswerSelect(question.id, optionIndex, index)}
                                  />
                                  <label htmlFor={`q${question.id}_${optionIndex}`}>
                                    Chọn đáp án {String.fromCharCode(65 + optionIndex)}
                                  </label>
                                </div>
                              </div>
                              <div className="note-section">
                                <textarea
                                  placeholder="Ghi chú từ khóa, thông tin quan trọng..."
                                  value={notes[`${question.id}_${optionIndex}`] || ''}
                                  onChange={(e) => handleNoteChange(question.id, optionIndex, e.target.value)}
                                  className="note-textarea"
                                  rows="2"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
