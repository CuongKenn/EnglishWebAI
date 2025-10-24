import React, { useState, useEffect } from 'react';
import './AssignmentsTests.css';
import apiClient from '../../../services/api';

const AssignmentsTests = () => {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'assignment',
    class_id: '',
    max_score: 10,
    due_date: '',
    duration: 60,
    allow_late_submission: true,
    instructions: ''
  });
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAssignments();
    loadClasses();
  }, []);

  const loadAssignments = () => {
    // Mock data - replace with API call
    setAssignments([
      {
        id: 1,
        title: 'English Grammar Test - Unit 5',
        description: 'Kiểm tra ngữ pháp unit 5',
        type: 'quiz',
        class_id: 1,
        max_score: 10,
        due_date: '2025-02-01',
        status: 'active',
        submissions: 15,
        total_students: 30,
        created_at: '2025-01-15'
      },
      {
        id: 2,
        title: 'Writing Assignment - My Favorite Book',
        description: 'Viết essay về cuốn sách yêu thích',
        type: 'assignment',
        class_id: 1,
        max_score: 20,
        due_date: '2025-02-05',
        status: 'active',
        submissions: 8,
        total_students: 30,
        created_at: '2025-01-14'
      },
      {
        id: 3,
        title: 'Vocabulary Quiz - Chapter 3',
        description: 'Kiểm tra từ vựng chương 3',
        type: 'quiz',
        class_id: 2,
        max_score: 15,
        due_date: '2025-01-20',
        status: 'closed',
        submissions: 25,
        total_students: 25,
        created_at: '2025-01-10'
      }
    ]);
  };

  const loadClasses = async () => {
    try {
      const res = await apiClient.get('/api/v1/classes/teaching');
      setClasses(res.data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        alert('Cập nhật bài tập thành công');
      } else {
        alert('Tạo bài tập thành công');
      }
      setShowModal(false);
      resetForm();
      loadAssignments();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = (id) => {
    if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;
    alert('Xóa bài tập thành công');
    loadAssignments();
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      class_id: assignment.class_id,
      max_score: assignment.max_score,
      due_date: assignment.due_date,
      duration: assignment.duration || 60,
      allow_late_submission: assignment.allow_late_submission !== false,
      instructions: assignment.instructions || ''
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'assignment',
      class_id: '',
      max_score: 10,
      due_date: '',
      duration: 60,
      allow_late_submission: true,
      instructions: ''
    });
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (a.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || a.type === filterType;
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'green';
      case 'closed': return 'gray';
      case 'draft': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'active': return '🟢 Đang mở';
      case 'closed': return '🔴 Đã đóng';
      case 'draft': return '🟡 Nháp';
      default: return status;
    }
  };

  const getTypeIcon = (type) => {
    return type === 'quiz' ? '📝' : '📄';
  };

  const getTypeLabel = (type) => {
    return type === 'quiz' ? 'Kiểm tra' : 'Bài tập';
  };

  return (
    <div className="assignments-tests">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bài tập & Kiểm tra 📝</h1>
          <p className="page-subtitle">Tạo và quản lý bài tập, bài kiểm tra cho học sinh</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          ➕ Tạo bài tập mới
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box blue">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{assignments.length}</div>
            <div className="stat-label">Tổng bài tập</div>
          </div>
        </div>
        <div className="stat-box green">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{assignments.filter(a => a.status === 'active').length}</div>
            <div className="stat-label">Đang mở</div>
          </div>
        </div>
        <div className="stat-box orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">
              {assignments.reduce((sum, a) => sum + (a.total_students - a.submissions), 0)}
            </div>
            <div className="stat-label">Chưa nộp</div>
          </div>
        </div>
        <div className="stat-box purple">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">
              {Math.round(
                (assignments.reduce((sum, a) => sum + a.submissions, 0) /
                assignments.reduce((sum, a) => sum + a.total_students, 0)) * 100
              ) || 0}%
            </div>
            <div className="stat-label">Tỷ lệ nộp</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Tìm kiếm bài tập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">Tất cả loại</option>
          <option value="assignment">Bài tập</option>
          <option value="quiz">Kiểm tra</option>
        </select>
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang mở</option>
          <option value="closed">Đã đóng</option>
          <option value="draft">Nháp</option>
        </select>
      </div>

      {/* Assignments List */}
      <div className="assignments-list">
        {filteredAssignments.map(assignment => (
          <div key={assignment.id} className="assignment-card">
            <div className="assignment-card-header">
              <div className="assignment-title-section">
                <span className="assignment-icon">{getTypeIcon(assignment.type)}</span>
                <div>
                  <h3 className="assignment-title">{assignment.title}</h3>
                  <p className="assignment-description">{assignment.description}</p>
                </div>
              </div>
              <div className="assignment-badges">
                <span className={`badge status ${getStatusColor(assignment.status)}`}>
                  {getStatusLabel(assignment.status)}
                </span>
                <span className="badge type">{getTypeLabel(assignment.type)}</span>
              </div>
            </div>

            <div className="assignment-card-body">
              <div className="assignment-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Lớp học:</span>
                  <span className="meta-value">
                    {classes.find(c => c.id === assignment.class_id)?.name || 'N/A'}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Hạn nộp:</span>
                  <span className="meta-value">
                    📅 {new Date(assignment.due_date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Điểm tối đa:</span>
                  <span className="meta-value">⭐ {assignment.max_score} điểm</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Tỷ lệ nộp:</span>
                  <span className="meta-value">
                    {assignment.submissions}/{assignment.total_students} 
                    ({Math.round((assignment.submissions/assignment.total_students)*100)}%)
                  </span>
                </div>
              </div>

              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{width: `${(assignment.submissions/assignment.total_students)*100}%`}}
                ></div>
              </div>
            </div>

            <div className="assignment-card-actions">
              <button className="action-btn view" title="Xem chi tiết">
                👁️ Chi tiết
              </button>
              <button className="action-btn" title="Xem bài nộp">
                📥 Bài nộp ({assignment.submissions})
              </button>
              <button className="action-btn edit" onClick={() => openEditModal(assignment)} title="Sửa">
                ✏️ Sửa
              </button>
              <button className="action-btn delete" onClick={() => handleDelete(assignment.id)} title="Xóa">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có bài tập nào</h3>
          <p>Tạo bài tập hoặc bài kiểm tra đầu tiên cho học sinh của bạn</p>
          <button className="btn-primary" onClick={openCreateModal}>
            ➕ Tạo bài tập đầu tiên
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAssignment ? '✏️ Chỉnh sửa bài tập' : '➕ Tạo bài tập mới'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group flex-2">
                    <label>Tiêu đề <span className="required">*</span></label>
                    <input 
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Nhập tiêu đề bài tập"
                    />
                  </div>

                  <div className="form-group">
                    <label>Loại <span className="required">*</span></label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="assignment">📄 Bài tập</option>
                      <option value="quiz">📝 Kiểm tra</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea 
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Mô tả ngắn về bài tập..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Lớp học <span className="required">*</span></label>
                    <select 
                      required
                      value={formData.class_id}
                      onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                    >
                      <option value="">-- Chọn lớp --</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Điểm tối đa <span className="required">*</span></label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={formData.max_score}
                      onChange={(e) => setFormData({...formData, max_score: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Hạn nộp <span className="required">*</span></label>
                    <input 
                      type="datetime-local"
                      required
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    />
                  </div>
                </div>

                {formData.type === 'quiz' && (
                  <div className="form-group">
                    <label>Thời gian làm bài (phút) <span className="required">*</span></label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Hướng dẫn chi tiết</label>
                  <textarea 
                    rows="4"
                    value={formData.instructions}
                    onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                    placeholder="Nhập hướng dẫn chi tiết cho học sinh..."
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={formData.allow_late_submission}
                      onChange={(e) => setFormData({...formData, allow_late_submission: e.target.checked})}
                    />
                    <span>Cho phép nộp muộn</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingAssignment ? '💾 Cập nhật' : '➕ Tạo bài tập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsTests;

