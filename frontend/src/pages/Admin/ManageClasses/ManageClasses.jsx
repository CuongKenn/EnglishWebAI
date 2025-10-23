import React, { useEffect, useState } from 'react';
import './ManageClasses.css';
import apiClient from '../../../services/api';

const ManageClasses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedClass, setSelectedClass] = useState(null);

  const [teachers, setTeachers] = useState([]);

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacherId: '',
    grade: '',
    skill: 'listening',
    maxStudents: 30,
    schedule: '',
    status: 'active',
    description: ''
  });

  const loadTeachers = async () => {
    try {
      const res = await apiClient.get('/api/v1/admin/teachers');
      const data = res.data;
      setTeachers(Array.isArray(data) ? data : []);
    } catch (e) {
      // silent
    }
  };

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/api/v1/admin/classes', { params: { search: searchTerm || undefined } });
      const data = res.data;
      setClasses(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Không tải được danh sách lớp học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadTeachers();
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadClasses(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Statistics
  const stats = {
    totalClasses: classes.length,
    activeClasses: classes.filter(c => c.status === 'active').length,
    totalStudents: classes.reduce((sum, c) => sum + c.students, 0),
    averageStudents: Math.round(classes.reduce((sum, c) => sum + c.students, 0) / classes.length)
  };

  const handleOpenModal = (mode, classData = null) => {
    setModalMode(mode);
    if (mode === 'edit' && classData) {
      setSelectedClass(classData);
      setFormData({
        name: classData.name,
        code: classData.code,
        teacherId: classData.teacherId,
        grade: classData.grade || '',
        skill: classData.skill || 'listening',
        maxStudents: classData.maxStudents,
        schedule: classData.schedule,
        status: classData.status,
        description: classData.description
      });
    } else {
      setFormData({
        name: '',
        code: '',
        teacherId: '',
        grade: '',
        skill: 'listening',
        maxStudents: 30,
        schedule: '',
        status: 'active',
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedClass(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        teacherId: formData.teacherId ? parseInt(formData.teacherId) : null,
        grade: formData.grade ? parseInt(formData.grade) : null,
        skill: formData.skill || null,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
        schedule: formData.schedule,
        status: formData.status,
        description: formData.description,
      };
      if (modalMode === 'add') {
        await apiClient.post('/api/v1/admin/classes', payload);
      } else if (selectedClass) {
        await apiClient.put(`/api/v1/admin/classes/${selectedClass.id}`, payload);
      }
      await loadClasses();
      handleCloseModal();
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Lưu lớp học thất bại';
      alert(msg);
    }
  };

  const handleDelete = async (classId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
      try {
        await apiClient.delete(`/api/v1/admin/classes/${classId}`);
        await loadClasses();
      } catch (e) {
        const msg = e?.response?.data?.detail || 'Xóa lớp học thất bại';
        alert(msg);
      }
    }
  };

  const filteredClasses = classes.filter(classData =>
    (classData.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (classData.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (classData.teacher || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container">
      <div className="admin-content">
        {/* Header */}
        <div className="admin-header">
          <h1>📚 Quản lý lớp học</h1>
          <p>Quản lý lớp học và phân công giảng dạy</p>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Tổng số lớp</span>
              <span className="stat-change positive">+12.5%</span>
            </div>
            <div className="stat-value">{stats.totalClasses}</div>
            <div className="stat-subtitle">Tất cả lớp học</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Đang hoạt động</span>
              <span className="stat-change positive">+8.3%</span>
            </div>
            <div className="stat-value">{stats.activeClasses}</div>
            <div className="stat-subtitle">Lớp đang mở</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Tổng học sinh</span>
              <span className="stat-change positive">+18.2%</span>
            </div>
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-subtitle">Đã đăng ký</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Trung bình/Lớp</span>
              <span className="stat-change negative">-3.1%</span>
            </div>
            <div className="stat-value">{stats.averageStudents}</div>
            <div className="stat-subtitle">Học sinh/lớp</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="content-header">
            <h2 className="content-title">Danh sách lớp học</h2>
            <div className="header-actions">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm lớp học, mã lớp, giáo viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn-primary" onClick={() => handleOpenModal('add')}>
                ➕ Tạo lớp học
              </button>
            </div>
          </div>

          {/* Classes Grid */}
          {filteredClasses.length > 0 ? (
            <div className="classes-grid">
              {filteredClasses.map(classData => (
                <div key={classData.id} className="class-card">
                  <div className="class-header">
                    <div>
                      <h3 className="class-name">{classData.name}</h3>
                      <span className="class-code">{classData.code}</span>
                    </div>
                    <div className="class-actions">
                      <button 
                        className="icon-btn edit"
                        onClick={() => handleOpenModal('edit', classData)}
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button 
                        className="icon-btn delete"
                        onClick={() => handleDelete(classData.id)}
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="teacher-info">
                    <div className="teacher-avatar">
                      {(classData.teacher || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="teacher-details">
                      <div className="teacher-label">Giáo viên</div>
                      <div className="teacher-name">{classData.teacher || 'Chưa phân công'}</div>
                    </div>
                  </div>

                  <div className="class-stats">
                    <div className="stat-item">
                      <span className="stat-item-value">{classData.students}/{classData.maxStudents}</span>
                      <span className="stat-item-label">Học sinh</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-item-value">
                        {Math.round((classData.students / classData.maxStudents) * 100)}%
                      </span>
                      <span className="stat-item-label">Đã đầy</span>
                    </div>
                  </div>

                  <div className="class-footer">
                    <div className="schedule-info">📅 {classData.schedule}</div>
                    <span className={`status-badge ${classData.status}`}>
                      {classData.status === 'active' ? 'Đang mở' : 'Đã đóng'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h3>Không tìm thấy lớp học nào</h3>
              <p>Thử tìm kiếm với từ khóa khác hoặc tạo lớp học mới</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Tạo lớp học mới' : 'Chỉnh sửa lớp học'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên lớp học</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Vd: English A1 - Morning"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Mã lớp</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="Vd: ENG-A1-M"
                  />
                </div>
                <div className="form-group">
                  <label>Sĩ số tối đa</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Khối lớp</label>
                  <select
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  >
                    <option value="">Chọn khối</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Kỹ năng</label>
                  <select
                    required
                    value={formData.skill}
                    onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                  >
                    <option value="listening">Listening</option>
                    <option value="speaking">Speaking</option>
                    <option value="reading">Reading</option>
                    <option value="writing">Writing</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Giáo viên phụ trách</label>
                <select
                  required
                  value={formData.teacherId}
                  onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                >
                  <option value="">Chọn giáo viên</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Lịch học</label>
                <input
                  type="text"
                  required
                  value={formData.schedule}
                  onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                  placeholder="Vd: T2, T4, T6 - 8:00-10:00"
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả về lớp học..."
                />
              </div>

              <div className="form-group">
                <label>Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Đang mở</option>
                  <option value="inactive">Đã đóng</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'add' ? 'Tạo lớp' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;

