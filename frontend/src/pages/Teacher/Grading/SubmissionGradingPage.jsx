import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiV1 } from '../../../services/api';
import Navbar from '../../../components/Navbar/Navbar';
import {
  ArrowLeft, Sparkles, CheckCircle, PlayCircle, FileAudio, FileImage,
  User, Clock, Award, AlertCircle, Loader2
} from 'lucide-react';
import './SubmissionGradingPage.css';

export default function SubmissionGradingPage() {
  const { submissionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const exerciseId = searchParams.get('exerciseId');
  const classId = searchParams.get('classId');

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  const hasAI = typeof submission?.ai_score === 'number';

  // Fetch a single submission either via class submissions list or exercise submissions list
  // Note: Don't force a global dark background; system defaults to light theme

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let found = null;
        if (classId) {
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
        }
      } catch (e) {
        console.error('Failed to fetch submission', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId, classId, exerciseId]);

  const runAutoGrade = async () => {
    if (!submission) return;
    setLoading(true);
    setAiLoading(true);
    try {
      const res = await apiV1.post(`/exercises/teacher-grading/submissions/${submission.id}/auto-grade`);
      const updated = res.data;
      setSubmission((prev) => ({ ...prev, ...updated }));
      setScoreInput(String(updated.ai_score ?? updated.score ?? ''));
      setFeedbackInput(updated.ai_feedback ?? updated.feedback ?? '');
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
  };

  const saveGrade = async () => {
    if (!submission) return;
    try {
      setLoading(true);
      await apiV1.post(`/exercises/${submission.exercise_id}/submissions/${submission.id}/grade`, {
        score: parseFloat(scoreInput),
        feedback: feedbackInput,
        rubrics_scores: submission.rubrics_scores || null,
      });
      alert('Đã lưu điểm');
      navigate(-1);
    } catch (e) {
      console.error('Save grade failed', e);
      alert('Lỗi khi lưu điểm!');
    } finally {
      setLoading(false);
    }
  };

  const speaking = submission?.rubrics_scores?.speaking_assessment || null;
  const writing = submission?.rubrics_scores?.writing_assessment || null;
  const auto = submission?.rubrics_scores?.auto_grade_results || null;

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
            {/* Speaking block */}
            {submission?.content_url && (
              <div className="gp-card">
                <div className="gp-card-title">🎤 Bài nói của học sinh</div>
                <div className="gp-speaking-row">
                  <audio controls src={submission.content_url} className="gp-audio" controlsList="nodownload">
                    Trình duyệt không hỗ trợ phát audio
                  </audio>
                  {speaking && (
                    <div className="gp-kpis">
                      {['pronunciation','fluency','completeness','accuracy'].map((k) => {
                        const val = speaking[k];
                        const map = {
                          pronunciation: { name: 'Phát âm', color: '#f59e0b' },
                          fluency: { name: 'Trôi chảy', color: '#3b82f6' },
                          completeness: { name: 'Hoàn chỉnh', color: '#10b981' },
                          accuracy: { name: 'Chính xác', color: '#ef4444' },
                        };
                        if (typeof val !== 'number') return null;
                        return (
                          <div key={k} className="gp-kpi" style={{ borderColor: map[k].color }}>
                            <div className="gp-kpi-value" style={{ color: map[k].color }}>{val.toFixed(1)}</div>
                            <div className="gp-kpi-label">{map[k].name}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {submission?.rubrics_scores?.recognized_text && (
                  <div className="gp-recognized">
                    <strong>Văn bản nhận dạng:</strong>
                    <p>{submission.rubrics_scores.recognized_text}</p>
                  </div>
                )}
                {submission?.rubrics_scores?.detailed_feedback && (
                  <div className="gp-feedback">
                    <strong>Nhận xét chi tiết:</strong>
                    {submission.rubrics_scores.detailed_feedback.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                )}
              </div>
            )}

            {/* Writing block */}
            {(submission?.content_text || writing) && (
              <div className="gp-card">
                <div className="gp-card-title">✍️ Bài viết của học sinh</div>
                {submission?.content_text && (
                  <div className="gp-textbox">{submission.content_text}</div>
                )}
                {writing && (
                  <div className="gp-writing">
                    {Object.entries(writing).map(([key, value]) => (
                      <div key={key} className="gp-writing-row">
                        <div className="gp-writing-name">{value.name} ({(value.weight * 100).toFixed(0)}%)</div>
                        <div className="gp-writing-bar"><div className="gp-writing-fill" style={{ width: `${value.score}%` }} /></div>
                        <div className="gp-writing-score">{value.score}/100</div>
                      </div>
                    ))}
                  </div>
                )}
                {submission?.rubrics_scores?.word_count && (
                  <div className="gp-label">Số từ: {submission.rubrics_scores.word_count}</div>
                )}
                {Array.isArray(submission?.rubrics_scores?.strengths) && submission.rubrics_scores.strengths.length > 0 && (
                  <div className="gp-list ok">
                    <strong>Điểm mạnh</strong>
                    <ul>
                      {submission.rubrics_scores.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {Array.isArray(submission?.rubrics_scores?.improvements) && submission.rubrics_scores.improvements.length > 0 && (
                  <div className="gp-list warn">
                    <strong>Cần cải thiện</strong>
                    <ul>
                      {submission.rubrics_scores.improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {Array.isArray(submission?.rubrics_scores?.corrections) && submission.rubrics_scores.corrections.length > 0 && (
                  <div className="gp-list danger">
                    <strong>Sửa lỗi</strong>
                    <ul>
                      {submission.rubrics_scores.corrections.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {submission?.rubrics_scores?.suggestions && (
                  <div className="gp-suggest">
                    <strong>Gợi ý:</strong>
                    <p>{submission.rubrics_scores.suggestions}</p>
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
                          <div className="gp-row"><span className="gp-lbl">Trả lời:</span><span className={`gp-answer ${result.correct ? 'ok' : 'wrong'}`}>{result.student_answer || '(Chưa trả lời)'}</span></div>
                          {!result.correct && (
                            <div className="gp-row"><span className="gp-lbl">Đáp án:</span><span className="gp-answer ok">{result.correct_answer}</span></div>
                          )}
                        </div>
                      ) : (
                        <div className="gp-q-body">
                          <div className="gp-essay">
                            <span className="gp-lbl">Câu trả lời tự luận:</span>
                            <p className="gp-essay-text">{result.student_answer || '(Chưa trả lời)'}</p>
                            <span className="gp-pending">⏳ Đợi giáo viên chấm</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
