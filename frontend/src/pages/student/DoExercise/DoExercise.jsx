import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, Save, Send, Volume2, Mic, Play, Pause, RotateCcw,
  Check, X, FileText, AlertCircle, Zap, BookOpen
} from 'lucide-react';
import './DoExercise.css';
import { apiV1 } from '../../../services/api';
import Toast from '../../../components/Toast/Toast';
import useToast from '../../../hooks/useToast';

export default function DoExercise() {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  
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
  }, [exerciseId]);

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
        console.warn('Error cleaning up media recorder:', error);
      }
    };
  }, []);

  const fetchExercise = async () => {
    try {
      console.log('[DoExercise] Fetching exercise ID:', exerciseId);
      const response = await apiV1.get(`/exercises/${exerciseId}`);
      console.log('[DoExercise] Exercise data received:', response.data);
      console.log('[DoExercise] Exercise content:', response.data.content);
      console.log('[DoExercise] Exercise skill_type:', response.data.skill_type);
      setExercise(response.data);
      
      // Initialize answers
      if (response.data.content && response.data.content.questions) {
        console.log('[DoExercise] Initializing answers for questions:', response.data.content.questions);
        const initialAnswers = {};
        response.data.content.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
      }
      
      // Set timer if applicable
      if (response.data.duration) {
        console.log('[DoExercise] Setting timer:', response.data.duration, 'minutes');
        setTimeRemaining(response.data.duration * 60); // Convert to seconds
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
      console.log('[DoExercise] Fetching submission for exercise:', exerciseId);
      const response = await apiV1.get(`/exercises/my-submissions`);
      console.log('[DoExercise] My submissions:', response.data);
      
      // Find submission for this exercise
      const exerciseSubmission = response.data.find(s => s.exercise_id === parseInt(exerciseId));
      console.log('[DoExercise] Found submission:', exerciseSubmission);
      
      const hasFinalScore = !!exerciseSubmission && exerciseSubmission.score !== null;
      const hasAIScore = !!exerciseSubmission && exerciseSubmission.ai_score !== null;
      if (exerciseSubmission && (hasFinalScore || hasAIScore)) {
        // Has graded submission (teacher or AI), show result view
        setSubmission(exerciseSubmission);
        setViewMode('result');
        console.log('[DoExercise] Submission has score (final or AI), showing result view');
      } else if (exerciseSubmission) {
        // Has submission but not graded yet
        setSubmission(exerciseSubmission);
        console.log('[DoExercise] Submission exists but not graded yet');
      }
    } catch (error) {
      console.error('[DoExercise] Error fetching submission:', error);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
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
    if (!confirm('Bạn có chắc muốn nộp bài?')) return;
    
    setIsSubmitting(true);
    try {
      // Prepare submission data
      const formData = new FormData();
      
      // Add answers if exists
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
        Object.entries(writingAnswers).forEach(([qid, txt]) => {
          mergedAnswers[qid] = txt;
        });
        // Use first speaking answer as content_url (backend supports one file). Also store marker in answers map
        const speakingQIds = Object.keys(speakingAnswers).filter((id) => speakingAnswers[id]?.blob);
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
            console.warn('Failed to attach speaking audio:', e);
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
      : questionIdOrEvent;
    console.log('[startRecording] START - questionId (normalized):', qid);
    try {
      setRecordingError(null);
      console.log('[startRecording] Cleared error state');

      // Allow localhost/127.0.0.1 even if secureContext is false (older browsers)
      if (!window.isSecureContext) {
        console.log('[startRecording] Not secure context, checking hostname...');
        const host = window.location.hostname;
        console.log('[startRecording] hostname:', host);
        const isLocal = host === 'localhost' || host === '127.0.0.1';
        if (!isLocal) {
          const message = 'Trình duyệt yêu cầu kết nối an toàn (https hoặc localhost) để ghi âm.';
          setRecordingError(message);
          showWarning(message);
          console.error('[startRecording] BLOCKED: not secure context and not local');
          return;
        }
        console.log('[startRecording] localhost detected, proceeding...');
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        const message = 'Trình duyệt của bạn không hỗ trợ ghi âm (getUserMedia).';
        setRecordingError(message);
        showWarning(message);
        console.error('[startRecording] BLOCKED: getUserMedia not supported');
        return;
      }
      console.log('[startRecording] getUserMedia available');

      if (typeof window.MediaRecorder === 'undefined') {
        const message = 'Trình duyệt của bạn chưa hỗ trợ MediaRecorder. Vui lòng dùng Chrome, Edge hoặc Firefox phiên bản mới.';
        setRecordingError(message);
        showWarning(message);
        console.error('[startRecording] BLOCKED: MediaRecorder not defined');
        return;
      }
      console.log('[startRecording] MediaRecorder available');

      // Release any previous recording for this slot
      if (qid) {
        const prev = speakingAnswers[qid];
        if (prev?.url) {
          URL.revokeObjectURL(prev.url);
          objectUrlRef.current.delete(prev.url);
          console.log('[startRecording] Released previous recording for question', qid);
        }
      } else if (recordedAudio?.url) {
        URL.revokeObjectURL(recordedAudio.url);
        objectUrlRef.current.delete(recordedAudio.url);
        setRecordedAudio(null);
        console.log('[startRecording] Released previous general recording');
      }

      console.log('[startRecording] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      console.log('[startRecording] ✓ Got stream:', stream);

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
            console.log('[startRecording] Selected MIME:', candidate);
            break;
          }
        }
      } else {
        console.warn('[startRecording] MediaRecorder.isTypeSupported not available, using default');
      }

      let recorder;
      try {
        recorder = recorderOptions ? new MediaRecorder(stream, recorderOptions) : new MediaRecorder(stream);
        console.log('[startRecording] ✓ MediaRecorder created with options:', recorderOptions);
      } catch (e) {
        console.warn('MediaRecorder init failed with options, retrying without options:', e);
        recorder = new MediaRecorder(stream);
        console.log('[startRecording] ✓ MediaRecorder created (default, no options)');
      }
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      let hadData = false;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          hadData = true;
          console.log('[recorder.ondataavailable] chunk size:', event.data.size, 'total chunks:', audioChunksRef.current.length);
        }
      };

      recorder.onerror = (e) => {
        console.error('[Recorder] error:', e);
        setRecordingError('Có lỗi khi ghi âm. Vui lòng kiểm tra quyền micro và thử lại.');
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || selectedMime || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('[recorder.onstop] hadData:', hadData, 'blob size:', audioBlob?.size, 'mime:', mimeType);
        if (!hadData || !audioBlob || audioBlob.size === 0) {
          console.warn('[Recorder] no audio data received');
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
          console.log('[recorder.onstop] Saved per-question audio for qid:', qid);
        } else {
          setRecordedAudio(audioPayload);
          console.log('[recorder.onstop] Saved general speaking audio');
        }
      };

      // Use a small timeslice to ensure dataavailable fires consistently across browsers
      console.log('[startRecording] Starting recorder with 200ms timeslice...');
      try {
        recorder.start(200);
        console.log('[startRecording] ✓ recorder.start(200) succeeded, state:', recorder.state);
      } catch {
        recorder.start();
        console.log('[startRecording] ✓ recorder.start() succeeded (no timeslice), state:', recorder.state);
      }
      setIsRecording(true);
      if (qid) setActiveSpeakingQ(qid);
      console.log('[startRecording] ✓✓✓ RECORDING ACTIVE ✓✓✓');
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
        console.warn('Không thể dừng stream sau lỗi micro:', cleanupError);
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
      console.warn('Error while stopping recorder:', error);
    } finally {
      setIsRecording(false);
    }
  };

  const reRecord = async (questionId = null) => {
    console.log('[reRecord] invoked for qid:', questionId);
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
        console.warn('[reRecord] failed to start new recording for qid:', questionId, e);
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
        console.warn('[reRecord] failed to start new general recording:', e);
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
    console.log('[renderExerciseContent] exercise:', exercise);
    console.log('[renderExerciseContent] exercise.content:', exercise?.content);
    console.log('[renderExerciseContent] exercise.skill_type:', exercise?.skill_type);
    
    const { skill_type, content: exerciseContent } = exercise;
    
    console.log('[renderExerciseContent] destructured skill_type:', skill_type);
    console.log('[renderExerciseContent] destructured exerciseContent:', exerciseContent);

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
      console.log('[COMPREHENSIVE TEST] exerciseContent:', exerciseContent);
      const questions = exerciseContent.questions || [];
      console.log('[COMPREHENSIVE TEST] questions:', questions);
      
      return (
        <div className="comprehensive-test-exercise">
          <div className="test-instructions">
            <h3>📝 Đề thi</h3>
            <p>Trả lời tất cả {questions.length} câu hỏi dưới đây</p>
          </div>
          
          {questions.map((q, idx) => (
            <div key={q.id} className="question-card">
              <div className="question-header">
                <span className="question-number">Câu {idx + 1}</span>
                <span className="question-points">{q.points || 1} điểm</span>
              </div>
              <div className="question-text">{q.question}</div>
              
              {q.type === 'multiple_choice' && (
                <div className="options-list">
                  {q.options && q.options.map((opt, optIdx) => (
                    <label key={optIdx} className="option-item">
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={String.fromCharCode(65 + optIdx)}
                        checked={answers[q.id] === String.fromCharCode(65 + optIdx)}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      />
                      <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
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
                  <label className="option-item">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value="True"
                      checked={answers[q.id] === 'True'}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    />
                    <span>✓ Đúng</span>
                  </label>
                  <label className="option-item">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value="False"
                      checked={answers[q.id] === 'False'}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    />
                    <span>✗ Sai</span>
                  </label>
                </div>
              )}
              
              {q.type === 'short_answer' && (
                <textarea
                  className="answer-textarea"
                  placeholder="Nhập câu trả lời của bạn..."
                  rows="4"
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              )}

              {/* Speaking question in comprehensive test */}
              {q.type === 'speaking' && (
                <div className="ct-speaking">
                  {!isRecording && !speakingAnswers[q.id] && (
                    <button className="btn-start-recording" onClick={() => startRecording(q.id)}>
                      <Mic size={18} /> Bắt đầu ghi âm
                    </button>
                  )}

                  {isRecording && activeSpeakingQ === q.id && (
                    <div className="recording-active">
                      <div className="pulse-dot"></div>
                      <p>Đang ghi âm...</p>
                      <button className="btn-stop-recording" onClick={stopRecording}>
                        <Pause size={18} /> Dừng
                      </button>
                    </div>
                  )}

                  {speakingAnswers[q.id]?.url && (
                    <div className="recorded-section">
                      <audio controls src={speakingAnswers[q.id].url} />
                      <div className="recorded-actions">
                        <button className="btn-re-record" onClick={() => reRecord(q.id)}>
                          <RotateCcw size={16} /> Ghi lại
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
                      ref={(el) => { questionFileInputRefs.current[q.id] = el; }}
                      onChange={(e) => handleAudioFileSelect(e, q.id)}
                    />
                  </div>
                </div>
              )}

              {/* Writing question in comprehensive test */}
              {q.type === 'writing' && (
                <div className="ct-writing">
                  <textarea
                    className="answer-textarea"
                    rows={8}
                    placeholder="Nhập bài viết của bạn..."
                    value={writingAnswers[q.id] || ''}
                    onChange={(e) => {
                      const txt = e.target.value;
                      setWritingAnswers(prev => ({ ...prev, [q.id]: txt }));
                      const words = txt.trim().split(/\s+/).filter(Boolean);
                      setWritingCounts(prev => ({ ...prev, [q.id]: words.length }));
                    }}
                  />
                  <div className="word-counter">Số từ: {writingCounts[q.id] || 0}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // LISTENING
    if (skill_type === 'listening') {
      console.log('[LISTENING] exerciseContent:', exerciseContent);
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
                          name={`q${q.id}`}
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
                        name={`q${q.id}`}
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
                        name={`q${q.id}`}
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
      console.log('[SPEAKING] exerciseContent:', exerciseContent);
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
      console.log('[READING] exerciseContent:', exerciseContent);
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
                            name={`q${q.id}`}
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
      console.log('[WRITING] exerciseContent:', exerciseContent);
      console.log('[WRITING] exerciseContent.word_limit:', exerciseContent?.word_limit);
      console.log('[WRITING] exerciseContent.prompt:', exerciseContent?.prompt);
      console.log('[WRITING] exerciseContent.instructions:', exerciseContent?.instructions);
      
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
      console.log('[WRITING] minWords:', minWords, 'maxWords:', maxWords);
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

    const effectiveScore = (submission.score ?? submission.ai_score);
    const gradedByAI = submission.score == null && submission.ai_score != null;
    const statusLabel = submission.status === 'graded'
      ? 'Đã chấm'
      : gradedByAI
        ? 'Đã chấm (AI) - chờ giáo viên duyệt'
        : (submission.status === 'pending_review' ? 'Đang chờ duyệt' : (submission.status || '')); 

    return (
      <div className="result-view-container">
        {/* Header */}
        <div className="result-header">
          <div className="result-header-left">
            <h1>
              {exercise.skill_type === 'listening' && '🎧'}
              {exercise.skill_type === 'speaking' && '🗣️'}
              {exercise.skill_type === 'reading' && '📖'}
              {exercise.skill_type === 'writing' && '✍️'}
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
            <div className="score-label">{gradedByAI ? 'Điểm AI (tạm thời)' : 'Điểm'}</div>
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
            <h3>🤖 Phản hồi AI</h3>
            <div className="feedback-content">
              {submission.ai_feedback}
            </div>
          </div>
        )}

        {/* Rubrics / Breakdown */}
        {submission.rubrics_scores && (
          <div className="feedback-card">
            <h3>📊 Chi tiết chấm điểm</h3>
            {/* Writing breakdown */}
            {submission.rubrics_scores.writing_assessment && (
              <div className="rubric-section">
                <h4>✍️ Writing assessment</h4>
                <ul>
                  {Object.entries(submission.rubrics_scores.writing_assessment).map(([k, v]) => (
                    <li key={k}><strong>{k}:</strong> {String(v)}</li>
                  ))}
                </ul>
                {submission.rubrics_scores.word_count != null && (
                  <p><strong>Word count:</strong> {submission.rubrics_scores.word_count}</p>
                )}
                {Array.isArray(submission.rubrics_scores.strengths) && submission.rubrics_scores.strengths.length > 0 && (
                  <div>
                    <strong>Điểm mạnh:</strong>
                    <ul>
                      {submission.rubrics_scores.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {Array.isArray(submission.rubrics_scores.improvements) && submission.rubrics_scores.improvements.length > 0 && (
                  <div>
                    <strong>Cần cải thiện:</strong>
                    <ul>
                      {submission.rubrics_scores.improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Speaking breakdown */}
            {submission.rubrics_scores.speaking_assessment && (
              <div className="rubric-section">
                <h4>🗣️ Speaking assessment</h4>
                <ul>
                  {Object.entries(submission.rubrics_scores.speaking_assessment).map(([k, v]) => (
                    <li key={k}><strong>{k}:</strong> {String(v)}</li>
                  ))}
                </ul>
                {submission.rubrics_scores.recognized_text && (
                  <p><strong>Recognized text:</strong> {submission.rubrics_scores.recognized_text}</p>
                )}
                {submission.rubrics_scores.detailed_feedback && (
                  <details>
                    <summary>Chi tiết</summary>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{submission.rubrics_scores.detailed_feedback}</pre>
                  </details>
                )}
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
                        <> — Trả lời: {String(res.student_answer)}{res.correct_answer != null ? ` (Đúng: ${String(res.correct_answer)})` : ''}</>
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
                {Object.entries(submission.answers).map(([qId, answer]) => (
                  <li key={qId}>
                    <strong>Câu {qId}:</strong> {answer}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="result-actions">
          <button className="btn-back" onClick={() => navigate('/exercise-hub')}>
            <BookOpen size={18} />
            Quay lại Exercise Hub
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="do-exercise-container">
      {/* Show result view if graded, otherwise show exercise view */}
      {viewMode === 'result' ? renderResultView() : (
        <>
      {/* Header */}
      <div className="exercise-header">
        <div className="header-left">
          <h1>
            {exercise.skill_type === 'listening' && '🎧'}
            {exercise.skill_type === 'speaking' && '🗣️'}
            {exercise.skill_type === 'reading' && '📖'}
            {exercise.skill_type === 'writing' && '✍️'}
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

