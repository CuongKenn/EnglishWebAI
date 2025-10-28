import { useState } from 'react';
import { 
  X, Download, Edit, Trash2, File, FileAudio, 
  Eye, Clock, Award, Sparkles, Users, Copy, Check 
} from 'lucide-react';
import './ExerciseManagement.css';

export default function ExerciseDetailModal({ exercise, onClose, onUpdate, onDelete }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedExercise, setEditedExercise] = useState({ ...exercise });
  const [copied, setCopied] = useState(false);
  
  const handleCopyLink = () => {
    const link = `${window.location.origin}/exercise/${exercise?.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const getSkillIcon = (skill) => {
    const icons = {
      listening: '🎧',
      speaking: '🗣️',
      reading: '📖',
      writing: '✍️'
    };
    return icons[skill] || '📝';
  };
  
  const getTypeLabel = (type) => {
    const labels = {
      skill_exercise: 'Bài tập Kỹ năng',
      test_15min: 'Kiểm tra 15 phút',
      midterm: 'Kiểm tra Giữa kì',
      final: 'Kiểm tra Cuối kì'
    };
    return labels[type] || type;
  };
  
  const handleDownload = async () => {
    // TODO: Call API to download exercise as PDF
    console.log('Downloading exercise:', exercise.id);
    alert('Đang tải xuống file PDF...');
  };
  
  const handleSaveEdit = () => {
    // Validate before saving
    if (!editedExercise.title || !editedExercise.title.trim()) {
      alert('⚠️ Vui lòng nhập tiêu đề bài tập!');
      return;
    }
    
    if (!editedExercise.maxScore || editedExercise.maxScore < 1) {
      alert('⚠️ Điểm tối đa phải lớn hơn 0!');
      return;
    }
    
    // Call parent's update handler
    onUpdate(editedExercise);
    setIsEditMode(false);
  };
  
  const handleCancelEdit = () => {
    // Reset to original values
    setEditedExercise({ ...exercise });
    setIsEditMode(false);
  };
  
  const handleFieldChange = (field, value) => {
    setEditedExercise({
      ...editedExercise,
      [field]: value
    });
  };
  
  return (
    <div className="exercise-modal-overlay" onClick={onClose}>
      <div className="exercise-detail-modal-large" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-detail-ex">
          <div className="header-left">
            {isEditMode ? (
              <input
                type="text"
                className="form-input-ex"
                style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}
                value={editedExercise.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Nhập tiêu đề bài tập..."
              />
            ) : (
              <h2>{exercise.title}</h2>
            )}
            <div className="exercise-meta-badges">
              <span className={`type-badge-detail ${exercise.type}`}>
                {getTypeLabel(exercise.type)}
              </span>
              {exercise.skill && (
                <span className={`skill-badge-detail ${exercise.skill}`}>
                  {getSkillIcon(exercise.skill)} {exercise.skill}
                </span>
              )}
              <span className="class-badge-detail">
                <Users size={14} />
                {exercise.class}
              </span>
              {exercise.ai_generated && (
                <span className="ai-badge-detail">
                  <Sparkles size={14} />
                  AI Generated
                </span>
              )}
            </div>
          </div>
          <button className="close-btn-detail" onClick={onClose}>×</button>
        </div>
        
        {/* Body */}
        <div className="modal-body-detail-ex">
          {/* General Info */}
          <div className="detail-info-section">
            <h3>Thông tin chung</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Hạn nộp:</span>
                {isEditMode ? (
                  <input
                    type="datetime-local"
                    className="form-input-ex"
                    style={{ width: '100%' }}
                    value={editedExercise.dueDate ? new Date(editedExercise.dueDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  />
                ) : (
                  <span className="info-value">{new Date(exercise.dueDate).toLocaleString('vi-VN')}</span>
                )}
              </div>
              <div className="info-item">
                <span className="info-label">Điểm tối đa:</span>
                {isEditMode ? (
                  <input
                    type="number"
                    className="form-input-ex"
                    style={{ width: '100%' }}
                    min="1"
                    value={editedExercise.maxScore}
                    onChange={(e) => handleFieldChange('maxScore', Number(e.target.value))}
                  />
                ) : (
                  <span className="info-value">{exercise.maxScore} điểm</span>
                )}
              </div>
              <div className="info-item">
                <span className="info-label">Trạng thái:</span>
                <span className={`status-badge-detail ${exercise.status}`}>
                  {exercise.status === 'active' ? 'Đang mở' : 'Đã đóng'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Bài nộp:</span>
                <span className="info-value">{exercise.submissions}/{exercise.totalStudents}</span>
              </div>
            </div>
          </div>

          {/* Link Section */}
          <div className="detail-info-section">
            <h3>Link bài tập cho học sinh</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/exercise/${exercise?.id}`}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#f5f5f5'
                }}
              />
              <button 
                onClick={handleCopyLink}
                style={{
                  padding: '10px 16px',
                  backgroundColor: copied ? '#10b981' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Sao chép
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Content based on skill type */}
          {exercise.skill === 'listening' && renderListeningContent()}
          {exercise.skill === 'speaking' && renderSpeakingContent()}
          {exercise.skill === 'reading' && renderReadingContent()}
          {exercise.skill === 'writing' && renderWritingContent()}
        </div>
        
        {/* Footer */}
        <div className="modal-footer-detail-ex">
          <div className="footer-left">
            {!isEditMode && (
              <button className="btn-download-detail" onClick={handleDownload}>
                <Download size={18} />
                Tải xuống (.pdf)
              </button>
            )}
          </div>
          <div className="footer-right">
            {isEditMode ? (
              <>
                <button className="btn-cancel-edit" onClick={handleCancelEdit}>
                  Hủy
                </button>
                <button className="btn-save-edit" onClick={handleSaveEdit}>
                  <Check size={18} />
                  Lưu thay đổi
                </button>
              </>
            ) : (
              <>
                <button className="btn-delete-detail" onClick={() => onDelete(exercise.id)}>
                  <Trash2 size={18} />
                  Xóa
                </button>
                <button className="btn-edit-detail" onClick={() => setIsEditMode(true)}>
                  <Edit size={18} />
                  Chỉnh sửa
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  // Listening Content
  function renderListeningContent() {
    return (
      <div className="skill-content-section listening-content">
        {/* Audio Section */}
        <div className="content-block">
          <h3>🎧 Audio</h3>
          {exercise.content.audio_url ? (
            <div className="audio-player-detail">
              <audio controls src={exercise.content.audio_url} className="audio-control-full" />
              <a 
                href={exercise.content.audio_url} 
                download 
                className="download-link-inline"
              >
                <Download size={16} />
                Tải xuống audio
              </a>
            </div>
          ) : (
            <p className="no-content">Chưa có file audio</p>
          )}
        </div>
        
        {/* Transcript */}
        {exercise.content.transcript && (
          <div className="content-block">
            <h3>📄 Transcript</h3>
            <div className="transcript-box">
              {exercise.content.transcript}
            </div>
            {exercise.content.show_transcript && (
              <span className="show-badge">✓ Hiển thị cho học sinh</span>
            )}
          </div>
        )}
        
        {/* Questions */}
        {exercise.content.questions && exercise.content.questions.length > 0 && (
          <div className="content-block">
            <h3>Câu hỏi ({exercise.content.questions.length})</h3>
            <div className="questions-list-detail">
              {exercise.content.questions.map((q, idx) => (
                <div key={idx} className="question-detail-card">
                  <div className="question-header-detail">
                    <span className="question-number">Câu {idx + 1}</span>
                    <span className="question-points">{q.points} điểm</span>
                    <span className="question-type-badge">{getQuestionTypeLabel(q.type)}</span>
                  </div>
                  <p className="question-text-detail">{q.question}</p>
                  
                  {q.type === 'multiple_choice' && (
                    <div className="options-detail">
                      {q.options.map((opt, i) => (
                        <div 
                          key={i} 
                          className={`option-item ${opt[0] === q.correct_answer ? 'correct' : ''}`}
                        >
                          {opt} {opt[0] === q.correct_answer && <span className="correct-mark">✓ Đúng</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {(q.type === 'fill_blank' || q.type === 'short_answer') && (
                    <div className="answer-detail">
                      <strong>Đáp án:</strong> {q.correct_answer}
                    </div>
                  )}
                  
                  {q.type === 'true_false' && (
                    <div className="answer-detail">
                      <strong>Đáp án:</strong> {q.correct_answer === 'true' ? 'Đúng' : 'Sai'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Speaking Content
  function renderSpeakingContent() {
    return (
      <div className="skill-content-section speaking-content">
        <div className="content-block">
          <h3>Đề bài</h3>
          <div className="prompt-display">
            {exercise.content.prompt}
          </div>
        </div>
        
        {exercise.content.instructions && exercise.content.instructions.length > 0 && (
          <div className="content-block">
            <h3>Hướng dẫn</h3>
            <ul className="instructions-list-detail">
              {exercise.content.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="content-block">
          <h3>Thời gian</h3>
          <div className="time-info-grid">
            <div className="time-item">
              <Clock size={20} />
              <div>
                <div className="time-label">Chuẩn bị</div>
                <div className="time-value">{exercise.content.preparation_time}s</div>
              </div>
            </div>
            <div className="time-item">
              <Clock size={20} />
              <div>
                <div className="time-label">Thời gian nói</div>
                <div className="time-value">{exercise.content.time_limit}s</div>
              </div>
            </div>
          </div>
        </div>
        
        {exercise.content.sample_audio && (
          <div className="content-block">
            <h3>Audio mẫu</h3>
            <audio controls src={exercise.content.sample_audio} className="audio-control-full" />
          </div>
        )}
      </div>
    );
  }
  
  // Reading Content
  function renderReadingContent() {
    return (
      <div className="skill-content-section reading-content">
        <div className="content-block">
          <h3>📖 Đoạn văn</h3>
          
          {exercise.content.passage_url ? (
            <div className="file-attachment-detail">
              <File size={24} />
              <div className="file-info-detail">
                <a href={exercise.content.passage_url} target="_blank" rel="noopener noreferrer">
                  <Eye size={16} />
                  Xem file đính kèm
                </a>
                <a href={exercise.content.passage_url} download>
                  <Download size={16} />
                  Tải xuống
                </a>
              </div>
            </div>
          ) : exercise.content.passage ? (
            <div className="passage-text-display">
              {exercise.content.passage}
              <div className="passage-stats-detail">
                <span>📊 {exercise.content.word_count} từ</span>
              </div>
            </div>
          ) : (
            <p className="no-content">Chưa có nội dung</p>
          )}
        </div>
        
        {/* Questions (same as Listening) */}
        {exercise.content.questions && exercise.content.questions.length > 0 && (
          <div className="content-block">
            <h3>Câu hỏi ({exercise.content.questions.length})</h3>
            <div className="questions-list-detail">
              {exercise.content.questions.map((q, idx) => (
                <div key={idx} className="question-detail-card">
                  <div className="question-header-detail">
                    <span className="question-number">Câu {idx + 1}</span>
                    <span className="question-points">{q.points} điểm</span>
                    <span className="question-type-badge">{getQuestionTypeLabel(q.type)}</span>
                  </div>
                  <p className="question-text-detail">{q.question}</p>
                  
                  {q.type === 'multiple_choice' && (
                    <div className="options-detail">
                      {q.options.map((opt, i) => (
                        <div 
                          key={i} 
                          className={`option-item ${opt[0] === q.correct_answer ? 'correct' : ''}`}
                        >
                          {opt} {opt[0] === q.correct_answer && <span className="correct-mark">✓ Đúng</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Writing Content
  function renderWritingContent() {
    return (
      <div className="skill-content-section writing-content">
        <div className="content-block">
          <h3>Đề bài</h3>
          <div className="prompt-display">
            {exercise.content.prompt}
          </div>
        </div>
        
        <div className="content-block">
          <h3>Thông tin bài viết</h3>
          <div className="writing-info-grid">
            <div className="info-item-detail">
              <span className="label">Loại:</span>
              <span className="value">{getWritingTypeLabel(exercise.content.type)}</span>
            </div>
            <div className="info-item-detail">
              <span className="label">Số từ:</span>
              <span className="value">
                {exercise.content.word_limit?.min || 0} - {exercise.content.word_limit?.max || 0} từ
              </span>
            </div>
          </div>
        </div>
        
        {exercise.content.instructions && exercise.content.instructions.length > 0 && (
          <div className="content-block">
            <h3>Yêu cầu</h3>
            <ul className="requirements-list-detail">
              {exercise.content.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>
        )}
        
        {exercise.content.sample_essay && (
          <div className="content-block">
            <h3>Bài mẫu</h3>
            <div className="essay-text-display">
              {exercise.content.sample_essay}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  function getQuestionTypeLabel(type) {
    const labels = {
      multiple_choice: 'Trắc nghiệm',
      fill_blank: 'Điền từ',
      true_false: 'Đúng/Sai',
      short_answer: 'Tự luận ngắn'
    };
    return labels[type] || type;
  }
  
  function getWritingTypeLabel(type) {
    const labels = {
      essay: 'Essay (Tiểu luận)',
      letter: 'Letter (Thư)',
      email: 'Email',
      report: 'Report (Báo cáo)',
      story: 'Story (Truyện ngắn)',
      review: 'Review (Bài nhận xét)'
    };
    return labels[type] || type;
  }
}

