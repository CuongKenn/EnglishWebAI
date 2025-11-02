import { useState, useEffect } from 'react';
import { lessonPlansAPI } from '../../../services/api';
import { X, Plus, Sparkles, Eye, Edit, Trash2, BookOpen, Clock, GraduationCap, Download, FileText, FileDown } from 'lucide-react';
import { 
  BookOpenIcon as BookOpenHero, 
  CpuChipIcon, 
  PencilSquareIcon 
} from '@heroicons/react/24/outline';
import Toast from '../../../components/Toast/Toast';
import useToast from '../../../hooks/useToast';
import './LessonPlans.css';

const LessonPlans = () => {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const [lessonPlans, setLessonPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('all');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    grade: 6,
    unit: '',
    lesson_number: 'Lesson 1',
    duration: 45,
    objectives: { knowledge: [], skills: [], competencies: [], qualities: [] },
    teaching_aids: [],
    activities: {},
    notes: '',
    homework: ''
  });
  
  const [aiFormData, setAiFormData] = useState({
    grade: 6,
    unit: '',
    lesson_number: 'Lesson 1',
    duration: 45,
    focus_skills: ['listening', 'speaking'],
    language_functions: '',
    vocabulary_topics: [],
    grammar_points: [],
    additional_notes: ''
  });
  
  const [generating, setGenerating] = useState(false);

  // Load lesson plans
  const loadLessonPlans = async () => {
    setLoading(true);
    try {
      const params = selectedGrade !== 'all' ? { grade: parseInt(selectedGrade) } : {};
      const data = await lessonPlansAPI.getAll(params);
      setLessonPlans(data);
    } catch (error) {
      console.error('Failed to load lesson plans:', error);
      showError('Không thể tải danh sách giáo án');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessonPlans();
  }, [selectedGrade]);

  // Handle create manually
  const handleCreate = async () => {
    try {
      await lessonPlansAPI.create(formData);
      showSuccess('Tạo giáo án thành công!');
      setShowCreateModal(false);
      loadLessonPlans();
    } catch (error) {
      console.error('Failed to create:', error);
      showError('Tạo giáo án thất bại');
    }
  };

  // Handle AI generation
  const handleAIGenerate = async () => {
    if (!aiFormData.unit.trim()) {
      showWarning('Vui lòng nhập Unit/Chủ đề');
      return;
    }
    
    setGenerating(true);
    try {
      await lessonPlansAPI.generateWithAI(aiFormData);
      showSuccess('Tạo giáo án bằng AI thành công!');
      setShowAIModal(false);
      loadLessonPlans();
      // Reset form
      setAiFormData({
        grade: 6,
        unit: '',
        lesson_number: 'Lesson 1',
        duration: 45,
        focus_skills: ['listening', 'speaking'],
        language_functions: '',
        vocabulary_topics: [],
        grammar_points: [],
        additional_notes: ''
      });
    } catch (error) {
      console.error('Failed to generate:', error);
      showError('Tạo giáo án bằng AI thất bại');
    } finally {
      setGenerating(false);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    try {
      await lessonPlansAPI.update(selectedPlan.id, formData);
      showSuccess('Cập nhật giáo án thành công!');
      setShowEditModal(false);
      loadLessonPlans();
    } catch (error) {
      console.error('Failed to update:', error);
      showError('Cập nhật giáo án thất bại');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await lessonPlansAPI.delete(selectedPlan.id);
      showSuccess('Xóa giáo án thành công!');
      setShowDeleteModal(false);
      setSelectedPlan(null);
      loadLessonPlans();
    } catch (error) {
      console.error('Failed to delete:', error);
      showError('Xóa giáo án thất bại');
    }
  };

  // Open modals
  const openDetail = (plan) => {
    setSelectedPlan(plan);
    setShowDetailModal(true);
  };

  const openEdit = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      title: plan.title,
      grade: plan.grade,
      unit: plan.unit || '',
      lesson_number: plan.lesson_number || 'Lesson 1',
      duration: plan.duration || 45,
      objectives: plan.objectives || { knowledge: [], skills: [], competencies: [], qualities: [] },
      teaching_aids: plan.teaching_aids || [],
      activities: plan.activities || {},
      notes: plan.notes || '',
      homework: plan.homework || ''
    });
    setShowEditModal(true);
  };

  const openDelete = (plan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  return (
    <div className="lesson-plans-page">
      {/* Header */}
      <div className="lp-header">
        <div className="lp-header-left">
          <div className="lp-header-icon">
            <BookOpen size={32} />
          </div>
          <div>
            <h1 className="lp-title">Quản lý Giáo án</h1>
            <p className="lp-subtitle">Tạo và quản lý giáo án theo chương trình 2018</p>
          </div>
        </div>
        <div className="lp-header-actions">
          <button className="lp-btn lp-btn-ai" onClick={() => setShowAIModal(true)}>
            <Sparkles size={18} />
            <span>Tạo bằng AI</span>
          </button>
          <button className="lp-btn lp-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>Tạo giáo án</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="lp-filters">
        <div className="lp-filter-group">
          <label>Khối lớp:</label>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
            <option value="all">Tất cả</option>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i + 1}>Lớp {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="lp-stats">
        <div className="lp-stat-card">
          <div className="lp-stat-icon">
            <BookOpenHero className="w-6 h-6" />
          </div>
          <div className="lp-stat-info">
            <div className="lp-stat-value">{lessonPlans.length}</div>
            <div className="lp-stat-label">Tổng giáo án</div>
          </div>
        </div>
        <div className="lp-stat-card">
          <div className="lp-stat-icon">
            <CpuChipIcon className="w-6 h-6" />
          </div>
          <div className="lp-stat-info">
            <div className="lp-stat-value">{lessonPlans.filter(p => p.ai_generated === 1).length}</div>
            <div className="lp-stat-label">Tạo bằng AI</div>
          </div>
        </div>
        <div className="lp-stat-card">
          <div className="lp-stat-icon">
            <PencilSquareIcon className="w-6 h-6" />
          </div>
          <div className="lp-stat-info">
            <div className="lp-stat-value">{lessonPlans.filter(p => p.ai_generated === 0).length}</div>
            <div className="lp-stat-label">Tạo thủ công</div>
          </div>
        </div>
      </div>

      {/* Lesson Plans Grid */}
      <div className="lp-grid">
        {loading ? (
          <div className="lp-loading">Đang tải...</div>
        ) : lessonPlans.length === 0 ? (
          <div className="lp-empty">
            <BookOpen size={64} color="#cbd5e1" />
            <p>Chưa có giáo án nào</p>
            <button className="lp-btn lp-btn-primary" onClick={() => setShowAIModal(true)}>
              <Sparkles size={18} />
              Tạo giáo án đầu tiên bằng AI
            </button>
          </div>
        ) : (
          lessonPlans.map(plan => (
            <div key={plan.id} className="lp-card">
              {plan.ai_generated === 1 && (
                <div className="lp-badge-ai">
                  <Sparkles size={14} />
                  AI Generated
                </div>
              )}
              <div className="lp-card-header">
                <h3>{plan.title}</h3>
                <div className="lp-card-meta">
                  <span className="lp-meta-item">
                    <GraduationCap size={14} />
                    Lớp {plan.grade}
                  </span>
                  {plan.duration && (
                    <span className="lp-meta-item">
                      <Clock size={14} />
                      {plan.duration} phút
                    </span>
                  )}
                </div>
              </div>
              
              <div className="lp-card-body">
                {plan.unit && <div className="lp-card-unit">📖 {plan.unit}</div>}
                {plan.lesson_number && <div className="lp-card-lesson">{plan.lesson_number}</div>}
              </div>
              
              <div className="lp-card-actions">
                <button className="lp-card-btn" onClick={() => openDetail(plan)}>
                  <Eye size={16} />
                  Chi tiết
                </button>
                <button className="lp-card-btn" onClick={() => openEdit(plan)}>
                  <Edit size={16} />
                  Sửa
                </button>
                <button className="lp-card-btn lp-card-btn-delete" onClick={() => openDelete(plan)}>
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="lp-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="lp-modal" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-header">
              <h2>Tạo giáo án mới</h2>
              <button className="lp-modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="lp-modal-body">
              <div className="lp-form-group">
                <label>Tên bài học *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Unit 7 - Technology - Lesson 1"
                />
              </div>
              <div className="lp-form-row">
                <div className="lp-form-group">
                  <label>Khối lớp *</label>
                  <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}>
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i + 1}>Lớp {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div className="lp-form-group">
                  <label>Thời lượng (phút)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="lp-form-row">
                <div className="lp-form-group">
                  <label>Unit/Chủ đề</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="VD: Unit 7 - Technology"
                  />
                </div>
                <div className="lp-form-group">
                  <label>Tiết học</label>
                  <input
                    type="text"
                    value={formData.lesson_number}
                    onChange={(e) => setFormData({ ...formData, lesson_number: e.target.value })}
                    placeholder="Lesson 1"
                  />
                </div>
              </div>
              <div className="lp-form-group">
                <label>Ghi chú</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Ghi chú cho giáo án..."
                />
              </div>
            </div>
            <div className="lp-modal-footer">
              <button className="lp-btn lp-btn-secondary" onClick={() => setShowCreateModal(false)}>
                Hủy
              </button>
              <button className="lp-btn lp-btn-primary" onClick={handleCreate}>
                Tạo giáo án
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="lp-modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="lp-modal lp-modal-large" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-header">
              <div className="lp-modal-title-ai">
                <Sparkles size={24} />
                <h2>Tạo giáo án bằng AI</h2>
              </div>
              <button className="lp-modal-close" onClick={() => setShowAIModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="lp-modal-body">
              <div className="lp-form-row">
                <div className="lp-form-group">
                  <label>Khối lớp *</label>
                  <select value={aiFormData.grade} onChange={(e) => setAiFormData({ ...aiFormData, grade: parseInt(e.target.value) })}>
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i + 1}>Lớp {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div className="lp-form-group">
                  <label>Thời lượng (phút)</label>
                  <input
                    type="number"
                    value={aiFormData.duration}
                    onChange={(e) => setAiFormData({ ...aiFormData, duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="lp-form-row">
                <div className="lp-form-group">
                  <label>Unit/Chủ đề * (VD: Unit 7 - Technology)</label>
                  <input
                    type="text"
                    value={aiFormData.unit}
                    onChange={(e) => setAiFormData({ ...aiFormData, unit: e.target.value })}
                    placeholder="Unit 7 - Technology"
                    required
                  />
                </div>
                <div className="lp-form-group">
                  <label>Tiết học</label>
                  <input
                    type="text"
                    value={aiFormData.lesson_number}
                    onChange={(e) => setAiFormData({ ...aiFormData, lesson_number: e.target.value })}
                    placeholder="Lesson 1"
                  />
                </div>
              </div>

              <div className="lp-form-group">
                <label>Kỹ năng tập trung</label>
                <div className="lp-checkbox-group">
                  {['listening', 'speaking', 'reading', 'writing'].map(skill => (
                    <label key={skill} className="lp-checkbox-label">
                      <input
                        type="checkbox"
                        checked={aiFormData.focus_skills.includes(skill)}
                        onChange={(e) => {
                          const newSkills = e.target.checked
                            ? [...aiFormData.focus_skills, skill]
                            : aiFormData.focus_skills.filter(s => s !== skill);
                          setAiFormData({ ...aiFormData, focus_skills: newSkills });
                        }}
                      />
                      {skill.charAt(0).toUpperCase() + skill.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="lp-form-group">
                <label>Chức năng ngôn ngữ (Language Functions)</label>
                <input
                  type="text"
                  value={aiFormData.language_functions}
                  onChange={(e) => setAiFormData({ ...aiFormData, language_functions: e.target.value })}
                  placeholder="VD: Asking for directions, Making suggestions"
                />
              </div>

              <div className="lp-form-group">
                <label>Ghi chú thêm cho AI</label>
                <textarea
                  value={aiFormData.additional_notes}
                  onChange={(e) => setAiFormData({ ...aiFormData, additional_notes: e.target.value })}
                  rows={3}
                  placeholder="Thêm yêu cầu cụ thể cho AI..."
                />
              </div>
            </div>
            <div className="lp-modal-footer">
              <button className="lp-btn lp-btn-secondary" onClick={() => setShowAIModal(false)} disabled={generating}>
                Hủy
              </button>
              <button className="lp-btn lp-btn-ai" onClick={handleAIGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <span className="lp-spinner"></span>
                    Đang tạo bằng AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Tạo giáo án
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPlan && (
        <div className="lp-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="lp-modal lp-modal-large" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-header">
              <h2>{selectedPlan.title}</h2>
              <button className="lp-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="lp-modal-body lp-detail-content">
              <div className="lp-detail-meta">
                <span>📚 Lớp {selectedPlan.grade}</span>
                <span>📖 {selectedPlan.unit}</span>
                <span>⏱️ {selectedPlan.duration} phút</span>
                {selectedPlan.ai_generated === 1 && <span className="lp-detail-ai-badge">🤖 AI Generated</span>}
              </div>
              
              {selectedPlan.objectives && (
                <div className="lp-detail-section">
                  <h3>Mục tiêu bài học</h3>
                  {selectedPlan.objectives.knowledge?.length > 0 && (
                    <div className="lp-detail-subsection">
                      <h4>Kiến thức:</h4>
                      <ul>
                        {selectedPlan.objectives.knowledge.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedPlan.objectives.skills?.length > 0 && (
                    <div className="lp-detail-subsection">
                      <h4>Kỹ năng:</h4>
                      <ul>
                        {selectedPlan.objectives.skills.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedPlan.teaching_aids?.length > 0 && (
                <div className="lp-detail-section">
                  <h3>Thiết bị dạy học</h3>
                  <div className="lp-teaching-aids">
                    {selectedPlan.teaching_aids.map((aid, idx) => (
                      <span key={idx} className="lp-aid-badge">{aid}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedPlan.notes && (
                <div className="lp-detail-section">
                  <h3>Ghi chú</h3>
                  <p>{selectedPlan.notes}</p>
                </div>
              )}

              {selectedPlan.homework && (
                <div className="lp-detail-section">
                  <h3>Bài tập về nhà</h3>
                  <p>{selectedPlan.homework}</p>
                </div>
              )}
            </div>
            <div className="lp-modal-footer">
              <button className="lp-btn lp-btn-secondary" onClick={() => setShowDetailModal(false)}>
                Đóng
              </button>
              <button className="lp-btn lp-btn-primary" onClick={() => { setShowDetailModal(false); openEdit(selectedPlan); }}>
                <Edit size={16} />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPlan && (
        <div className="lp-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="lp-modal lp-modal-large" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-header">
              <h2>Chỉnh sửa giáo án</h2>
              <button className="lp-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="lp-modal-body">
              <div className="lp-form-group">
                <label>Tên bài học *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="lp-form-row">
                <div className="lp-form-group">
                  <label>Khối lớp *</label>
                  <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}>
                    {[...Array(12)].map((_, i) => (
                      <option key={i} value={i + 1}>Lớp {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div className="lp-form-group">
                  <label>Thời lượng (phút)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="lp-form-group">
                <label>Ghi chú</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="lp-form-group">
                <label>Bài tập về nhà</label>
                <textarea
                  value={formData.homework}
                  onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="lp-modal-footer">
              <button className="lp-btn lp-btn-secondary" onClick={() => setShowEditModal(false)}>
                Hủy
              </button>
              <button className="lp-btn lp-btn-primary" onClick={handleUpdate}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {showDetailModal && selectedPlan && (
        <div className="lp-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="lp-modal lp-modal-large" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-header">
              <div>
                <h2>{selectedPlan.title}</h2>
                {selectedPlan.ai_generated === 1 && (
                  <div className="lp-badge-ai" style={{ marginTop: '0.5rem' }}>
                    <Sparkles size={14} />
                    AI Generated
                  </div>
                )}
              </div>
              <button className="lp-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="lp-modal-body">
              {/* Basic Info */}
              <div className="lp-detail-section">
                <h3>📋 Thông tin cơ bản</h3>
                <div className="lp-detail-grid">
                  <div className="lp-detail-item">
                    <span className="lp-detail-label">Khối lớp:</span>
                    <span className="lp-detail-value">Lớp {selectedPlan.grade}</span>
                  </div>
                  <div className="lp-detail-item">
                    <span className="lp-detail-label">Unit:</span>
                    <span className="lp-detail-value">{selectedPlan.unit || 'Không có'}</span>
                  </div>
                  <div className="lp-detail-item">
                    <span className="lp-detail-label">Tiết học:</span>
                    <span className="lp-detail-value">{selectedPlan.lesson_number || 'Không có'}</span>
                  </div>
                  <div className="lp-detail-item">
                    <span className="lp-detail-label">Thời lượng:</span>
                    <span className="lp-detail-value">{selectedPlan.duration} phút</span>
                  </div>
                </div>
              </div>

              {/* Objectives */}
              {selectedPlan.objectives && Object.keys(selectedPlan.objectives).length > 0 && (
                <div className="lp-detail-section">
                  <h3>🎯 Mục tiêu bài học</h3>
                  {selectedPlan.objectives.knowledge && selectedPlan.objectives.knowledge.length > 0 && (
                    <div className="lp-detail-subsection">
                      <h4>Kiến thức:</h4>
                      <ul>
                        {selectedPlan.objectives.knowledge.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedPlan.objectives.skills && selectedPlan.objectives.skills.length > 0 && (
                    <div className="lp-detail-subsection">
                      <h4>Kỹ năng:</h4>
                      <ul>
                        {selectedPlan.objectives.skills.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedPlan.objectives.competencies && selectedPlan.objectives.competencies.length > 0 && (
                    <div className="lp-detail-subsection">
                      <h4>Năng lực:</h4>
                      <ul>
                        {selectedPlan.objectives.competencies.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedPlan.objectives.qualities && selectedPlan.objectives.qualities.length > 0 && (
                    <div className="lp-detail-subsection">
                      <h4>Phẩm chất:</h4>
                      <ul>
                        {selectedPlan.objectives.qualities.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Teaching Aids */}
              {selectedPlan.teaching_aids && selectedPlan.teaching_aids.length > 0 && (
                <div className="lp-detail-section">
                  <h3>🛠️ Thiết bị và học liệu</h3>
                  <ul>
                    {selectedPlan.teaching_aids.map((aid, idx) => (
                      <li key={idx}>{aid}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Activities */}
              {selectedPlan.activities && Object.keys(selectedPlan.activities).length > 0 && (
                <div className="lp-detail-section">
                  <h3>📚 Tiến trình dạy học</h3>
                  {selectedPlan.activities.warm_up && (
                    <div className="lp-activity-card">
                      <h4>Hoạt động 1: Khởi động</h4>
                      <p><strong>Nội dung:</strong> {selectedPlan.activities.warm_up.content || 'Không có'}</p>
                      {selectedPlan.activities.warm_up.duration && (
                        <p><strong>Thời lượng:</strong> {selectedPlan.activities.warm_up.duration} phút</p>
                      )}
                    </div>
                  )}
                  {selectedPlan.activities.presentation && (
                    <div className="lp-activity-card">
                      <h4>Hoạt động 2: Hình thành kiến thức</h4>
                      <p><strong>Nội dung:</strong> {selectedPlan.activities.presentation.content || 'Không có'}</p>
                      {selectedPlan.activities.presentation.duration && (
                        <p><strong>Thời lượng:</strong> {selectedPlan.activities.presentation.duration} phút</p>
                      )}
                    </div>
                  )}
                  {selectedPlan.activities.practice && (
                    <div className="lp-activity-card">
                      <h4>Hoạt động 3: Luyện tập</h4>
                      <p><strong>Nội dung:</strong> {selectedPlan.activities.practice.content || 'Không có'}</p>
                      {selectedPlan.activities.practice.duration && (
                        <p><strong>Thời lượng:</strong> {selectedPlan.activities.practice.duration} phút</p>
                      )}
                    </div>
                  )}
                  {selectedPlan.activities.production && (
                    <div className="lp-activity-card">
                      <h4>Hoạt động 4: Vận dụng</h4>
                      <p><strong>Nội dung:</strong> {selectedPlan.activities.production.content || 'Không có'}</p>
                      {selectedPlan.activities.production.duration && (
                        <p><strong>Thời lượng:</strong> {selectedPlan.activities.production.duration} phút</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedPlan.notes && (
                <div className="lp-detail-section">
                  <h3>📝 Ghi chú</h3>
                  <p className="lp-detail-text">{selectedPlan.notes}</p>
                </div>
              )}

              {/* Homework */}
              {selectedPlan.homework && (
                <div className="lp-detail-section">
                  <h3>📖 Bài tập về nhà</h3>
                  <p className="lp-detail-text">{selectedPlan.homework}</p>
                </div>
              )}
            </div>
            <div className="lp-modal-footer">
              <button className="lp-btn lp-btn-primary" onClick={() => { setShowDetailModal(false); openEdit(selectedPlan); }}>
                <Edit size={18} />
                Chỉnh sửa
              </button>
              <button className="lp-btn lp-btn-secondary" onClick={async () => {
                try {
                  const response = await lessonPlansAPI.downloadWord(selectedPlan.id);
                  const url = window.URL.createObjectURL(new Blob([response]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `${selectedPlan.title}.docx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                  showSuccess('Tải Word thành công!');
                } catch (error) {
                  console.error('Download failed:', error);
                  showError('Tải Word thất bại. Vui lòng thử lại sau.');
                }
              }}>
                <Download size={18} />
                Tải Word
              </button>
              <button className="lp-btn lp-btn-secondary" onClick={async () => {
                try {
                  const response = await lessonPlansAPI.downloadPDF(selectedPlan.id);
                  const url = window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `${selectedPlan.title}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                  showSuccess('Tải PDF thành công!');
                } catch (error) {
                  console.error('Download failed:', error);
                  showError('Tải PDF chưa được hỗ trợ. Vui lòng sử dụng tải Word thay thế.');
                }
              }}>
                <FileDown size={18} />
                Tải PDF
              </button>
              <button className="lp-btn lp-btn-close" onClick={() => setShowDetailModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPlan && (
        <div className="lp-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="lp-modal lp-modal-small" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="lp-modal-close" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="lp-modal-body">
              <p>Bạn có chắc chắn muốn xóa giáo án "<strong>{selectedPlan.title}</strong>"?</p>
              <p className="lp-warning">Hành động này không thể hoàn tác!</p>
            </div>
            <div className="lp-modal-footer">
              <button className="lp-btn lp-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </button>
              <button className="lp-btn lp-btn-danger" onClick={handleDelete}>
                <Trash2 size={16} />
                Xóa giáo án
              </button>
            </div>
          </div>
        </div>
      )}
      
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
};

export default LessonPlans;

