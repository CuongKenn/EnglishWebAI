import React from 'react';
import { AlertCircle } from 'lucide-react';

// Helper function to safely render any value
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    if (value.constructor === Object) {
      return Object.entries(value).map(([key, val]) => `${key}: ${val}`).join(', ');
    }
    return JSON.stringify(value);
  }
  return String(value);
};

/**
 * Component to render individual question results with scoring
 */
const QuestionResult = ({ question, index }) => {
  const q = question;
  const idx = index;
  const isCorrect = q.is_correct || q.correct;
  const isPending = q.status === 'pending_review';
  const isError = q.status === 'error';
  
  return (
    <div className={`gp-q ${isCorrect ? 'ok' : isPending ? 'pending' : isError ? 'error' : 'wrong'}`}>
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
        
        {/* Correct answer */}
        {q.correct_answer && (
          <div className="gp-row">
            <span className="gp-lbl">Đáp án đúng:</span>
            <span className="gp-answer ok">
              {safeRender(q.correct_answer)}
            </span>
          </div>
        )}
        
        {/* AI semantic feedback */}
        {q.type === 'fill_blank' && q.ai_feedback && (
          <div className="gp-ai-hint">
            ✨ {safeRender(q.ai_feedback)}
            {q.semantic_match && <span className="gp-badge ok">Semantic match ✓</span>}
          </div>
        )}
        
        {/* Matching stats */}
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

export default React.memo(QuestionResult);
