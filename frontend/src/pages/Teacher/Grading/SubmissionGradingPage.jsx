import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiV1 } from '../../../services/api';
import Navbar from '../../../components/Navbar/Navbar';
import {
  ArrowLeft, Sparkles, CheckCircle, PlayCircle, FileAudio, FileImage,
  User, Clock, Award, AlertCircle, Loader2
} from 'lucide-react';
import './SubmissionGradingPage.css';

// Helper function to safely render any value (prevent React Error #31)
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
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
            console.log('Not an exam submission, trying exercise...', examError);
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
      
      // Update rubrics_scores with edited detailed_feedback
      const updatedRubrics = {
        ...(submission.rubrics_scores || {}),
        detailed_feedback: detailedFeedbackInput
      };
      
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

  // Check if comprehensive test
  const isComprehensiveTest = submission?.rubrics_scores?.listening && submission?.rubrics_scores?.reading;
  
  // Extract sections for comprehensive test
  const listeningSection = submission?.rubrics_scores?.listening || null;
  const readingSection = submission?.rubrics_scores?.reading || null;
  const writingSection = submission?.rubrics_scores?.writing || null;
  const speakingSection = submission?.rubrics_scores?.speaking || null;
  
  // Debug logs
  if (submission && isComprehensiveTest) {
    console.log('[DEBUG] Comprehensive test detected');
    console.log('[DEBUG] Listening section:', listeningSection);
    console.log('[DEBUG] Reading section:', readingSection);
    console.log('[DEBUG] Writing section:', writingSection);
    console.log('[DEBUG] Speaking section:', speakingSection);
  }
  
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
            {q.points_earned !== undefined ? `${q.points_earned.toFixed(1)}/${q.max_points || q.points} điểm` : 
             q.earned !== undefined ? `${q.earned}/${q.points} điểm` : 
             `${q.points || q.max_points} điểm`}
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
              {q.semantic_match && <span className="gp-badge ok">Semantic match ✓</span>}
            </div>
          )}
          
          {/* Matching details */}
          {q.type === 'matching' && q.correct_count !== undefined && (
            <div className="gp-matching-stats">
              ✓ Đúng {q.correct_count}/{q.total_pairs} cặp
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
            <button className={`gp-btn ai ${aiLoading ? 'loading' : ''}`} onClick={runAutoGrade} disabled={loading}>
              {aiLoading ? (<><Loader2 className="spinner" size={16} /> Đang chấm...</>) : (<><Sparkles size={16} /> {hasAI ? 'Chấm lại bằng AI' : 'Chấm tự động (AI)'} </>)}
            </button>
          </div>
        </div>

        <div className="gp-grid">
          {/* Main column */}
          <div className="gp-main">
            {/* COMPREHENSIVE TEST - 4 SECTIONS */}
            {isComprehensiveTest && (
              <>
                {/* SECTION 1: LISTENING */}
                {listeningSection && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title">🎧 PHẦN 1: NGHE HIỂU</div>
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
                {readingSection && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title">📖 PHẦN 2: ĐỌC HIỂU</div>
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
                {writingSection && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title">✍️ PHẦN 3: VIẾT</div>
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
                        <strong>Nhận xét AI:</strong>
                        {typeof writingSection.feedback === 'object' && writingSection.feedback !== null ? (
                          <div style={{ marginTop: '10px' }}>
                            {Object.entries(writingSection.feedback).map(([criterion, text]) => (
                              <div key={criterion} style={{ 
                                marginBottom: '10px', 
                                padding: '10px', 
                                background: '#f8f9fa', 
                                borderRadius: '6px',
                                borderLeft: '3px solid #10b981'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px', textTransform: 'capitalize' }}>
                                  {criterion === 'content' ? '📝 Nội dung' : 
                                   criterion === 'grammar' ? '📖 Ngữ pháp' :
                                   criterion === 'vocabulary' ? '📚 Từ vựng' :
                                   criterion === 'structure' ? '🏗️ Cấu trúc' : criterion}:
                                </div>
                                <div style={{ color: '#374151' }}>{safeRender(text)}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>{safeRender(writingSection.feedback)}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* SECTION 4: SPEAKING */}
                {speakingSection && (
                  <div className="gp-card">
                    <div className="gp-card-header">
                      <div className="gp-card-title">🗣️ PHẦN 4: NÓI</div>
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
                        <span className="gp-score">{speakingSection.pronunciation_score?.toFixed(1) || 0}/1.25</span>
                      </div>
                      <div className="gp-speaking-score-row">
                        <span className="gp-lbl">💬 Content (ChatGPT):</span>
                        <span className="gp-score">{speakingSection.content_score?.toFixed(1) || 0}/1.25</span>
                      </div>
                    </div>
                    
                    {speakingSection.pronunciation_details && (
                      <div className="gp-kpis">
                        {Object.entries(speakingSection.pronunciation_details).map(([key, val]) => {
                          const map = {
                            pronunciation: { name: 'Phát âm', color: '#f59e0b' },
                            fluency: { name: 'Trôi chảy', color: '#3b82f6' },
                            completeness: { name: 'Hoàn chỉnh', color: '#10b981' },
                            accuracy: { name: 'Chính xác', color: '#ef4444' },
                          };
                          if (typeof val !== 'number' || !map[key]) return null;
                          return (
                            <div key={key} className="gp-kpi" style={{ borderColor: map[key].color }}>
                              <div className="gp-kpi-value" style={{ color: map[key].color }}>{val.toFixed(1)}</div>
                              <div className="gp-kpi-label">{map[key].name}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {speakingSection.recognized_text && (
                      <div className="gp-recognized">
                        <strong>Văn bản nhận dạng:</strong>
                        <p>{safeRender(speakingSection.recognized_text)}</p>
                      </div>
                    )}
                    
                    {speakingSection.feedback && (
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
            {!isComprehensiveTest && (
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
                      <strong>✍️ Nhận xét của giáo viên:</strong>
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
                      <div className="gp-card-title">✍️ Bài viết của học sinh (Writing Assessment)</div>
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
                                   criterion === 'grammar' ? '📖 Ngữ pháp' :
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
                      {Object.entries(auto).map(([qId, result]) => (
                        <div key={qId} className={`gp-q ${result.correct ? 'ok' : result.status === 'pending_review' ? 'pending' : 'wrong'}`}>
                          <div className="gp-q-head">
                            <div className="gp-q-id">Câu {qId}</div>
                            <div className="gp-q-pts">
                              {result.earned !== undefined ? `${result.earned}/${result.points} điểm` : `${result.points} điểm (chờ chấm)`}
                            </div>
                          </div>
                          {result.type !== 'short_answer' ? (
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
                          ) : (
                            <div className="gp-q-body">
                              <div className="gp-essay">
                                <span className="gp-lbl">Câu trả lời tự luận:</span>
                                <p className="gp-essay-text">
                                  {typeof result.student_answer === 'object'
                                    ? JSON.stringify(result.student_answer)
                                    : (result.student_answer || '(Chưa trả lời)')}
                                </p>
                                <span className="gp-pending">⏳ Đợi giáo viên chấm</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
              {typeof submission?.ai_score === 'number' && (
                <button className="gp-btn use-ai" onClick={applyAIResultToForm}><Sparkles size={16} /> Dùng gợi ý AI</button>
              )}
              <button className="gp-btn save" onClick={saveGrade} disabled={loading}><CheckCircle size={16} /> Xác nhận & lưu điểm</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
