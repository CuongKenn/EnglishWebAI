import React, { useState, useEffect } from 'react';
import './MaterialsManagement.css';
import apiClient from '../../../services/api';

const MaterialsManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'file',
    description: '',
    class_id: '',
    url: '',
    file: null
  });
  const [filterType, setFilterType] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMaterials();
    loadClasses();
  }, []);

  const loadMaterials = async () => {
    try {
      // TODO: Update API endpoint when backend is ready
      const res = await apiClient.get('/api/v1/materials');
      setMaterials(res.data || []);
    } catch (error) {
      console.error('Failed to load materials:', error);
      // Mock data for demonstration
      setMaterials([
        { id: 1, title: 'English Grammar Basics', type: 'file', description: 'Tài liệu ngữ pháp cơ bản', class_id: 1, created_at: '2025-01-15' },
        { id: 2, title: 'Reading Comprehension', type: 'file', description: 'Bài tập đọc hiểu', class_id: 1, created_at: '2025-01-14' },
        { id: 3, title: 'Video Tutorial', type: 'link', description: 'Video hướng dẫn phát âm', url: 'https://youtube.com', class_id: 2, created_at: '2025-01-13' },
      ]);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await apiClient.get('/api/v1/classes/teaching');
      setClasses(res.data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        // Update material
        await apiClient.put(`/api/v1/materials/${editingMaterial.id}`, formData);
        alert('Cập nhật học liệu thành công');
      } else {
        // Create new material
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key]) formDataToSend.append(key, formData[key]);
        });
        await apiClient.post('/api/v1/materials', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Thêm học liệu thành công');
      }
      setShowModal(false);
      resetForm();
      loadMaterials();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa học liệu này?')) return;
    try {
      await apiClient.delete(`/api/v1/materials/${id}`);
      alert('Xóa học liệu thành công');
      loadMaterials();
    } catch (error) {
      alert('Xóa học liệu thất bại');
    }
  };

  const openEditModal = (material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      type: material.type,
      description: material.description || '',
      class_id: material.class_id,
      url: material.url || '',
      file: null
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingMaterial(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'file',
      description: '',
      class_id: '',
      url: '',
      file: null
    });
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (material.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || material.type === filterType;
    const matchesClass = filterClass === 'all' || material.class_id.toString() === filterClass;
    return matchesSearch && matchesType && matchesClass;
  });

  const getTypeIcon = (type) => {
    switch(type) {
      case 'file': return '📄';
      case 'link': return '🔗';
      case 'video': return '🎥';
      case 'text': return '📝';
      default: return '📚';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'file': return 'Tệp tin';
      case 'link': return 'Liên kết';
      case 'video': return 'Video';
      case 'text': return 'Văn bản';
      default: return type;
    }
  };

  return (
    <div className="materials-management">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý học liệu 📚</h1>
          <p className="page-subtitle">Tạo và quản lý tài liệu học tập cho học sinh</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          ➕ Thêm học liệu mới
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Tìm kiếm học liệu..."
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
          <option value="file">Tệp tin</option>
          <option value="link">Liên kết</option>
          <option value="video">Video</option>
          <option value="text">Văn bản</option>
        </select>
        <select 
          className="filter-select"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="all">Tất cả lớp</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {/* Materials Grid */}
      <div className="materials-grid">
        {filteredMaterials.map(material => (
          <div key={material.id} className="material-card">
            <div className="material-card-header">
              <div className="material-icon">{getTypeIcon(material.type)}</div>
              <span className="material-type-badge">{getTypeLabel(material.type)}</span>
            </div>
            
            <div className="material-card-body">
              <h3 className="material-title">{material.title}</h3>
              <p className="material-description">{material.description || 'Không có mô tả'}</p>
              
              <div className="material-meta">
                <div className="meta-item">
                  <span className="meta-icon">🏫</span>
                  <span className="meta-text">
                    {classes.find(c => c.id === material.class_id)?.name || 'Không có lớp'}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span className="meta-text">
                    {new Date(material.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="material-card-actions">
              <button className="action-btn view" title="Xem">👁️</button>
              <button className="action-btn edit" onClick={() => openEditModal(material)} title="Sửa">✏️</button>
              <button className="action-btn delete" onClick={() => handleDelete(material.id)} title="Xóa">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có học liệu nào</h3>
          <p>Bắt đầu bằng cách thêm học liệu mới cho lớp học của bạn</p>
          <button className="btn-primary" onClick={openCreateModal}>
            ➕ Thêm học liệu đầu tiên
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMaterial ? '✏️ Chỉnh sửa học liệu' : '➕ Thêm học liệu mới'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tiêu đề <span className="required">*</span></label>
                  <input 
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Nhập tiêu đề học liệu"
                  />
                </div>

                <div className="form-group">
                  <label>Loại học liệu <span className="required">*</span></label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="file">📄 Tệp tin</option>
                    <option value="link">🔗 Liên kết</option>
                    <option value="video">🎥 Video</option>
                    <option value="text">📝 Văn bản</option>
                  </select>
                </div>

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

                {formData.type === 'link' && (
                  <div className="form-group">
                    <label>URL <span className="required">*</span></label>
                    <input 
                      type="url"
                      required
                      value={formData.url}
                      onChange={(e) => setFormData({...formData, url: e.target.value})}
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                {formData.type === 'file' && (
                  <div className="form-group">
                    <label>Tệp tin <span className="required">*</span></label>
                    <input 
                      type="file"
                      onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea 
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Nhập mô tả về học liệu này..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingMaterial ? '💾 Cập nhật' : '➕ Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsManagement;

