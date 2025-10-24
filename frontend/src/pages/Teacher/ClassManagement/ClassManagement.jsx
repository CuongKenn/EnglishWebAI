import React, { useState, useEffect } from 'react';
import './ClassManagement.css';
import apiClient from '../../../services/api';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'students', 'attendance', 'schedule'
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/classes/teaching');
      setClasses(res.data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId) => {
    try {
      const res = await apiClient.get(`/api/v1/classes/${classId}/students`);
      setStudents(res.data || []);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const loadAttendance = async (classId, date) => {
    try {
      const res = await apiClient.get(`/api/v1/classes/${classId}/attendance`, { 
        params: { date } 
      });
      const map = {};
      (res.data || []).forEach((r) => { 
        map[r.userId] = { status: r.status, note: r.note || '' };
      });
      setAttendance(map);
    } catch (error) {
      setAttendance({});
    }
  };

  const saveAttendance = async () => {
    if (!selectedClass) return;
    try {
      const records = students.map((s) => ({
        userId: s.id,
        status: (attendance[s.id]?.status) || 'present',
        note: attendance[s.id]?.note || undefined,
      }));
      await apiClient.post(`/api/v1/classes/${selectedClass.id}/attendance`, {
        date: attendanceDate,
        records,
      });
      alert('Đã lưu điểm danh thành công');
    } catch (error) {
      alert('Lưu điểm danh thất bại');
    }
  };

  const openModal = async (cls, type) => {
    setSelectedClass(cls);
    setModalType(type);
    setShowModal(true);
    
    if (type === 'students' || type === 'attendance') {
      await loadStudents(cls.id);
      if (type === 'attendance') {
        await loadAttendance(cls.id, attendanceDate);
      }
    }
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cls.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || cls.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'present': return 'status-present';
      case 'absent': return 'status-absent';
      case 'late': return 'status-late';
      case 'excused': return 'status-excused';
      default: return '';
    }
  };

  return (
    <div className="class-management">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý lớp học 🏫</h1>
          <p className="page-subtitle">Quản lý danh sách lớp, học sinh và điểm danh</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Tìm kiếm lớp học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
        >
          <option value="all">Tất cả môn học</option>
          <option value="Tiếng Anh">Tiếng Anh</option>
          <option value="Toán">Toán</option>
          <option value="Văn">Văn</option>
          <option value="Khoa học">Khoa học</option>
        </select>
      </div>

      {/* Classes Grid */}
      <div className="classes-grid">
        {filteredClasses.map(cls => (
          <div key={cls.id} className="class-card">
            <div className="class-card-header" style={{borderTopColor: `var(--color-${cls.color || 'blue'})`}}>
              <div className="class-emoji">{cls.image_emoji || '📚'}</div>
              <div className="class-info">
                <h3 className="class-title">{cls.name}</h3>
                <p className="class-subject">{cls.subject} - {cls.grade}</p>
              </div>
              <div className={`class-status ${cls.is_active ? 'active' : 'inactive'}`}>
                {cls.is_active ? '🟢 Hoạt động' : '🔴 Không hoạt động'}
              </div>
            </div>
            
            <div className="class-card-body">
              <p className="class-description">{cls.description || 'Không có mô tả'}</p>
              
              <div className="class-meta">
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span className="meta-text">{cls.schedule || 'Chưa có lịch'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">👥</span>
                  <span className="meta-text">{cls.student_count || 0}/{cls.max_students || 30} học sinh</span>
                </div>
              </div>
            </div>

            <div className="class-card-actions">
              <button 
                className="action-btn primary"
                onClick={() => openModal(cls, 'students')}
              >
                👥 Danh sách HS
              </button>
              <button 
                className="action-btn secondary"
                onClick={() => openModal(cls, 'attendance')}
              >
                ✓ Điểm danh
              </button>
              <button 
                className="action-btn outline"
                onClick={() => openModal(cls, 'schedule')}
              >
                📅 Lịch học
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Không tìm thấy lớp học nào</h3>
          <p>Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalType === 'students' && `📋 Danh sách học sinh - ${selectedClass?.name}`}
                {modalType === 'attendance' && `✓ Điểm danh - ${selectedClass?.name}`}
                {modalType === 'schedule' && `📅 Lịch học - ${selectedClass?.name}`}
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {modalType === 'students' && (
                <div className="students-list">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Họ và tên</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>{student.name || student.full_name}</td>
                          <td>{student.email}</td>
                          <td>{student.username}</td>
                          <td>
                            <span className="badge active">Đang học</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {modalType === 'attendance' && (
                <div className="attendance-section">
                  <div className="attendance-header">
                    <div className="form-group">
                      <label>Ngày điểm danh:</label>
                      <input 
                        type="date" 
                        value={attendanceDate}
                        onChange={async (e) => {
                          setAttendanceDate(e.target.value);
                          await loadAttendance(selectedClass.id, e.target.value);
                        }}
                      />
                    </div>
                  </div>

                  <table className="data-table attendance-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Họ và tên</th>
                        <th>Trạng thái</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>{student.name || student.full_name}</td>
                          <td>
                            <select
                              className={`status-select ${getStatusBadgeClass(attendance[student.id]?.status || 'present')}`}
                              value={attendance[student.id]?.status || 'present'}
                              onChange={(e) => setAttendance(prev => ({
                                ...prev,
                                [student.id]: { ...prev[student.id], status: e.target.value }
                              }))}
                            >
                              <option value="present">Có mặt</option>
                              <option value="absent">Vắng</option>
                              <option value="late">Đi muộn</option>
                              <option value="excused">Xin phép</option>
                            </select>
                          </td>
                          <td>
                            <input 
                              type="text"
                              className="note-input"
                              placeholder="Ghi chú..."
                              value={attendance[student.id]?.note || ''}
                              onChange={(e) => setAttendance(prev => ({
                                ...prev,
                                [student.id]: { ...prev[student.id], note: e.target.value }
                              }))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {modalType === 'schedule' && (
                <div className="schedule-section">
                  <div className="schedule-info">
                    <div className="info-item">
                      <span className="info-label">Lịch học hiện tại:</span>
                      <span className="info-value">{selectedClass?.schedule || 'Chưa có lịch'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Thời gian:</span>
                      <span className="info-value">8:00 - 9:30</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Phòng học:</span>
                      <span className="info-value">A101</span>
                    </div>
                  </div>
                  <div className="schedule-calendar">
                    <p className="coming-soon">📅 Lịch chi tiết sẽ được cập nhật sau</p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Đóng
              </button>
              {modalType === 'attendance' && (
                <button className="btn-primary" onClick={saveAttendance}>
                  💾 Lưu điểm danh
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;

