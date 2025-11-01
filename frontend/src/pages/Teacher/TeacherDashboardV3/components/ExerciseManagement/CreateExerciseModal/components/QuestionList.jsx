import React from 'react';
import { Plus, Database, Trash2 } from 'lucide-react';

/**
 * QuestionList component
 * Displays list of questions with add/remove actions
 */
const QuestionList = React.memo(({
  questions,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  onUpdateQuestionOption,
  onShowQuestionBank,
}) => {
  return (
    <div className="questions-section-form">
      <div className="section-header-with-actions">
        <h4>Câu hỏi</h4>
        <div className="question-actions">
          <button 
            className="btn-from-bank"
            onClick={onShowQuestionBank}
            type="button"
          >
            <Database size={16} />
            Từ Ngân hàng
          </button>
          <button 
            className="btn-add-question" 
            onClick={onAddQuestion}
            type="button"
          >
            <Plus size={16} />
            Thêm câu hỏi
          </button>
        </div>
      </div>
      
      {questions.length === 0 ? (
        <div className="empty-questions">
          <p>Chưa có câu hỏi. Click "Thêm câu hỏi" hoặc "Từ Ngân hàng"</p>
        </div>
      ) : (
        questions.map((q, idx) => (
          <div key={q.id} className="question-form-card">
            <div className="question-form-header">
              <span>Câu {idx + 1}</span>
              <button 
                onClick={() => onRemoveQuestion(idx)} 
                className="btn-remove-question"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            {/* Question Type */}
            <div className="form-section-ex">
              <label>Loại câu hỏi</label>
              <select 
                className="form-select-ex"
                value={q.type}
                onChange={(e) => onUpdateQuestion(idx, 'type', e.target.value)}
              >
                <optgroup label="Trắc nghiệm">
                  <option value="multiple_choice">Trắc nghiệm (A/B/C/D)</option>
                  <option value="fill_blank">Điền từ</option>
                  <option value="true_false">Đúng/Sai</option>
                </optgroup>
                <optgroup label="Tự luận">
                  <option value="short_answer">Tự luận ngắn</option>
                  <option value="essay">Tự luận dài (Essay)</option>
                </optgroup>
                <optgroup label="Kỹ năng">
                  <option value="speaking">Speaking (Nói)</option>
                  <option value="listening">Listening (Nghe)</option>
                  <option value="reading">Reading (Đọc)</option>
                  <option value="writing">Writing (Viết)</option>
                </optgroup>
              </select>
            </div>
            
            {/* Question Text */}
            <div className="form-section-ex">
              <label>
                {q.type === 'listening' && '🎧 Đề bài Listening'}
                {q.type === 'reading' && '📖 Đoạn văn Reading'}
                {q.type === 'speaking' && '🗣️ Yêu cầu Speaking'}
                {q.type === 'writing' && '✍️ Đề bài Writing'}
                {!['listening', 'reading', 'speaking', 'writing'].includes(q.type) && 'Câu hỏi'}
              </label>
              <textarea
                className="form-input-ex"
                placeholder={
                  q.type === 'listening' ? 'Nhập đề bài hoặc link audio...' :
                  q.type === 'reading' ? 'Nhập đoạn văn để học sinh đọc...' :
                  q.type === 'speaking' ? 'Nhập yêu cầu: "Hãy nói về..." hoặc câu để đọc...' :
                  q.type === 'writing' ? 'Nhập đề bài: "Viết một đoạn văn về..."' :
                  'Nhập câu hỏi...'
                }
                value={q.question}
                onChange={(e) => onUpdateQuestion(idx, 'question', e.target.value)}
                rows={q.type === 'reading' || q.type === 'writing' ? 5 : 3}
                style={{ resize: 'vertical' }}
              />
            </div>
            
            {/* Multiple Choice Options */}
            {q.type === 'multiple_choice' && (
              <div className="form-section-ex">
                <label>Đáp án</label>
                {q.options.map((opt, optIdx) => (
                  <input 
                    key={optIdx}
                    type="text"
                    className="form-input-ex"
                    placeholder={`${String.fromCharCode(65 + optIdx)}. Đáp án ${optIdx + 1}`}
                    value={opt}
                    onChange={(e) => onUpdateQuestionOption(idx, optIdx, e.target.value)}
                    style={{ marginBottom: '8px' }}
                  />
                ))}
                <select 
                  className="form-select-ex"
                  value={q.correct_answer}
                  onChange={(e) => onUpdateQuestion(idx, 'correct_answer', e.target.value)}
                >
                  <option value="">Chọn đáp án đúng</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            )}
            
            {/* Fill Blank / Short Answer */}
            {(q.type === 'fill_blank' || q.type === 'short_answer') && (
              <div className="form-section-ex">
                <label>Đáp án đúng</label>
                <input 
                  type="text"
                  className="form-input-ex"
                  placeholder="Nhập đáp án..."
                  value={q.correct_answer}
                  onChange={(e) => onUpdateQuestion(idx, 'correct_answer', e.target.value)}
                />
              </div>
            )}
            
            {/* True/False */}
            {q.type === 'true_false' && (
              <div className="form-section-ex">
                <label>Đáp án đúng</label>
                <select 
                  className="form-select-ex"
                  value={q.correct_answer}
                  onChange={(e) => onUpdateQuestion(idx, 'correct_answer', e.target.value)}
                >
                  <option value="">Chọn...</option>
                  <option value="true">Đúng</option>
                  <option value="false">Sai</option>
                </select>
              </div>
            )}
            
            {/* Speaking Specific */}
            {q.type === 'speaking' && (
              <div className="form-section-ex">
                <div className="info-box" style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#0369a1' }}>
                    ℹ️ <strong>Chấm tự động bằng Azure Speech API:</strong> Phát âm, độ trôi chảy, tính hoàn chỉnh
                  </p>
                </div>
                <label>Văn bản tham khảo (optional - để AI so sánh)</label>
                <textarea
                  className="form-input-ex"
                  placeholder="Nhập văn bản tham khảo mà học sinh cần đọc (nếu có)..."
                  value={q.reference_text || ''}
                  onChange={(e) => onUpdateQuestion(idx, 'reference_text', e.target.value)}
                  rows={3}
                />
              </div>
            )}
            
            {/* Writing Specific */}
            {q.type === 'writing' && (
              <div className="form-section-ex">
                <div className="info-box" style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
                    ℹ️ <strong>Chấm tự động bằng ChatGPT AI:</strong> Nội dung, tổ chức, từ vựng, ngữ pháp, kỹ thuật
                  </p>
                </div>
                <label>Yêu cầu độ dài (optional)</label>
                <input
                  type="number"
                  className="form-input-ex"
                  placeholder="Số từ tối thiểu (VD: 150)"
                  value={q.min_words || ''}
                  onChange={(e) => onUpdateQuestion(idx, 'min_words', Number(e.target.value))}
                />
              </div>
            )}
            
            {/* Listening Specific */}
            {q.type === 'listening' && (
              <div className="form-section-ex">
                <div className="info-box" style={{ background: '#f3e8ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b21a8' }}>
                    ℹ️ <strong>Audio file:</strong> Học sinh nghe audio và trả lời câu hỏi
                  </p>
                </div>
                <label>Link audio hoặc upload file</label>
                <input
                  type="text"
                  className="form-input-ex"
                  placeholder="https://... hoặc /media/audio/..."
                  value={q.audio_url || ''}
                  onChange={(e) => onUpdateQuestion(idx, 'audio_url', e.target.value)}
                />
                <label style={{ marginTop: '12px' }}>Câu hỏi sau khi nghe</label>
                <textarea
                  className="form-input-ex"
                  placeholder="VD: What is the main topic? Who are the speakers?"
                  value={q.listening_question || ''}
                  onChange={(e) => onUpdateQuestion(idx, 'listening_question', e.target.value)}
                  rows={2}
                />
              </div>
            )}
            
            {/* Reading Specific */}
            {q.type === 'reading' && (
              <div className="form-section-ex">
                <div className="info-box" style={{ background: '#dcfce7', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>
                    ℹ️ <strong>Reading comprehension:</strong> Học sinh đọc đoạn văn và trả lời
                  </p>
                </div>
                <label>Câu hỏi sau khi đọc</label>
                <textarea
                  className="form-input-ex"
                  placeholder="VD: What is the main idea? According to the passage..."
                  value={q.reading_question || ''}
                  onChange={(e) => onUpdateQuestion(idx, 'reading_question', e.target.value)}
                  rows={2}
                />
              </div>
            )}
            
            {/* Points */}
            <div className="form-section-ex">
              <label>Điểm</label>
              <input 
                type="number"
                className="form-input-ex"
                value={q.points}
                onChange={(e) => onUpdateQuestion(idx, 'points', Number(e.target.value))}
                min="0.5"
                step="0.5"
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
});

QuestionList.displayName = 'QuestionList';

export default QuestionList;
