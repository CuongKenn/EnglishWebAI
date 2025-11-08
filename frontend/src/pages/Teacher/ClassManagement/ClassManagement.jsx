import React, { useState, useEffect } from 'react';
import './ClassManagement.css';
import apiClient from '../../../services/api';
import AddStudentsModal from '../../../components/AddStudentsModal';
import Toast from '../../../components/Toast/Toast';
import useToast from '../../../hooks/useToast';

const ClassManagement = () => {
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'students', 'attendance', 'schedule', 'materials'
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [showAddStudents, setShowAddStudents] = useState(false);
  
  // Materials state
  const [materials, setMaterials] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    type: 'file'
  });

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
    } catch {
      /* Error loading attendance - reset to empty */
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
      showSuccess('Đã lưu điểm danh thành công');
    } catch (error) {
      showError('Lưu điểm danh thất bại');
    }
  };

  const loadMaterials = async (classId) => {
    try {
      const res = await apiClient.get(`/api/v1/materials/by-class/${classId}`);
      setMaterials(res.data || []);
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedClass) return;

    try {
      setLoading(true);
      
      // Upload file first
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      const uploadRes = await apiClient.post('/api/v1/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Create material record
      await apiClient.post('/api/v1/materials/', {
        class_id: selectedClass.id,
        title: materialForm.title || uploadFile.name,
        description: materialForm.description,
        type: uploadRes.data.file_type || 'file',
        file_path: uploadRes.data.file_path,
        url: uploadRes.data.public_url
      });

      showSuccess('Đã tải lên học liệu thành công!');
      setUploadFile(null);
      setMaterialForm({ title: '', description: '', type: 'file' });
      await loadMaterials(selectedClass.id);
    } catch (error) {
      showError('Lỗi: ' + (error.response?.data?.detail || 'Không thể tải lên file'));
    } finally {
      setLoading(false);
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
    } else if (type === 'materials') {
      await loadMaterials(cls.id);
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
          <option value="all">Tất cả kỹ năng</option>
          <option value="Listening">Listening</option>
          <option value="Speaking">Speaking</option>
          <option value="Reading">Reading</option>
          <option value="Writing">Writing</option>
          <option value="Grammar">Grammar</option>
          <option value="Vocabulary">Vocabulary</option>
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
                className="action-btn info"
                onClick={() => openModal(cls, 'materials')}
              >
                📁 Học liệu
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
                {modalType === 'materials' && `📁 Học liệu & Tài liệu - ${selectedClass?.name}`}
                {modalType === 'schedule' && `📅 Lịch học - ${selectedClass?.name}`}
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {modalType === 'students' && (
                <div className="students-list">
                  <div className="section-header">
                    <h3>Danh sách học sinh ({students.length})</h3>
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        setShowModal(false);
                        setShowAddStudents(true);
                      }}
                    >
                      ➕ Thêm học sinh
                    </button>
                  </div>
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

              {modalType === 'materials' && (
                <div className="materials-section">
                  {/* Upload Form */}
                  <form onSubmit={handleFileUpload} className="upload-form">
                    <h3 className="form-title">📤 Tải lên học liệu mới</h3>
                    <div className="upload-grid">
                      <div className="form-field">
                        <label>Tiêu đề:</label>
                        <input 
                          type="text"
                          placeholder="Tên học liệu..."
                          value={materialForm.title}
                          onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                        />
                      </div>
                      <div className="form-field full-width">
                        <label>Mô tả (tùy chọn):</label>
                        <textarea 
                          placeholder="Mô tả nội dung học liệu..."
                          value={materialForm.description}
                          onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                          rows="2"
                        />
                      </div>
                      <div className="form-field full-width">
                        <label>Chọn file (PDF, Word, PowerPoint, Image, Audio, Video):</label>
                        <input 
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.mp3,.mp4"
                          onChange={(e) => setUploadFile(e.target.files[0])}
                          required
                        />
                        {uploadFile && (
                          <div className="file-info">
                            📎 {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                          </div>
                        )}
                      </div>
                    </div>
                    <button type="submit" className="btn-upload" disabled={!uploadFile || loading}>
                      {loading ? '⏳ Đang tải lên...' : '📤 Tải lên học liệu'}
                    </button>
                  </form>

                  {/* Materials List */}
                  <div className="materials-list">
                    <h3 className="list-title">📚 Danh sách học liệu ({materials.length})</h3>
                    {materials.length > 0 ? (
                      <div className="materials-grid">
                        {materials.map(material => {
                          const getFileIcon = (type) => {
                            const icons = {
                              presentation: '📊',
                              document: '📄',
                              pdf: '📕',
                              image: '🖼️',
                              audio: '🎵',
                              video: '🎬',
                              text: '📝'
                            };
                            return icons[type] || '📁';
                          };

                          return (
                            <div key={material.id} className="material-card">
                              <div className="material-icon">{getFileIcon(material.type)}</div>
                              <div className="material-info">
                                <h4 className="material-title">{material.title}</h4>
                                <p className="material-desc">{material.description || 'Không có mô tả'}</p>
                                <div className="material-meta">
                                  <span className="material-type">{material.type}</span>
                                  <span className="material-date">
                                    {new Date(material.created_at).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                              </div>
                              {material.url && (
                                <a 
                                  href={material.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn-download"
                                >
                                  ⬇️ Tải về
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="no-materials">Chưa có học liệu nào</p>
                    )}
                  </div>
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

      {/* Add Students Modal */}
      <AddStudentsModal
        isOpen={showAddStudents}
        onClose={() => setShowAddStudents(false)}
        classId={selectedClass?.id}
        className={selectedClass?.name}
        onSuccess={() => {
          if (selectedClass) {
            loadStudents(selectedClass.id);
          }
        }}
      />
      
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

export default ClassManagement;

