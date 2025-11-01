import { useState, useEffect } from 'react';
import { worksheetsAPI } from '../../../services/api';
import { X, Plus, Sparkles, Eye, Edit, Trash2, FileText, Clock, Award, Download, FileDown } from 'lucide-react';
import Toast from '../../../components/Toast/Toast';
import useToast from '../../../hooks/useToast';
import './Worksheets.css';

const Worksheets = () => {
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  
  // Modals state
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  
  const [aiFormData, setAiFormData] = useState({
    grade: 6,
    unit: '',
    worksheet_type: 'multiple_choice',
    skill_focus: 'reading',
    difficulty_level: 'medium',
    num_questions: 10,
    duration: 30,
    vocabulary_topics: [],
    grammar_points: [],
    language_functions: '',
    additional_notes: ''
  });
  
  const [generating, setGenerating] = useState(false);

  const worksheetTypes = [
    { value: 'multiple_choice', label: 'Trắc nghiệm', icon: '✅' },
    { value: 'essay', label: 'Tự luận', icon: '✍️' },
    { value: 'fill_in_blank', label: 'Điền khuyết', icon: '📝' },
    { value: 'topic_based', label: 'Theo chủ đề', icon: '📚' },
    { value: 'self_study', label: 'Tự học', icon: '🎯' },
    { value: 'situational', label: 'Tình huống', icon: '💭' },
    { value: 'mixed', label: 'Kết hợp', icon: '🔀' }
  ];

  const skillOptions = [
    { value: 'listening', label: 'Listening', icon: '🎧' },
    { value: 'speaking', label: 'Speaking', icon: '🗣️' },
    { value: 'reading', label: 'Reading', icon: '📖' },
    { value: 'writing', label: 'Writing', icon: '✍️' },
    { value: 'grammar', label: 'Grammar', icon: '📚' },
    { value: 'vocabulary', label: 'Vocabulary', icon: '📝' }
  ];

  const difficultyOptions = [
    { value: 'easy', label: 'Dễ', color: '#10b981' },
    { value: 'medium', label: 'Trung bình', color: '#f59e0b' },
    { value: 'hard', label: 'Khó', color: '#ef4444' }
  ];

  // Load worksheets
  const loadWorksheets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedGrade !== 'all') params.grade = parseInt(selectedGrade);
      if (selectedType !== 'all') params.worksheet_type = selectedType;
      if (selectedSkill !== 'all') params.skill_focus = selectedSkill;
      
      const data = await worksheetsAPI.getAll(params);
      setWorksheets(data);
    } catch (error) {
      console.error('Failed to load worksheets:', error);
      showError('Không thể tải danh sách phiếu học tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorksheets();
  }, [selectedGrade, selectedType, selectedSkill]);

  // Handle AI generation
  const handleAIGenerate = async () => {
    if (!aiFormData.unit.trim()) {
      showWarning('Vui lòng nhập Unit/Chủ đề');
      return;
    }
    
    setGenerating(true);
    try {
      await worksheetsAPI.generateWithAI(aiFormData);
      showSuccess('Tạo phiếu học tập bằng AI thành công!');
      setShowAIModal(false);
      loadWorksheets();
      // Reset form
      setAiFormData({
        grade: 6,
        unit: '',
        worksheet_type: 'multiple_choice',
        skill_focus: 'reading',
        difficulty_level: 'medium',
        num_questions: 10,
        duration: 30,
        vocabulary_topics: [],
        grammar_points: [],
        language_functions: '',
        additional_notes: ''
      });
    } catch (error) {
      console.error('Failed to generate:', error);
      showError('Tạo phiếu học tập bằng AI thất bại');
    } finally {
      setGenerating(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await worksheetsAPI.delete(selectedWorksheet.id);
      showSuccess('Xóa phiếu học tập thành công!');
      setShowDeleteModal(false);
      setSelectedWorksheet(null);
      loadWorksheets();
    } catch (error) {
      console.error('Failed to delete:', error);
      showError('Xóa phiếu học tập thất bại');
    }
  };

  // Handle download Word
  const handleDownloadWord = async (id) => {
    try {
      const response = await worksheetsAPI.downloadWord(id);
      
      // Check if response is valid
      if (!response || response.size === 0) {
        throw new Error('File rỗng hoặc không hợp lệ');
      }
      
      const url = window.URL.createObjectURL(new Blob([response], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedWorksheet.title}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('Tải Word thành công!');
    } catch (error) {
      console.error('Download Word failed:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi không xác định';
      showError(`Tải Word thất bại: ${errorMessage}`);
    }
  };

  // Handle download PDF
  const handleDownloadPdf = async (id) => {
    try {
      const response = await worksheetsAPI.downloadPDF(id);
      
      // Check if response is valid
      if (!response || response.size === 0) {
        throw new Error('File rỗng hoặc không hợp lệ');
      }
      
      const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedWorksheet.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('Tải PDF thành công!');
    } catch (error) {
      console.error('Download PDF failed:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Tính năng chưa được hỗ trợ';
      showError(`Tải PDF thất bại: ${errorMessage}. Vui lòng sử dụng tải Word thay thế.`);
    }
  };

  // Open modals
  const openDetail = (worksheet) => {
    setSelectedWorksheet(worksheet);
    setShowDetailModal(true);
  };

  const openDelete = (worksheet) => {
    setSelectedWorksheet(worksheet);
    setShowDeleteModal(true);
  };

  const getTypeLabel = (type) => {
    return worksheetTypes.find(t => t.value === type)?.label || type;
  };

  const getTypeIcon = (type) => {
    return worksheetTypes.find(t => t.value === type)?.icon || '📄';
  };

  const getSkillIcon = (skill) => {
    return skillOptions.find(s => s.value === skill)?.icon || '📚';
  };

  const getDifficultyColor = (level) => {
    return difficultyOptions.find(d => d.value === level)?.color || '#64748b';
  };

  return (
    <div className="worksheets-page">
      {/* Header */}
      <div className="ws-header">
        <div className="ws-header-left">
          <div className="ws-header-icon">
            <FileText size={32} />
          </div>
          <div>
            <h1 className="ws-title">Quản lý Phiếu học tập</h1>
            <p className="ws-subtitle">Tạo phiếu học tập cho học sinh theo chương trình 2018</p>
          </div>
        </div>
        <div className="ws-header-actions">
          <button className="ws-btn ws-btn-ai" onClick={() => setShowAIModal(true)}>
            <Sparkles size={18} />
            <span>Tạo bằng AI</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="ws-filters">
        <div className="ws-filter-group">
          <label>Khối lớp:</label>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
            <option value="all">Tất cả</option>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i + 1}>Lớp {i + 1}</option>
            ))}
          </select>
        </div>
        <div className="ws-filter-group">
          <label>Loại:</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="all">Tất cả</option>
            {worksheetTypes.map(type => (
              <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
            ))}
          </select>
        </div>
        <div className="ws-filter-group">
          <label>Kỹ năng:</label>
          <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)}>
            <option value="all">Tất cả</option>
            {skillOptions.map(skill => (
              <option key={skill.value} value={skill.value}>{skill.icon} {skill.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="ws-stats">
        <div className="ws-stat-card">
          <div className="ws-stat-icon">📝</div>
          <div className="ws-stat-info">
            <div className="ws-stat-value">{worksheets.length}</div>
            <div className="ws-stat-label">Tổng phiếu</div>
          </div>
        </div>
        <div className="ws-stat-card">
          <div className="ws-stat-icon">🤖</div>
          <div className="ws-stat-info">
            <div className="ws-stat-value">{worksheets.filter(w => w.ai_generated === 1).length}</div>
            <div className="ws-stat-label">Tạo bằng AI</div>
          </div>
        </div>
        <div className="ws-stat-card">
          <div className="ws-stat-icon">✅</div>
          <div className="ws-stat-info">
            <div className="ws-stat-value">{worksheets.filter(w => w.worksheet_type === 'multiple_choice').length}</div>
            <div className="ws-stat-label">Trắc nghiệm</div>
          </div>
        </div>
        <div className="ws-stat-card">
          <div className="ws-stat-icon">✍️</div>
          <div className="ws-stat-info">
            <div className="ws-stat-value">{worksheets.filter(w => w.worksheet_type === 'essay').length}</div>
            <div className="ws-stat-label">Tự luận</div>
          </div>
        </div>
      </div>

      {/* Worksheets Grid */}
      <div className="ws-grid">
        {loading ? (
          <div className="ws-loading">Đang tải...</div>
        ) : worksheets.length === 0 ? (
          <div className="ws-empty">
            <FileText size={64} color="#cbd5e1" />
            <p>Chưa có phiếu học tập nào</p>
            <button className="ws-btn ws-btn-primary" onClick={() => setShowAIModal(true)}>
              <Sparkles size={18} />
              Tạo phiếu học tập đầu tiên bằng AI
            </button>
          </div>
        ) : (
          worksheets.map(ws => (
            <div key={ws.id} className="ws-card">
              {ws.ai_generated === 1 && (
                <div className="ws-badge-ai">
                  <Sparkles size={14} />
                  AI
                </div>
              )}
              <div className="ws-card-header">
                <div className="ws-card-type-badge">
                  {getTypeIcon(ws.worksheet_type)} {getTypeLabel(ws.worksheet_type)}
                </div>
                <h3>{ws.title}</h3>
                <div className="ws-card-meta">
                  <span className="ws-meta-item">
                    📚 Lớp {ws.grade}
                  </span>
                  {ws.skill_focus && (
                    <span className="ws-meta-item">
                      {getSkillIcon(ws.skill_focus)} {ws.skill_focus}
                    </span>
                  )}
                  {ws.difficulty_level && (
                    <span 
                      className="ws-difficulty-badge"
                      style={{ background: getDifficultyColor(ws.difficulty_level) }}
                    >
                      {difficultyOptions.find(d => d.value === ws.difficulty_level)?.label}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="ws-card-body">
                {ws.unit && <div className="ws-card-unit">📖 {ws.unit}</div>}
                <div className="ws-card-info">
                  {ws.duration && (
                    <span className="ws-info-item">
                      <Clock size={14} />
                      {ws.duration} phút
                    </span>
                  )}
                  {ws.total_points && (
                    <span className="ws-info-item">
                      <Award size={14} />
                      {ws.total_points} điểm
                    </span>
                  )}
                </div>
              </div>
              
              <div className="ws-card-actions">
                <button className="ws-card-btn" onClick={() => openDetail(ws)}>
                  <Eye size={16} />
                  Chi tiết
                </button>
                <button className="ws-card-btn ws-card-btn-delete" onClick={() => openDelete(ws)}>
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="ws-modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="ws-modal ws-modal-large" onClick={e => e.stopPropagation()}>
            <div className="ws-modal-header">
              <div className="ws-modal-title-ai">
                <Sparkles size={24} />
                <h2>Tạo phiếu học tập bằng AI</h2>
              </div>
              <button className="ws-modal-close" onClick={() => setShowAIModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="ws-modal-body">
              <div className="ws-form-row">
                <div className="ws-form-group">
                  <label>Khối lớp *</label>
                  <select value={aiFormData.grade} onChange={(e) => setAiFormData({ ...aiFormData, grade: parseInt(e.target.value) })}>
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i + 1}>Lớp {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div className="ws-form-group">
                  <label>Unit/Chủ đề *</label>
                  <input
                    type="text"
                    value={aiFormData.unit}
                    onChange={(e) => setAiFormData({ ...aiFormData, unit: e.target.value })}
                    placeholder="Unit 7 - Technology"
                    required
                  />
                </div>
              </div>
              
              <div className="ws-form-row">
                <div className="ws-form-group">
                  <label>Loại phiếu *</label>
                  <select value={aiFormData.worksheet_type} onChange={(e) => setAiFormData({ ...aiFormData, worksheet_type: e.target.value })}>
                    {worksheetTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="ws-form-group">
                  <label>Kỹ năng tập trung *</label>
                  <select value={aiFormData.skill_focus} onChange={(e) => setAiFormData({ ...aiFormData, skill_focus: e.target.value })}>
                    {skillOptions.map(skill => (
                      <option key={skill.value} value={skill.value}>{skill.icon} {skill.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ws-form-row">
                <div className="ws-form-group">
                  <label>Độ khó *</label>
                  <select value={aiFormData.difficulty_level} onChange={(e) => setAiFormData({ ...aiFormData, difficulty_level: e.target.value })}>
                    {difficultyOptions.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>
                <div className="ws-form-group">
                  <label>Số câu hỏi</label>
                  <input
                    type="number"
                    value={aiFormData.num_questions}
                    onChange={(e) => setAiFormData({ ...aiFormData, num_questions: parseInt(e.target.value) })}
                    min={5}
                    max={50}
                  />
                </div>
              </div>

              <div className="ws-form-row">
                <div className="ws-form-group">
                  <label>Thời gian (phút)</label>
                  <input
                    type="number"
                    value={aiFormData.duration}
                    onChange={(e) => setAiFormData({ ...aiFormData, duration: parseInt(e.target.value) })}
                    min={10}
                    max={90}
                  />
                </div>
                <div className="ws-form-group">
                  <label>Chức năng ngôn ngữ</label>
                  <input
                    type="text"
                    value={aiFormData.language_functions}
                    onChange={(e) => setAiFormData({ ...aiFormData, language_functions: e.target.value })}
                    placeholder="Asking for directions"
                  />
                </div>
              </div>

              <div className="ws-form-group">
                <label>Ghi chú thêm cho AI</label>
                <textarea
                  value={aiFormData.additional_notes}
                  onChange={(e) => setAiFormData({ ...aiFormData, additional_notes: e.target.value })}
                  rows={3}
                  placeholder="Thêm yêu cầu cụ thể..."
                />
              </div>
            </div>
            <div className="ws-modal-footer">
              <button className="ws-btn ws-btn-secondary" onClick={() => setShowAIModal(false)} disabled={generating}>
                Hủy
              </button>
              <button className="ws-btn ws-btn-ai" onClick={handleAIGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <span className="ws-spinner"></span>
                    Đang tạo bằng AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Tạo phiếu học tập
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedWorksheet && (
        <div className="ws-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="ws-modal ws-modal-large" onClick={e => e.stopPropagation()}>
            <div className="ws-modal-header">
              <h2>{selectedWorksheet.title}</h2>
              <button className="ws-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="ws-modal-body ws-detail-content">
              <div className="ws-detail-meta">
                <span>📚 Lớp {selectedWorksheet.grade}</span>
                <span>{getTypeIcon(selectedWorksheet.worksheet_type)} {getTypeLabel(selectedWorksheet.worksheet_type)}</span>
                {selectedWorksheet.skill_focus && <span>{getSkillIcon(selectedWorksheet.skill_focus)} {selectedWorksheet.skill_focus}</span>}
                <span
                  style={{ 
                    background: getDifficultyColor(selectedWorksheet.difficulty_level),
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}
                >
                  {difficultyOptions.find(d => d.value === selectedWorksheet.difficulty_level)?.label}
                </span>
                <span>⏱️ {selectedWorksheet.duration} phút</span>
                {selectedWorksheet.total_points && <span>⭐ {selectedWorksheet.total_points} điểm</span>}
                {selectedWorksheet.ai_generated === 1 && <span className="ws-detail-ai-badge">🤖 AI Generated</span>}
              </div>
              
              {selectedWorksheet.unit && (
                <div className="ws-detail-section">
                  <h3>Unit/Chủ đề</h3>
                  <p>{selectedWorksheet.unit}</p>
                </div>
              )}

              {selectedWorksheet.teacher_notes && (
                <div className="ws-detail-section">
                  <h3>Ghi chú cho giáo viên</h3>
                  <p>{selectedWorksheet.teacher_notes}</p>
                </div>
              )}

              {selectedWorksheet.content && (
                <div className="ws-detail-section">
                  <h3>Nội dung phiếu học tập</h3>
                  <div className="ws-content-display">
                    {typeof selectedWorksheet.content === 'string' 
                      ? selectedWorksheet.content
                      : JSON.stringify(selectedWorksheet.content, null, 2)}
                  </div>
                </div>
              )}
              
              {selectedWorksheet.answer_key && (
                <div className="ws-detail-section">
                  <h3>Đáp án</h3>
                  <div className="ws-content-display">
                    {typeof selectedWorksheet.answer_key === 'string' 
                      ? selectedWorksheet.answer_key
                      : JSON.stringify(selectedWorksheet.answer_key, null, 2)}
                  </div>
                </div>
              )}
            </div>
            <div className="ws-modal-footer">
              <button className="ws-btn ws-btn-primary" onClick={() => handleDownloadWord(selectedWorksheet.id)}>
                <Download size={18} />
                Tải Word
              </button>
              <button className="ws-btn ws-btn-secondary" onClick={() => handleDownloadPdf(selectedWorksheet.id)}>
                <FileDown size={18} />
                Tải PDF
              </button>
              <button className="ws-btn ws-btn-close" onClick={() => setShowDetailModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedWorksheet && (
        <div className="ws-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="ws-modal ws-modal-small" onClick={e => e.stopPropagation()}>
            <div className="ws-modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="ws-modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="ws-modal-body">
              <p>Bạn có chắc chắn muốn xóa phiếu học tập "<strong>{selectedWorksheet.title}</strong>"?</p>
              <p className="ws-warning">Hành động này không thể hoàn tác!</p>
            </div>
            <div className="ws-modal-footer">
              <button className="ws-btn ws-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </button>
              <button className="ws-btn ws-btn-danger" onClick={handleDelete}>
                <Trash2 size={16} />
                Xóa phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default Worksheets;

