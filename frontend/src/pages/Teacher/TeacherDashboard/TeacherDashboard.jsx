import React, { useEffect, useState } from 'react';
import './TeacherDashboard.css';
import apiClient from '../../../services/api';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [identifiers, setIdentifiers] = useState('');
  const [idType, setIdType] = useState('username');
  const [fileText, setFileText] = useState('');

  const parseIdentifiers = (text) => {
    return Array.from(new Set(
      (text || '')
        .split(/\r?\n|,|;|\s+/)
        .map(s => s.trim())
        .filter(Boolean)
    ));
  };

  const loadTeachingClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/api/v1/classes/teaching');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('Không tải được danh sách lớp dạy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachingClasses();
  }, []);

  const openAddStudents = (cls) => {
    setSelectedClass(cls);
    setIdentifiers('');
    setShowAddModal(true);
  };

  const addStudents = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    const text = identifiers || fileText;
    const ids = parseIdentifiers(text);
    if (ids.length === 0) return;
    try {
      await apiClient.post(`/api/v1/classes/${selectedClass.id}/students`, {
        identifiers: ids,
        idType,
        role: 'student',
        status: 'active',
      });
      setShowAddModal(false);
      await loadTeachingClasses();
      alert('Đã thêm học sinh vào lớp');
    } catch (e) {
      alert('Thêm học sinh thất bại');
    }
  };

  return (
    <div className="teacher-dashboard">
      <div className="teacher-container">
        {/* Header */}
        <div className="teacher-header">
          <div className="teacher-welcome">
            <div className="welcome-text">
              <h1>Chào mừng, Giáo viên! 👋</h1>
              <p>Đây là bảng điều khiển quản lý lớp học của bạn</p>
            </div>
            <div className="header-actions">
              <button className="btn-icon" title="Tìm kiếm">🔍</button>
              <button className="btn-icon" title="Thông báo">🔔</button>
            </div>
          </div>
        </div>

        {/* Stats Grid (real) */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-title">Tổng lớp đang dạy</div>
              <div className="stat-icon green">📦</div>
            </div>
            <div className="stat-value">{classes.length}</div>
            <div className="stat-subtitle">Cập nhật theo thời gian thực</div>
          </div>

          <div className="stat-card members">
            <div className="stat-header">
              <div className="stat-title">Tổng học sinh</div>
              <div className="stat-icon orange">👥</div>
            </div>
            <div className="stat-value">{classes.reduce((sum, c) => sum + (c.student_count || 0), 0)}</div>
            <div className="stat-subtitle">Trong tất cả lớp</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Active Projects */}
          <div className="projects-section">
            <div className="section-header">
              <h2 className="section-title">Lớp học đang hoạt động</h2>
              {/* Teachers may create via admin; hide create from here */}
            </div>
            {error && <div style={{ color: '#b91c1c', marginBottom: 10 }}>{error}</div>}
            {loading && <div style={{ color: '#6b7280', marginBottom: 10 }}>Đang tải...</div>}
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Tên lớp</th>
                  <th>Lịch học</th>
                  <th>Sĩ số</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.id}>
                    <td>
                      <div className="project-name">{cls.name}</div>
                      <div className="project-date">{cls.description || ' '}</div>
                    </td>
                    <td>
                      {cls.schedule || '—'}
                    </td>
                    <td>
                      {(cls.student_count || 0)}/{cls.max_students || '—'}
                    </td>
                    <td>
                      <button className="action-btn" title="Thêm học sinh" onClick={() => openAddStudents(cls)}>+ HS</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column can host future widgets */}
          <div className="task-progress-card">
            <div className="section-header" style={{ marginBottom: '20px' }}>
              <h3 className="section-title">Hỗ trợ nhanh</h3>
            </div>
            <p style={{ color: '#6b7280' }}>Chọn lớp và bấm “+ HS” để thêm học sinh theo username (phân tách bằng dấu phẩy).</p>
          </div>
        </div>
      </div>

      {/* Add Students Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm học sinh vào lớp</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={addStudents}>
              <div className="form-group">
                <label>Lớp</label>
                <input type="text" disabled value={selectedClass?.name || ''} />
              </div>
              <div className="form-group">
                <label>Kiểu định danh</label>
                <select value={idType} onChange={(e) => setIdType(e.target.value)}>
                  <option value="username">Username</option>
                  <option value="email">Email</option>
                  <option value="id">User ID</option>
                </select>
              </div>
              <div className="form-group">
                <label>Danh sách (dấu phẩy, khoảng trắng hoặc xuống dòng)</label>
                <textarea
                  value={identifiers}
                  onChange={(e) => setIdentifiers(e.target.value)}
                  placeholder={idType === 'email' ? 'vd: a@x.com, b@x.com, ...' : 'vd: student1\nstudent2\nstudent3'}
                  rows={6}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-group">
                <label>Hoặc tải tệp .csv/.txt</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    setFileText(text);
                    const ids = parseIdentifiers(text);
                    setIdentifiers(ids.join('\n'));
                  }}
                />
              </div>
              {parseIdentifiers(identifiers).length > 0 && (
                <div style={{ color: '#6b7280', fontSize: 13 }}>
                  Sẽ thêm khoảng {parseIdentifiers(identifiers).length} mục (loại bỏ trùng lặp tự động)
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Thêm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;

