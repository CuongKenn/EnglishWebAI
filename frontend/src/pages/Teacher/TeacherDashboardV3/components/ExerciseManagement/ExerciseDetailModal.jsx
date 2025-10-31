import { useMemo, useState, useCallback, memo, useEffect } from 'react';
import { 
  X, Download, Edit, Trash2, File, FileAudio, 
  Eye, Clock, Award, Sparkles, Users, Copy, Check
} from 'lucide-react';
import './ExerciseManagement.css';
import Toast from '../../../../../components/Toast/Toast';
import useToast from '../../../../../hooks/useToast';

const ExerciseDetailModal = memo(function ExerciseDetailModal({ exercise, onClose, onUpdate, onDelete }) {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedExercise, setEditedExercise] = useState(exercise);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // info | content | questions
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [isLoadingWord, setIsLoadingWord] = useState(true);
  
  // Update editedExercise when exercise prop changes
  useEffect(() => {
    setEditedExercise(exercise);
  }, [exercise]);
  
  const statusLabel = useMemo(() => (exercise?.status === 'active' ? 'Đang mở' : exercise?.status === 'closed' ? 'Đã đóng' : (exercise?.status || '')),[exercise?.status]);
  const statusClass = useMemo(() => (exercise?.status === 'active' ? 'open' : 'closed'),[exercise?.status]);
  const submissionsRatio = useMemo(() => {
    const done = Number(exercise?.submissions || 0);
    const total = Number(exercise?.totalStudents || 0);
    if (!total) return 0;
    return Math.min(100, Math.round((done / total) * 100));
  }, [exercise?.submissions, exercise?.totalStudents]);
  
  const formatDateTime = useCallback((d) => {
    try {
      const date = new Date(d);
      return date.toLocaleString('vi-VN', { hour12: false });
    } catch { return ''; }
  }, []);
  
  const handleCopyLink = useCallback(() => {
    const link = `${window.location.origin}/exercise/${exercise?.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [exercise?.id]);
  
  
  const getSkillIcon = useCallback((skill) => {
    const icons = {
      listening: '🎧',
      speaking: '🗣️',
      reading: '📖',
      writing: '✍️'
    };
    return icons[skill] || '📝';
  }, []);
  
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
  
  const getWritingTypeLabel = useCallback((type) => {
    const labels = {
      essay: 'Essay (Tiểu luận)',
      letter: 'Letter (Thư)',
      email: 'Email',
      report: 'Report (Báo cáo)',
      story: 'Story (Truyện ngắn)',
      review: 'Review (Bài nhận xét)'
    };
    return labels[type] || type;
  }, []);
  
  const handleDownload = useCallback(async () => {
    console.log('Downloading exercise:', exercise.id);
    showSuccess('Đang tải xuống file PDF...');
  }, [exercise.id, showSuccess]);
  
  const handleSaveEdit = useCallback(() => {
    // Validate before saving
    if (!editedExercise.title || !editedExercise.title.trim()) {
      showWarning('⚠️ Vui lòng nhập tiêu đề bài tập!');
      return;
    }
    
    if (!editedExercise.maxScore || editedExercise.maxScore < 1) {
      showWarning('⚠️ Điểm tối đa phải lớn hơn 0!');
      return;
    }
    
    // Call parent's update handler
    onUpdate(editedExercise);
    setIsEditMode(false);
  }, [editedExercise, onUpdate, showWarning]);
  
  const handleCancelEdit = useCallback(() => {
    // Reset to original values
    setEditedExercise({ ...exercise });
    setIsEditMode(false);
  }, [exercise]);
  
  const handleFieldChange = useCallback((field, value) => {
    setEditedExercise(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleDeleteQuestion = useCallback((questionIndex) => {
    if (!window.confirm(`⚠️ Bạn có chắc muốn xóa câu hỏi ${questionIndex + 1}?`)) {
      return;
    }
    
    const updatedQuestions = editedExercise.content.questions.filter((_, idx) => idx !== questionIndex);
    
    setEditedExercise(prev => ({
      ...prev,
      content: {
        ...prev.content,
        questions: updatedQuestions
      }
    }));
    
    showSuccess(`✅ Đã xóa câu hỏi ${questionIndex + 1}`);
  }, [editedExercise.content.questions, showSuccess]);

  const handleEditQuestion = useCallback((questionIndex, field, value) => {
    setEditedExercise(prev => {
      const updatedQuestions = [...prev.content.questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        [field]: value
      };
      
      return {
        ...prev,
        content: {
          ...prev.content,
          questions: updatedQuestions
        }
      };
    });
  }, []);
  
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
              {exercise.skill && exercise.skill !== 'all' && (
                <span className={`skill-badge-detail ${exercise.skill}`}>
                  {getSkillIcon(exercise.skill)} {exercise.skill}
                </span>
              )}
              {exercise.skill === 'all' && (
                <span className="skill-badge-detail all-skills" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}>
                  🎯 4 Kỹ năng
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
        
        {/* Body with Tabs */}
        <div className="modal-body-detail-ex">
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #eee', marginBottom: 16 }}>
            {['info','content','questions'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: '8px 12px',
                  borderBottom: activeTab === t ? '2px solid #7c3aed' : '2px solid transparent',
                  color: activeTab === t ? '#111827' : '#6b7280',
                  fontWeight: 600
                }}
              >
                {t === 'info' ? 'Thông tin' : t === 'content' ? 'Nội dung' : 'Câu hỏi'}
              </button>
            ))}
          </div>

          {activeTab === 'info' && (
            <>
              <div className="detail-info-section">
                <h3>Thông tin chung</h3>
                <div className="summary-grid">
                  <div className="summary-card">
                    <div className="summary-title">Hạn nộp</div>
                    {isEditMode ? (
                      <input
                        type="datetime-local"
                        className="form-input-ex"
                        style={{ width: '100%' }}
                        value={editedExercise.dueDate ? new Date(editedExercise.dueDate).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                      />
                    ) : (
                      <div className="summary-value time">{formatDateTime(exercise.dueDate)}</div>
                    )}
                  </div>
                  <div className="summary-card">
                    <div className="summary-title">Điểm tối đa</div>
                    {isEditMode ? (
                      <input
                        type="number"
                        className="form-input-ex"
                        min="1"
                        value={editedExercise.maxScore}
                        onChange={(e) => handleFieldChange('maxScore', Number(e.target.value))}
                      />
                    ) : (
                      <div className="summary-value score">{exercise.maxScore} điểm</div>
                    )}
                  </div>
                  <div className="summary-card">
                    <div className="summary-title">Trạng thái</div>
                    <div className={`status-chip ${statusClass}`}>{statusLabel}</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-title">Bài nộp</div>
                    <div className="summary-value submissions">{exercise.submissions}/{exercise.totalStudents}</div>
                    <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: `${submissionsRatio}%` }} /></div>
                  </div>
                </div>
              </div>

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
            </>
          )}

          {activeTab === 'content' && (
            <>
              {/* Check if this is an imported Word file exercise */}
              {exercise.content?.file_path ? (
                <div className="skill-content-section">
                  <div className="content-block">
                    <h3>📄 File đề thi</h3>
                    <div className="file-attachment-detail" style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                      border: '2px solid #667eea30',
                      borderRadius: '12px'
                    }}>
                      <File size={48} color="#667eea" />
                      <div className="file-info-detail">
                        <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>
                          {exercise.content.original_filename || 'Đề thi.docx'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                          {exercise.content.file_size 
                            ? `${(exercise.content.file_size / 1024 / 1024).toFixed(2)} MB`
                            : 'File Word'}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setShowFileViewer(true);
                              setIsLoadingWord(true);
                            }}
                            style={{
                              padding: '8px 16px',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            <Eye size={16} />
                            Xem file (Office Viewer)
                          </button>
                          <a 
                            href={`/${exercise.content.file_path}`}
                            download={exercise.content.original_filename}
                            style={{
                              padding: '8px 16px',
                              background: '#10b981',
                              color: 'white',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            <Download size={16} />
                            Tải xuống
                          </a>
                        </div>
                      </div>
                    </div>
                    {exercise.content.description && (
                      <div style={{
                        marginTop: '16px',
                        padding: '12px 16px',
                        background: '#f3f4f6',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        <strong>📌 Lưu ý:</strong> {exercise.content.description}
                      </div>
                    )}
                    
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      border: '2px solid #fbbf24',
                      borderRadius: '12px',
                      fontSize: '13px',
                      lineHeight: '1.6'
                    }}>
                      <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>⚠️</span> Giới hạn hiển thị
                      </div>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#78350f' }}>
                        <li>✅ Hỗ trợ: <strong>.docx</strong> (Word 2007 trở lên)</li>
                        <li>❌ Không hỗ trợ: <strong>.doc</strong> (Word 97-2003)</li>
                        <li>⚠️ Một số định dạng phức tạp có thể hiển thị không đầy đủ (bảng, hình ảnh, màu nền, v.v.)</li>
                        <li>💡 Để xem đầy đủ 100%, vui lòng tải file về và mở bằng Microsoft Word</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {exercise.skill === 'listening' && renderListeningContentOnly()}
                  {exercise.skill === 'speaking' && renderSpeakingContent()}
                  {exercise.skill === 'reading' && renderReadingContentOnly()}
                  {exercise.skill === 'writing' && renderWritingContent()}
                  {(exercise.type === 'midterm' || exercise.type === 'final') && !exercise.skill && (
                    <div className="skill-content-section">
                      <div className="content-block">
                        <h3>Bài kiểm tra tổng hợp</h3>
                        <p className="no-content">Bài kiểm tra bao gồm đầy đủ 4 kỹ năng. Vui lòng xem tab "Câu hỏi" để xem chi tiết.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'questions' && (
            <div className="skill-content-section">
              {exercise.content?.file_path ? (
                <div className="content-block">
                  <p className="no-content" style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    ℹ️ Bài tập này sử dụng file Word. Câu hỏi nằm trong file đính kèm. 
                    Vui lòng xem tab "Nội dung" để tải file.
                  </p>
                </div>
              ) : ((isEditMode ? editedExercise?.content?.questions : exercise?.content?.questions) || []).length > 0 ? (
                renderQuestionsList((isEditMode ? editedExercise?.content?.questions : exercise?.content?.questions) || [])
              ) : (
                <p className="no-content">Chưa có câu hỏi</p>
              )}
            </div>
          )}
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
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      {/* File Viewer Modal */}
      {showFileViewer && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => {
            setShowFileViewer(false);
            setIsEditingWord(false);
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '1200px',
              height: '90vh',
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f9fafb'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                📄 {exercise.content.original_filename || 'Đề thi.docx'}
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <a 
                  href={`/${exercise.content.file_path}`}
                  download={exercise.content.original_filename}
                  style={{
                    padding: '6px 12px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                >
                  <Download size={16} />
                  Tải xuống
                </a>
                <button
                  onClick={() => setShowFileViewer(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px 8px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '0',
              background: '#525659'
            }}>
              {isLoadingWord ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '16px',
                  background: 'white'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ color: '#6b7280' }}>Đang tải file Word...</p>
                </div>
              ) : (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + '/' + exercise.content.file_path)}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  title="Word Document Viewer"
                  onLoad={() => setIsLoadingWord(false)}
                  onError={() => {
                    setIsLoadingWord(false);
                    showError('Không thể tải Office Viewer. Đang chạy trên localhost hoặc file không tồn tại.');
                  }}
                />
              )}
            </div>
            
            <div style={{
              padding: '12px 24px',
              borderTop: '1px solid #e5e7eb',
              background: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ fontSize: '13px', color: '#6b7280', flex: 1 }}>
                <div style={{ marginBottom: '4px' }}>
                  ✅ <strong>Hỗ trợ:</strong> .docx, .doc với đầy đủ rich text formatting
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  💡 Xem giống 100% như trong Microsoft Word
                </div>
              </div>
              <div style={{ 
                padding: '8px 16px', 
                background: '#fef3c7', 
                borderRadius: '8px',
                fontSize: '12px',
                color: '#92400e',
                fontWeight: '500'
              }}>
                ⚠️ Trên localhost có thể không load được. Deploy lên server để xem đầy đủ.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Content-only renderers to avoid brittle child indexing when using tabs
  function renderListeningContentOnly() {
    return (
      <div className="skill-content-section listening-content">
        <div className="content-block">
          <h3>🎧 Audio</h3>
          {exercise.content.audio_url ? (
            <div className="audio-player-detail">
              <audio controls src={exercise.content.audio_url} className="audio-control-full" />
              <a href={exercise.content.audio_url} download className="download-link-inline">
                <Download size={16} />
                Tải xuống audio
              </a>
            </div>
          ) : (
            <p className="no-content">Chưa có file audio</p>
          )}
        </div>

        {exercise.content.transcript && (
          <div className="content-block">
            <h3>📄 Transcript</h3>
            <div className="transcript-box">{exercise.content.transcript}</div>
            {exercise.content.show_transcript && (
              <span className="show-badge">✓ Hiển thị cho học sinh</span>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderReadingContentOnly() {
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
      </div>
    );
  }

  function renderQuestionsList(questions) {
    return (
      <div className="content-block">
        <h3>Câu hỏi ({questions.length})</h3>
        <div className="questions-list-detail">
          {questions.map((q, idx) => (
            <div key={idx} className="question-detail-card">
              <div className="question-header-detail">
                <span className="question-number">Câu {idx + 1}</span>
                <span className="question-points">
                  {isEditMode ? (
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={q.points}
                      onChange={(e) => handleEditQuestion(idx, 'points', parseFloat(e.target.value))}
                      style={{ width: '60px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  ) : q.points} điểm
                </span>
                <span className="question-type-badge">{getQuestionTypeLabel(q.type)}</span>
                {isEditMode && (
                  <button
                    className="btn-delete-question"
                    onClick={() => handleDeleteQuestion(idx)}
                    title="Xóa câu hỏi"
                    style={{
                      marginLeft: 'auto',
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px'
                    }}
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                )}
              </div>

              {isEditMode ? (
                <textarea
                  className="form-textarea-ex"
                  value={q.question}
                  onChange={(e) => handleEditQuestion(idx, 'question', e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  rows="2"
                  style={{ marginTop: '8px', width: '100%' }}
                />
              ) : (
                <p className="question-text-detail">{q.question}</p>
              )}

              {q.type === 'multiple_choice' && (
                <div className="options-detail">
                  {q.options.map((opt, i) => (
                    <div key={i} className={`option-item ${opt[0] === q.correct_answer ? 'correct' : ''}`}>
                      {opt} {opt[0] === q.correct_answer && <span className="correct-mark">✓ Đúng</span>}
                    </div>
                  ))}
                </div>
              )}

              {(q.type === 'fill_blank' || q.type === 'short_answer') && (
                <div className="answer-detail">
                  <strong>Đáp án:</strong>
                  {isEditMode ? (
                    <input
                      type="text"
                      className="form-input-ex"
                      value={q.correct_answer}
                      onChange={(e) => handleEditQuestion(idx, 'correct_answer', e.target.value)}
                      placeholder="Nhập đáp án đúng..."
                      style={{ marginLeft: '8px', width: '300px' }}
                    />
                  ) : (
                    ` ${q.correct_answer}`
                  )}
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="answer-detail">
                  <strong>Đáp án:</strong>
                  {isEditMode ? (
                    <select
                      className="form-select-ex"
                      value={q.correct_answer}
                      onChange={(e) => handleEditQuestion(idx, 'correct_answer', e.target.value)}
                      style={{ marginLeft: '8px', width: '120px' }}
                    >
                      <option value="true">Đúng</option>
                      <option value="false">Sai</option>
                    </select>
                  ) : (
                    ` ${q.correct_answer === 'true' ? 'Đúng' : 'Sai'}`
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

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
            <h3>Câu hỏi ({isEditMode ? editedExercise.content.questions.length : exercise.content.questions.length})</h3>
            <div className="questions-list-detail">
              {(isEditMode ? editedExercise.content.questions : exercise.content.questions).map((q, idx) => (
                <div key={idx} className="question-detail-card">
                  <div className="question-header-detail">
                    <span className="question-number">Câu {idx + 1}</span>
                    <span className="question-points">
                      {isEditMode ? (
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={q.points}
                          onChange={(e) => handleEditQuestion(idx, 'points', parseFloat(e.target.value))}
                          style={{ width: '60px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      ) : q.points} điểm
                    </span>
                    <span className="question-type-badge">{getQuestionTypeLabel(q.type)}</span>
                    {isEditMode && (
                      <button 
                        className="btn-delete-question"
                        onClick={() => handleDeleteQuestion(idx)}
                        title="Xóa câu hỏi"
                        style={{
                          marginLeft: 'auto',
                          padding: '6px 12px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '13px'
                        }}
                      >
                        <Trash2 size={14} />
                        Xóa
                      </button>
                    )}
                  </div>
                  
                  {isEditMode ? (
                    <textarea
                      className="form-textarea-ex"
                      value={q.question}
                      onChange={(e) => handleEditQuestion(idx, 'question', e.target.value)}
                      placeholder="Nhập nội dung câu hỏi..."
                      rows="2"
                      style={{ marginTop: '8px', width: '100%' }}
                    />
                  ) : (
                    <p className="question-text-detail">{q.question}</p>
                  )}
                  
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
                      <strong>Đáp án:</strong> 
                      {isEditMode ? (
                        <input
                          type="text"
                          className="form-input-ex"
                          value={q.correct_answer}
                          onChange={(e) => handleEditQuestion(idx, 'correct_answer', e.target.value)}
                          placeholder="Nhập đáp án đúng..."
                          style={{ marginLeft: '8px', width: '300px' }}
                        />
                      ) : (
                        ` ${q.correct_answer}`
                      )}
                    </div>
                  )}
                  
                  {q.type === 'true_false' && (
                    <div className="answer-detail">
                      <strong>Đáp án:</strong> 
                      {isEditMode ? (
                        <select
                          className="form-select-ex"
                          value={q.correct_answer}
                          onChange={(e) => handleEditQuestion(idx, 'correct_answer', e.target.value)}
                          style={{ marginLeft: '8px', width: '120px' }}
                        >
                          <option value="true">Đúng</option>
                          <option value="false">Sai</option>
                        </select>
                      ) : (
                        ` ${q.correct_answer === 'true' ? 'Đúng' : 'Sai'}`
                      )}
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
            <h3>Câu hỏi ({isEditMode ? editedExercise.content.questions.length : exercise.content.questions.length})</h3>
            <div className="questions-list-detail">
              {(isEditMode ? editedExercise.content.questions : exercise.content.questions).map((q, idx) => (
                <div key={idx} className="question-detail-card">
                  <div className="question-header-detail">
                    <span className="question-number">Câu {idx + 1}</span>
                    <span className="question-points">
                      {isEditMode ? (
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={q.points}
                          onChange={(e) => handleEditQuestion(idx, 'points', parseFloat(e.target.value))}
                          style={{ width: '60px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      ) : q.points} điểm
                    </span>
                    <span className="question-type-badge">{getQuestionTypeLabel(q.type)}</span>
                    {isEditMode && (
                      <button 
                        className="btn-delete-question"
                        onClick={() => handleDeleteQuestion(idx)}
                        title="Xóa câu hỏi"
                        style={{
                          marginLeft: 'auto',
                          padding: '6px 12px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '13px'
                        }}
                      >
                        <Trash2 size={14} />
                        Xóa
                      </button>
                    )}
                  </div>
                  
                  {isEditMode ? (
                    <textarea
                      className="form-textarea-ex"
                      value={q.question}
                      onChange={(e) => handleEditQuestion(idx, 'question', e.target.value)}
                      placeholder="Nhập nội dung câu hỏi..."
                      rows="2"
                      style={{ marginTop: '8px', width: '100%' }}
                    />
                  ) : (
                    <p className="question-text-detail">{q.question}</p>
                  )}
                  
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
                      <strong>Đáp án:</strong> 
                      {isEditMode ? (
                        <input
                          type="text"
                          className="form-input-ex"
                          value={q.correct_answer}
                          onChange={(e) => handleEditQuestion(idx, 'correct_answer', e.target.value)}
                          placeholder="Nhập đáp án đúng..."
                          style={{ marginLeft: '8px', width: '300px' }}
                        />
                      ) : (
                        ` ${q.correct_answer}`
                      )}
                    </div>
                  )}
                  
                  {q.type === 'true_false' && (
                    <div className="answer-detail">
                      <strong>Đáp án:</strong> 
                      {isEditMode ? (
                        <select
                          className="form-select-ex"
                          value={q.correct_answer}
                          onChange={(e) => handleEditQuestion(idx, 'correct_answer', e.target.value)}
                          style={{ marginLeft: '8px', width: '120px' }}
                        >
                          <option value="true">Đúng</option>
                          <option value="false">Sai</option>
                        </select>
                      ) : (
                        ` ${q.correct_answer === 'true' ? 'Đúng' : 'Sai'}`
                      )}
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
});

export default ExerciseDetailModal;
