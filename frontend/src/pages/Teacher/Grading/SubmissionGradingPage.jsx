import { useEffect, useState } from 'react';
// useMemo imported but not used currently
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiV1 } from '../../../services/api';
import Navbar from '../../../components/Navbar/Navbar';
import {
  ArrowLeft, Sparkles, CheckCircle, PlayCircle, FileAudio, FileImage,
  User, Clock, Award, AlertCircle, Loader2, BookOpen, PencilLine, 
  BookMarked, Building2, XCircle, AlertTriangle, Check, X, Headphones, Mic, PenTool
} from 'lucide-react';
import './SubmissionGradingPage.css';

// Helper function to safely render any value (prevent React Error #31)
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    // For matching questions - format as pairs
    if (value.constructor === Object) {
      return Object.entries(value).map(([key, val]) => `${key}: ${val}`).join(', ');
    }
    return JSON.stringify(value);
  }
  return String(value);
};

export default function SubmissionGradingPage() {
  const { submissionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const exerciseId = searchParams.get('exerciseId');
  const classId = searchParams.get('classId');
  const examId = searchParams.get('examId'); // NEW: for exam submissions

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [detailedFeedbackInput, setDetailedFeedbackInput] = useState('');
  const [isExam, setIsExam] = useState(false); // NEW: track if this is an exam submission
  
  // Speaking feedback editable states
  const [editableSpeaking, setEditableSpeaking] = useState({
    content_feedback: '',
    grammar_feedback: '',
    vocabulary_feedback: '',
    pronunciation_note: '',
    strengths: [],
    improvements: [],
    suggestions: [],
    overall_comment: ''
  });

  // Writing feedback editable states
  const [editableWriting, setEditableWriting] = useState({
    content: '',
    grammar: '',
    vocabulary: '',
    structure: '',
    strengths: [],
    improvements: [],
    overall_comment: ''
  });

  const hasAI = typeof submission?.ai_score === 'number';

  // Fetch a single submission either via class submissions list or exercise submissions list
  // Note: Don't force a global dark background; system defaults to light theme

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let found = null;
        
        // NEW: Try fetching from exam submissions first if examId or classId provided
        if (examId || classId) {
          try {
            if (examId) {
              // Fetch from exam submissions by exam_id
              const res = await apiV1.get(`/exam-assessments/submissions/exam/${examId}`);
              found = (res.data || []).find((s) => String(s.id) === String(submissionId));
              if (found) setIsExam(true);
            } else if (classId) {
              // Fetch from exam submissions by class_id
              const res = await apiV1.get(`/exam-assessments/submissions/class/${classId}`);
              found = (res.data || []).find((s) => String(s.id) === String(submissionId));
              if (found) setIsExam(true);
            }
          } catch (examError) {

          }
        }
        
        // Fallback to exercise submissions if not found in exams
        if (!found && classId) {
          const res = await apiV1.get(`/exercises/teacher-grading/classes/${classId}/submissions`);
          found = (res.data || []).find((s) => String(s.id) === String(submissionId));
        }
        if (!found && exerciseId) {
          const res2 = await apiV1.get(`/exercises/${exerciseId}/submissions`);
          const list = Array.isArray(res2.data) ? res2.data : (res2.data?.submissions || []);
          found = list.find((s) => String(s.id) === String(submissionId));
        }
        
        if (found) {
          setSubmission(found);
          setScoreInput(String(found.ai_score ?? found.score ?? ''));
          setFeedbackInput(found.ai_feedback ?? found.feedback ?? '');
          setDetailedFeedbackInput(found.rubrics_scores?.detailed_feedback || '');
          
          // Initialize editable speaking feedback from rubrics_scores.speaking.content
          if (found.rubrics_scores?.speaking?.content) {
            const content = found.rubrics_scores.speaking.content;
            setEditableSpeaking({
              content_feedback: content.content_feedback || '',
              grammar_feedback: content.grammar_feedback || '',
              vocabulary_feedback: content.vocabulary_feedback || '',
              pronunciation_note: content.pronunciation_note || '',
              strengths: Array.isArray(content.strengths) ? content.strengths : [],
              improvements: Array.isArray(content.improvements) ? content.improvements : [],
              suggestions: Array.isArray(content.suggestions) ? content.suggestions : [],
              overall_comment: content.overall_comment || ''
            });
          }
          
          // Initialize editable writing feedback from rubrics_scores.writing or writing.feedback
          if (found.rubrics_scores?.writing?.feedback || found.rubrics_scores?.writing) {
            const feedback = found.rubrics_scores.writing?.feedback || found.rubrics_scores.writing;
            setEditableWriting({
              content: feedback.content || '',
              grammar: feedback.grammar || '',
              vocabulary: feedback.vocabulary || '',
              structure: feedback.structure || '',
              strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
              improvements: Array.isArray(feedback.improvements) ? feedback.improvements : [],
              overall_comment: feedback.overall_comment || ''
            });
          }
        }
      } catch (e) {
        console.error('Failed to fetch submission', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId, classId, exerciseId, examId]);

  const runAutoGrade = async () => {
    if (!submission) return;
    setLoading(true);
    setAiLoading(true);
    try {
      // Use appropriate endpoint based on submission type
      const endpoint = isExam 
        ? `/exam-assessments/submissions/${submission.id}/auto-grade`
        : `/exercises/teacher-grading/submissions/${submission.id}/auto-grade`;
      
      const res = await apiV1.post(endpoint);
      const updated = isExam ? res.data.submission : res.data;
      setSubmission((prev) => ({ ...prev, ...updated }));
      setScoreInput(String(updated.ai_score ?? updated.score ?? ''));
      setFeedbackInput(updated.ai_feedback ?? updated.feedback ?? '');
      setDetailedFeedbackInput(updated.rubrics_scores?.detailed_feedback || '');
    } catch (e) {
      console.error('Auto-grade failed', e);
      alert('Lỗi khi chấm tự động!');
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  const applyAIResultToForm = () => {
    if (!submission) return;
    if (typeof submission.ai_score === 'number') setScoreInput(String(submission.ai_score));
    if (submission.ai_feedback) setFeedbackInput(submission.ai_feedback);
    if (submission.rubrics_scores?.detailed_feedback) setDetailedFeedbackInput(submission.rubrics_scores.detailed_feedback);
  };

  const saveGrade = async () => {
    if (!submission) return;
    try {
      setLoading(true);
      
      // Update rubrics_scores with edited detailed_feedback and speaking feedback
      const updatedRubrics = {
        ...(submission.rubrics_scores || {}),
        detailed_feedback: detailedFeedbackInput
      };
      
      // Update speaking content feedback if exists
      if (updatedRubrics.speaking?.content) {
        updatedRubrics.speaking.content = {
          ...updatedRubrics.speaking.content,
          content_feedback: editableSpeaking.content_feedback,
          grammar_feedback: editableSpeaking.grammar_feedback,
          vocabulary_feedback: editableSpeaking.vocabulary_feedback,
          pronunciation_note: editableSpeaking.pronunciation_note,
          strengths: editableSpeaking.strengths,
          improvements: editableSpeaking.improvements,
          suggestions: editableSpeaking.suggestions,
          overall_comment: editableSpeaking.overall_comment
        };
      }
      
      // Use appropriate endpoint based on submission type
      if (isExam) {
        await apiV1.post(`/exam-assessments/submissions/${submission.id}/grade`, {
          score: parseFloat(scoreInput),
          feedback: feedbackInput,
          rubrics_scores: updatedRubrics
        });
      } else {
        await apiV1.post(`/exercises/${submission.exercise_id}/submissions/${submission.id}/grade`, {
          score: parseFloat(scoreInput),
          feedback: feedbackInput,
          rubrics_scores: updatedRubrics,
        });
      }
      alert('Đã lưu điểm');
      navigate(-1);
    } catch (e) {
      console.error('Save grade failed', e);
      alert('Lỗi khi lưu điểm!');
    } finally {
      setLoading(false);
    }
  };

  // Extract structured rubric sections (if any)
  const listeningSection = submission?.rubrics_scores?.listening || null;
  const readingSection = submission?.rubrics_scores?.reading || null;
  const writingSection = submission?.rubrics_scores?.writing || null;

  const legacySpeakingAssessment = submission?.rubrics_scores?.speaking_assessment;
  const legacySpeakingContent = submission?.rubrics_scores?.speaking_content;
  const legacySpeakingFeedback = submission?.rubrics_scores?.speaking_feedback || submission?.rubrics_scores?.detailed_feedback;
  const legacyRecognizedText = submission?.rubrics_scores?.recognized_text;

  const normalizeLegacyPronunciation = (assessment) => {
    if (!assessment || typeof assessment !== 'object') return null;
    const pronunciation = assessment.pronunciation ?? assessment.pronunciation_score ?? assessment.pronunciationScore;
    const fluency = assessment.fluency ?? assessment.fluency_score ?? assessment.fluencyScore;
    const completeness = assessment.completeness ?? assessment.completeness_score ?? assessment.completenessScore;
    const accuracy = assessment.accuracy ?? assessment.accuracy_score ?? assessment.accuracyScore;
    const recognized = assessment.recognized_text ?? assessment.recognizedText ?? legacyRecognizedText ?? '';
    if ([pronunciation, fluency, completeness, accuracy].every((value) => typeof value !== 'number')) {
      return null;
    }
    return {
      pronunciation_score: typeof pronunciation === 'number' ? pronunciation : 0,
      fluency_score: typeof fluency === 'number' ? fluency : 0,
      completeness_score: typeof completeness === 'number' ? completeness : 0,
      accuracy_score: typeof accuracy === 'number' ? accuracy : 0,
      recognized_text: recognized,
    };
  };

  let speakingSection = submission?.rubrics_scores?.speaking || null;

  if (!speakingSection && (legacySpeakingAssessment || legacySpeakingContent || legacySpeakingFeedback || legacyRecognizedText || submission?.content_url)) {
    const normalizedPronunciation = normalizeLegacyPronunciation(legacySpeakingAssessment);
    const fallbackContent = legacySpeakingContent || (legacySpeakingFeedback ? {
      overall_comment: legacySpeakingFeedback,
    } : null);

    speakingSection = {
      points_earned: submission?.rubrics_scores?.speaking_points ?? null,
      max_points: submission?.rubrics_scores?.speaking_max_points ?? 2.5,
      prompt: submission?.rubrics_scores?.speaking_prompt ?? null,
      audio_url: submission?.rubrics_scores?.speaking_audio_url || submission?.content_url || null,
      pronunciation: normalizedPronunciation,
      content: fallbackContent,
      recognized_text: legacyRecognizedText ?? normalizedPronunciation?.recognized_text ?? null,
      feedback: legacySpeakingFeedback ? {
        pronunciation: legacySpeakingFeedback,
        recognized_text: legacyRecognizedText ?? normalizedPronunciation?.recognized_text ?? '',
      } : null,
    };
  } else if (speakingSection) {
    speakingSection = {
      ...speakingSection,
      audio_url: speakingSection.audio_url || submission?.rubrics_scores?.speaking_audio_url || submission?.content_url || null,
      pronunciation: speakingSection.pronunciation || normalizeLegacyPronunciation(legacySpeakingAssessment),
      content: speakingSection.content || legacySpeakingContent || (legacySpeakingFeedback ? {
        overall_comment: legacySpeakingFeedback,
      } : null),
      recognized_text: speakingSection.recognized_text || legacyRecognizedText || speakingSection.pronunciation?.recognized_text || null,
    };
  }
  
  const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
  const hasNonEmptyStringArray = (value) => Array.isArray(value) && value.some((item) => hasText(item));
  const hasObjectWithContent = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some((val) => {
      if (Array.isArray(val)) {
        return val.some((item) => {
          if (typeof item === 'string') return hasText(item);
          if (typeof item === 'number') return item > 0;
          if (item && typeof item === 'object') return hasObjectWithContent(item);
          return false;
        });
      }
      if (typeof val === 'string') return hasText(val);
      if (typeof val === 'number') return val > 0;
      if (val && typeof val === 'object') return hasObjectWithContent(val);
      return false;
    });
  };

  const hasListeningSection = Boolean(
    listeningSection && (
      (Array.isArray(listeningSection.questions) && listeningSection.questions.length > 0) ||
      hasText(listeningSection.script) ||
      hasText(listeningSection.audio_url)
    )
  );

  const hasReadingSection = Boolean(
    readingSection && (
      (Array.isArray(readingSection.questions) && readingSection.questions.length > 0) ||
      hasText(readingSection.passage)
    )
  );

  const hasWritingFeedback = writingSection?.feedback && hasObjectWithContent(writingSection.feedback);
  const hasWritingSection = Boolean(
    writingSection && (
      hasText(writingSection.prompt) ||
      hasText(writingSection.student_text) ||
      (typeof writingSection.word_count === 'number' && writingSection.word_count > 0) ||
      hasNonEmptyStringArray(writingSection.strengths) ||
      hasNonEmptyStringArray(writingSection.improvements) ||
      hasText(writingSection.overall_comment) ||
      hasWritingFeedback
    )
  );

  const speakingRecognizedText = speakingSection?.pronunciation?.recognized_text
    || speakingSection?.recognized_text
    || speakingSection?.feedback?.recognized_text;
  const hasSpeakingContentFeedback = speakingSection?.content && hasObjectWithContent({
    content_feedback: speakingSection.content?.content_feedback,
    grammar_feedback: speakingSection.content?.grammar_feedback,
    vocabulary_feedback: speakingSection.content?.vocabulary_feedback,
    pronunciation_note: speakingSection.content?.pronunciation_note,
    strengths: speakingSection.content?.strengths,
    improvements: speakingSection.content?.improvements,
    suggestions: speakingSection.content?.suggestions,
    overall_comment: speakingSection.content?.overall_comment,
    content_score: speakingSection.content?.content_score
  });
  const hasSpeakingPronunciationScores = speakingSection?.pronunciation && hasObjectWithContent({
    pronunciation_score: speakingSection.pronunciation?.pronunciation_score,
    fluency_score: speakingSection.pronunciation?.fluency_score,
    accuracy_score: speakingSection.pronunciation?.accuracy_score,
    completeness_score: speakingSection.pronunciation?.completeness_score
  });
  const hasSpeakingSection = Boolean(
    speakingSection && (
      hasText(speakingSection.prompt) ||
      hasText(speakingSection.audio_url) ||
      hasText(speakingRecognizedText) ||
      (typeof speakingSection.points_earned === 'number' && speakingSection.points_earned > 0) ||
      hasSpeakingContentFeedback ||
      hasSpeakingPronunciationScores
    )
  ) || Boolean(submission?.content_url);

  const sectionedRubricsCount = [hasListeningSection, hasReadingSection, hasWritingSection, hasSpeakingSection].filter(Boolean).length;
  const showSectionedRubrics = sectionedRubricsCount > 0;
  
  // Legacy single-skill data
  const speaking = submission?.rubrics_scores?.speaking_assessment || null;
  const writing = submission?.rubrics_scores?.writing_assessment || null;
  const auto = submission?.rubrics_scores?.auto_grade_results || null;

  // Render question result helper
  const renderQuestionResult = (q, idx) => {
    const isCorrect = q.is_correct || q.correct;
    const isPending = q.status === 'pending_review';
    const isError = q.status === 'error';
    
    return (
      <div key={idx} className={`gp-q ${isCorrect ? 'ok' : isPending ? 'pending' : isError ? 'error' : 'wrong'}`}>
        <div className="gp-q-head">
          <div className="gp-q-id">Câu {idx + 1} {q.type && `(${q.type})`}</div>
          <div className="gp-q-pts">
            {q.points_earned !== undefined 
              ? `${q.points_earned.toFixed(2)}/${(q.max_points || q.points).toFixed(2)} điểm` 
              : q.earned !== undefined 
                ? `${q.earned.toFixed(2)}/${(q.points).toFixed(2)} điểm` 
                : `${(q.points || q.max_points).toFixed(2)} điểm`}
          </div>
        </div>
        
        <div className="gp-q-body">
          {q.question && <div className="gp-q-text">{safeRender(q.question)}</div>}
          
          {/* Student answer */}
          <div className="gp-row">
            <span className="gp-lbl">Trả lời của học sinh:</span>
            <span className={`gp-answer ${isCorrect ? 'ok' : isPending ? 'pending' : 'wrong'}`}>
              {safeRender(q.student_answer) || '(Chưa trả lời)'}
            </span>
          </div>
          
          {/* Correct answer - always show if available */}
          {q.correct_answer && (
            <div className="gp-row">
              <span className="gp-lbl">Đáp án đúng:</span>
              <span className="gp-answer ok">
                {safeRender(q.correct_answer)}
              </span>
            </div>
          )}
          
          {/* AI semantic feedback for fill_blank */}
          {q.type === 'fill_blank' && q.ai_feedback && (
            <div className="gp-ai-hint">
              <Sparkles size={14} /> {safeRender(q.ai_feedback)}
              {q.semantic_match && (
                <span className="gp-badge ok">
                  <Check size={14} /> Semantic match
                </span>
              )}
            </div>
          )}
          
          {/* Matching details */}
          {q.type === 'matching' && q.correct_count !== undefined && (
            <div className="gp-matching-stats">
              <Check size={14} className="inline-block" /> Đúng {q.correct_count}/{q.total_pairs} cặp
              {q.partial_credit && <span className="gp-badge warn">Partial credit</span>}
            </div>
          )}
          
          {/* Error message */}
          {isError && q.error && (
            <div className="gp-error-msg">
              <AlertCircle size={14} /> Lỗi: {safeRender(q.error)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grading-page">
      <Navbar userRole="teacher" isLoggedIn={true} onLogout={() => navigate('/')} />
      <div className="grading-page-body">
        <div className="gp-header">
          <button className="gp-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Trở lại
          </button>
          <div className="gp-title">
            <h1>Chấm điểm bài nộp</h1>
            {submission && (
              <p>
                <User size={14} /> {submission.student_name} • Bài tập ID: {submission.exercise_id} •
                <Clock size={14} style={{ marginLeft: 8 }} /> {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString('vi-VN') : ''}
              </p>
            )}
          </div>
          {hasAI && (
            <div className="gp-ai-pill">
              <Sparkles size={14} /> AI: {submission.ai_score}/10
            </div>
          )}
        </div>

        {/* Toolbar: AI ring + actions */}
        <div className="gp-toolbar">
          <div className="gp-toolbar-left">
            <div className="gp-toolbar-title">Đánh giá Speaking/Writing & Trắc nghiệm</div>
            <div className="gp-toolbar-sub">Xem nội dung học sinh đã nộp và xác nhận điểm</div>
          </div>
          <div className="gp-toolbar-right">
            <div className="gp-ring">
              <div className="gp-ring-value">{typeof submission?.ai_score === 'number' ? submission.ai_score : '-'}</div>
              <div className="gp-ring-max">/10</div>
            </div>
          </div>
        </div>

        <div className="gp-grid">
          {/* Main column */}
          <div className="gp-main">
            {/* SECTIONED RUBRICS (Listening/Reading/Writing/Speaking) */}
            {showSectionedRubrics && (
              <>
                {/* SECTION 1: LISTENING */}
                {hasListeningSection && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title"><Headphones className="inline-block w-5 h-5 mr-2" /> PHẦN 1: NGHE HIỂU</div>
                      <div className="gp-section-score">
                        {listeningSection.total_points?.toFixed(1) || 0}/2.5 điểm
                      </div>
                    </div>
                    
                    {listeningSection.audio_url && (
                      <div className="gp-audio-player">
                        <audio controls src={listeningSection.audio_url} className="gp-audio">
                          Trình duyệt không hỗ trợ phát audio
                        </audio>
                      </div>
                    )}
                    
                    {listeningSection.questions && listeningSection.questions.length > 0 ? (
                      <div className="gp-questions">
                        {listeningSection.questions.map((q, idx) => renderQuestionResult(q, idx))}
                      </div>
                    ) : (
                      <div className="gp-empty" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                        <AlertCircle size={24} style={{ marginBottom: '10px' }} />
                        <div>Không có câu hỏi hoặc chưa có dữ liệu</div>
                      </div>
                    )}
                  </div>
                )}

                {/* SECTION 2: READING */}
                {hasReadingSection && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title">
                        <BookOpen size={20} className="inline-block mr-2" />
                        PHẦN 2: ĐỌC HIỂU
                      </div>
                      <div className="gp-section-score">
                        {readingSection.total_points?.toFixed(1) || 0}/2.5 điểm
                      </div>
                    </div>
                    
                    {readingSection.passage && (
                      <div className="gp-passage">
                        <strong>Đoạn văn:</strong>
                        <p>{safeRender(readingSection.passage)}</p>
                      </div>
                    )}
                    
                    {readingSection.questions && readingSection.questions.length > 0 ? (
                      <div className="gp-questions">
                        {readingSection.questions.map((q, idx) => renderQuestionResult(q, idx))}
                      </div>
                    ) : (
                      <div className="gp-empty" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                        <AlertCircle size={24} style={{ marginBottom: '10px' }} />
                        <div>Không có câu hỏi hoặc chưa có dữ liệu</div>
                      </div>
                    )}
                  </div>
                )}

                {/* SECTION 3: WRITING */}
                {hasWritingSection && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title">
                        <PencilLine size={20} className="inline-block mr-2" />
                        PHẦN 3: VIẾT
                      </div>
                      <div className="gp-section-score">
                        {writingSection.points_earned?.toFixed(1) || 0}/2.5 điểm
                      </div>
                    </div>
                    
                    {writingSection.prompt && (
                      <div className="gp-prompt">
                        <strong>Đề bài:</strong>
                        <p>{safeRender(writingSection.prompt)}</p>
                      </div>
                    )}
                    
                    {/* Show student's writing - try multiple sources */}
                    {(writingSection.student_text || submission?.answers?.writing_main) && (
                      <div>
                        <strong>Bài viết của học sinh:</strong>
                        <div className="gp-textbox">
                          {safeRender(writingSection.student_text || submission?.answers?.writing_main)}
                        </div>
                      </div>
                    )}
                    
                    {writingSection.word_count && (
                      <div className="gp-label">Số từ: {writingSection.word_count}</div>
                    )}
                    
                    {writingSection.rubric_scores && (
                      <div className="gp-writing">
                        {Object.entries(writingSection.rubric_scores).map(([key, value]) => (
                          <div key={key} className="gp-writing-row">
                            <div className="gp-writing-name">{safeRender(value.name || key)} ({(value.weight * 100).toFixed(0)}%)</div>
                            <div className="gp-writing-bar">
                              <div className="gp-writing-fill" style={{ width: `${value.score}%` }} />
                            </div>
                            <div className="gp-writing-score">{value.score}/100</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {writingSection.feedback && (
                      <div className="gp-feedback">
                        <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#4f46e5' }}>
                          💡 Nhận xét chi tiết từ Cô giáo
                        </div>
                        {typeof writingSection.feedback === 'object' && writingSection.feedback !== null ? (
                          <div style={{ marginTop: '10px' }}>
                            {writingSection.feedback.content && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#fef3c7', 
                                borderRadius: '8px',
                                borderLeft: '4px solid #f59e0b'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#92400e' }}>
                                  <PencilLine size={16} className="inline-block mr-1" />
                                  Nội dung:
                                </div>
                                <textarea
                                  value={editableWriting.content}
                                  onChange={(e) => setEditableWriting(prev => ({...prev, content: e.target.value}))}
                                  style={{ 
                                    width: '100%',
                                    minHeight: '80px',
                                    color: '#78350f', 
                                    lineHeight: '1.7',
                                    padding: '10px',
                                    border: '1px solid #f59e0b',
                                    borderRadius: '6px',
                                    background: 'white',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </div>
                            )}
                            
                            {writingSection.feedback.grammar && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#fce7f3', 
                                borderRadius: '8px',
                                borderLeft: '4px solid #ec4899'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#831843' }}>
                                  <BookOpen size={16} className="inline-block mr-1" />
                                  Ngữ pháp:
                                </div>
                                <textarea
                                  value={editableWriting.grammar}
                                  onChange={(e) => setEditableWriting(prev => ({...prev, grammar: e.target.value}))}
                                  style={{ 
                                    width: '100%',
                                    minHeight: '80px',
                                    color: '#9f1239', 
                                    lineHeight: '1.7',
                                    padding: '10px',
                                    border: '1px solid #ec4899',
                                    borderRadius: '6px',
                                    background: 'white',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </div>
                            )}
                            
                            {writingSection.feedback.vocabulary && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#dbeafe', 
                                borderRadius: '8px',
                                borderLeft: '4px solid #3b82f6'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
                                  <BookMarked size={16} className="inline-block mr-1" />
                                  Từ vựng:
                                </div>
                                <textarea
                                  value={editableWriting.vocabulary}
                                  onChange={(e) => setEditableWriting(prev => ({...prev, vocabulary: e.target.value}))}
                                  style={{ 
                                    width: '100%',
                                    minHeight: '80px',
                                    color: '#1e3a8a', 
                                    lineHeight: '1.7',
                                    padding: '10px',
                                    border: '1px solid #3b82f6',
                                    borderRadius: '6px',
                                    background: 'white',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </div>
                            )}
                            
                            {writingSection.feedback.structure && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#dcfce7', 
                                borderRadius: '8px',
                                borderLeft: '4px solid #10b981'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#065f46' }}>
                                  <Building2 size={16} className="inline-block mr-1" />
                                  Cấu trúc:
                                </div>
                                <textarea
                                  value={editableWriting.structure}
                                  onChange={(e) => setEditableWriting(prev => ({...prev, structure: e.target.value}))}
                                  style={{ 
                                    width: '100%',
                                    minHeight: '80px',
                                    color: '#064e3b', 
                                    lineHeight: '1.7',
                                    padding: '10px',
                                    border: '1px solid #10b981',
                                    borderRadius: '6px',
                                    background: 'white',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Strengths */}
                            {Array.isArray(editableWriting.strengths) && editableWriting.strengths.length > 0 && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#d1fae5', 
                                borderRadius: '8px',
                                borderLeft: '4px solid #059669'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#065f46' }}>
                                  � Điểm mạnh của em:
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                  {editableWriting.strengths.map((item, idx) => (
                                    <li key={idx} style={{ marginBottom: '6px', color: '#047857', lineHeight: '1.6' }}>
                                      <input 
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                          const newStrengths = [...editableWriting.strengths];
                                          newStrengths[idx] = e.target.value;
                                          setEditableWriting(prev => ({...prev, strengths: newStrengths}));
                                        }}
                                        style={{ 
                                          width: '100%', 
                                          border: '1px solid #059669', 
                                          borderRadius: '4px', 
                                          padding: '6px',
                                          background: 'white',
                                          color: '#047857'
                                        }}
                                      />
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Improvements */}
                            {Array.isArray(editableWriting.improvements) && editableWriting.improvements.length > 0 && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#fed7aa', 
                                borderRadius: '8px',
                                borderLeft: '4px solid #ea580c'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#7c2d12' }}>
                                  📈 Cần cải thiện:
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                  {editableWriting.improvements.map((item, idx) => (
                                    <li key={idx} style={{ marginBottom: '6px', color: '#9a3412', lineHeight: '1.6' }}>
                                      <input 
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                          const newImprovements = [...editableWriting.improvements];
                                          newImprovements[idx] = e.target.value;
                                          setEditableWriting(prev => ({...prev, improvements: newImprovements}));
                                        }}
                                        style={{ 
                                          width: '100%', 
                                          border: '1px solid #ea580c', 
                                          borderRadius: '4px', 
                                          padding: '6px',
                                          background: 'white',
                                          color: '#9a3412'
                                        }}
                                      />
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Overall Comment */}
                            {editableWriting.overall_comment && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', 
                                borderRadius: '10px',
                                border: '2px solid #6366f1'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#3730a3' }}>
                                  💬 Lời nhận xét chung từ Cô:
                                </div>
                                <textarea
                                  value={editableWriting.overall_comment}
                                  onChange={(e) => setEditableWriting(prev => ({...prev, overall_comment: e.target.value}))}
                                  style={{ 
                                    width: '100%',
                                    minHeight: '100px',
                                    color: '#312e81', 
                                    lineHeight: '1.7',
                                    padding: '10px',
                                    border: '2px solid #6366f1',
                                    borderRadius: '6px',
                                    background: 'white',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    fontWeight: '500'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <p>{safeRender(writingSection.feedback)}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* SECTION 4: SPEAKING */}
                {hasSpeakingSection && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title"><Mic className="inline-block w-5 h-5 mr-2" /> PHẦN 4: NÓI</div>
                      <div className="gp-section-score">
                        {speakingSection.points_earned?.toFixed(1) || 0}/2.5 điểm
                      </div>
                    </div>
                    
                    {speakingSection.prompt && (
                      <div className="gp-prompt">
                        <strong>Đề bài:</strong>
                        <p>{safeRender(speakingSection.prompt)}</p>
                      </div>
                    )}
                    
                    {(speakingSection.audio_url || submission?.content_url) && (
                      <div>
                        <strong>Audio bài nói của học sinh:</strong>
                        <div className="gp-audio-player">
                          <audio controls src={speakingSection.audio_url || submission?.content_url} className="gp-audio">
                            Trình duyệt không hỗ trợ phát audio
                          </audio>
                        </div>
                      </div>
                    )}
                    
                    <div className="gp-speaking-breakdown">
                      <div className="gp-speaking-score-row">
                        <span className="gp-lbl">🎯 Pronunciation (Azure):</span>
                        <span className="gp-score">
                          {speakingSection.pronunciation?.pronunciation_score?.toFixed(1) || speakingSection.pronunciation_score?.toFixed(1) || 0}/100
                        </span>
                      </div>
                      <div className="gp-speaking-score-row">
                        <span className="gp-lbl">💬 Content (ChatGPT):</span>
                        <span className="gp-score">
                          {speakingSection.content?.content_score?.toFixed(1) || speakingSection.content_score?.toFixed(1) || 0} điểm
                        </span>
                      </div>
                    </div>
                    
                    {/* Azure Speech Detailed Metrics */}
                    {speakingSection.pronunciation && (
                      <div style={{ 
                        marginTop: '15px',
                        marginBottom: '15px', 
                        padding: '15px', 
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                        borderRadius: '10px',
                        border: '2px solid #fbbf24'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#92400e', fontSize: '15px' }}>
                          🎯 Đánh giá phát âm từ Azure Speech AI
                        </div>
                        <div className="gp-kpis">
                          {[
                            { key: 'pronunciation_score', name: 'Phát âm', color: '#f59e0b' },
                            { key: 'fluency_score', name: 'Trôi chảy', color: '#3b82f6' },
                            { key: 'accuracy_score', name: 'Chính xác', color: '#10b981' },
                            { key: 'completeness_score', name: 'Hoàn chỉnh', color: '#ef4444' }
                          ].map((item) => {
                            const val = speakingSection.pronunciation[item.key];
                            if (typeof val !== 'number') return null;
                            return (
                              <div key={item.key} className="gp-kpi" style={{ borderColor: item.color }}>
                                <div className="gp-kpi-value" style={{ color: item.color }}>{val.toFixed(1)}</div>
                                <div className="gp-kpi-label">{item.name}</div>
                                <div className="gp-kpi-bar">
                                  <div className="gp-kpi-fill" style={{ width: `${val}%`, backgroundColor: item.color }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Recognized Text */}
                    {(speakingSection.pronunciation?.recognized_text || speakingSection.recognized_text) && (
                      <div style={{ 
                        marginBottom: '15px', 
                        padding: '12px', 
                        background: '#f0f9ff', 
                        borderRadius: '8px',
                        borderLeft: '4px solid #3b82f6'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
                          📄 Văn bản nhận dạng được:
                        </div>
                        <div style={{ color: '#1e3a8a', fontStyle: 'italic', lineHeight: '1.6' }}>
                          "{safeRender(speakingSection.pronunciation?.recognized_text || speakingSection.recognized_text)}"
                        </div>
                      </div>
                    )}
                    
                    {/* ChatGPT Content Feedback */}
                    {speakingSection.content && (
                      <div style={{ marginTop: '15px' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#4f46e5' }}>
                          💡 Nhận xét chi tiết từ giáo viên AI
                        </div>
                        
                        {speakingSection.content.content_feedback && (
                          <div style={{ 
                            marginBottom: '12px', 
                            padding: '14px', 
                            background: '#f0fdf4', 
                            borderRadius: '8px',
                            borderLeft: '4px solid #10b981'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#065f46' }}>
                              📝 Nhận xét về nội dung:
                            </div>
                            <textarea
                              value={editableSpeaking.content_feedback}
                              onChange={(e) => setEditableSpeaking(prev => ({...prev, content_feedback: e.target.value}))}
                              style={{ 
                                width: '100%',
                                minHeight: '80px',
                                color: '#064e3b', 
                                lineHeight: '1.7',
                                padding: '10px',
                                border: '1px solid #10b981',
                                borderRadius: '6px',
                                background: 'white',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                              }}
                            />
                          </div>
                        )}
                        
                        {speakingSection.content.grammar_feedback && (
                          <div style={{ 
                            marginBottom: '12px', 
                            padding: '14px', 
                            background: '#eff6ff', 
                            borderRadius: '8px',
                            borderLeft: '4px solid #3b82f6'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
                              <BookOpen className="inline-block w-4 h-4 mr-1" /> Nhận xét về ngữ pháp:
                            </div>
                            <textarea
                              value={editableSpeaking.grammar_feedback}
                              onChange={(e) => setEditableSpeaking(prev => ({...prev, grammar_feedback: e.target.value}))}
                              style={{ 
                                width: '100%',
                                minHeight: '80px',
                                color: '#1e3a8a', 
                                lineHeight: '1.7',
                                padding: '10px',
                                border: '1px solid #3b82f6',
                                borderRadius: '6px',
                                background: 'white',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                              }}
                            />
                          </div>
                        )}
                        
                        {speakingSection.content.vocabulary_feedback && (
                          <div style={{ 
                            marginBottom: '12px', 
                            padding: '14px', 
                            background: '#fef3c7', 
                            borderRadius: '8px',
                            borderLeft: '4px solid #f59e0b'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#92400e' }}>
                              📚 Nhận xét về từ vựng:
                            </div>
                            <textarea
                              value={editableSpeaking.vocabulary_feedback}
                              onChange={(e) => setEditableSpeaking(prev => ({...prev, vocabulary_feedback: e.target.value}))}
                              style={{ 
                                width: '100%',
                                minHeight: '80px',
                                color: '#78350f', 
                                lineHeight: '1.7',
                                padding: '10px',
                                border: '1px solid #f59e0b',
                                borderRadius: '6px',
                                background: 'white',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                              }}
                            />
                          </div>
                        )}
                        
                        {speakingSection.content.pronunciation_note && (
                          <div style={{ 
                            marginBottom: '12px', 
                            padding: '14px', 
                            background: '#fce7f3', 
                            borderRadius: '8px',
                            borderLeft: '4px solid #ec4899'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#9f1239' }}>
                              🎤 Ghi chú về phát âm:
                            </div>
                            <textarea
                              value={editableSpeaking.pronunciation_note}
                              onChange={(e) => setEditableSpeaking(prev => ({...prev, pronunciation_note: e.target.value}))}
                              style={{ 
                                width: '100%',
                                minHeight: '80px',
                                color: '#831843', 
                                lineHeight: '1.7',
                                padding: '10px',
                                border: '1px solid #ec4899',
                                borderRadius: '6px',
                                background: 'white',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                              }}
                            />
                          </div>
                        )}
                        
                        {Array.isArray(editableSpeaking.strengths) && editableSpeaking.strengths.length > 0 && (
                          <div style={{ 
                            marginBottom: '12px', 
                            padding: '14px', 
                            background: '#d1fae5', 
                            borderRadius: '8px',
                            border: '2px solid #10b981'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#065f46' }}>
                              ✅ Điểm mạnh của em:
                            </div>
                            {editableSpeaking.strengths.map((strength, idx) => (
                              <div key={idx} style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#065f46', fontWeight: 'bold' }}>{idx + 1}.</span>
                                <textarea
                                  value={strength}
                                  onChange={(e) => {
                                    const newStrengths = [...editableSpeaking.strengths];
                                    newStrengths[idx] = e.target.value;
                                    setEditableSpeaking(prev => ({...prev, strengths: newStrengths}));
                                  }}
                                  style={{ 
                                    flex: 1,
                                    minHeight: '60px',
                                    color: '#064e3b', 
                                    lineHeight: '1.6',
                                    padding: '8px',
                                    border: '1px solid #10b981',
                                    borderRadius: '6px',
                                    background: 'white',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {Array.isArray(editableSpeaking.improvements) && editableSpeaking.improvements.length > 0 && (
                          <div style={{ 
                            marginBottom: '12px', 
                            padding: '14px', 
                            background: '#fef3c7', 
                            borderRadius: '8px',
                            border: '2px solid #f59e0b'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#92400e' }}>
                              ⚠️ Em cần cải thiện:
                            </div>
                            {editableSpeaking.improvements.map((improvement, idx) => (
                              <div key={idx} style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#92400e', fontWeight: 'bold' }}>{idx + 1}.</span>
                                <textarea
                                  value={improvement}
                                  onChange={(e) => {
                                    const newImprovements = [...editableSpeaking.improvements];
                                    newImprovements[idx] = e.target.value;
                                    setEditableSpeaking(prev => ({...prev, improvements: newImprovements}));
                                  }}
                                  style={{ 
                                    flex: 1,
                                    minHeight: '60px',
                                    color: '#78350f', 
                                    lineHeight: '1.6',
                                    padding: '8px',
                                    border: '1px solid #f59e0b',
                                    borderRadius: '6px',
                                    background: 'white',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {Array.isArray(editableSpeaking.suggestions) && editableSpeaking.suggestions.length > 0 && (
                          <div style={{ 
                            marginBottom: '12px', 
                            padding: '14px', 
                            background: '#e0e7ff', 
                            borderRadius: '8px',
                            border: '2px solid #6366f1'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#3730a3' }}>
                              💡 Gợi ý của cô:
                            </div>
                            {editableSpeaking.suggestions.map((suggestion, idx) => (
                              <div key={idx} style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <span style={{ color: '#3730a3', fontWeight: 'bold' }}>{idx + 1}.</span>
                                <textarea
                                  value={suggestion}
                                  onChange={(e) => {
                                    const newSuggestions = [...editableSpeaking.suggestions];
                                    newSuggestions[idx] = e.target.value;
                                    setEditableSpeaking(prev => ({...prev, suggestions: newSuggestions}));
                                  }}
                                  style={{ 
                                    flex: 1,
                                    minHeight: '60px',
                                    color: '#312e81', 
                                    lineHeight: '1.6',
                                    padding: '8px',
                                    border: '1px solid #6366f1',
                                    borderRadius: '6px',
                                    background: 'white',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {speakingSection.content.overall_comment && (
                          <div style={{ 
                            marginTop: '15px',
                            padding: '16px', 
                            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', 
                            borderRadius: '10px',
                            border: '2px solid #6366f1',
                            boxShadow: '0 4px 6px rgba(99, 102, 241, 0.1)'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#3730a3', fontSize: '15px' }}>
                              💬 Nhận xét tổng quan:
                            </div>
                            <textarea
                              value={editableSpeaking.overall_comment}
                              onChange={(e) => setEditableSpeaking(prev => ({...prev, overall_comment: e.target.value}))}
                              style={{ 
                                width: '100%',
                                minHeight: '100px',
                                color: '#312e81', 
                                lineHeight: '1.8',
                                padding: '12px',
                                border: '2px solid #6366f1',
                                borderRadius: '8px',
                                background: 'white',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Legacy feedback (fallback) */}
                    {!speakingSection.content && speakingSection.feedback && (
                      <div className="gp-feedback">
                        <strong>Nhận xét AI:</strong>
                        {typeof speakingSection.feedback === 'object' && speakingSection.feedback !== null ? (
                          <div style={{ marginTop: '10px' }}>
                            {Object.entries(speakingSection.feedback).map(([key, text]) => (
                              <div key={key} style={{ 
                                marginBottom: '8px', 
                                padding: '8px', 
                                background: '#f0f9ff', 
                                borderRadius: '6px',
                                borderLeft: '3px solid #3b82f6'
                              }}>
                                <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '4px' }}>
                                  {key}:
                                </div>
                                <div style={{ color: '#374151' }}>{safeRender(text)}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>{safeRender(speakingSection.feedback)}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* LEGACY SINGLE-SKILL BLOCKS */}
            {!showSectionedRubrics && (
              <>
                {/* Speaking block */}
                {submission?.content_url && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title">🎤 Bài nói của học sinh (Speaking Assessment)</div>
                      {submission?.ai_score && (
                        <div className="gp-section-score">
                          Điểm AI: {submission.ai_score}/10
                        </div>
                      )}
                    </div>
                    
                    {/* Audio Player */}
                    <div className="gp-audio-section">
                      <div className="gp-audio-label">
                        <PlayCircle size={16} /> Audio bài nói
                      </div>
                      <audio controls src={submission.content_url} className="gp-audio" controlsList="nodownload">
                        Trình duyệt không hỗ trợ phát audio
                      </audio>
                    </div>
                    
                    {/* Azure Speech Assessment Results */}
                    {speaking && (
                      <div className="gp-assessment-section">
                        <div className="gp-assessment-title">
                          <Sparkles size={16} /> Đánh giá từ Azure Speech API
                        </div>
                        
                        {/* KPI Scores */}
                        <div className="gp-kpis">
                          {['pronunciation','fluency','completeness','accuracy'].map((k) => {
                            const val = speaking[k];
                            const map = {
                              pronunciation: { name: 'Phát âm', color: '#f59e0b', desc: 'Độ chính xác phát âm từng âm' },
                              fluency: { name: 'Trôi chảy', color: '#3b82f6', desc: 'Tốc độ nói và sự mượt mà' },
                              completeness: { name: 'Hoàn chỉnh', color: '#10b981', desc: 'Mức độ hoàn thành câu nói' },
                              accuracy: { name: 'Chính xác', color: '#ef4444', desc: 'Độ chính xác ngữ pháp' },
                            };
                            if (typeof val !== 'number') return null;
                            return (
                              <div key={k} className="gp-kpi" style={{ borderColor: map[k].color }} title={map[k].desc}>
                                <div className="gp-kpi-value" style={{ color: map[k].color }}>{val.toFixed(1)}</div>
                                <div className="gp-kpi-label">{map[k].name}</div>
                                <div className="gp-kpi-bar">
                                  <div className="gp-kpi-fill" style={{ width: `${val}%`, backgroundColor: map[k].color }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Overall Speaking Score Breakdown */}
                        {speaking.pronunciation && (
                          <div className="gp-score-breakdown">
                            <div className="gp-breakdown-item">
                              <span className="gp-breakdown-label">Tổng điểm phát âm:</span>
                              <span className="gp-breakdown-value">{speaking.pronunciation}/100</span>
                            </div>
                            <div className="gp-breakdown-item">
                              <span className="gp-breakdown-label">Mức độ hoàn thành:</span>
                              <span className="gp-breakdown-value">{speaking.completeness}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Recognized Text */}
                    {submission?.rubrics_scores?.recognized_text && (
                      <div className="gp-recognized">
                        <strong>📝 Văn bản nhận dạng được:</strong>
                        <div className="gp-recognized-text">
                          {typeof submission.rubrics_scores.recognized_text === 'object'
                            ? JSON.stringify(submission.rubrics_scores.recognized_text)
                            : String(submission.rubrics_scores.recognized_text)}
                        </div>
                        <small className="gp-hint">Văn bản được Azure Speech API nhận dạng từ audio</small>
                      </div>
                    )}
                    
                    {/* AI Detailed Feedback */}
                    {submission?.rubrics_scores?.detailed_feedback && (
                      <div className="gp-ai-feedback-display">
                        <strong>💡 Nhận xét chi tiết từ AI:</strong>
                        <div className="gp-ai-feedback-content">
                          {typeof submission.rubrics_scores.detailed_feedback === 'object'
                            ? JSON.stringify(submission.rubrics_scores.detailed_feedback)
                            : String(submission.rubrics_scores.detailed_feedback)}
                        </div>
                      </div>
                    )}
                    
                    {/* Teacher's Editable Feedback */}
                    <div className="gp-feedback-editable">
                      <strong><PenTool className="inline-block w-4 h-4 mr-1" /> Nhận xét của giáo viên:</strong>
                      <textarea 
                        className="gp-textarea-feedback"
                        value={detailedFeedbackInput}
                        onChange={(e) => setDetailedFeedbackInput(e.target.value)}
                        placeholder="Nhập nhận xét chi tiết của bạn về phát âm, độ trôi chảy, ngữ điệu, nội dung..."
                        rows={8}
                      />
                      <small className="gp-hint">Nhận xét này sẽ được gửi đến học sinh</small>
                    </div>
                  </div>
                )}

                {/* Writing block */}
                {(submission?.content_text || writing) && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title"><PenTool className="inline-block w-5 h-5 mr-2" /> Bài viết của học sinh (Writing Assessment)</div>
                      {submission?.ai_score && (
                        <div className="gp-section-score">
                          Điểm AI: {submission.ai_score}/10
                        </div>
                      )}
                    </div>
                    
                    {/* Student's Essay */}
                    {submission?.content_text && (
                      <div className="gp-essay-section">
                        <div className="gp-essay-label">📝 Bài viết của học sinh</div>
                        <div className="gp-textbox">{submission.content_text}</div>
                        {submission?.rubrics_scores?.word_count && (
                          <div className="gp-word-count">
                            Số từ: <strong>{submission.rubrics_scores.word_count}</strong> từ
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* AI Writing Assessment Results */}
                    {writing && (
                      <div className="gp-assessment-section">
                        <div className="gp-assessment-title">
                          <Sparkles size={16} /> Đánh giá từ ChatGPT AI
                        </div>
                        
                        {/* Writing Rubrics Scores */}
                        <div className="gp-writing">
                          {typeof writing === 'object' && Object.entries(writing)
                            .filter(([key]) => typeof writing[key] === 'object' && writing[key].score !== undefined)
                            .map(([key, value]) => (
                              <div key={key} className="gp-writing-row">
                                <div className="gp-writing-name">
                                  {typeof value.name === 'string' ? value.name : key}
                                  {value.weight && (
                                    <span className="gp-writing-weight">({(value.weight * 100).toFixed(0)}%)</span>
                                  )}
                                </div>
                                <div className="gp-writing-bar">
                                  <div className="gp-writing-fill" style={{ width: `${value.score}%` }} />
                                </div>
                                <div className="gp-writing-score">{value.score}/100</div>
                              </div>
                            ))
                          }
                        </div>
                        
                        {/* AI Feedback for Writing Criteria */}
                        {submission?.rubrics_scores?.feedback && typeof submission.rubrics_scores.feedback === 'object' && (
                          <div className="gp-ai-feedback-criteria" style={{ marginTop: '20px' }}>
                            <strong>💬 Nhận xét chi tiết:</strong>
                            {Object.entries(submission.rubrics_scores.feedback).map(([criterion, feedback]) => (
                              <div key={criterion} className="gp-feedback-item" style={{ 
                                marginTop: '10px', 
                                padding: '12px', 
                                background: '#f8f9fa', 
                                borderRadius: '8px',
                                borderLeft: '3px solid #10b981'
                              }}>
                                <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '5px' }}>
                                  {criterion === 'content' ? '📝 Nội dung' : 
                                   criterion === 'grammar' ? <><BookOpen className="inline-block w-4 h-4 mr-1" /> Ngữ pháp</> :
                                   criterion === 'vocabulary' ? '📚 Từ vựng' :
                                   criterion === 'structure' ? '🏗️ Cấu trúc' : criterion}
                                </div>
                                <div style={{ color: '#374151' }}>{String(feedback)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Strengths */}
                    {Array.isArray(submission?.rubrics_scores?.strengths) && submission.rubrics_scores.strengths.length > 0 && (
                      <div className="gp-list ok">
                        <strong>✅ Điểm mạnh</strong>
                        <ul>
                          {submission.rubrics_scores.strengths.map((s, i) => (
                            <li key={i}>{typeof s === 'object' ? JSON.stringify(s) : String(s)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Areas for Improvement */}
                    {Array.isArray(submission?.rubrics_scores?.improvements) && submission.rubrics_scores.improvements.length > 0 && (
                      <div className="gp-list warn">
                        <strong>⚠️ Cần cải thiện</strong>
                        <ul>
                          {submission.rubrics_scores.improvements.map((s, i) => (
                            <li key={i}>{typeof s === 'object' ? JSON.stringify(s) : String(s)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Error Corrections */}
                    {Array.isArray(submission?.rubrics_scores?.corrections) && submission.rubrics_scores.corrections.length > 0 && (
                      <div className="gp-list danger">
                        <strong>🔧 Sửa lỗi</strong>
                        <ul>
                          {submission.rubrics_scores.corrections.map((s, i) => (
                            <li key={i}>{typeof s === 'object' ? JSON.stringify(s) : String(s)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* AI Suggestions */}
                    {submission?.rubrics_scores?.suggestions && (
                      <div className="gp-suggest">
                        <strong>💡 Gợi ý cải thiện:</strong>
                        <p>{typeof submission.rubrics_scores.suggestions === 'object' 
                          ? JSON.stringify(submission.rubrics_scores.suggestions) 
                          : String(submission.rubrics_scores.suggestions)}
                        </p>
                      </div>
                    )}
                    
                    {/* Overall AI Feedback */}
                    {submission?.ai_feedback && (
                      <div className="gp-ai-feedback-display">
                        <strong>💬 Nhận xét tổng quan từ AI:</strong>
                        <div className="gp-ai-feedback-content">
                          {typeof submission.ai_feedback === 'object'
                            ? JSON.stringify(submission.ai_feedback)
                            : String(submission.ai_feedback)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Objective results */}
                {auto && (
                  <div className="gp-card">
                    <div className="gp-card-title">✅ Kết quả trắc nghiệm</div>
                    <div className="gp-questions">
                      {Object.entries(auto).map(([qId, result]) => {
                        // Skip speaking/writing questions - they'll be shown in dedicated sections below
                        if (result.type === 'speaking' || result.type === 'short_answer' || result.type === 'essay') {
                          return null;
                        }
                        
                        return (
                          <div key={qId} className={`gp-q ${result.correct ? 'ok' : result.status === 'pending_review' ? 'pending' : 'wrong'}`}>
                            <div className="gp-q-head">
                              <div className="gp-q-id">Câu {qId}</div>
                              <div className="gp-q-pts">
                                {result.earned !== undefined ? `${result.earned}/${result.points} điểm` : `${result.points} điểm (chờ chấm)`}
                              </div>
                            </div>
                            <div className="gp-q-body">
                              <div className="gp-row">
                                <span className="gp-lbl">Trả lời:</span>
                                <span className={`gp-answer ${result.correct ? 'ok' : 'wrong'}`}>
                                  {typeof result.student_answer === 'object' 
                                    ? JSON.stringify(result.student_answer) 
                                    : (result.student_answer || '(Chưa trả lời)')}
                                </span>
                              </div>
                              {!result.correct && result.correct_answer && (
                                <div className="gp-row">
                                  <span className="gp-lbl">Đáp án:</span>
                                  <span className="gp-answer ok">
                                    {typeof result.correct_answer === 'object'
                                      ? JSON.stringify(result.correct_answer)
                                      : String(result.correct_answer)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Exam Speaking Results (from auto_grade_results) */}
                {auto && Object.entries(auto).some(([_, result]) => result.type === 'speaking') && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title"><Mic className="inline-block w-5 h-5 mr-2" /> Kết quả Speaking (Exam)</div>
                    </div>
                    {Object.entries(auto).filter(([_, result]) => result.type === 'speaking').map(([qId, result]) => (
                      <div key={qId} className="gp-exam-speaking-section">
                        <div className="gp-q-head" style={{ marginBottom: '15px' }}>
                          <div className="gp-q-id">Câu {qId}</div>
                          <div className="gp-q-pts">
                            {result.earned !== undefined ? `${result.earned}/${result.points} điểm` : `${result.points} điểm`}
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        {result.status && (
                          <div style={{ marginBottom: '10px' }}>
                            <span className={`gp-badge ${
                              result.status === 'ai_graded' ? 'ok' : 
                              result.status === 'grading_error' ? 'danger' : 
                              result.status === 'recognition_failed' ? 'warn' : 'pending'
                            }`}>
                              {result.status === 'ai_graded' ? '✅ Đã chấm tự động' :
                               result.status === 'grading_error' ? '❌ Lỗi chấm' :
                               result.status === 'recognition_failed' ? '⚠️ Không nhận diện được' :
                               result.status === 'audio_not_found' ? '📁 Không tìm thấy audio' :
                               '⏳ Chờ xử lý'}
                            </span>
                          </div>
                        )}
                        
                        {/* Pronunciation & Content Breakdown */}
                        {result.pronunciation && result.content && (
                          <div style={{ marginBottom: '20px' }}>
                            <div className="gp-speaking-breakdown">
                              <div className="gp-speaking-score-row">
                                <span className="gp-lbl">🎯 Pronunciation (Azure Speech):</span>
                                <span className="gp-score">
                                  {result.pronunciation.pronunciation_score || 0}/100
                                </span>
                              </div>
                              <div className="gp-speaking-score-row">
                                <span className="gp-lbl">💬 Content (ChatGPT):</span>
                                <span className="gp-score">
                                  {result.content.content_score || 0} điểm
                                </span>
                              </div>
                            </div>
                            
                            {/* Azure Pronunciation Details */}
                            {result.pronunciation && (
                              <div className="gp-kpis" style={{ marginTop: '15px' }}>
                                {[
                                  { key: 'pronunciation_score', name: 'Phát âm', color: '#f59e0b' },
                                  { key: 'fluency_score', name: 'Trôi chảy', color: '#3b82f6' },
                                  { key: 'accuracy_score', name: 'Chính xác', color: '#10b981' },
                                  { key: 'completeness_score', name: 'Hoàn chỉnh', color: '#ef4444' }
                                ].map(({ key, name, color }) => {
                                  const val = result.pronunciation[key];
                                  if (typeof val !== 'number') return null;
                                  return (
                                    <div key={key} className="gp-kpi" style={{ borderColor: color }}>
                                      <div className="gp-kpi-value" style={{ color }}>{val.toFixed(1)}</div>
                                      <div className="gp-kpi-label">{name}</div>
                                      <div className="gp-kpi-bar">
                                        <div className="gp-kpi-fill" style={{ width: `${val}%`, backgroundColor: color }}></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* AI Feedback */}
                        {result.ai_feedback && (
                          <div className="gp-feedback-detailed" style={{ marginTop: '20px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '15px', color: '#4f46e5' }}>
                              💡 Nhận xét chi tiết từ giáo viên AI
                            </div>
                            
                            {/* Transcript */}
                            {result.ai_feedback.transcript && (
                              <div style={{ 
                                marginBottom: '15px', 
                                padding: '12px', 
                                background: '#f0f9ff', 
                                borderRadius: '8px',
                                borderLeft: '4px solid #3b82f6'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
                                  📄 Văn bản nhận dạng được:
                                </div>
                                <div style={{ color: '#1e3a8a', fontStyle: 'italic', lineHeight: '1.6' }}>
                                  "{safeRender(result.ai_feedback.transcript)}"
                                </div>
                              </div>
                            )}
                            
                            {/* Pronunciation Scores Grid */}
                            {(result.ai_feedback.pronunciation_score !== undefined) && (
                              <div style={{ 
                                marginBottom: '20px', 
                                padding: '15px', 
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                                borderRadius: '10px',
                                border: '2px solid #fbbf24'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#92400e', fontSize: '15px' }}>
                                  🎯 Đánh giá phát âm từ Azure Speech AI
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                  {[
                                    { label: 'Phát âm', value: result.ai_feedback.pronunciation_score, color: '#f59e0b' },
                                    { label: 'Độ trôi chảy', value: result.ai_feedback.fluency_score, color: '#3b82f6' },
                                    { label: 'Độ chính xác', value: result.ai_feedback.accuracy_score, color: '#10b981' },
                                    { label: 'Hoàn chỉnh', value: result.ai_feedback.completeness_score, color: '#ef4444' }
                                  ].map((item, idx) => (
                                    <div key={idx} style={{ 
                                      background: 'white', 
                                      padding: '12px', 
                                      borderRadius: '8px',
                                      textAlign: 'center',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                      <div style={{ fontSize: '24px', fontWeight: '900', color: item.color }}>
                                        {item.value}/100
                                      </div>
                                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                                        {item.label}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Content Feedback */}
                            {result.ai_feedback.content_feedback && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#f0fdf4', 
                                borderRadius: '8px',
                                borderLeft: '4px solid #10b981'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#065f46' }}>
                                  📝 Nhận xét về nội dung:
                                </div>
                                <div style={{ color: '#064e3b', lineHeight: '1.7' }}>
                                  {safeRender(result.ai_feedback.content_feedback)}
                                </div>
                              </div>
                            )}
                            
                            {/* Grammar Feedback */}
                            {result.ai_feedback.grammar_feedback && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#eff6ff', 
                                borderRadius: '8px',
                                borderLeft: '4px solid #3b82f6'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
                                  <BookOpen className="inline-block w-4 h-4 mr-1" /> Nhận xét về ngữ pháp:
                                </div>
                                <div style={{ color: '#1e3a8a', lineHeight: '1.7' }}>
                                  {safeRender(result.ai_feedback.grammar_feedback)}
                                </div>
                              </div>
                            )}
                            
                            {/* Vocabulary Feedback */}
                            {result.ai_feedback.vocabulary_feedback && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#fef3c7', 
                                borderRadius: '8px',
                                borderLeft: '4px solid #f59e0b'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#92400e' }}>
                                  📚 Nhận xét về từ vựng:
                                </div>
                                <div style={{ color: '#78350f', lineHeight: '1.7' }}>
                                  {safeRender(result.ai_feedback.vocabulary_feedback)}
                                </div>
                              </div>
                            )}
                            
                            {/* Pronunciation Note */}
                            {result.ai_feedback.pronunciation_note && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#fce7f3', 
                                borderRadius: '8px',
                                borderLeft: '4px solid #ec4899'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#9f1239' }}>
                                  � Ghi chú về phát âm:
                                </div>
                                <div style={{ color: '#831843', lineHeight: '1.7' }}>
                                  {safeRender(result.ai_feedback.pronunciation_note)}
                                </div>
                              </div>
                            )}
                            
                            {/* Strengths */}
                            {Array.isArray(result.ai_feedback.strengths) && result.ai_feedback.strengths.length > 0 && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#d1fae5', 
                                borderRadius: '8px',
                                border: '2px solid #10b981'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#065f46' }}>
                                  ✅ Điểm mạnh của em:
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#064e3b' }}>
                                  {result.ai_feedback.strengths.map((strength, idx) => (
                                    <li key={idx} style={{ marginBottom: '6px', lineHeight: '1.6' }}>
                                      {safeRender(strength)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Improvements */}
                            {Array.isArray(result.ai_feedback.improvements) && result.ai_feedback.improvements.length > 0 && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#fef3c7', 
                                borderRadius: '8px',
                                border: '2px solid #f59e0b'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#92400e' }}>
                                  ⚠️ Em cần cải thiện:
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#78350f' }}>
                                  {result.ai_feedback.improvements.map((improvement, idx) => (
                                    <li key={idx} style={{ marginBottom: '6px', lineHeight: '1.6' }}>
                                      {safeRender(improvement)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Suggestions */}
                            {Array.isArray(result.ai_feedback.suggestions) && result.ai_feedback.suggestions.length > 0 && (
                              <div style={{ 
                                marginBottom: '12px', 
                                padding: '14px', 
                                background: '#e0e7ff', 
                                borderRadius: '8px',
                                border: '2px solid #6366f1'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#3730a3' }}>
                                  💡 Gợi ý của cô:
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#312e81' }}>
                                  {result.ai_feedback.suggestions.map((suggestion, idx) => (
                                    <li key={idx} style={{ marginBottom: '6px', lineHeight: '1.6' }}>
                                      {safeRender(suggestion)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Overall Comment */}
                            {result.ai_feedback.overall_comment && (
                              <div style={{ 
                                marginTop: '15px',
                                padding: '16px', 
                                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', 
                                borderRadius: '10px',
                                border: '2px solid #6366f1',
                                boxShadow: '0 4px 6px rgba(99, 102, 241, 0.1)'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#3730a3', fontSize: '15px' }}>
                                  💬 Nhận xét tổng quan:
                                </div>
                                <div style={{ color: '#312e81', lineHeight: '1.8', fontSize: '14px' }}>
                                  {safeRender(result.ai_feedback.overall_comment)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Error Message */}
                        {result.error && (
                          <div className="gp-error-msg" style={{ marginTop: '10px' }}>
                            <AlertCircle size={14} /> Lỗi: {safeRender(result.error)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Exam Writing Results (from auto_grade_results) */}
                {auto && Object.entries(auto).some(([_, result]) => result.type === 'short_answer' || result.type === 'essay') && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title"><PenTool className="inline-block w-5 h-5 mr-2" /> Kết quả Writing (Exam)</div>
                    </div>
                    {Object.entries(auto).filter(([_, result]) => result.type === 'short_answer' || result.type === 'essay').map(([qId, result]) => (
                      <div key={qId} className="gp-exam-writing-section">
                        <div className="gp-q-head" style={{ marginBottom: '15px' }}>
                          <div className="gp-q-id">Câu {qId}</div>
                          <div className="gp-q-pts">
                            {result.earned !== undefined ? `${result.earned}/${result.points} điểm` : `${result.points} điểm (chờ chấm)`}
                          </div>
                        </div>
                        
                        {/* Status */}
                        {result.status && (
                          <div style={{ marginBottom: '10px' }}>
                            <span className={`gp-badge ${result.status === 'ai_graded' ? 'ok' : 'pending'}`}>
                              {result.status === 'ai_graded' ? '✅ Đã chấm AI' : '⏳ Chờ chấm'}
                            </span>
                          </div>
                        )}
                        
                        {/* Student Answer */}
                        <div className="gp-essay">
                          <span className="gp-lbl">Câu trả lời của học sinh:</span>
                          <p className="gp-essay-text">
                            {typeof result.student_answer === 'object'
                              ? JSON.stringify(result.student_answer)
                              : (result.student_answer || '(Chưa trả lời)')}
                          </p>
                        </div>
                        
                        {/* AI Feedback for Writing */}
                        {result.ai_feedback && (
                          <div className="gp-feedback" style={{ marginTop: '15px' }}>
                            <strong>💡 Nhận xét AI:</strong>
                            {typeof result.ai_feedback === 'object' ? (
                              <div style={{ marginTop: '10px' }}>
                                {Object.entries(result.ai_feedback).map(([criterion, feedback]) => (
                                  <div key={criterion} style={{ 
                                    marginBottom: '10px', 
                                    padding: '12px', 
                                    background: '#f8f9fa', 
                                    borderRadius: '8px',
                                    borderLeft: '3px solid #10b981'
                                  }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '5px', textTransform: 'capitalize' }}>
                                      {criterion === 'content_feedback' ? '📝 Nội dung' : 
                                       criterion === 'grammar_feedback' ? <><BookOpen className="inline-block w-4 h-4 mr-1" /> Ngữ pháp</> :
                                       criterion === 'vocabulary_feedback' ? '📚 Từ vựng' :
                                       criterion === 'structure_feedback' ? '🏗️ Cấu trúc' : criterion}:
                                    </div>
                                    <div style={{ color: '#374151' }}>{safeRender(feedback)}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p>{safeRender(result.ai_feedback)}</p>
                            )}
                          </div>
                        )}
                        
                        {/* Error */}
                        {result.error && (
                          <div className="gp-error-msg" style={{ marginTop: '10px' }}>
                            <AlertCircle size={14} /> Lỗi: {safeRender(result.error)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="gp-side">
            <div className="gp-card sticky">
              <div className="gp-side-title">✅ Kết quả & Xác nhận</div>
              <label className="gp-label">Điểm số (/10)</label>
              <input className="gp-input" type="number" min="0" max="10" step="0.1" value={scoreInput} onChange={(e)=>setScoreInput(e.target.value)} />
              <label className="gp-label">Nhận xét</label>
              <textarea className="gp-textarea" value={feedbackInput} onChange={(e)=>setFeedbackInput(e.target.value)} />
              <button className="gp-btn save" onClick={saveGrade} disabled={loading}><CheckCircle size={16} /> Xác nhận & lưu điểm</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
