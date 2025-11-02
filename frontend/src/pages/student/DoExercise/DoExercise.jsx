import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Clock, Save, Send, Volume2, Mic, Play, Pause, RotateCcw,
  Check, X, FileText, AlertCircle, Zap, BookOpen, Headphones, PenLine, CheckCircle, Target
} from 'lucide-react';
import './DoExercise.css';
import { apiV1 } from '../../../services/api';
import Toast from '../../../components/Toast/Toast';
import useToast from '../../../hooks/useToast';

export default function DoExercise() {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedViewMode = location.state?.viewMode; // 'result' if coming from "Xem kết quả"
  
  // Full screen management
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [fullscreenWarningCount, setFullscreenWarningCount] = useState(0);
  const isFullscreenRef = useRef(false); // Use ref to avoid re-render loops
  const viewModeRef = useRef('exercise');
  const showStartScreenRef = useRef(true);
  
  const [exercise, setExercise] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [viewMode, setViewMode] = useState('exercise'); // 'exercise' or 'result'
  
  // For Speaking
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null); // { url, blob, mimeType }
  const [recordingError, setRecordingError] = useState(null);
  const [prepTime, setPrepTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const objectUrlRef = useRef(new Set());
  const generalFileInputRef = useRef(null);
  const questionFileInputRefs = useRef({});
  // For comprehensive test speaking per-question
  const [activeSpeakingQ, setActiveSpeakingQ] = useState(null);
  const [speakingAnswers, setSpeakingAnswers] = useState({}); // qId -> { url, blob, mimeType }
  
  // For Writing
  const [wordCount, setWordCount] = useState(0);
  const [content, setContent] = useState('');
  // For comprehensive test writing per-question
  const [writingAnswers, setWritingAnswers] = useState({}); // qId -> text
  const [writingCounts, setWritingCounts] = useState({}); // qId -> number
  
  useEffect(() => {
    fetchExercise();
    fetchSubmission();
    
    // If coming from "Xem kết quả" button, force result view
    if (requestedViewMode === 'result') {
      setViewMode('result');
      setShowStartScreen(false);

    }
  }, [exerciseId, requestedViewMode]);
  
  // Sync refs with state
  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);
  
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);
  
  useEffect(() => {
    showStartScreenRef.current = showStartScreen;
  }, [showStartScreen]);
  
  // Separate effect for fullscreen management based on viewMode
  useEffect(() => {
    // Only enable fullscreen blocking when already in fullscreen and in exercise mode
    if (viewMode === 'exercise' && isFullscreen && !showStartScreen) {
      let reenterTimeout = null;
      
      // Block fullscreen exit - re-enter immediately
      const preventExit = () => {
        const isInFullscreen = !!(
          document.fullscreenElement || 
          document.webkitFullscreenElement || 
          document.mozFullScreenElement || 
          document.msFullscreenElement
        );
        
        if (!isInFullscreen && viewModeRef.current === 'exercise' && !showStartScreenRef.current) {
          // Fullscreen was exited, schedule re-enter
          if (reenterTimeout) clearTimeout(reenterTimeout);
          
          reenterTimeout = setTimeout(() => {
            if (viewModeRef.current === 'exercise' && !showStartScreenRef.current && isFullscreenRef.current) {

              enterFullscreen();
              setFullscreenWarningCount(prev => prev + 1);
            }
          }, 200);
        }
      };
      
      // Prevent ESC key, F11, and other fullscreen exit shortcuts
      const preventKeys = (e) => {
        // Block ESC key
        if (e.key === 'Escape' || e.keyCode === 27) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        // Block F11 (fullscreen toggle)
        if (e.key === 'F11' || e.keyCode === 122) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        // Block Cmd+Shift+F (Mac fullscreen)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      };
      
      // Add listeners with capture phase for maximum priority
      document.addEventListener('fullscreenchange', preventExit, true);
      document.addEventListener('webkitfullscreenchange', preventExit, true);
      document.addEventListener('mozfullscreenchange', preventExit, true);
      document.addEventListener('MSFullscreenChange', preventExit, true);
      
      document.addEventListener('keydown', preventKeys, { capture: true, passive: false });
      document.addEventListener('keyup', preventKeys, { capture: true, passive: false });
      document.addEventListener('keypress', preventKeys, { capture: true, passive: false });
      
      // Also prevent via window
      window.addEventListener('keydown', preventKeys, { capture: true, passive: false });
      
      return () => {
        if (reenterTimeout) clearTimeout(reenterTimeout);
        
        document.removeEventListener('fullscreenchange', preventExit, true);
        document.removeEventListener('webkitfullscreenchange', preventExit, true);
        document.removeEventListener('mozfullscreenchange', preventExit, true);
        document.removeEventListener('MSFullscreenChange', preventExit, true);
        
        document.removeEventListener('keydown', preventKeys, true);
        document.removeEventListener('keyup', preventKeys, true);
        document.removeEventListener('keypress', preventKeys, true);
        
        window.removeEventListener('keydown', preventKeys, true);
      };
    } else if (requestedViewMode === 'result') {
      // Exit fullscreen when in result view
      exitFullscreen();
    }
  }, [viewMode, isFullscreen, showStartScreen]);
  
  // Fullscreen functions
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);

      return true;
    } catch (error) {

      // Only show error on initial attempt, not on re-entry
      if (showStartScreenRef.current) {
        showError('Không thể vào chế độ toàn màn hình. Vui lòng thử lại hoặc cho phép quyền fullscreen trong trình duyệt.');
      }
      return false;
    }
  };
  
  // Start exercise with fullscreen
  const handleStartExercise = async () => {
    const success = await enterFullscreen();
    if (success) {
      setShowStartScreen(false);
      // Start timer if needed
      if (exercise?.duration && timeRemaining === null) {
        setTimeRemaining(exercise.duration * 60);
      }
    }
  };
  
  const exitFullscreen = () => {
    try {
      // Check if document is actually in fullscreen mode
      const isInFullscreen = document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.msFullscreenElement;
      
      if (!isInFullscreen) {
        setIsFullscreen(false);
        return;
      }
      
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {

      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    // Timer
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmit();
    }
  }, [timeRemaining]);

  useEffect(() => {
    return () => {
      objectUrlRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlRef.current.clear();

      try {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
      } catch (error) {

      }
      
      // Exit fullscreen when component unmounts
      exitFullscreen();
    };
  }, []);

  const fetchExercise = async () => {
    try {

      const response = await apiV1.get(`/exercises/${exerciseId}`);



      setExercise(response.data);
      
      // Initialize answers
      if (response.data.content && response.data.content.questions) {

        const initialAnswers = {};
        response.data.content.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      }
      
      // Set timer if applicable (but don't start it yet)
      if (response.data.duration) {

        // Don't set timer here, will be set when user clicks Start
      }
      
      setLoading(false);
    } catch (error) {
      console.error('[DoExercise] Error fetching exercise:', error);
      console.error('[DoExercise] Error details:', error.response?.data);
      setLoading(false);
    }
  };

  const fetchSubmission = async () => {
    try {

      const response = await apiV1.get(`/exercises/my-submissions`);

      
      // Find submission for this exercise
      const exerciseSubmission = response.data.find(s => s.exercise_id === parseInt(exerciseId));

      
      if (exerciseSubmission) {
        // Check grading status
        const gradingStatus = exerciseSubmission.grading_status;
        const hasScore = exerciseSubmission.score !== null || exerciseSubmission.ai_score !== null;
        
        // Show result view if:
        // 1. Coming from "Xem kết quả" button (requestedViewMode === 'result') OR
        // 2. Has final score (teacher reviewed) OR
        // 3. Has AI score and grading completed (ai_graded) OR
        // 4. Teacher has reviewed
        const shouldShowResult = requestedViewMode === 'result' || (hasScore && (
          exerciseSubmission.teacher_reviewed === true ||
          gradingStatus === 'ai_graded' ||
          gradingStatus === 'graded'
        ));
        
        setSubmission(exerciseSubmission);
        
        if (shouldShowResult) {
          setViewMode('result');
          setShowStartScreen(false);

        } else {
          setShowStartScreen(false);}
      }
    } catch (error) {
      console.error('[DoExercise] Error fetching submission:', error);
    }
  };

  const handleAnswerChange = (questionId, value) => {

    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };
  
  // Helper to safely render any value (prevent React error #31)
  const safeRenderValue = (value, questionType = null) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') {
      // If it's an array, join with commas
      if (Array.isArray(value)) {
        return value.map(v => safeRenderValue(v)).join(', ');
      }
      // If it's a matching question answer (object with pairs)
      // Display as "pair1 → answer1; pair2 → answer2"
      if (questionType === 'matching' || Object.keys(value).every(k => !isNaN(k))) {
        const pairs = Object.entries(value)
          .map(([idx, val]) => `Cặp ${parseInt(idx) + 1}: ${val}`)
          .join('; ');
        return pairs || JSON.stringify(value);
      }
      // If it's a complex nested object, render it as structured data
      // Don't show raw JSON - it's confusing for users
      return '[Dữ liệu phức tạp]';
    }
    return String(value);
  };
  
  // Helper to handle matching questions safely
  const handleMatchingChange = (questionId, pairIndex, value) => {
    setAnswers(prev => {
      const currentMatching = typeof prev[questionId] === 'object' && prev[questionId] !== null 
        ? prev[questionId] 
        : {};
      
      const newMatching = { ...currentMatching, [pairIndex]: value };
      return { ...prev, [questionId]: newMatching };
    });
  };

  const handleSaveDraft = async () => {
    try {
      await apiV1.post(`/exercises/${exerciseId}/save-draft`, {
        answers,
        content_text: exercise.skill_type === 'writing' ? content : null,
        content_url: exercise.skill_type === 'speaking' ? recordedAudio?.url || null : null
      });
      showSuccess('Đã lưu nháp!');
    } catch (error) {
      console.error('Error saving draft:', error);
      showError('Lỗi khi lưu nháp!');
    }
  };

  const getAudioExtension = (mimeType = '') => {
    if (!mimeType) return 'webm';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('mpeg')) return 'mp3';
    return 'webm';
  };

  const handleSubmit = async () => {
    if (!confirm('Bạn có chắc muốn nộp bài?')) return;setIsSubmitting(true);
    try {
      // Prepare submission data
      const formData = new FormData();
      
      // Keep uniqueQuestionId format (listening_1, reading_1) for backend
      // Backend will handle these prefixed keys
      if (answers && Object.keys(answers).length > 0) {
        formData.append('answers', JSON.stringify(answers));
      }
      
      // Add writing content if exists
      if (exercise.skill_type === 'writing' && content) {
        formData.append('content_text', content);
      }
      
      // Add speaking audio if exists
      if (exercise.skill_type === 'speaking' && recordedAudio?.blob) {
        const extension = getAudioExtension(recordedAudio.mimeType);
        const audioFile = new File(
          [recordedAudio.blob],
          `speaking_${Date.now()}.${extension}`,
          { type: recordedAudio.mimeType || 'audio/webm' }
        );
        formData.append('audio_file', audioFile);
      }

      // Comprehensive test: include first speaking audio and all writing answers into answers map
      if (!exercise.skill_type && exercise.content?.type === 'comprehensive_test') {
        // Map writing answers
        const mergedAnswers = { ...(answers || {}) };
        
        // Add writing_main answer
        if (writingAnswers['writing_main']) {
          mergedAnswers['writing_main'] = writingAnswers['writing_main'];
        }
        
        // Add other writing answers
        Object.entries(writingAnswers).forEach(([qid, txt]) => {
          if (qid !== 'writing_main') {
            mergedAnswers[qid] = txt;
          }
        });
        
        // Handle speaking_main audio
        if (speakingAnswers['speaking_main']?.blob) {
          try {
            const audioData = speakingAnswers['speaking_main'];
            const extension = getAudioExtension(audioData.mimeType);
            const audioFile = new File(
              [audioData.blob],
              `speaking_main_${Date.now()}.${extension}`,
              { type: audioData.mimeType || 'audio/webm' }
            );
            formData.append('audio_file', audioFile);
            mergedAnswers['speaking_main'] = '[speaking-audio-attached]';
          } catch (e) {

          }
        }
        
        // Handle other speaking answers
        const speakingQIds = Object.keys(speakingAnswers).filter(
          (id) => id !== 'speaking_main' && speakingAnswers[id]?.blob
        );
        if (speakingQIds.length > 0) {
          const firstQId = speakingQIds[0];
          const audioData = speakingAnswers[firstQId];
          try {
            const extension = getAudioExtension(audioData.mimeType);
            const audioFile = new File(
              [audioData.blob],
              `speaking_${firstQId}_${Date.now()}.${extension}`,
              { type: audioData.mimeType || 'audio/webm' }
            );
            formData.append('audio_file', audioFile);
            mergedAnswers[firstQId] = '[speaking-audio-attached]';
          } catch (e) {

          }
        }
        
        if (Object.keys(mergedAnswers).length > 0) {
          // Replace answers payload
          formData.set('answers', JSON.stringify(mergedAnswers));
        }
      }
      
      const res = await apiV1.post(`/exercises/${exerciseId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const sub = res?.data;
      if (sub) {
        setSubmission(sub);
        setViewMode('result');
        // Exit fullscreen when viewing results
        exitFullscreen();
      }
      showSuccess('Nộp bài thành công! Hệ thống đã chấm tự động nếu có thể.');
    } catch (error) {
      console.error('Error submitting:', error);
      showError('Lỗi khi nộp bài: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Speaking functions
  const startRecording = async (questionIdOrEvent = null) => {
    // Normalize param: if called as onClick handler without args, first arg is the event
    const qid = (questionIdOrEvent && typeof questionIdOrEvent === 'object' && (questionIdOrEvent.nativeEvent || questionIdOrEvent.target))
      ? null
      : questionIdOrEvent;try {
      setRecordingError(null);


      // Allow localhost/127.0.0.1 even if secureContext is false (older browsers)
      if (!window.isSecureContext) {

        const host = window.location.hostname;

        const isLocal = host === 'localhost' || host === '127.0.0.1';
        if (!isLocal) {
          const message = 'Trình duyệt yêu cầu kết nối an toàn (https hoặc localhost) để ghi âm.';
          setRecordingError(message);
          showWarning(message);
          console.error('[startRecording] BLOCKED: not secure context and not local');
          return;
        }

      }

      if (!navigator.mediaDevices?.getUserMedia) {
        const message = 'Trình duyệt của bạn không hỗ trợ ghi âm (getUserMedia).';
        setRecordingError(message);
        showWarning(message);
        console.error('[startRecording] BLOCKED: getUserMedia not supported');
        return;
      }


      if (typeof window.MediaRecorder === 'undefined') {
        const message = 'Trình duyệt của bạn chưa hỗ trợ MediaRecorder. Vui lòng dùng Chrome, Edge hoặc Firefox phiên bản mới.';
        setRecordingError(message);
        showWarning(message);
        console.error('[startRecording] BLOCKED: MediaRecorder not defined');
        return;
      }


      // Release any previous recording for this slot
      if (qid) {
        const prev = speakingAnswers[qid];
        if (prev?.url) {
          URL.revokeObjectURL(prev.url);
          objectUrlRef.current.delete(prev.url);

        }
      } else if (recordedAudio?.url) {
        URL.revokeObjectURL(recordedAudio.url);
        objectUrlRef.current.delete(recordedAudio.url);
        setRecordedAudio(null);

      }


      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });


      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/webm'
      ];
      let recorderOptions;
      let selectedMime = '';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        for (const candidate of mimeCandidates) {
          if (MediaRecorder.isTypeSupported(candidate)) {
            recorderOptions = { mimeType: candidate };
            selectedMime = candidate;

            break;
          }
        }
      } else {

      }

      let recorder;
      try {
        recorder = recorderOptions ? new MediaRecorder(stream, recorderOptions) : new MediaRecorder(stream);

      } catch (e) {

        recorder = new MediaRecorder(stream);}
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      let hadData = false;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          hadData = true;

        }
      };

      recorder.onerror = (e) => {
        console.error('[Recorder] error:', e);
        setRecordingError('Có lỗi khi ghi âm. Vui lòng kiểm tra quyền micro và thử lại.');
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || selectedMime || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (!hadData || !audioBlob || audioBlob.size === 0) {

          setRecordingError('Không nhận được dữ liệu âm thanh. Hãy đảm bảo đã cho phép micro và thử lại, hoặc tải file âm thanh ở dưới.');
          try { recorder.stream?.getTracks().forEach(t => t.stop()); } catch {}
          return;
        }
        const audioUrl = URL.createObjectURL(audioBlob);
        objectUrlRef.current.add(audioUrl);
        const audioPayload = { url: audioUrl, blob: audioBlob, mimeType };

        // Ensure stream is fully released after stopping
        try { recorder.stream?.getTracks().forEach(t => t.stop()); } catch {}

        if (qid) {
          setSpeakingAnswers(prev => ({ ...prev, [qid]: audioPayload }));
          setActiveSpeakingQ(null);

        } else {
          setRecordedAudio(audioPayload);

        }
      };

      // Use a small timeslice to ensure dataavailable fires consistently across browsers

      try {
        recorder.start(200);} catch {
        recorder.start();}
      setIsRecording(true);
      if (qid) setActiveSpeakingQ(qid);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      console.error('[startRecording] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      const message = error?.name === 'NotAllowedError'
        ? 'Bạn đã từ chối quyền truy cập micro. Hãy bật lại quyền trong cài đặt trình duyệt và thử lại.'
        : 'Không thể truy cập microphone!';
      setRecordingError(message);
      showError(message);
      try {
        mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
      } catch (cleanupError) {

      }
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || !isRecording) {
      return;
    }

    try {
      if (recorder.state === 'recording') {
        // Flush remaining data chunk before stopping to avoid empty blob on some browsers
        try { recorder.requestData?.(); } catch {}
        recorder.stop();
      }
    } catch (error) {

    } finally {
      setIsRecording(false);
    }
  };

  const reRecord = async (questionId = null) => {

    audioChunksRef.current = [];

    if (questionId) {
      const prev = speakingAnswers[questionId];
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
        objectUrlRef.current.delete(prev.url);
      }
      setSpeakingAnswers(prevState => ({ ...prevState, [questionId]: null }));
      if (questionFileInputRefs.current[questionId]) {
        questionFileInputRefs.current[questionId].value = '';
      }
      // Start a fresh recording for this question
      try {
        await startRecording(questionId);
      } catch (e) {

      }
    } else {
      if (recordedAudio?.url) {
        URL.revokeObjectURL(recordedAudio.url);
        objectUrlRef.current.delete(recordedAudio.url);
      }
      setRecordedAudio(null);
      setRecordingError(null);
      if (generalFileInputRef.current) {
        generalFileInputRef.current.value = '';
      }
      // Start a fresh general speaking recording
      try {
        await startRecording();
      } catch (e) {

      }
    }
  };

  const handleAudioFileSelect = (event, questionId = null) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    setRecordingError(null);

    const mimeType = file.type || 'audio/webm';
    const audioUrl = URL.createObjectURL(file);
    objectUrlRef.current.add(audioUrl);

    if (questionId) {
      const prev = speakingAnswers[questionId];
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
        objectUrlRef.current.delete(prev.url);
      }
      setSpeakingAnswers(prevState => ({
        ...prevState,
        [questionId]: { url: audioUrl, blob: file, mimeType }
      }));
    } else {
      if (recordedAudio?.url) {
        URL.revokeObjectURL(recordedAudio.url);
        objectUrlRef.current.delete(recordedAudio.url);
      }
      setRecordedAudio({ url: audioUrl, blob: file, mimeType });
    }

    // Reset input to allow same file selection again if needed
    event.target.value = '';
  };

  // Writing functions
  const handleContentChange = (e) => {
    const text = e.target.value;
    setContent(text);
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải bài tập...</p>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="error-container">
        <AlertCircle size={64} />
        <h2>Không tìm thấy bài tập</h2>
        <button onClick={() => navigate('/exercise-hub')}>Quay lại</button>
      </div>
    );
  }

  const renderExerciseContent = () => {



    
    const { skill_type, content: exerciseContent } = exercise;
    



    // Check if content exists
    if (!exerciseContent) {
      console.error('[renderExerciseContent] exerciseContent is missing!');
      return (
        <div className="error-container">
          <AlertCircle size={64} />
          <h2>Bài tập chưa có nội dung</h2>
          <p>Giáo viên chưa thiết lập nội dung cho bài tập này.</p>
          <button 
            onClick={() => navigate('/exercise-hub')}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Quay lại danh sách
          </button>
        </div>
      );
    }

    // COMPREHENSIVE TEST (Mid-term/Final)
  if (!skill_type && exerciseContent.type === 'comprehensive_test') {

      
      const listening = exerciseContent.listening || {};
      const reading = exerciseContent.reading || {};
      const writing = exerciseContent.writing || {};
      const speaking = exerciseContent.speaking || {};
      

      
      // Get questions from each section
      const listeningQuestions = listening.questions || [];
      const readingQuestions = reading.questions || [];
      
      return (
        <div className="comprehensive-test-exercise">
          <div className="test-header">
            <h3>📝 Đề thi {exercise.type === 'midterm' ? 'Giữa kỳ' : 'Cuối kỳ'}</h3>
            <p className="test-subtitle">Tổng điểm: 10 điểm (4 phần x 2.5 điểm)</p>
          </div>
          
          {/* PART 1: LISTENING (2.5 điểm) */}
          <div className="test-section">
            <div className="section-header">
              <h4><Headphones className="inline-block w-5 h-5 mr-2" /> PHẦN 1: NGHE HIỂU (2.5 điểm)</h4>
            </div>
            
            {/* Audio Player */}
            {listening.audio_url && (
              <div className="audio-section">
                <div className="audio-player-custom">
                  <Volume2 size={32} />
                  <audio controls src={listening.audio_url} className="audio-element">
                    Your browser does not support audio.
                  </audio>
                </div>
                {listening.show_transcript && listening.transcript && (
                  <details className="transcript-section">
                    <summary>📄 Transcript</summary>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{listening.transcript}</p>
                  </details>
                )}
              </div>
            )}
            
            {/* Listening Questions */}
            {listeningQuestions.length > 0 && (
              <div className="questions-container">
                <p className="section-instruction">Nghe đoạn audio và trả lời các câu hỏi sau:</p>
                {listeningQuestions.map((q, idx) => {
                  // Create unique ID for this question within listening section
                  const uniqueQuestionId = `listening_${q.id}`;
                  
                  return (
                  <div key={idx} className="question-card">
                    <div className="question-header">
                      <span className="question-number">Câu {idx + 1}</span>
                      <span className="question-points">{q.points || 0.5} điểm</span>
                    </div>
                    <p className="question-text">{q.question}</p>

                    {q.type === 'multiple_choice' && (
                      <div className="options-list">
                        {q.options && q.options.map((opt, optIdx) => {
                          const optionLetter = opt.match(/^[A-D]\./)?.[0] || `${String.fromCharCode(65 + optIdx)}.`;
                          const optionText = opt.replace(/^[A-D]\.\s*/, '');
                          return (
                            <label key={optIdx} className="option-label">
                              <input
                                type="radio"
                                name={uniqueQuestionId}
                                value={optionLetter[0]}
                                checked={answers[uniqueQuestionId] === optionLetter[0]}
                                onChange={(e) => handleAnswerChange(uniqueQuestionId, e.target.value)}
                              />
                              <span>{optionLetter} {optionText}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    
                    {q.type === 'fill_blank' && (
                      <div className="fill-blank-input">
                        <input
                          type="text"
                          placeholder="Nhập câu trả lời..."
                          value={answers[uniqueQuestionId] || ''}
                          onChange={(e) => handleAnswerChange(uniqueQuestionId, e.target.value)}
                          className="text-input"
                        />
                      </div>
                    )}
                    
                    {q.type === 'true_false' && (
                      <div className="options-list">
                        <label className="option-label">
                          <input
                            type="radio"
                            name={uniqueQuestionId}
                            value="True"
                            checked={answers[uniqueQuestionId] === 'True'}
                            onChange={(e) => handleAnswerChange(uniqueQuestionId, e.target.value)}
                          />
                          <span>✓ True (Đúng)</span>
                        </label>
                        <label className="option-label">
                          <input
                            type="radio"
                            name={uniqueQuestionId}
                            value="False"
                            checked={answers[uniqueQuestionId] === 'False'}
                            onChange={(e) => handleAnswerChange(uniqueQuestionId, e.target.value)}
                          />
                          <span>✗ False (Sai)</span>
                        </label>
                      </div>
                    )}
                    
                    {q.type === 'matching' && q.pairs && (
                      <div className="matching-container">
                        <p className="matching-instruction">Ghép các cặp sau cho đúng:</p>
                        {q.pairs.map((pair, pairIdx) => {
                          const currentMatching = typeof answers[uniqueQuestionId] === 'object' && answers[uniqueQuestionId] !== null 
                            ? answers[uniqueQuestionId] 
                            : {};
                          
                          return (
                            <div key={pairIdx} className="matching-pair">
                              <div className="match-left">{pair.left}</div>
                              <div className="match-arrow">→</div>
                              <select
                                className="match-select"
                                value={currentMatching[pairIdx] || ''}
                                onChange={(e) => handleMatchingChange(uniqueQuestionId, pairIdx, e.target.value)}
                              >
                                <option value="">-- Chọn --</option>
                                {q.pairs.map((p, i) => (
                                  <option key={i} value={p.right}>{p.right}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* PART 2: READING (2.5 điểm) */}
          <div className="test-section">
            <div className="section-header">
              <h4>📖 PHẦN 2: ĐỌC HIỂU (2.5 điểm)</h4>
            </div>
            
            {/* Reading Passage */}
            {reading.passage && (
              <div className="reading-passage">
                <div className="passage-content">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{reading.passage}</p>
                </div>
              </div>
            )}
            
            {/* Reading Questions */}
            {readingQuestions.length > 0 && (
              <div className="questions-container">
                <p className="section-instruction">Đọc đoạn văn trên và trả lời các câu hỏi sau:</p>
                {readingQuestions.map((q, idx) => {
                  // Create unique ID for this question within reading section
                  const uniqueQuestionId = `reading_${q.id}`;
                  
                  return (
                  <div key={idx} className="question-card">
                    <div className="question-header">
                      <span className="question-number">Câu {idx + 1}</span>
                      <span className="question-points">{q.points || 0.5} điểm</span>
                    </div>
                    <p className="question-text">{q.question}</p>

                    {q.type === 'multiple_choice' && (
                      <div className="options-list">
                        {q.options && q.options.map((opt, optIdx) => {
                          const optionLetter = opt.match(/^[A-D]\./)?.[0] || `${String.fromCharCode(65 + optIdx)}.`;
                          const optionText = opt.replace(/^[A-D]\.\s*/, '');
                          return (
                            <label key={optIdx} className="option-label">
                              <input
                                type="radio"
                                name={uniqueQuestionId}
                                value={optionLetter[0]}
                                checked={answers[uniqueQuestionId] === optionLetter[0]}
                                onChange={(e) => handleAnswerChange(uniqueQuestionId, e.target.value)}
                              />
                              <span>{optionLetter} {optionText}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    
                    {q.type === 'fill_blank' && (
                      <div className="fill-blank-input">
                        <input
                          type="text"
                          placeholder="Nhập câu trả lời..."
                          value={answers[uniqueQuestionId] || ''}
                          onChange={(e) => handleAnswerChange(uniqueQuestionId, e.target.value)}
                          className="text-input"
                        />
                      </div>
                    )}
                    
                    {q.type === 'true_false' && (
                      <div className="options-list">
                        <label className="option-label">
                          <input
                            type="radio"
                            name={uniqueQuestionId}
                            value="True"
                            checked={answers[uniqueQuestionId] === 'True'}
                            onChange={(e) => handleAnswerChange(uniqueQuestionId, e.target.value)}
                          />
                          <span>✓ True (Đúng)</span>
                        </label>
                        <label className="option-label">
                          <input
                            type="radio"
                            name={uniqueQuestionId}
                            value="False"
                            checked={answers[uniqueQuestionId] === 'False'}
                            onChange={(e) => handleAnswerChange(uniqueQuestionId, e.target.value)}
                          />
                          <span>✗ False (Sai)</span>
                        </label>
                      </div>
                    )}
                    
                    {q.type === 'matching' && q.pairs && (
                      <div className="matching-container">
                        <p className="matching-instruction">Ghép các cặp sau cho đúng:</p>
                        {q.pairs.map((pair, pairIdx) => {
                          const currentMatching = typeof answers[uniqueQuestionId] === 'object' && answers[uniqueQuestionId] !== null 
                            ? answers[uniqueQuestionId] 
                            : {};
                          
                          return (
                            <div key={pairIdx} className="matching-pair">
                              <div className="match-left">{pair.left}</div>
                              <div className="match-arrow">→</div>
                              <select
                                className="match-select"
                                value={currentMatching[pairIdx] || ''}
                                onChange={(e) => handleMatchingChange(uniqueQuestionId, pairIdx, e.target.value)}
                              >
                                <option value="">-- Chọn --</option>
                                {q.pairs.map((p, i) => (
                                  <option key={i} value={p.right}>{p.right}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* PART 3: WRITING (2.5 điểm) */}
          <div className="test-section">
            <div className="section-header">
              <h4>✍️ PHẦN 3: VIẾT (2.5 điểm)</h4>
            </div>
            
            <div className="writing-section">
              {/* Writing Prompt */}
              {writing.prompt && (
                <div className="prompt-box">
                  <h5>Đề bài:</h5>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{writing.prompt}</p>
                </div>
              )}
              
              {/* Writing Instructions */}
              {writing.instructions && writing.instructions.length > 0 && (
                <div className="instructions-box">
                  <h5>Hướng dẫn:</h5>
                  <ul>
                    {writing.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Writing Word Count Info */}
              {(writing.min_words || writing.max_words) && (
                <p className="word-requirement">
                  Yêu cầu: {writing.min_words || 0} - {writing.max_words || 0} từ
                </p>
              )}
              
              {/* Writing Textarea */}
              <textarea
                className="writing-textarea"
                rows={12}
                placeholder="Nhập bài viết của bạn..."
                value={writingAnswers['writing_main'] || ''}
                onChange={(e) => {
                  const txt = e.target.value;
                  setWritingAnswers(prev => ({ ...prev, writing_main: txt }));
                  const words = txt.trim().split(/\s+/).filter(Boolean);
                  setWritingCounts(prev => ({ ...prev, writing_main: words.length }));
                }}
              />
              <div className="word-counter">
                Số từ hiện tại: {writingCounts['writing_main'] || 0}
              </div>
            </div>
          </div>
          
          {/* PART 4: SPEAKING (2.5 điểm) */}
          <div className="test-section">
            <div className="section-header">
              <h4>🗣️ PHẦN 4: NÓI (2.5 điểm)</h4>
            </div>
            
            <div className="speaking-section">
              {/* Speaking Prompt */}
              {speaking.prompt && (
                <div className="prompt-box">
                  <h5>Đề bài:</h5>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{speaking.prompt}</p>
                </div>
              )}
              
              {/* Speaking Instructions */}
              {speaking.instructions && speaking.instructions.length > 0 && (
                <div className="instructions-box">
                  <h5>Hướng dẫn:</h5>
                  <ul>
                    {speaking.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Speaking Time Info */}
              {(speaking.prep_time || speaking.speak_time) && (
                <p className="time-info">
                  ⏱️ Thời gian chuẩn bị: {speaking.prep_time || 60}s | 
                  Thời gian nói: {speaking.speak_time || 120}s
                </p>
              )}
              
              {/* Recording Area */}
              <div className="recording-area">
                {!isRecording && !speakingAnswers['speaking_main'] && (
                  <button className="btn-start-recording" onClick={() => startRecording('speaking_main')}>
                    <Mic size={24} />
                    Bắt đầu ghi âm
                  </button>
                )}

                {isRecording && activeSpeakingQ === 'speaking_main' && (
                  <div className="recording-active">
                    <div className="pulse-dot"></div>
                    <p>Đang ghi âm...</p>
                    <button className="btn-stop-recording" onClick={stopRecording}>
                      <Pause size={24} />
                      Dừng
                    </button>
                  </div>
                )}

                {speakingAnswers['speaking_main']?.url && (
                  <div className="recorded-section">
                    <audio controls src={speakingAnswers['speaking_main'].url} className="recorded-audio" />
                    <div className="recorded-actions">
                      <button className="btn-re-record" onClick={() => reRecord('speaking_main')}>
                        <RotateCcw size={18} />
                        Ghi lại
                      </button>
                    </div>
                  </div>
                )}

                {recordingError && (
                  <p className="recording-error-message">{recordingError}</p>
                )}
                
                <div className="upload-fallback">
                  <span>Hoặc tải file âm thanh:</span>
                  <input
                    type="file"
                    accept="audio/*"
                    ref={(el) => { questionFileInputRefs.current['speaking_main'] = el; }}
                    onChange={(e) => handleAudioFileSelect(e, 'speaking_main')}
                    style={{ display: 'block', marginTop: '8px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // LISTENING
    if (skill_type === 'listening') {

      return (
        <div className="listening-exercise">
          <div className="audio-section">
            <div className="audio-player-custom">
              <Volume2 size={32} />
              <audio controls src={exerciseContent.audio_url} className="audio-element">
                Your browser does not support audio.
              </audio>
            </div>
            {exerciseContent.show_transcript && (
              <details className="transcript-section">
                <summary>📄 Transcript</summary>
                <p>{exerciseContent.transcript}</p>
              </details>
            )}
          </div>

          <div className="questions-container">
            <h3>Câu hỏi</h3>
            {exerciseContent.questions && exerciseContent.questions.map((q, idx) => (
              <div key={q.id} className="question-card">
                <div className="question-header">
                  <span className="question-number">Câu {idx + 1}</span>
                  <span className="question-points">{q.points} điểm</span>
                </div>
                <p className="question-text">{q.question}</p>

                {q.type === 'multiple_choice' && (
                  <div className="options-list">
                    {q.options.map((opt, i) => (
                      <label key={i} className="option-label">
                        <input
                          type="radio"
                          name={`question_${q.id}`}
                          value={opt[0]}
                          checked={answers[q.id] === opt[0]}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'fill_blank' && (
                  <input
                    type="text"
                    className="answer-input"
                    placeholder="Nhập câu trả lời..."
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  />
                )}

                {q.type === 'true_false' && (
                  <div className="true-false-options">
                    <label className="tf-option">
                      <input
                        type="radio"
                        name={`question_${q.id}`}
                        value="true"
                        checked={answers[q.id] === 'true'}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      />
                      <Check size={18} />
                      <span>Đúng</span>
                    </label>
                    <label className="tf-option">
                      <input
                        type="radio"
                        name={`question_${q.id}`}
                        value="false"
                        checked={answers[q.id] === 'false'}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      />
                      <X size={18} />
                      <span>Sai</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // SPEAKING
    if (skill_type === 'speaking') {

      return (
        <div className="speaking-exercise">
          <div className="prompt-section">
            <h3>Đề bài</h3>
            <p className="prompt-text">{exerciseContent.prompt}</p>
          </div>

          <div className="instructions-box">
            <h4>Hướng dẫn:</h4>
            <ul>
              {exerciseContent.instructions && exerciseContent.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>

          <div className="recording-area">
            {!isRecording && !recordedAudio && (
              <button className="btn-start-recording" onClick={startRecording}>
                <Mic size={24} />
                Bắt đầu ghi âm
              </button>
            )}

            {isRecording && (
              <div className="recording-active">
                <div className="pulse-dot"></div>
                <p>Đang ghi âm...</p>
                <button className="btn-stop-recording" onClick={stopRecording}>
                  <Pause size={24} />
                  Dừng
                </button>
              </div>
            )}

            {recordedAudio && (
              <div className="recorded-section">
                <audio controls src={recordedAudio.url} className="recorded-audio" />
                <div className="recorded-actions">
                  <button className="btn-re-record" onClick={reRecord}>
                    <RotateCcw size={18} />
                    Ghi lại
                  </button>
                </div>
              </div>
            )}

            {recordingError && (
              <p className="recording-error-message">{recordingError}</p>
            )}

            <div className="upload-fallback">
              <span>Không ghi âm được? Tải file âm thanh:</span>
              <input
                type="file"
                accept="audio/*"
                ref={generalFileInputRef}
                onChange={(e) => handleAudioFileSelect(e)}
              />
            </div>
          </div>

          {exerciseContent.sample_answer && (
            <details className="sample-answer-section">
              <summary>💡 Xem bài mẫu</summary>
              <p>{exerciseContent.sample_answer}</p>
            </details>
          )}
        </div>
      );
    }

    // READING
    if (skill_type === 'reading') {

      return (
        <div className="reading-exercise">
          <div className="reading-layout">
            <div className="passage-panel">
              <div className="passage-content">
                <div className="passage-text">{exerciseContent.passage}</div>
                <div className="passage-info">
                  <span>📊 {exerciseContent.word_count} từ</span>
                </div>
              </div>
            </div>

            <div className="questions-panel">
              <h3>Câu hỏi</h3>
              {exerciseContent.questions && exerciseContent.questions.map((q, idx) => (
                <div key={q.id} className="question-card">
                  <div className="question-header">
                    <span className="question-number">Câu {idx + 1}</span>
                    <span className="question-points">{q.points} điểm</span>
                  </div>
                  <p className="question-text">{q.question}</p>

                  {/* Similar rendering logic as Listening */}
                  {q.type === 'multiple_choice' && (
                    <div className="options-list">
                      {q.options.map((opt, i) => (
                        <label key={i} className="option-label">
                          <input
                            type="radio"
                            name={`question_${q.id}`}
                            value={opt[0]}
                            checked={answers[q.id] === opt[0]}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'short_answer' && (
                    <textarea
                      className="short-answer-input"
                      placeholder="Nhập câu trả lời..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      rows="3"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // WRITING
    if (skill_type === 'writing') {




      
      if (!exerciseContent || !exerciseContent.word_limit) {
        console.error('[WRITING] Missing exerciseContent or word_limit!');
        return (
          <div className="error-container">
            <AlertCircle size={64} />
            <h2>Nội dung bài tập chưa đầy đủ</h2>
            <p>Vui lòng liên hệ giáo viên để cập nhật nội dung bài tập.</p>
          </div>
        );
      }
      
      const minWords = exerciseContent.word_limit.min;
      const maxWords = exerciseContent.word_limit.max;

      const progress = (wordCount / minWords) * 100;

      return (
        <div className="writing-exercise">
          <div className="prompt-section">
            <h3>Đề bài</h3>
            <p className="prompt-text">{exerciseContent.prompt}</p>
          </div>

          <div className="instructions-box">
            <h4>Yêu cầu:</h4>
            <ul>
              {exerciseContent.instructions && exerciseContent.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>

          <div className="editor-container">
            <div className="editor-stats">
              <span className={wordCount >= minWords ? 'text-success' : 'text-warning'}>
                📝 {wordCount} / {minWords} từ
                {wordCount >= minWords && ' ✅'}
              </span>
              <span>⏱️ {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
            </div>

            <textarea
              className="writing-editor"
              placeholder="Bắt đầu viết bài của bạn..."
              value={content}
              onChange={handleContentChange}
              rows="20"
            />

            <div className="word-progress">
              <div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} />
              <span className="progress-text">
                {wordCount < minWords
                  ? `Còn ${minWords - wordCount} từ để đạt yêu cầu`
                  : `✅ Đã đủ ${minWords} từ`}
              </span>
            </div>
          </div>

          {exerciseContent.sample_essay && (
            <details className="sample-answer-section">
              <summary>💡 Xem bài mẫu</summary>
              <div className="sample-content">{exerciseContent.sample_essay}</div>
            </details>
          )}
        </div>
      );
    }

    // Default fallback
    console.error('[renderExerciseContent] Unknown skill_type:', skill_type);
    console.error('[renderExerciseContent] exerciseContent:', exerciseContent);
    return (
      <div className="error-container">
        <AlertCircle size={64} />
        <h2>Loại bài tập không được hỗ trợ</h2>
        <p>Skill type: {skill_type || 'Không xác định'}</p>
        <p>Vui lòng liên hệ giáo viên.</p>
      </div>
    );
  };

  const renderResultView = () => {
    if (!submission || !exercise) return null;

    const gradingStatus = submission.grading_status;
    const teacherReviewed = submission.teacher_reviewed;
    
    // If still pending or grading, show waiting message
    // But if ai_graded, show results even without teacher review
    if (['pending', 'grading'].includes(gradingStatus)) {
      return (
        <div className="result-view-container">
          <div className="result-header">
            <div className="result-header-left">
              <h1>
                {exercise.skill_type === 'listening' && <Headphones className="inline-block w-6 h-6 mr-2" />}
                {exercise.skill_type === 'speaking' && <Mic className="inline-block w-6 h-6 mr-2" />}
                {exercise.skill_type === 'reading' && <BookOpen className="inline-block w-6 h-6 mr-2" />}
                {exercise.skill_type === 'writing' && <PenLine className="inline-block w-6 h-6 mr-2" />}
                {exercise.title}
              </h1>
              <p className="result-subtitle">Bài làm của bạn</p>
            </div>
          </div>

          <div className="result-info-card">
            <div className="info-item">
              <span className="info-label">📅 Ngày nộp:</span>
              <span className="info-value">{new Date(submission.submitted_at).toLocaleString('vi-VN')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">📊 Trạng thái:</span>
              <span className="info-value status-pending">
                {gradingStatus === 'pending' && '⏳ Đang chờ chấm điểm...'}
                {gradingStatus === 'grading' && '⚙️ Đang tự động chấm...'}
                {gradingStatus === 'ai_graded' && '👨‍🏫 Đang chờ giáo viên duyệt...'}
              </span>
            </div>
          </div>

          <div className="feedback-card">
            <h3>ℹ️ Thông báo</h3>
            <div className="feedback-content">
              <p>Bài làm của bạn đang được xử lý và chờ giáo viên chấm điểm.</p>
              <p>Bạn sẽ nhận được thông báo khi kết quả đã sẵn sàng.</p>
              {gradingStatus === 'ai_graded' && (
                <p><strong>Hệ thống đã tự động chấm xong, đang chờ giáo viên xem xét và phê duyệt.</strong></p>
              )}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => navigate('/student/exercises')}
                className="btn-primary"
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                🏠 Quay về danh sách bài tập
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Show full results (teacher reviewed)
    const effectiveScore = (submission.score ?? submission.ai_score);
    const gradedByAI = submission.score == null && submission.ai_score != null;
    const statusLabel = submission.status === 'graded'
      ? 'Đã chấm'
      : gradedByAI
        ? 'Đã chấm (AI)'
        : (submission.status === 'pending_review' ? 'Đang chờ duyệt' : (submission.status || '')); 

    return (
      <div className="result-view-container">
        {/* Header */}
        <div className="result-header">
          <div className="result-header-left">
            <h1>
              {exercise.skill_type === 'listening' && <Headphones className="inline-block w-6 h-6 mr-2" />}
              {exercise.skill_type === 'speaking' && <Mic className="inline-block w-6 h-6 mr-2" />}
              {exercise.skill_type === 'reading' && <BookOpen className="inline-block w-6 h-6 mr-2" />}
              {exercise.skill_type === 'writing' && <PenLine className="inline-block w-6 h-6 mr-2" />}
              {' '}
              {exercise.title}
            </h1>
            <p className="result-subtitle">Kết quả bài làm của bạn</p>
          </div>
          <div className="result-score-display">
            <div className="score-badge">
              <span className="score-number">{effectiveScore ?? '-'}</span>
              <span className="score-total">/{exercise.max_score || 10}</span>
            </div>
            <div className="score-label">{teacherReviewed ? 'Điểm đã duyệt' : 'Điểm'}</div>
          </div>
        </div>

        {/* Submission Info */}
        <div className="result-info-card">
          <div className="info-item">
            <span className="info-label">📅 Ngày nộp:</span>
            <span className="info-value">{new Date(submission.submitted_at).toLocaleString('vi-VN')}</span>
          </div>
          {submission.graded_at && (
            <div className="info-item">
              <span className="info-label">✅ Ngày chấm:</span>
              <span className="info-value">{new Date(submission.graded_at).toLocaleString('vi-VN')}</span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">📊 Trạng thái:</span>
            <span className="info-value status-graded">{statusLabel}</span>
          </div>
        </div>

        {/* Feedback */}
        {submission.feedback && (
          <div className="feedback-card">
            <h3>💬 Nhận xét của giáo viên</h3>
            <div className="feedback-content">
              {submission.feedback}
            </div>
          </div>
        )}

        {submission.ai_feedback && (
          <div className="feedback-card">
            <h3>📝 Nhận xét tổng quan</h3>
            <div className="feedback-content">
              {(() => {
                // First, try to parse if it's a JSON string
                let feedbackData = submission.ai_feedback;
                if (typeof feedbackData === 'string') {
                  try {
                    // Try to parse as JSON
                    feedbackData = JSON.parse(feedbackData);
                  } catch (e) {
                    // If JSON parse fails, might be Python dict string format (single quotes)
                    // Try converting Python dict string to JSON format
                    try {
                      // Replace single quotes with double quotes for JSON compatibility
                      const jsonStr = feedbackData
                        .replace(/'/g, '"')
                        .replace(/None/g, 'null')
                        .replace(/True/g, 'true')
                        .replace(/False/g, 'false');
                      feedbackData = JSON.parse(jsonStr);
                    } catch (e2) {
                      // Still not valid, treat as regular string
                    }
                  }
                }
                
                // If it's still a string (plain text feedback), display with line breaks
                if (typeof feedbackData === 'string') {
                  // Split by double newlines to create sections
                  const sections = feedbackData.split('\n\n').filter(s => s.trim());
                  
                  return (
                    <div className="formatted-feedback">
                      {sections.map((section, idx) => {
                        // Check if section starts with emoji icons
                        const hasIcon = /^[🎧📖✍️🗣️💡]/.test(section.trim());
                        
                        return (
                          <div key={idx} className={`feedback-section ${hasIcon ? 'with-icon' : ''}`}>
                            {section.split('\n').map((line, lineIdx) => (
                              <div key={lineIdx} className="feedback-line">
                                {line}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                
                // Handle object type (parsed JSON or direct object)
                if (typeof feedbackData === 'object' && feedbackData !== null) {
                  // If it has sections property
                  if (feedbackData.sections && Array.isArray(feedbackData.sections)) {
                    return (
                      <div className="formatted-feedback">
                        {feedbackData.sections.map((section, idx) => (
                          <div key={idx} className="feedback-section with-icon">
                            <div className="feedback-line"><strong>{section.title}</strong></div>
                            {section.content.split('\n').map((line, lineIdx) => (
                              <div key={lineIdx} className="feedback-line">
                                {line}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  // If it's a comprehensive feedback structure with nested objects, don't display raw
                  // This includes structures like {listening: {...}, reading: {...}, writing: {...}}
                  return <p>Nhận xét chi tiết có trong phần đánh giá từng kỹ năng bên dưới</p>;
                }
                
                // Fallback
                return <p>Chưa có nhận xét chi tiết</p>;
              })()}
            </div>
          </div>
        )}

        {/* Rubrics / Breakdown */}
        {submission.rubrics_scores && (
          <div className="feedback-card">
            <h3>📊 Chi tiết chấm điểm</h3>
            
            {/* Speaking Assessment - Detailed like teacher view */}
            {(submission.rubrics_scores.speaking_assessment || submission.rubrics_scores.speaking) && (
              <div className="rubric-section speaking-detailed">
                <h4><Mic className="inline-block w-5 h-5 mr-2" /> Đánh giá kỹ năng Speaking</h4>
                
                {/* KPI Scores Display */}
                {submission.rubrics_scores.speaking_assessment && (
                  <div className="kpi-scores-grid">
                    {['pronunciation', 'fluency', 'completeness', 'accuracy'].map((key) => {
                      const value = submission.rubrics_scores.speaking_assessment[key];
                      const labels = {
                        pronunciation: { name: 'Phát âm', icon: <Mic className="w-6 h-6" />, color: '#f59e0b' },
                        fluency: { name: 'Trôi chảy', icon: <Zap className="w-6 h-6" />, color: '#3b82f6' },
                        completeness: { name: 'Hoàn chỉnh', icon: <CheckCircle className="w-6 h-6" />, color: '#10b981' },
                        accuracy: { name: 'Chính xác', icon: <Target className="w-6 h-6" />, color: '#ef4444' }
                      };
                      if (typeof value !== 'number') return null;
                      return (
                        <div key={key} className="kpi-card" style={{ borderColor: labels[key].color }}>
                          <div className="kpi-icon">{labels[key].icon}</div>
                          <div className="kpi-value" style={{ color: labels[key].color }}>
                            {value.toFixed(1)}
                          </div>
                          <div className="kpi-label">{labels[key].name}</div>
                          <div className="kpi-progress-bar">
                            <div 
                              className="kpi-progress-fill" 
                              style={{ width: `${value}%`, backgroundColor: labels[key].color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Speaking Content Feedback */}
                {submission.rubrics_scores.speaking?.content && (
                  <div className="speaking-content-feedback">
                    {submission.rubrics_scores.speaking.content.content_feedback && (
                      <div className="feedback-item content-feedback">
                        <strong>📝 Nội dung:</strong>
                        <p>{submission.rubrics_scores.speaking.content.content_feedback}</p>
                      </div>
                    )}
                    
                    {submission.rubrics_scores.speaking.content.grammar_feedback && (
                      <div className="feedback-item grammar-feedback">
                        <strong>📐 Ngữ pháp:</strong>
                        <p>{submission.rubrics_scores.speaking.content.grammar_feedback}</p>
                      </div>
                    )}
                    
                    {submission.rubrics_scores.speaking.content.vocabulary_feedback && (
                      <div className="feedback-item vocabulary-feedback">
                        <strong>📚 Từ vựng:</strong>
                        <p>{submission.rubrics_scores.speaking.content.vocabulary_feedback}</p>
                      </div>
                    )}
                    
                    {submission.rubrics_scores.speaking.content.pronunciation_note && (
                      <div className="feedback-item pronunciation-feedback">
                        <strong>🗣️ Phát âm:</strong>
                        <p>{submission.rubrics_scores.speaking.content.pronunciation_note}</p>
                      </div>
                    )}
                    
                    {/* Strengths */}
                    {Array.isArray(submission.rubrics_scores.speaking.content.strengths) && 
                     submission.rubrics_scores.speaking.content.strengths.length > 0 && (
                      <div className="feedback-item strengths">
                        <strong>💪 Điểm mạnh:</strong>
                        <ul>
                          {submission.rubrics_scores.speaking.content.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Improvements */}
                    {Array.isArray(submission.rubrics_scores.speaking.content.improvements) && 
                     submission.rubrics_scores.speaking.content.improvements.length > 0 && (
                      <div className="feedback-item improvements">
                        <strong>📈 Cần cải thiện:</strong>
                        <ul>
                          {submission.rubrics_scores.speaking.content.improvements.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {Array.isArray(submission.rubrics_scores.speaking.content.suggestions) && 
                     submission.rubrics_scores.speaking.content.suggestions.length > 0 && (
                      <div className="feedback-item suggestions">
                        <strong>💡 Gợi ý:</strong>
                        <ul>
                          {submission.rubrics_scores.speaking.content.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Overall Comment */}
                    {submission.rubrics_scores.speaking.content.overall_comment && (
                      <div className="feedback-item overall-comment">
                        <strong>💬 Nhận xét tổng quan:</strong>
                        <p>{submission.rubrics_scores.speaking.content.overall_comment}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Recognized Text */}
                {submission.rubrics_scores.recognized_text && (
                  <div className="recognized-text-section">
                    <strong>📝 Văn bản nhận dạng được:</strong>
                    <div className="recognized-text-content">
                      {submission.rubrics_scores.recognized_text}
                    </div>
                    <small className="hint-text">Văn bản được Azure Speech API nhận dạng từ audio của bạn</small>
                  </div>
                )}
              </div>
            )}
            
            {/* Writing breakdown */}
            {submission.rubrics_scores.writing_assessment && (
              <div className="rubric-section">
                <h4>✍️ Đánh giá kỹ năng Writing</h4>
                
                {/* Writing Assessment Grid */}
                <div className="writing-assessment-grid">
                  {Object.entries(submission.rubrics_scores.writing_assessment).map(([k, v]) => (
                    <div key={k} className="assessment-item">
                      <span className="assessment-label">{k}:</span>
                      <span className="assessment-value">{safeRenderValue(v)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Word Count */}
                {submission.rubrics_scores.word_count != null && (
                  <div className="word-count-display">
                    <strong>📊 Số từ:</strong> {submission.rubrics_scores.word_count}
                  </div>
                )}
                
                {/* Writing Content Feedback */}
                {submission.rubrics_scores.writing && submission.rubrics_scores.writing.content && (
                  <div className="speaking-content-feedback">
                    {submission.rubrics_scores.writing.content.content_feedback && (
                      <div className="feedback-item content-feedback">
                        <strong>📝 Nội dung:</strong>
                        <p>{submission.rubrics_scores.writing.content.content_feedback}</p>
                      </div>
                    )}
                    
                    {submission.rubrics_scores.writing.content.grammar_feedback && (
                      <div className="feedback-item grammar-feedback">
                        <strong>📐 Ngữ pháp:</strong>
                        <p>{submission.rubrics_scores.writing.content.grammar_feedback}</p>
                      </div>
                    )}
                    
                    {submission.rubrics_scores.writing.content.vocabulary_feedback && (
                      <div className="feedback-item vocabulary-feedback">
                        <strong>📚 Từ vựng:</strong>
                        <p>{submission.rubrics_scores.writing.content.vocabulary_feedback}</p>
                      </div>
                    )}
                    
                    {submission.rubrics_scores.writing.content.structure_feedback && (
                      <div className="feedback-item pronunciation-feedback">
                        <strong>🏗️ Cấu trúc:</strong>
                        <p>{submission.rubrics_scores.writing.content.structure_feedback}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Strengths */}
                {Array.isArray(submission.rubrics_scores.strengths) && submission.rubrics_scores.strengths.length > 0 && (
                  <div className="feedback-item strengths">
                    <strong>💪 Điểm mạnh:</strong>
                    <ul>
                      {submission.rubrics_scores.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                
                {/* Improvements */}
                {Array.isArray(submission.rubrics_scores.improvements) && submission.rubrics_scores.improvements.length > 0 && (
                  <div className="feedback-item improvements">
                    <strong>📈 Cần cải thiện:</strong>
                    <ul>
                      {submission.rubrics_scores.improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                
                {/* Suggestions */}
                {Array.isArray(submission.rubrics_scores.writing?.content?.suggestions) && 
                 submission.rubrics_scores.writing.content.suggestions.length > 0 && (
                  <div className="feedback-item suggestions">
                    <strong>💡 Gợi ý:</strong>
                    <ul>
                      {submission.rubrics_scores.writing.content.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Overall Comment */}
                {submission.rubrics_scores.writing?.content?.overall_comment && (
                  <div className="feedback-item overall-comment">
                    <strong>💬 Nhận xét tổng quan:</strong>
                    <p>{submission.rubrics_scores.writing.content.overall_comment}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Detailed Feedback from Teacher */}
            {submission.rubrics_scores.detailed_feedback && (
              <div className="detailed-feedback-section">
                <strong>💡 Nhận xét chi tiết:</strong>
                <div className="detailed-feedback-content">
                  {submission.rubrics_scores.detailed_feedback}
                </div>
              </div>
            )}
            
            {/* Objective questions auto-grade breakdown */}
            {submission.rubrics_scores.auto_grade_results && (
              <div className="rubric-section">
                <h4>🧮 Trắc nghiệm tự chấm</h4>
                <ul>
                  {Object.entries(submission.rubrics_scores.auto_grade_results).map(([qid, res]) => (
                    <li key={qid}>
                      <strong>Câu {qid}:</strong> {res.correct ? 'Đúng' : 'Sai'}
                      {res.student_answer != null && (
                        <> — Trả lời: {safeRenderValue(res.student_answer)}{res.correct_answer != null ? ` (Đúng: ${safeRenderValue(res.correct_answer)})` : ''}</>
                      )}
                      {res.earned != null && res.points != null && (
                        <> — Điểm: {res.earned}/{res.points}</>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Your Submission */}
        <div className="submission-content-card">
          <h3>📝 Bài làm của bạn</h3>
          {submission.content_text && (
            <div className="submission-text">
              {submission.content_text}
            </div>
          )}
          {submission.content_url && (
            <div className="submission-file">
              {submission.content_url.includes('.mp3') || submission.content_url.includes('audio') ? (
                <audio controls src={submission.content_url} />
              ) : (
                <a href={submission.content_url} target="_blank" rel="noopener noreferrer">
                  Xem file đính kèm
                </a>
              )}
            </div>
          )}
          {submission.answers && Object.keys(submission.answers).length > 0 && (
            <div className="submission-answers">
              <h4>Câu trả lời:</h4>
              <ul>
                {Object.entries(submission.answers).map(([qId, answer]) => {
                  // Try to find the question in exercise content to get pairs info
                  let questionData = null;
                  const exerciseContent = exercise.content || {};
                  
                  // For comprehensive test, check all sections
                  if (exerciseContent.type === 'comprehensive_test') {
                    const allQuestions = [
                      ...(exerciseContent.listening?.questions || []),
                      ...(exerciseContent.reading?.questions || [])
                    ];
                    questionData = allQuestions.find(q => String(q.id) === String(qId));
                  } else {
                    // For single skill exercises
                    const questions = exerciseContent.questions || [];
                    questionData = questions.find(q => String(q.id) === String(qId));
                  }
                  
                  // Check if answer is a matching question (object with numeric keys)
                  const isMatchingAnswer = typeof answer === 'object' && 
                    answer !== null && 
                    !Array.isArray(answer) &&
                    Object.keys(answer).every(k => !isNaN(k));
                  
                  return (
                    <li key={qId}>
                      <strong>Câu {qId}:</strong>{' '}
                      {isMatchingAnswer && questionData?.pairs ? (
                        <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                          {Object.entries(answer).map(([idx, selectedRight]) => {
                            const pair = questionData.pairs[parseInt(idx)];
                            return (
                              <li key={idx}>
                                {pair?.left || `Item ${parseInt(idx) + 1}`} → {selectedRight}
                              </li>
                            );
                          })}
                        </ul>
                      ) : isMatchingAnswer ? (
                        <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                          {Object.entries(answer).map(([idx, val]) => (
                            <li key={idx}>Cặp {parseInt(idx) + 1} → {val}</li>
                          ))}
                        </ul>
                      ) : (
                        safeRenderValue(answer)
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="result-actions">
          <button className="btn-back" onClick={() => {
            exitFullscreen();
            navigate('/exercise-hub');
          }}>
            <BookOpen size={18} />
            Quay lại Exercise Hub
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="do-exercise-container">
      {/* Fullscreen violation warning overlay */}
      {fullscreenWarningCount > 2 && viewMode === 'exercise' && !showStartScreen && (
        <div className="fullscreen-violation-overlay">
          <div className="violation-card">
            <div className="violation-icon">🚨</div>
            <h2>CẢNH BÁO VI PHẠM</h2>
            <p>Bạn đã cố gắng thoát chế độ toàn màn hình <strong>{fullscreenWarningCount}</strong> lần!</p>
            <p className="violation-warning">
              Hành vi này có thể bị coi là gian lận. Vui lòng tuân thủ quy định thi cử!
            </p>
            <button className="btn-understand" onClick={() => setFullscreenWarningCount(0)}>
              Tôi hiểu và sẽ tuân thủ
            </button>
          </div>
        </div>
      )}
      
      {/* Start Screen - Must click to enter fullscreen */}
      {viewMode === 'exercise' && showStartScreen && exercise && (
        <div className="start-screen-overlay">
          <div className="start-screen-card">
            <div className="start-screen-icon">
              {exercise.skill_type === 'listening' && <Headphones className="w-16 h-16 text-blue-500" />}
              {exercise.skill_type === 'speaking' && <Mic className="w-16 h-16 text-green-500" />}
              {exercise.skill_type === 'reading' && <BookOpen className="w-16 h-16 text-purple-500" />}
              {exercise.skill_type === 'writing' && <PenLine className="w-16 h-16 text-orange-500" />}
              {!exercise.skill_type && <FileText className="w-16 h-16 text-gray-500" />}
            </div>
            <h2>{exercise.title}</h2>
            <p className="start-screen-desc">{exercise.description}</p>
            
            <div className="start-screen-info">
              <div className="info-item">
                <strong><Clock className="inline-block w-4 h-4 mr-1" /> Thời gian:</strong> {exercise.duration ? `${exercise.duration} phút` : 'Không giới hạn'}
              </div>
              <div className="info-item">
                <strong><Target className="inline-block w-4 h-4 mr-1" /> Điểm tối đa:</strong> {exercise.max_score || 10} điểm
              </div>
            </div>
            
            <div className="start-screen-warning">
              <AlertCircle size={24} />
              <div>
                <strong>Lưu ý quan trọng:</strong>
                <ul>
                  <li>Bài thi sẽ được mở ở chế độ <strong>toàn màn hình</strong></li>
                  <li>Không được thoát fullscreen trong quá trình làm bài</li>
                  <li>Nếu thoát fullscreen, hệ thống sẽ tự động bật lại</li>
                  <li>Vui lòng cho phép quyền fullscreen khi trình duyệt yêu cầu</li>
                </ul>
              </div>
            </div>
            
            <button className="btn-start-exam" onClick={handleStartExercise}>
              <Zap size={24} />
              Bắt đầu làm bài
            </button>
            
            <button className="btn-cancel" onClick={() => navigate('/exercise-hub')}>
              Quay lại
            </button>
          </div>
        </div>
      )}
      
      {/* Fullscreen Warning Banner - Only show when doing exercise */}
      {viewMode === 'exercise' && !showStartScreen && isFullscreen && (
        <div className="fullscreen-warning-banner">
          <AlertCircle size={20} />
          <span>Chế độ làm bài: Toàn màn hình. Không được thoát fullscreen!</span>
        </div>
      )}
      
      {/* Show result view if graded, otherwise show exercise view */}
      {viewMode === 'result' ? renderResultView() : !showStartScreen && (
        <>
      {/* Header */}
      <div className="exercise-header">
        <div className="header-left">
          <h1>
            {exercise.skill_type === 'listening' && <Headphones className="inline-block w-6 h-6 mr-2" />}
            {exercise.skill_type === 'speaking' && <Mic className="inline-block w-6 h-6 mr-2" />}
            {exercise.skill_type === 'reading' && <BookOpen className="inline-block w-6 h-6 mr-2" />}
            {exercise.skill_type === 'writing' && <PenLine className="inline-block w-6 h-6 mr-2" />}
            {' '}
            {exercise.title}
          </h1>
          <p className="exercise-description">{exercise.description}</p>
        </div>
        {timeRemaining !== null && (
          <div className="time-display">
            <Clock size={24} />
            <span className={timeRemaining < 300 ? 'time-warning' : ''}>
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="exercise-content">
        {renderExerciseContent()}
      </div>

      {/* Footer Actions */}
      <div className="exercise-footer">
        <button className="btn-save-draft" onClick={handleSaveDraft}>
          <Save size={18} />
          Lưu nháp
        </button>
        <button
          className="btn-submit-exercise"
          onClick={handleSubmit}
          disabled={isSubmitting || (exercise.skill_type === 'writing' && exercise.content?.word_limit && wordCount < exercise.content.word_limit.min)}
        >
          <Send size={18} />
          {isSubmitting ? 'Đang nộp...' : 'Nộp bài và xem kết quả'}
        </button>
      </div>
        </>
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
}


