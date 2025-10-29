import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, Save, Send, Volume2, Mic, Play, Pause, RotateCcw,
  Check, X, FileText, AlertCircle, Zap, BookOpen
} from 'lucide-react';
import './DoExercise.css';
import { apiV1 } from '../../../services/api';

export default function DoExercise() {
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
      
      if (exerciseSubmission && exerciseSubmission.score !== null) {
        // Has graded submission, show result view
        setSubmission(exerciseSubmission);
        setViewMode('result');
        console.log('[DoExercise] Submission is graded, showing result view');
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
      alert('Đã lưu nháp!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Lỗi khi lưu nháp!');
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
      
      await apiV1.post(`/exercises/${exerciseId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Nộp bài thành công!');
      navigate('/exercise-hub');
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Lỗi khi nộp bài: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Speaking functions
  const startRecording = async (questionId = null) => {
    try {
      setRecordingError(null);

      if (!window.isSecureContext) {
        const message = 'Trình duyệt yêu cầu kết nối an toàn (https hoặc localhost) để ghi âm.';
        setRecordingError(message);
        alert(message);
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        const message = 'Trình duyệt của bạn không hỗ trợ ghi âm (getUserMedia).';
        setRecordingError(message);
        alert(message);
        return;
      }

      if (typeof window.MediaRecorder === 'undefined') {
        const message = 'Trình duyệt của bạn chưa hỗ trợ MediaRecorder. Vui lòng dùng Chrome, Edge hoặc Firefox phiên bản mới.';
        setRecordingError(message);
        alert(message);
        return;
      }

      // Release any previous recording for this slot
      if (questionId) {
        const prev = speakingAnswers[questionId];
        if (prev?.url) {
          URL.revokeObjectURL(prev.url);
          objectUrlRef.current.delete(prev.url);
        }
      } else if (recordedAudio?.url) {
        URL.revokeObjectURL(recordedAudio.url);
        objectUrlRef.current.delete(recordedAudio.url);
        setRecordedAudio(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
      }

      const recorder = recorderOptions ? new MediaRecorder(stream, recorderOptions) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || selectedMime || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        objectUrlRef.current.add(audioUrl);
        const audioPayload = { url: audioUrl, blob: audioBlob, mimeType };

        if (questionId) {
          setSpeakingAnswers(prev => ({ ...prev, [questionId]: audioPayload }));
          setActiveSpeakingQ(null);
        } else {
          setRecordedAudio(audioPayload);
        }
      };

      recorder.start();
      setIsRecording(true);
      if (questionId) setActiveSpeakingQ(questionId);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      const message = error?.name === 'NotAllowedError'
        ? 'Bạn đã từ chối quyền truy cập micro. Hãy bật lại quyền trong cài đặt trình duyệt và thử lại.'
        : 'Không thể truy cập microphone!';
      setRecordingError(message);
      alert(message);
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
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
      recorder.stream?.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.warn('Error while stopping recorder:', error);
    } finally {
      setIsRecording(false);
    }
  };

  const reRecord = (questionId = null) => {
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
              <span className="score-number">{submission.score}</span>
              <span className="score-total">/{exercise.max_score || 10}</span>
            </div>
            <div className="score-label">Điểm</div>
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
            <span className="info-value status-graded">Đã chấm</span>
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
          {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
        </button>
      </div>
        </>
      )}
    </div>
  );
}

