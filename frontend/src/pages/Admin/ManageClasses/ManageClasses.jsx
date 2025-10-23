import React, { useState } from 'react';
import './ManageClasses.css';

const ManageClasses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedClass, setSelectedClass] = useState(null);

  // Sample teachers data
  const teachers = [
    { id: 1, name: 'Nguyễn Văn A' },
    { id: 2, name: 'Trần Thị B' },
    { id: 3, name: 'Lê Minh C' },
  ];

  // Sample classes data
  const [classes, setClasses] = useState([
    {
      id: 1,
      name: 'English A1 - Morning',
      code: 'ENG-A1-M',
      teacher: 'Nguyễn Văn A',
      teacherId: 1,
      students: 25,
      maxStudents: 30,
      schedule: 'T2, T4, T6 - 8:00-10:00',
      status: 'active',
      description: 'Lớp học tiếng Anh cơ bản cho người mới bắt đầu'
    },
    {
      id: 2,
      name: 'English B1 - Afternoon',
      code: 'ENG-B1-A',
      teacher: 'Trần Thị B',
      teacherId: 2,
      students: 18,
      maxStudents: 25,
      schedule: 'T3, T5, T7 - 14:00-16:00',
      status: 'active',
      description: 'Lớp học tiếng Anh trung cấp'
    },
    {
      id: 3,
      name: 'English C1 - Evening',
      code: 'ENG-C1-E',
      teacher: 'Lê Minh C',
      teacherId: 3,
      students: 15,
      maxStudents: 20,
      schedule: 'T2, T4 - 18:00-20:00',
      status: 'inactive',
      description: 'Lớp học tiếng Anh nâng cao'
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacherId: '',
    maxStudents: 30,
    schedule: '',
    status: 'active',
    description: ''
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const teacher = teachers.find(t => t.id === parseInt(formData.teacherId));
    
    if (modalMode === 'add') {
      const newClass = {
        id: classes.length + 1,
        ...formData,
        teacher: teacher.name,
        students: 0
      };
      setClasses([...classes, newClass]);
    } else {
      setClasses(classes.map(c => 
        c.id === selectedClass.id 
          ? { ...c, ...formData, teacher: teacher.name }
          : c
      ));
    }
    handleCloseModal();
  };

  const handleDelete = (classId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp học này?')) {
      setClasses(classes.filter(c => c.id !== classId));
    }
  };

  const filteredClasses = classes.filter(classData =>
    classData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classData.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classData.teacher.toLowerCase().includes(searchTerm.toLowerCase())
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
                      {classData.teacher.charAt(0).toUpperCase()}
                    </div>
                    <div className="teacher-details">
                      <div className="teacher-label">Giáo viên</div>
                      <div className="teacher-name">{classData.teacher}</div>
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

