import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Users, TrendingUp, Plus, Eye, Edit, Trash2,
  Search, Upload, X, ChevronRight, Award, Clock, Filter,
  FileText, CheckCircle, AlertCircle, Loader
} from 'lucide-react';
import './CoursesManagement.css';
import { coursesAPI } from '../../../services/api';

const SKILLS = [
  { value: 'listening', label: 'Listening', emoji: '🎧', color: '#10b981' },
  { value: 'speaking', label: 'Speaking', emoji: '🗣️', color: '#8b5cf6' },
  { value: 'reading', label: 'Reading', emoji: '📖', color: '#3b82f6' },
  { value: 'writing', label: 'Writing', emoji: '✍️', color: '#f97316' },
];

const LEVELS = [
  { value: 'Beginner', label: 'BEGINNER' },
  { value: 'Elementary', label: 'ELEMENTARY' },
  { value: 'Intermediate', label: 'INTERMEDIATE' },
  { value: 'Upper-Intermediate', label: 'UPPER-INTERMEDIATE' },
  { value: 'Advanced', label: 'ADVANCED' },
];

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

const CoursesManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // Selected course
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    skill: 'listening',
    level: 'Intermediate',
    grade: 10,
    description: '',
    lessonsCount: 20,
    durationHours: 40,
    thumbnailFile: null,
    thumbnailPreview: null,
  });

  const [message, setMessage] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Load courses
  const loadCourses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSkill !== 'all') params.skill = selectedSkill;
      if (selectedGrade !== 'all') params.grade = Number(selectedGrade);
      const data = await coursesAPI.getCourses(params);
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading courses:', error);
      setMessage({ type: 'error', text: 'Không thể tải danh sách khóa học' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [selectedSkill, selectedGrade]);

  // Filter courses by search
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase();
    return courses.filter(c => c.name?.toLowerCase().includes(query));
  }, [courses, searchQuery]);

  // Stats
  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status !== 'locked').length,
    completed: courses.filter(c => c.status === 'completed').length,
    totalStudents: courses.reduce((sum, c) => sum + (c.totalUnits || 0), 0),
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      skill: 'listening',
      level: 'Intermediate',
      grade: 10,
      description: '',
      lessonsCount: 20,
      durationHours: 40,
      thumbnailFile: null,
      thumbnailPreview: null,
    });
    setMessage(null);
  };

  // Handle thumbnail upload
  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Ảnh không được vượt quá 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          thumbnailFile: file,
          thumbnailPreview: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Create course
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage(null);

    try {
      // TODO: Upload thumbnail first when backend is ready
      // const thumbnailUrl = formData.thumbnailFile 
      //   ? await coursesManageAPI.uploadThumbnail(formData.thumbnailFile)
      //   : null;

      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        grade: Number(formData.grade),
        skill: formData.skill,
        level: formData.level,
        is_active: true,
        // thumbnail_url: thumbnailUrl, // TODO: Add when backend ready
        // duration_hours: Number(formData.durationHours), // TODO: Add when backend ready
      };

      await coursesAPI.createCourse(payload);
      setMessage({ type: 'success', text: 'Tạo khóa học thành công!' });
      resetForm();
      setIsCreateOpen(false);
      await loadCourses();
    } catch (error) {
      console.error('Create course error:', error);
      const errorMsg = error?.response?.data?.detail || error?.detail || error?.message || 'Tạo khóa học thất bại';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setFormLoading(false);
    }
  };

  // Update course
  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    
    setFormLoading(true);
    setMessage(null);

    try {
      // TODO: Upload new thumbnail if changed
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        grade: Number(formData.grade),
        skill: formData.skill,
        level: formData.level,
      };

      await coursesAPI.updateCourse(selectedCourse.id, payload);
      setMessage({ type: 'success', text: 'Cập nhật khóa học thành công!' });
      setIsEditOpen(false);
      await loadCourses();
    } catch (error) {
      console.error('Update course error:', error);
      const errorMsg = error?.response?.data?.detail || error?.detail || error?.message || 'Cập nhật thất bại';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setFormLoading(false);
    }
  };

  // Delete course
  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    
    setFormLoading(true);
    try {
      await coursesAPI.deleteCourse(selectedCourse.id);
      setMessage({ type: 'success', text: 'Xóa khóa học thành công!' });
      setIsDeleteConfirmOpen(false);
      setSelectedCourse(null);
      await loadCourses();
    } catch (error) {
      console.error('Delete course error:', error);
      const errorMsg = error?.response?.data?.detail || error?.detail || error?.message || 'Xóa khóa học thất bại';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setFormLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.name || '',
      skill: course.category || 'listening',
      level: course.level || 'Intermediate',
      grade: course.gradeLabel ? parseInt(course.gradeLabel.replace('Lớp ', '')) : 10,
      description: '',
      lessonsCount: course.totalUnits || 20,
      durationHours: 40,
      thumbnailFile: null,
      thumbnailPreview: null,
    });
    setIsEditOpen(true);
  };

  // Open detail modal
  const openDetailModal = async (course) => {
    setSelectedCourse(course);
    setIsDetailOpen(true);
  };

  // Open delete confirm
  const openDeleteConfirm = (course) => {
    setSelectedCourse(course);
    setIsDeleteConfirmOpen(true);
  };

  // Get skill color
  const getSkillColor = (skill) => {
    const skillObj = SKILLS.find(s => s.value === skill);
    return skillObj?.color || '#64748b';
  };

  // Get skill emoji
  const getSkillEmoji = (skill) => {
    const skillObj = SKILLS.find(s => s.value === skill);
    return skillObj?.emoji || '📚';
  };

  return (
    <div className="courses-management">
      {/* Header */}
      <div className="cm-header">
        <div>
          <h1 className="cm-title">Quản lý Khóa học</h1>
          <p className="cm-subtitle">Tạo và quản lý khóa học tiếng Anh từ lớp 1 đến lớp 12</p>
        </div>
        <button className="cm-btn-primary" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus size={20} />
          Tạo khóa học mới
        </button>
      </div>

      {/* Stats */}
      <div className="cm-stats">
        <div className="cm-stat-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="cm-stat-icon" style={{ backgroundColor: '#dbeafe' }}>
            <BookOpen size={24} color="#3b82f6" />
          </div>
          <div className="cm-stat-content">
            <div className="cm-stat-label">Tổng khóa học</div>
            <div className="cm-stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="cm-stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="cm-stat-icon" style={{ backgroundColor: '#d1fae5' }}>
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div className="cm-stat-content">
            <div className="cm-stat-label">Đã hoàn thành</div>
            <div className="cm-stat-value">{stats.completed}</div>
          </div>
        </div>
        <div className="cm-stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="cm-stat-icon" style={{ backgroundColor: '#fef3c7' }}>
            <TrendingUp size={24} color="#f59e0b" />
          </div>
          <div className="cm-stat-content">
            <div className="cm-stat-label">Đang hoạt động</div>
            <div className="cm-stat-value">{stats.active}</div>
          </div>
        </div>
        <div className="cm-stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="cm-stat-icon" style={{ backgroundColor: '#ede9fe' }}>
            <Users size={24} color="#8b5cf6" />
          </div>
          <div className="cm-stat-content">
            <div className="cm-stat-label">Tổng bài học</div>
            <div className="cm-stat-value">{stats.totalStudents}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="cm-filters">
        <div className="cm-search-box">
          <Search size={20} className="cm-search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cm-search-input"
          />
        </div>
        <select
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          className="cm-filter-select"
        >
          <option value="all">Tất cả kỹ năng</option>
          {SKILLS.map(skill => (
            <option key={skill.value} value={skill.value}>{skill.emoji} {skill.label}</option>
          ))}
        </select>
        <select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="cm-filter-select"
        >
          <option value="all">Tất cả lớp</option>
          {GRADES.map(grade => (
            <option key={grade} value={grade}>Lớp {grade}</option>
          ))}
        </select>
      </div>

      {/* Message */}
      {message && (
        <div className={`cm-message cm-message-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="cm-message-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Courses Grid */}
      {loading ? (
        <div className="cm-loading">
          <Loader className="cm-spinner" size={40} />
          <p>Đang tải khóa học...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="cm-empty">
          <BookOpen size={64} className="cm-empty-icon" />
          <h3>Chưa có khóa học nào</h3>
          <p>Tạo khóa học đầu tiên của bạn để bắt đầu</p>
          <button className="cm-btn-primary" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            <Plus size={20} />
            Tạo khóa học mới
          </button>
        </div>
      ) : (
        <div className="cm-grid">
          {filteredCourses.map((course) => (
            <div key={course.id} className="cm-course-card">
              <div
                className="cm-course-header"
                style={{
                  background: `linear-gradient(135deg, ${getSkillColor(course.category)}15 0%, ${getSkillColor(course.category)}30 100%)`,
                }}
              >
                <div className="cm-course-emoji">{getSkillEmoji(course.category)}</div>
                <div className="cm-course-badge" style={{ backgroundColor: getSkillColor(course.category) }}>
                  {course.level || 'INTERMEDIATE'}
                </div>
              </div>
              
              <div className="cm-course-body">
                <h3 className="cm-course-title">{course.name}</h3>
                <div className="cm-course-meta">
                  <span className="cm-course-meta-item">
                    <BookOpen size={14} />
                    {course.totalUnits} bài học
                  </span>
                  <span className="cm-course-meta-item">
                    <Award size={14} />
                    {course.totalCups} cúp
                  </span>
                </div>
                <div className="cm-course-info">
                  <span className="cm-course-skill">{course.category}</span>
                  <span className="cm-course-grade">{course.gradeLabel}</span>
                </div>
                
                <div className="cm-course-actions">
                  <button
                    className="cm-btn-icon"
                    onClick={() => openDetailModal(course)}
                    title="Xem chi tiết"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    className="cm-btn-icon"
                    onClick={() => openEditModal(course)}
                    title="Chỉnh sửa"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="cm-btn-icon cm-btn-danger"
                    onClick={() => openDeleteConfirm(course)}
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {isCreateOpen && (
        <div className="cm-modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>Tạo khóa học mới</h2>
              <button onClick={() => setIsCreateOpen(false)} className="cm-modal-close">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCourse} className="cm-modal-body">
              <div className="cm-form-group">
                <label>Tên khóa học *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Speaking Cơ Bản Lớp 10"
                  required
                />
              </div>

              <div className="cm-form-row">
                <div className="cm-form-group">
                  <label>Kỹ năng *</label>
                  <select
                    value={formData.skill}
                    onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                    required
                  >
                    {SKILLS.map(skill => (
                      <option key={skill.value} value={skill.value}>
                        {skill.emoji} {skill.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cm-form-group">
                  <label>Cấp độ *</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    required
                  >
                    {LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div className="cm-form-group">
                  <label>Khối lớp *</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    required
                  >
                    {GRADES.map(grade => (
                      <option key={grade} value={grade}>Lớp {grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cm-form-group">
                <label>Mô tả khóa học</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả nội dung và mục tiêu của khóa học..."
                  rows={4}
                />
              </div>

              <div className="cm-form-row">
                <div className="cm-form-group">
                  <label>Số bài học dự kiến</label>
                  <input
                    type="number"
                    value={formData.lessonsCount}
                    onChange={(e) => setFormData({ ...formData, lessonsCount: e.target.value })}
                    placeholder="20"
                    min="1"
                  />
                </div>
                <div className="cm-form-group">
                  <label>Thời lượng (giờ)</label>
                  <input
                    type="number"
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                    placeholder="40"
                    min="1"
                  />
                </div>
              </div>

              <div className="cm-form-group">
                <label>Thumbnail khóa học</label>
                <div className="cm-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    id="thumbnail-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="thumbnail-upload" className="cm-upload-label">
                    {formData.thumbnailPreview ? (
                      <div className="cm-thumbnail-preview">
                        <img src={formData.thumbnailPreview} alt="Preview" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFormData({ ...formData, thumbnailFile: null, thumbnailPreview: null });
                          }}
                          className="cm-thumbnail-remove"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={32} className="cm-upload-icon" />
                        <p className="cm-upload-text">Kéo thả ảnh hoặc click để chọn</p>
                        <p className="cm-upload-hint">PNG, JPG (tối đa 2MB)</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {message && (
                <div className={`cm-message cm-message-${message.type}`}>
                  {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  {message.text}
                </div>
              )}

              <div className="cm-modal-footer">
                <button type="button" className="cm-btn-secondary" onClick={() => setIsCreateOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="cm-btn-primary" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader className="cm-spinner-sm" size={18} />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Tạo khóa học
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {isEditOpen && selectedCourse && (
        <div className="cm-modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>Chỉnh sửa khóa học</h2>
              <button onClick={() => setIsEditOpen(false)} className="cm-modal-close">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateCourse} className="cm-modal-body">
              <div className="cm-form-group">
                <label>Tên khóa học *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="cm-form-row">
                <div className="cm-form-group">
                  <label>Kỹ năng *</label>
                  <select
                    value={formData.skill}
                    onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                    required
                  >
                    {SKILLS.map(skill => (
                      <option key={skill.value} value={skill.value}>
                        {skill.emoji} {skill.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cm-form-group">
                  <label>Cấp độ *</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    required
                  >
                    {LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
                <div className="cm-form-group">
                  <label>Khối lớp *</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    required
                  >
                    {GRADES.map(grade => (
                      <option key={grade} value={grade}>Lớp {grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cm-form-group">
                <label>Mô tả khóa học</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              {message && (
                <div className={`cm-message cm-message-${message.type}`}>
                  {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  {message.text}
                </div>
              )}

              <div className="cm-modal-footer">
                <button type="button" className="cm-btn-secondary" onClick={() => setIsEditOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="cm-btn-primary" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader className="cm-spinner-sm" size={18} />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Detail Modal */}
      {isDetailOpen && selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          onClose={() => setIsDetailOpen(false)}
          onEdit={() => {
            setIsDetailOpen(false);
            openEditModal(selectedCourse);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && selectedCourse && (
        <div className="cm-modal-overlay" onClick={() => setIsDeleteConfirmOpen(false)}>
          <div className="cm-modal cm-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h2>Xác nhận xóa</h2>
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="cm-modal-close">
                <X size={24} />
              </button>
            </div>
            
            <div className="cm-modal-body">
              <div className="cm-delete-confirm">
                <AlertCircle size={48} color="#ef4444" />
                <h3>Bạn có chắc chắn muốn xóa khóa học này?</h3>
                <p className="cm-delete-course-name">{selectedCourse.name}</p>
                <p className="cm-delete-warning">
                  Tất cả bài học và bài tập trong khóa học sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                </p>
              </div>

              <div className="cm-modal-footer">
                <button
                  type="button"
                  className="cm-btn-secondary"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  disabled={formLoading}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="cm-btn-danger"
                  onClick={handleDeleteCourse}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader className="cm-spinner-sm" size={18} />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Xóa khóa học
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Unit Questions Modal Component
const UnitQuestionsModal = ({ unit, course, onClose, onRefresh }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    type: '',
    prompt: '',
    options: ['', '', '', ''],
    answer: { correct: 0 },
    media_url: '',
    points: 1,
  });
  const [uploadedAudio, setUploadedAudio] = useState(null);
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [documentInputMode, setDocumentInputMode] = useState('text'); // 'text' or 'file'

  // Load questions
  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await coursesAPI.getQuestions(unit.id);
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [unit.id]);

  // Get default question type based on skill
  const getDefaultQuestionType = (skill) => {
    const types = {
      listening: 'mcq-audio',
      speaking: 'prompt',
      reading: 'mcq',
      writing: 'essay',
    };
    return types[skill] || 'mcq';
  };

  // Reset question form
  const resetQuestionForm = () => {
    const defaultType = getDefaultQuestionType(course.category);
    setQuestionForm({
      type: defaultType,
      prompt: '',
      options: ['', '', '', ''],
      answer: { correct: 0 },
      media_url: '',
      points: 1,
    });
    setUploadedAudio(null);
    setUploadedDocument(null);
    setDocumentInputMode('text');
  };

  // Handle audio file upload
  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File audio không được vượt quá 50MB');
        return;
      }
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file MP3, WAV, OGG');
        return;
      }
      setUploadedAudio(file);
      // TODO: Upload to server and get URL
      // const url = await uploadAudioFile(file);
      // setQuestionForm({ ...questionForm, media_url: url });
    }
  };

  // Handle document file upload
  const handleDocumentUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File không được vượt quá 10MB');
        return;
      }
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận file PDF, Word, hoặc Text');
        return;
      }
      setUploadedDocument(file);
      // TODO: Upload to server
    }
  };

  // Handle add question
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: questionForm.type,
        prompt: questionForm.prompt,
        points: Number(questionForm.points) || 1,
      };

      // Add options for MCQ types
      if (['mcq', 'mcq-audio'].includes(questionForm.type)) {
        payload.options = questionForm.options.filter(opt => opt.trim());
        payload.answer = { correct: Number(questionForm.answer.correct) };
      }

      // Add media URL for listening
      if (questionForm.type === 'mcq-audio' && questionForm.media_url) {
        payload.media_url = questionForm.media_url;
      }

      await coursesAPI.createQuestion(unit.id, payload);
      resetQuestionForm();
      setIsAddQuestionOpen(false);
      await loadQuestions();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };

  // Render question form based on skill
  const renderQuestionForm = () => {
    const skill = course.category;

    return (
      <form onSubmit={handleAddQuestion} className="cm-question-form">
        <div className="cm-form-group">
          <label>Loại câu hỏi</label>
          <select
            value={questionForm.type}
            onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
            required
          >
            {skill === 'listening' && (
              <>
                <option value="mcq-audio">Nghe và chọn đáp án</option>
                <option value="dictation">Nghe và viết lại</option>
              </>
            )}
            {skill === 'speaking' && (
              <option value="prompt">Câu gợi ý nói</option>
            )}
            {skill === 'reading' && (
              <>
                <option value="mcq">Chọn đáp án đúng</option>
                <option value="fill-blank">Điền vào chỗ trống</option>
                <option value="short">Câu trả lời ngắn</option>
              </>
            )}
            {skill === 'writing' && (
              <option value="essay">Viết đoạn văn</option>
            )}
          </select>
        </div>

        {/* Audio Upload for Listening */}
        {(questionForm.type === 'mcq-audio' || questionForm.type === 'dictation') && (
          <div className="cm-form-group">
            <label>🎧 NỘI DUNG BÀI NGHE</label>
            <div className="cm-file-upload-area">
              <input
                type="file"
                accept=".mp3,.wav,.ogg"
                onChange={handleAudioUpload}
                id="audio-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="audio-upload" className="cm-upload-box">
                {uploadedAudio ? (
                  <div className="cm-uploaded-file">
                    <div className="cm-file-icon">🎧</div>
                    <div className="cm-file-info">
                      <p className="cm-file-name">{uploadedAudio.name}</p>
                      <p className="cm-file-size">
                        {(uploadedAudio.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cm-file-remove"
                      onClick={(e) => {
                        e.preventDefault();
                        setUploadedAudio(null);
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="cm-upload-icon">🎧</div>
                    <p className="cm-upload-text">Click để chọn file audio</p>
                    <p className="cm-upload-hint">File Audio * (.mp3, .wav, .ogg)</p>
                    <p className="cm-upload-hint">Tối đa 50MB</p>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Document Upload for Reading */}
        {['mcq', 'fill-blank', 'short'].includes(questionForm.type) && (
          <div className="cm-form-group">
            <label>📖 NỘI DUNG BÀI ĐỌC</label>
            <div className="cm-file-upload-tabs">
              <button
                type="button"
                className={`cm-upload-tab ${documentInputMode === 'text' ? 'active' : ''}`}
                onClick={() => {
                  setDocumentInputMode('text');
                  setUploadedDocument(null);
                }}
              >
                📝 Nhập văn bản
              </button>
              <button
                type="button"
                className={`cm-upload-tab ${documentInputMode === 'file' ? 'active' : ''}`}
                onClick={() => setDocumentInputMode('file')}
              >
                📎 Upload file
              </button>
            </div>
            
            {documentInputMode === 'file' ? (
              <div className="cm-file-upload-area">
                {uploadedDocument ? (
                  <div className="cm-upload-box" style={{ padding: '1rem' }}>
                    <div className="cm-uploaded-file">
                      <div className="cm-file-icon">📄</div>
                      <div className="cm-file-info">
                        <p className="cm-file-name">{uploadedDocument.name}</p>
                        <p className="cm-file-size">
                          {(uploadedDocument.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        className="cm-file-remove"
                        onClick={(e) => {
                          e.preventDefault();
                          setUploadedDocument(null);
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleDocumentUpload}
                      id="document-upload"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="document-upload" className="cm-upload-box">
                      <div className="cm-upload-icon">📄</div>
                      <p className="cm-upload-text">Click để chọn file</p>
                      <p className="cm-upload-hint">Upload file (.pdf, .docx, .txt)</p>
                      <p className="cm-upload-hint">PDF, Word, hoặc Text - Tối đa 10MB</p>
                    </label>
                  </>
                )}
              </div>
            ) : (
              <div className="cm-text-input-hint">
                <p>💡 Nhập nội dung văn bản trực tiếp vào phần "Câu hỏi" bên dưới</p>
              </div>
            )}
          </div>
        )}

        {/* Question Prompt */}
        <div className="cm-form-group">
          <label>
            {questionForm.type === 'prompt' ? 'Câu gợi ý' :
             questionForm.type === 'essay' ? 'Đề bài' :
             'Câu hỏi'} *
          </label>
          <textarea
            value={questionForm.prompt}
            onChange={(e) => setQuestionForm({ ...questionForm, prompt: e.target.value })}
            placeholder={
              questionForm.type === 'prompt' ? 'Describe your favorite place...' :
              questionForm.type === 'essay' ? 'Write about environmental protection...' :
              'What is the main idea of the passage?'
            }
            rows={3}
            required
          />
        </div>

        {/* Options for MCQ */}
        {['mcq', 'mcq-audio'].includes(questionForm.type) && (
          <>
            <div className="cm-form-group">
              <label>Các đáp án</label>
              <div className="cm-options-grid">
                {questionForm.options.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Đáp án ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[idx] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    required
                  />
                ))}
              </div>
            </div>
            <div className="cm-form-group">
              <label>Đáp án đúng</label>
              <select
                value={questionForm.answer.correct}
                onChange={(e) => setQuestionForm({
                  ...questionForm,
                  answer: { correct: Number(e.target.value) }
                })}
              >
                {questionForm.options.map((_, idx) => (
                  <option key={idx} value={idx}>Đáp án {idx + 1}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Points */}
        <div className="cm-form-group">
          <label>Điểm</label>
          <input
            type="number"
            min="1"
            max="10"
            value={questionForm.points}
            onChange={(e) => setQuestionForm({ ...questionForm, points: e.target.value })}
          />
        </div>

        <div className="cm-form-actions">
          <button type="button" className="cm-btn-secondary" onClick={() => setIsAddQuestionOpen(false)}>
            Hủy
          </button>
          <button type="submit" className="cm-btn-primary">
            <Plus size={18} />
            Thêm câu hỏi
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="cm-modal-overlay" onClick={onClose}>
      <div className="cm-modal cm-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="cm-modal-header">
          <div>
            <h2>{unit.title}</h2>
            <p className="cm-modal-subtitle">
              Tuần {unit.week_index || 1} • {unit.max_cups || 2} cúp • Kỹ năng: {course.category}
            </p>
          </div>
          <button onClick={onClose} className="cm-modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="cm-modal-body">
          {/* Add Question Section */}
          <div className="cm-section">
            <div className="cm-section-header">
              <h3>Quản lý câu hỏi</h3>
              <button
                className="cm-btn-sm cm-btn-primary"
                onClick={() => {
                  setIsAddQuestionOpen(!isAddQuestionOpen);
                  if (!isAddQuestionOpen) resetQuestionForm();
                }}
              >
                <Plus size={16} />
                Thêm câu hỏi
              </button>
            </div>

            {isAddQuestionOpen && (
              <div className="cm-add-question-container">
                {renderQuestionForm()}
              </div>
            )}
          </div>

          {/* Questions List */}
          <div className="cm-section">
            <h3>Danh sách câu hỏi ({questions.length})</h3>
            <div className="cm-questions-list">
              {loading ? (
                <div className="cm-loading-sm">
                  <Loader className="cm-spinner" size={24} />
                  <span>Đang tải...</span>
                </div>
              ) : questions.length === 0 ? (
                <div className="cm-empty-sm">
                  <FileText size={32} />
                  <p>Chưa có câu hỏi nào</p>
                </div>
              ) : (
                questions.map((q, index) => (
                  <div key={q.id} className="cm-question-item">
                    <div className="cm-question-number">{index + 1}</div>
                    <div className="cm-question-content">
                      <div className="cm-question-header">
                        <span className="cm-question-type-badge">{q.type}</span>
                        <span className="cm-question-points">{q.points || 1} điểm</span>
                      </div>
                      <p className="cm-question-prompt">{q.prompt}</p>
                      {q.options && q.options.length > 0 && (
                        <div className="cm-question-options">
                          {q.options.map((opt, idx) => (
                            <span
                              key={idx}
                              className={`cm-option ${q.answer?.correct === idx ? 'cm-option-correct' : ''}`}
                            >
                              {String.fromCharCode(65 + idx)}. {opt}
                            </span>
                          ))}
                        </div>
                      )}
                      {q.media_url && (
                        <div className="cm-question-media">
                          <span>🎧 Audio: {q.media_url}</span>
                        </div>
                      )}
                    </div>
                    <button
                      className="cm-btn-icon-sm cm-btn-danger"
                      onClick={async () => {
                        if (window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
                          try {
                            await coursesAPI.deleteQuestion(unit.id, q.id);
                            await loadQuestions();
                            if (onRefresh) onRefresh();
                          } catch (error) {
                            console.error('Error deleting question:', error);
                          }
                        }
                      }}
                      title="Xóa câu hỏi"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="cm-modal-footer">
            <button className="cm-btn-secondary" onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Course Detail Modal Component
const CourseDetailModal = ({ course, onClose, onEdit }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitForm, setUnitForm] = useState({
    title: '',
    description: '',
    week_index: 1,
    max_cups: 2,
  });

  const loadUnits = async () => {
    setLoading(true);
    try {
      const data = await coursesAPI.getUnits(course.id);
      setUnits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading units:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [course.id]);

  const handleAddUnit = async (e) => {
    e.preventDefault();
    try {
      await coursesAPI.createUnit(course.id, unitForm);
      setUnitForm({ title: '', description: '', week_index: 1, max_cups: 2 });
      setIsAddUnitOpen(false);
      await loadUnits();
    } catch (error) {
      console.error('Error creating unit:', error);
    }
  };

  return (
    <div className="cm-modal-overlay" onClick={onClose}>
      <div className="cm-modal cm-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="cm-modal-header">
          <h2>{course.name}</h2>
          <button onClick={onClose} className="cm-modal-close">
            <X size={24} />
          </button>
        </div>
        
        <div className="cm-modal-body">
          {/* Course Info */}
          <div className="cm-detail-info">
            <div className="cm-detail-item">
              <span className="cm-detail-label">Kỹ năng</span>
              <span className="cm-detail-value">{course.category}</span>
            </div>
            <div className="cm-detail-item">
              <span className="cm-detail-label">Cấp độ</span>
              <span className="cm-detail-value">{course.level}</span>
            </div>
            <div className="cm-detail-item">
              <span className="cm-detail-label">Lớp</span>
              <span className="cm-detail-value">{course.gradeLabel}</span>
            </div>
            <div className="cm-detail-item">
              <span className="cm-detail-label">Số bài học</span>
              <span className="cm-detail-value">{course.totalUnits}</span>
            </div>
          </div>

          {/* Units List */}
          <div className="cm-units-section">
            <div className="cm-units-header">
              <h3>Danh sách bài học</h3>
              <button className="cm-btn-sm cm-btn-primary" onClick={() => setIsAddUnitOpen(!isAddUnitOpen)}>
                <Plus size={16} />
                Thêm bài học
              </button>
            </div>

            {/* Add Unit Form */}
            {isAddUnitOpen && (
              <form onSubmit={handleAddUnit} className="cm-add-unit-form">
                <div className="cm-form-row">
                  <input
                    type="text"
                    placeholder="Tên bài học"
                    value={unitForm.title}
                    onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Tuần"
                    value={unitForm.week_index}
                    onChange={(e) => setUnitForm({ ...unitForm, week_index: e.target.value })}
                    min="1"
                  />
                  <input
                    type="number"
                    placeholder="Số cúp"
                    value={unitForm.max_cups}
                    onChange={(e) => setUnitForm({ ...unitForm, max_cups: e.target.value })}
                    min="0"
                  />
                  <button type="submit" className="cm-btn-sm cm-btn-primary">Thêm</button>
                </div>
              </form>
            )}

            {/* Units List */}
            <div className="cm-units-list">
              {loading ? (
                <div className="cm-loading-sm">
                  <Loader className="cm-spinner" size={24} />
                  <span>Đang tải...</span>
                </div>
              ) : units.length === 0 ? (
                <div className="cm-empty-sm">
                  <FileText size={32} />
                  <p>Chưa có bài học nào</p>
                </div>
              ) : (
                units.map((unit, index) => (
                  <div key={unit.id} className="cm-unit-item">
                    <div className="cm-unit-number">{index + 1}</div>
                    <div className="cm-unit-info">
                      <h4>{unit.title}</h4>
                      <div className="cm-unit-meta">
                        <span>Tuần {unit.week_index || 1}</span>
                        <span>•</span>
                        <span>{unit.questions || 0} câu hỏi</span>
                        <span>•</span>
                        <span>{unit.max_cups || 2} cúp</span>
                      </div>
                    </div>
                    <div className="cm-unit-actions">
                      <button
                        className="cm-btn-icon-sm"
                        onClick={() => setSelectedUnit(unit)}
                        title="Quản lý câu hỏi"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button
                        className="cm-btn-icon-sm cm-btn-danger"
                        onClick={async () => {
                          if (window.confirm(`Bạn có chắc muốn xóa bài học "${unit.title}"?`)) {
                            try {
                                await coursesAPI.deleteUnit(course.id, unit.id);
                              await loadUnits();
                            } catch (error) {
                              console.error('Error deleting unit:', error);
                            }
                          }
                        }}
                        title="Xóa bài học"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="cm-modal-footer">
            <button className="cm-btn-secondary" onClick={onClose}>Đóng</button>
            <button className="cm-btn-primary" onClick={onEdit}>
              <Edit size={18} />
              Chỉnh sửa khóa học
            </button>
          </div>
        </div>
      </div>

      {/* Unit Questions Modal */}
      {selectedUnit && (
        <UnitQuestionsModal
          unit={selectedUnit}
          course={course}
          onClose={() => setSelectedUnit(null)}
          onRefresh={loadUnits}
        />
      )}
    </div>
  );
};

export default CoursesManagement;

