import { useMemo, useState, useCallback, memo, useEffect } from 'react';
import {
  X, Download, Edit, Trash2, Save, Calendar, Target,
  Users, BarChart2, Copy, Check, Plus, Circle, CheckCircle2
} from 'lucide-react';
import './ExerciseDetailModal.css';
import Toast from '../../../../../components/Toast/Toast';
import useToast from '../../../../../hooks/useToast';
import { UI_CONFIG } from '../../../../../config/constants';const ExerciseDetailModal = memo(function ExerciseDetailModal({ exercise, onClose, onUpdate, onDelete }) {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedExercise, setEditedExercise] = useState(exercise);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    // Map backend fields to frontend format
    const mappedExercise = {
      ...exercise,
      skill: exercise.skill_type || exercise.skill,
      dueDate: exercise.due_at || exercise.dueDate,
      maxScore: exercise.max_score || exercise.maxScore
    };
    setEditedExercise(mappedExercise);
  }, [exercise?.id]);
  
  const statusLabel = useMemo(() => {
    return exercise?.status === 'active' ? 'Đang mở' : 'Đã đóng';
  }, [exercise?.status]);
  
  const submissionsRatio = useMemo(() => {
    const done = Number(exercise?.submissions || 0);
    const total = Number(exercise?.totalStudents || 0);
    if (!total) return 0;
    return Math.min(100, Math.round((done / total) * 100));
  }, [exercise?.submissions, exercise?.totalStudents]);
  
  const formatDateTime = useCallback((d) => {
    try {
      const date = new Date(d);
      return date.toLocaleString('vi-VN', { 
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
      });
    } catch { return 'Không xác định'; }
  }, []);
  
  const handleCopyLink = useCallback(() => {
    const link = `${window.location.origin}/exercise/${exercise?.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      showSuccess('Đã sao chép link!');
      setTimeout(() => setCopied(false), UI_CONFIG.COPIED_INDICATOR_DURATION);
    });
  }, [exercise?.id, showSuccess]);
  
  const getTypeLabel = useCallback((type) => {
    const labels = {
      skill_exercise: 'Bài tập Kỹ năng',
      test_15min: 'Kiểm tra 15 phút',
      midterm: 'Kiểm tra Giữa kì',
      final: 'Kiểm tra Cuối kì'
    };
    return labels[type] || type;
  }, []);
  
  const getQuestionTypeLabel = useCallback((type) => {
    const labels = {
      multiple_choice: 'Trắc nghiệm',
      fill_blank: 'Điền từ',
      true_false: 'Đúng/Sai',
      short_answer: 'Tự luận ngắn'
    };
    return labels[type] || type;
  }, []);
  
  const handleSaveEdit = useCallback(() => {
    if (!editedExercise.title?.trim()) {
      showWarning('Vui lòng nhập tiêu đề bài tập!');
      return;
    }
    
    if (!editedExercise.maxScore || editedExercise.maxScore < 1) {
      showWarning('Điểm tối đa phải lớn hơn 0!');
      return;
    }
    
    // Map back to backend format
    const backendFormat = {
      ...editedExercise,
      skill_type: editedExercise.skill,
      due_at: editedExercise.dueDate,
      max_score: editedExercise.maxScore
    };
    
    onUpdate(backendFormat);
    setIsEditMode(false);
    showSuccess('Đã lưu thay đổi!');
  }, [editedExercise, onUpdate, showWarning, showSuccess]);
  
  const handleCancelEdit = useCallback(() => {
    setEditedExercise({ ...exercise });
    setIsEditMode(false);
  }, [exercise]);
  
  const handleFieldChange = useCallback((field, value) => {
    setEditedExercise(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDeleteQuestion = useCallback((questionIndex) => {
    if (!window.confirm(`Bạn có chắc muốn xóa câu hỏi ${questionIndex + 1}?`)) return;
    
    const updatedQuestions = editedExercise.content.questions.filter((_, idx) => idx !== questionIndex);
    setEditedExercise(prev => ({
      ...prev,
      content: { ...prev.content, questions: updatedQuestions }
    }));
    showSuccess(`Đã xóa câu hỏi ${questionIndex + 1}`);
  }, [editedExercise.content?.questions, showSuccess]);

  const handleEditQuestion = useCallback((questionIndex, field, value) => {
    setEditedExercise(prev => {
      const updatedQuestions = [...prev.content.questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        [field]: value
      };
      return {
        ...prev,
        content: { ...prev.content, questions: updatedQuestions }
      };
    });
  }, []);
  
  const questions = useMemo(() => {
    const ex = isEditMode ? editedExercise : exercise;
    console.log('Exercise data:', ex);
    console.log('Exercise content:', ex?.content);
    console.log('Questions:', ex?.content?.questions);
    return ex?.content?.questions || [];
  }, [isEditMode, editedExercise, exercise]);
  
  return (
    <div className="modal-overlay-new" onClick={onClose}>
      <div className="modal-container-new" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header-new">
          <div className="header-top-row">
            {isEditMode ? (
              <input
                type="text"
                className="title-input-new"
                value={editedExercise.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Nhập tiêu đề bài tập..."
              />
            ) : (
              <h2 className="modal-title-new">{exercise.title}</h2>
            )}
            <button className="close-btn-new" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          
          <div className="badges-row">
            <span className={`badge-new type-${exercise.type}`}>
              {getTypeLabel(exercise.type)}
            </span>
            {exercise.skill && (
              <span className={`badge-new skill-${exercise.skill || exercise.skill_type}`}>
                {exercise.skill || exercise.skill_type}
              </span>
            )}
            <span className="badge-new class-badge">
              <Users size={14} />
              {exercise.class}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body-new">
          
          {/* Stats Grid */}
          <div className="stats-grid-new">
            <div className="stat-card-new deadline">
              <div className="stat-icon">
                <Calendar size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Hạn nộp</div>
                {isEditMode ? (
                  <input
                    type="datetime-local"
                    className="stat-input-new"
                    value={editedExercise.dueDate ? new Date(editedExercise.dueDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  />
                ) : (
                  <div className="stat-value">{formatDateTime(exercise.due_at || exercise.dueDate)}</div>
                )}
              </div>
            </div>
            
            <div className="stat-card-new score">
              <div className="stat-icon">
                <Target size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Điểm tối đa</div>
                {isEditMode ? (
                  <input
                    type="number"
                    className="stat-input-new"
                    min="1"
                    value={editedExercise.maxScore}
                    onChange={(e) => handleFieldChange('maxScore', Number(e.target.value))}
                  />
                ) : (
                  <div className="stat-value">{exercise.max_score || exercise.maxScore} điểm</div>
                )}
              </div>
            </div>
            
            <div className="stat-card-new submissions">
              <div className="stat-icon">
                <BarChart2 size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Bài nộp</div>
                <div className="stat-value">{exercise.submissions}/{exercise.totalStudents}</div>
                <div className="progress-bar-new">
                  <div className="progress-fill-new" style={{ width: `${submissionsRatio}%` }} />
                </div>
              </div>
            </div>
            
            <div className={`stat-card-new status ${exercise.status}`}>
              <div className="stat-content">
                <div className="stat-label">Trạng thái</div>
                <div className={`status-badge-new ${exercise.status}`}>
                  {statusLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Link Section */}
          <div className="link-section-new">
            <div className="section-title-new">
              <Copy size={18} />
              Link bài tập
            </div>
            <div className="link-input-wrapper">
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/exercise/${exercise?.id}`}
                className="link-input-new"
              />
              <button 
                onClick={handleCopyLink}
                className={`copy-btn-new ${copied ? 'copied' : ''}`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>
          </div>

          {/* Questions Section */}
          {questions.length > 0 && (
            <div className="questions-section-new">
              <div className="section-title-new">
                <span>Câu hỏi ({questions.length})</span>
              </div>
              
              <div className="questions-list-new">
                {questions.map((q, idx) => (
                  <div key={idx} className="question-card-new">
                    <div className="question-header-new">
                      <div className="question-number-new">{idx + 1}</div>
                      <div className="question-info-new">
                        <span className="question-type-new">{getQuestionTypeLabel(q.type)}</span>
                        <span className="question-points-new">
                          {isEditMode ? (
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={q.points}
                              onChange={(e) => handleEditQuestion(idx, 'points', parseFloat(e.target.value))}
                              className="points-input-new"
                            />
                          ) : (
                            `${q.points} điểm`
                          )}
                        </span>
                      </div>
                      {isEditMode && (
                        <button
                          className="delete-question-btn-new"
                          onClick={() => handleDeleteQuestion(idx)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="question-content-new">
                      {isEditMode ? (
                        <textarea
                          className="question-textarea-new"
                          value={q.question}
                          onChange={(e) => handleEditQuestion(idx, 'question', e.target.value)}
                          placeholder="Nhập nội dung câu hỏi..."
                          rows="3"
                        />
                      ) : (
                        <p className="question-text-new">{q.question}</p>
                      )}
                    </div>

                    {/* Multiple Choice Options */}
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="options-list-new">
                        {q.options.map((opt, i) => (
                          <div 
                            key={i} 
                            className={`option-item-new ${opt[0] === q.correct_answer ? 'correct' : ''}`}
                          >
                            {isEditMode ? (
                              <>
                                <input
                                  type="text"
                                  className="option-input-new"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...q.options];
                                    newOptions[i] = e.target.value;
                                    handleEditQuestion(idx, 'options', newOptions);
                                  }}
                                />
                                <button
                                  className={`correct-marker-new ${opt[0] === q.correct_answer ? 'active' : ''}`}
                                  onClick={() => handleEditQuestion(idx, 'correct_answer', opt[0])}
                                  title="Đặt làm đáp án đúng"
                                >
                                  {opt[0] === q.correct_answer ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="option-text-new">{opt}</span>
                                {opt[0] === q.correct_answer && (
                                  <span className="correct-badge-new">
                                    <Check size={14} />
                                    Đúng
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fill Blank / Short Answer */}
                    {(q.type === 'fill_blank' || q.type === 'short_answer') && (
                      <div className="answer-section-new">
                        <span className="answer-label-new">Đáp án:</span>
                        {isEditMode ? (
                          <input
                            type="text"
                            className="answer-input-new"
                            value={q.correct_answer}
                            onChange={(e) => handleEditQuestion(idx, 'correct_answer', e.target.value)}
                            placeholder="Nhập đáp án đúng..."
                          />
                        ) : (
                          <span className="answer-value-new">{q.correct_answer}</span>
                        )}
                      </div>
                    )}

                    {/* True/False */}
                    {q.type === 'true_false' && (
                      <div className="answer-section-new">
                        <span className="answer-label-new">Đáp án:</span>
                        {isEditMode ? (
                          <select
                            className="answer-select-new"
                            value={q.correct_answer}
                            onChange={(e) => handleEditQuestion(idx, 'correct_answer', e.target.value)}
                          >
                            <option value="true">Đúng</option>
                            <option value="false">Sai</option>
                          </select>
                        ) : (
                          <span className="answer-value-new">
                            {q.correct_answer === 'true' || q.correct_answer === true ? 'Đúng' : 'Sai'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer-new">
          <button className="btn-download-new" onClick={() => showSuccess('Tính năng đang phát triển')}>
            <Download size={18} />
            Tải xuống PDF
          </button>
          
          <div className="footer-actions-new">
            {isEditMode ? (
              <>
                <button className="btn-cancel-new" onClick={handleCancelEdit}>
                  <X size={18} />
                  Hủy
                </button>
                <button className="btn-save-new" onClick={handleSaveEdit}>
                  <Save size={18} />
                  Lưu thay đổi
                </button>
              </>
            ) : (
              <>
                <button className="btn-delete-new" onClick={() => {
                  if (window.confirm('Bạn có chắc muốn xóa bài tập này?')) {
                    onDelete(exercise.id);
                  }
                }}>
                  <Trash2 size={18} />
                  Xóa
                </button>
                <button className="btn-edit-new" onClick={() => setIsEditMode(true)}>
                  <Edit size={18} />
                  Chỉnh sửa
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {toast.show && toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
});

export default ExerciseDetailModal;
