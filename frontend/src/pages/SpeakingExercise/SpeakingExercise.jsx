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
  Loader2
} from 'lucide-react';
import apiClient, { coursesAPI } from '../../services/api';
import { getSpeakingPrompt } from '../../api/courseContent';
import './SpeakingExercise.css';
import Toast from '../../components/Toast/Toast';
import useToast from '../../hooks/useToast';

const SpeakingExercise = () => {
  const { toast, showWarning, showError, hideToast } = useToast();
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
  const [recordingError, setRecordingError] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [completionSaved, setCompletionSaved] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [speakingData, setSpeakingData] = useState(null);
  const [unitData, setUnitData] = useState(null);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const objectUrlSetRef = useRef(new Set());

  const safeParseJSON = (value, fallback) => {
    if (typeof value === 'undefined' || value === null) {
      return fallback;
    }
    if (typeof value !== 'string') {
      return value ?? fallback;
    }
    try {
      return JSON.parse(value);
    } catch (err) {
      console.warn('Không thể parse JSON:', err);
      return fallback;
    }
  };

  // Handle completion
  const handleComplete = async ({ redirect = true } = {}) => {
    if (completionSaved) {
      if (redirect) {
        navigate('/learning-profile');
      }
      return true;
    }

    if (isFinalizing) {
      return false;
    }

    setIsFinalizing(true);

    const results = assessmentResults || mockResults;
    const scores = [results?.fluency, results?.grammar, results?.pronunciation, results?.vocabulary]
      .map((value) => (Number.isFinite(Number(value)) ? Number(value) : 0));
    const scoreAverage = scores.reduce((sum, value) => sum + value, 0) / (scores.length || 1);
    const finalScore = Math.round((scoreAverage) * 10) / 10;

    let scorePercent;
    if (results?.score !== undefined && results?.score !== null) {
      const numericScore = Number(results.score);
      scorePercent = Number.isFinite(numericScore) ? Math.max(0, Math.min(100, numericScore)) : Math.round((finalScore / 10) * 100);
    } else {
      scorePercent = Math.round((finalScore / 10) * 100);
    }

    const rawMaxCups = unitData?.max_cups;
    let cupCapacity = Number(rawMaxCups);
    if (!Number.isFinite(cupCapacity) || cupCapacity <= 0) {
      cupCapacity = 1;
    }
    const cupsEarned = Math.min(cupCapacity, Math.round((scorePercent / 100) * cupCapacity));

    try {
      await coursesAPI.submitUnitAnswers(parseInt(lessonId, 10), {
        content_text: assessmentResults?.transcription || null,
        content_url: null,
        score: cupsEarned,
        time_spent: timeSpent
      });
      setIsCompleted(true);
    } catch (submitErr) {
      console.error('Không thể lưu kết quả Speaking:', submitErr);
      showError('Không thể lưu kết quả Speaking. Vui lòng thử lại.');
      setIsFinalizing(false);
      return false;
    }

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

    setCompletionSaved(true);
    setIsFinalizing(false);

    if (redirect) {
      navigate('/learning-profile');
    }

    return true;
  };

  const handleFinishExercise = async () => {
    const success = await handleComplete({ redirect: false });
    if (success) {
      setShowCompletionMessage(true);
    }
  };

  // Load speaking data from API
  useEffect(() => {
    let isMounted = true;

    const fetchSpeakingData = async () => {
      if (!lessonId) return;

      try {
        setLoading(true);
        setError(null);

        let matchedUnit = null;
        let course = null;

        if (courseId) {
          try {
            const units = await coursesAPI.getUnits(courseId);
            matchedUnit = units.find((u) => u.id === parseInt(lessonId, 10)) || null;
            if (isMounted && matchedUnit) {
              setUnitData(matchedUnit);
            }
          } catch (unitErr) {
            console.warn('Không thể tải thông tin unit Speaking:', unitErr);
          }

          try {
            course = await coursesAPI.getCourse(courseId);
          } catch (courseErr) {
            console.warn('Không thể tải thông tin khóa học Speaking:', courseErr);
          }
        }

        let promptLoaded = false;
        try {
          const promptData = await getSpeakingPrompt(lessonId);

          let tips = promptData.tips;
          if (typeof tips === 'string') {
            tips = safeParseJSON(tips, []);
          }

          let vocabulary = promptData.vocabulary;
          if (typeof vocabulary === 'string') {
            vocabulary = safeParseJSON(vocabulary, {});
          }

          if (isMounted) {
            setSpeakingData({
              id: promptData.id,
              title: promptData.title,
              courseTitle: promptData.course_title || course?.title || 'Speaking',
              difficulty: promptData.difficulty || matchedUnit?.difficulty || course?.level || 'Intermediate',
              estimatedTime: Math.ceil((Number(promptData.preparation_time || 0) + Number(promptData.response_time || 0)) / 60) || 10,
              totalQuestions: 1,
              preparation_time: promptData.preparation_time,
              response_time: promptData.response_time,
              questions: [
                {
                  id: promptData.id,
                  question: promptData.prompt,
                  instruction: promptData.instruction,
                  context: promptData.context,
                  timeLimit: Number(promptData.response_time) || 120,
                  minSentences: 2,
                  audioUrl: promptData.sample_audio_url,
                  tips: Array.isArray(tips) ? tips : [],
                  vocabulary: vocabulary || {},
                  sampleResponse: promptData.sample_response,
                  criteria: Array.isArray(promptData.criteria) ? promptData.criteria : []
                }
              ]
            });
          }
          promptLoaded = true;
        } catch (apiErr) {
          if (apiErr?.response?.status !== 404) {
            console.warn('Không thể tải dữ liệu Speaking mới:', apiErr);
          }
        }

        if (promptLoaded) {
          return;
        }

        try {
          const numericLessonId = parseInt(lessonId, 10);
          const legacyQuestions = await coursesAPI.getQuestions(numericLessonId);

          if (!Array.isArray(legacyQuestions) || legacyQuestions.length === 0) {
            throw new Error('Bài nói này chưa có nội dung để luyện.');
          }

          const normalizedQuestions = legacyQuestions.map((question, index) => {
            const rawAnswer = typeof question.answer !== 'undefined' ? question.answer : question.answer_json;
            const parsedAnswer = safeParseJSON(rawAnswer, {});

            const instruction = parsedAnswer.instruction
              || (Array.isArray(parsedAnswer.instructions) ? parsedAnswer.instructions[0] : null)
              || 'Ghi âm câu trả lời của bạn cho câu hỏi sau';

            const tipsValue = parsedAnswer.tips ?? parsedAnswer.hints;
            let tips = Array.isArray(tipsValue) ? tipsValue : [];
            if (!Array.isArray(tips) && typeof tipsValue === 'string') {
              tips = safeParseJSON(tipsValue, []);
            }

            let vocabulary = parsedAnswer.vocabulary ?? {};
            if (typeof vocabulary === 'string') {
              vocabulary = safeParseJSON(vocabulary, {});
            }

            const prepTime = Number(parsedAnswer.preparation_time ?? parsedAnswer.prep_time ?? 30);
            const responseTime = Number(parsedAnswer.response_time ?? parsedAnswer.time_limit ?? parsedAnswer.duration ?? 60);
            const minSentences = Number(parsedAnswer.min_sentences ?? parsedAnswer.minSentences ?? 2);

            return {
              id: question.id,
              question: question.prompt || parsedAnswer.prompt || `Câu hỏi ${index + 1}`,
              instruction,
              context: parsedAnswer.context || parsedAnswer.topic || '',
              preparationTime: Number.isFinite(prepTime) ? prepTime : 30,
              timeLimit: Number.isFinite(responseTime) ? responseTime : 60,
              minSentences: Number.isFinite(minSentences) ? minSentences : 2,
              audioUrl: question.media_url || parsedAnswer.sample_audio_url || parsedAnswer.audio_url || null,
              tips,
              vocabulary,
              sampleResponse: parsedAnswer.sample_response ?? parsedAnswer.sampleResponse ?? null,
              criteria: Array.isArray(parsedAnswer.criteria) ? parsedAnswer.criteria : [],
            };
          });

          const validQuestions = normalizedQuestions.filter((q) => q.question && typeof q.question === 'string');
          if (!validQuestions.length) {
            throw new Error('Không có câu hỏi Speaking hợp lệ trong bài này.');
          }

          const totalTimeSeconds = validQuestions.reduce((total, q) => {
            const prep = Number.isFinite(q.preparationTime) ? q.preparationTime : 0;
            const speak = Number.isFinite(q.timeLimit) ? q.timeLimit : 0;
            return total + prep + speak;
          }, 0);
          const estimatedTime = Math.max(1, Math.ceil(totalTimeSeconds / 60));

          if (isMounted) {
            setSpeakingData({
              id: lessonId,
              title: matchedUnit?.title || course?.title || 'Speaking Unit',
              courseTitle: course?.title || 'Speaking',
              difficulty: matchedUnit?.difficulty || course?.level || 'Intermediate',
              estimatedTime,
              totalQuestions: validQuestions.length,
              preparation_time: validQuestions[0]?.preparationTime ?? 30,
              response_time: validQuestions[0]?.timeLimit ?? 60,
              questions: validQuestions,
            });
          }
        } catch (legacyErr) {
          console.error('Không thể tải dữ liệu Speaking từ câu hỏi cũ:', legacyErr);
          if (isMounted) {
            setError(legacyErr.message || 'Không thể tải bài tập speaking. Vui lòng thử lại sau.');
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải bài Speaking:', err);
        if (isMounted) {
          setError('Không thể tải bài tập speaking. Vui lòng thử lại sau.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSpeakingData();

    return () => {
      isMounted = false;
    };
  }, [lessonId, courseId]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
      } catch {
        /* Error stopping media recorder - ignore */
      }
      objectUrlSetRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlSetRef.current.clear();
    };
  }, []);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      setRecordingError(null);

      if (!window.isSecureContext) {
        const message = 'Trình duyệt yêu cầu kết nối an toàn (https hoặc localhost) để ghi âm.';
        setRecordingError(message);
        showWarning(message);
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        const message = 'Trình duyệt của bạn không hỗ trợ ghi âm (getUserMedia).';
        setRecordingError(message);
        showWarning(message);
        return;
      }

      if (typeof window.MediaRecorder === 'undefined') {
        const message = 'Trình duyệt của bạn chưa hỗ trợ MediaRecorder. Vui lòng dùng Chrome, Edge hoặc Firefox phiên bản mới.';
        setRecordingError(message);
        showWarning(message);
        return;
      }

      // Reset previous recording
      audioChunksRef.current = [];
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        objectUrlSetRef.current.delete(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/webm'
      ];

      let options;
      let selectedMime = '';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        for (const c of mimeCandidates) {
          if (MediaRecorder.isTypeSupported(c)) {
            options = { mimeType: c };
            selectedMime = c;
            break;
          }
        }
      }

      const recorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        try {
          const mimeType = recorder.mimeType || selectedMime || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          objectUrlSetRef.current.add(url);
          setAudioBlob(blob);
          setAudioUrl(url);
        } finally {
          try {
            recorder.stream?.getTracks().forEach(t => t.stop());
          } catch {}
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      const message = error?.name === 'NotAllowedError'
        ? 'Bạn đã từ chối quyền truy cập micro. Hãy bật lại quyền trong cài đặt trình duyệt và thử lại.'
        : 'Không thể truy cập microphone!';
      setRecordingError(message);
      showError(message);
      try {
        mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
      } catch (cleanupError) {
        // noop
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    const r = mediaRecorderRef.current;
    if (!r || !isRecording) return;
    try {
      if (r.state !== 'inactive') r.stop();
    } finally {
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
      showWarning('Vui lòng ghi âm trước khi nộp bài');
      return;
    }

    setIsAssessing(true);
    setRecordingError(null);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('reference_text', currentQuestionData.question);

      // Call API
      const response = await apiClient.post('/api/v1/ai/speaking-practice/assess', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Store results
      setAssessmentResults(response.data);
      setShowResults(true);

    } catch (error) {
      console.error('[submitRecording] Error:', error);
      setRecordingError(error.response?.data?.detail || 'Không thể chấm điểm. Vui lòng thử lại.');
    } finally {
      setIsAssessing(false);
    }
  };

  // Manual upload fallback
  const onSelectAudioFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setRecordingError(null);
    try {
      const url = URL.createObjectURL(file);
      objectUrlSetRef.current.add(url);
      setAudioBlob(file);
      setAudioUrl(url);
    } finally {
      e.target.value = '';
    }
  };

  // Calculate score from results
  const calculateScore = () => {
    if (!assessmentResults) return 0;
    // Use score from API
    return Math.round(assessmentResults.score * 10) / 10;
  };

  // Get current results (from API or fallback to mock for display)
  const currentResults = assessmentResults || mockResults;

  // Next question
  const nextQuestion = () => {
    if (currentQuestion < speakingData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowResults(false);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
    } else {
      handleFinishExercise();
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
    setCompletionSaved(false);
    setIsFinalizing(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="speaking-exercise-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
          <Loader2 size={48} className="animate-spin" style={{ color: '#4F46E5' }} />
          <p style={{ color: '#6B7280' }}>Đang tải bài tập speaking...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !speakingData) {
    return (
      <div className="speaking-exercise-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
          <AlertCircle size={48} style={{ color: '#EF4444' }} />
          <p style={{ color: '#EF4444' }}>{error || 'Không tìm thấy bài tập'}</p>
          <button 
            onClick={() => navigate(`/course/${courseId}`)}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#4F46E5', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

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

            {/* Error and fallback */}
            {recordingError && (
              <p className="recording-error-message" style={{ color: '#b91c1c', marginTop: 8 }}>{recordingError}</p>
            )}
            <div className="upload-fallback" style={{ marginTop: 12 }}>
              <span>Không ghi âm được? Tải file âm thanh: </span>
              <input type="file" accept="audio/*" onChange={onSelectAudioFile} />
            </div>
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
                  <span className="tab-number good">{currentResults.feedback.goodExpressions}</span>
                  Diễn đạt hay
                </button>
                <button className="tab-btn">
                  <span className="tab-number error">{currentResults.feedback.errors}</span>
                  Lỗi trong bài
                </button>
              </div>
            </div>

            <div className="results-content">
              <div className="transcription-section">
                <p className="transcription-text">
                  {currentResults.transcription || 'Không nhận diện được giọng nói'}
                </p>
              </div>

              {currentResults.aiGeneratedFeedback && (
                <div className="ai-feedback-section" style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap'
                }}>
                  <h4 style={{ marginBottom: '10px', color: '#6366f1' }}>📝 Nhận xét chi tiết từ AI</h4>
                  <div style={{ lineHeight: '1.6' }}>
                    {currentResults.aiGeneratedFeedback}
                  </div>
                </div>
              )}

              {currentResults.detailedFeedback && currentResults.detailedFeedback.length > 0 && (
                <div className="detailed-errors" style={{ marginTop: '20px' }}>
                  <h4>Chi tiết lỗi và gợi ý:</h4>
                  {currentResults.detailedFeedback.map((item, index) => (
                    <div key={index} className={`feedback-item ${item.type}`} style={{
                      padding: '10px',
                      margin: '8px 0',
                      borderLeft: `3px solid ${item.type === 'error' ? '#ef4444' : '#22c55e'}`,
                      backgroundColor: item.type === 'error' ? '#fee' : '#efe'
                    }}>
                      <strong>{item.text}</strong>
                      {item.suggestion && <span> → {item.suggestion}</span>}
                      {item.explanation && <p style={{ marginTop: '5px', fontSize: '0.9em' }}>{item.explanation}</p>}
                      {item.comment && <p style={{ marginTop: '5px', fontSize: '0.9em' }}>{item.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div className="feedback-summary">
                <p>{currentResults.transcription ? `Bạn đã nói: "${currentResults.transcription}"` : 'Nhận xét trên nội dung bài nói'}</p>
              </div>

              <div className="score-breakdown">
                <div className="score-item">
                  <span className="score-label">Pronunciation</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(currentResults.pronunciation / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{currentResults.pronunciation}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Fluency</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(currentResults.fluency / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{currentResults.fluency}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Grammar</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(currentResults.grammar / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{currentResults.grammar}/10</span>
                </div>
                <div className="score-item">
                  <span className="score-label">Vocabulary</span>
                  <div className="score-bar">
                    <div
                      className="score-fill"
                      style={{ width: `${(currentResults.vocabulary / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{currentResults.vocabulary}/10</span>
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
              disabled={!audioBlob || isCompleted || isAssessing}
            >
              {isAssessing ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Đang chấm điểm...
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
            onClick={currentQuestion < speakingData.questions.length - 1 ? nextQuestion : handleFinishExercise}
            disabled={isFinalizing}
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
                onClick={() => handleComplete({ redirect: true })}
                disabled={isFinalizing}
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
};

export default SpeakingExercise;
