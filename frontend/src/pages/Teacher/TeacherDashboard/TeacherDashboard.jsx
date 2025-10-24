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
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState({}); // { userId: { status, note } }

  const parseIdentifiers = (text) => {
    const raw = (text || '')
      .split(/\r?\n|,|;|\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const headers = new Set(['email', 'username', 'user', 'id']);
    const cleaned = raw.filter((t) => !headers.has(t.toLowerCase()));
    return Array.from(new Set(cleaned));
  };

  const detectIdType = (tokens) => {
    if (!tokens || tokens.length === 0) return 'username';
    const hasAt = tokens.filter((t) => t.includes('@')).length;
    if (hasAt >= Math.max(1, Math.floor(tokens.length * 0.6))) return 'email';
    const allDigits = tokens.every((t) => /^\d+$/.test(t));
    if (allDigits) return 'id';
    return 'username';
  };

  const loadTeachingClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/api/v1/classes/teaching');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // Hiển thị thông báo lỗi cụ thể để dễ chẩn đoán
      if (e?.response) {
        const status = e.response.status;
        if (status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (status === 403) {
          setError('Tài khoản hiện tại không có quyền giáo viên.');
        } else {
          const detail = e.response.data?.detail || 'Không tải được danh sách lớp dạy';
          setError(detail);
        }
      } else if (e?.request) {
        setError('Không kết nối được máy chủ. Kiểm tra backend (http://127.0.0.1:8000) hoặc cấu hình API.');
      } else {
        setError('Đã xảy ra lỗi khi tải danh sách lớp dạy.');
      }
      console.error('Load teaching classes failed:', e);
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

  const loadStudents = async (clsId) => {
    const res = await apiClient.get(`/api/v1/classes/${clsId}/students`);
    setStudents(Array.isArray(res.data) ? res.data : []);
  };

  const loadAttendance = async (clsId, date) => {
    try {
      const res = await apiClient.get(`/api/v1/classes/${clsId}/attendance`, { params: { date } });
      const map = {};
      (res.data || []).forEach((r) => { map[r.userId] = { status: r.status, note: r.note || '' }; });
      setAttendance(map);
    } catch (e) {
      setAttendance({});
    }
  };

  const openStudents = async (cls) => {
    setSelectedClass(cls);
    setShowStudentsModal(true);
    await loadStudents(cls.id);
    await loadAttendance(cls.id, attendanceDate);
  };

  const addStudents = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    const text = identifiers || fileText;
    const ids = parseIdentifiers(text);
    if (ids.length === 0) return;
    try {
      const res = await apiClient.post(`/api/v1/classes/${selectedClass.id}/students`, {
        identifiers: ids,
        idType,
        role: 'student',
        status: 'active',
      });
      setShowAddModal(false);
      await loadTeachingClasses();
      const added = Array.isArray(res.data) ? res.data.length : 0;
      if (added > 0) {
        alert(`Đã thêm ${added} học sinh vào lớp`);
      } else {
        alert('Không thêm được học sinh nào. Kiểm tra lại danh sách và kiểu định danh.');
      }
      if (selectedClass && showStudentsModal) {
        await loadStudents(selectedClass.id);
      }
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
              <button className="action-btn" title="Danh sách học sinh" onClick={() => openStudents(cls)}>👥</button>
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
                    const guessed = detectIdType(ids);
                    setIdType(guessed);
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

      {/* Students + Attendance Modal */}
      {showStudentsModal && (
        <div className="modal-overlay" onClick={() => setShowStudentsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Học sinh - {selectedClass?.name}</h2>
              <button className="close-btn" onClick={() => setShowStudentsModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label>Ngày điểm danh</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={async (e) => {
                  const d = e.target.value;
                  setAttendanceDate(d);
                  if (selectedClass) await loadAttendance(selectedClass.id, d);
                }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="projects-table">
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>
                        <select
                          value={attendance[s.id]?.status || 'present'}
                          onChange={(e) => setAttendance((prev) => ({ ...prev, [s.id]: { ...(prev[s.id]||{}), status: e.target.value } }))}
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
                          value={attendance[s.id]?.note || ''}
                          onChange={(e) => setAttendance((prev) => ({ ...prev, [s.id]: { ...(prev[s.id]||{}), note: e.target.value } }))}
                          placeholder="Ghi chú (tùy chọn)"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowStudentsModal(false)}>Đóng</button>
              <button
                className="btn-primary"
                onClick={async () => {
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
                    alert('Đã lưu điểm danh');
                  } catch (e) {
                    alert('Lưu điểm danh thất bại');
                  }
                }}
              >
                Lưu điểm danh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;

