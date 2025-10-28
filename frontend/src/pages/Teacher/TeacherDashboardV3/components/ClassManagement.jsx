import { useState, useEffect } from 'react';
import { Users, UserPlus, Upload, Download, Search, Trash2, Mail, User, CheckCircle, XCircle } from 'lucide-react';
import { apiV1 } from '../../../../services/api';
import './ClassManagement.css';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await apiV1.get('/classes/teaching');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
  alert('Lỗi khi tải danh sách lớp học!');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    setLoading(true);
    try {
      const response = await apiV1.get(`/classes/${classId}/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
  alert('Lỗi khi tải danh sách học sinh!');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = async () => {
    if (!selectedClass) return;
    if (!newStudent.email) {
      alert('Vui lòng nhập email học sinh!');
      return;
    }

    setLoading(true);
    try {
      await apiV1.post(`/classes/${selectedClass.id}/students`, {
        identifiers: [newStudent.email],
        idType: 'email',
        status: 'active'
      });
      
  alert('Thêm học sinh thành công!');
      setShowAddModal(false);
      setNewStudent({ name: '', email: '', phone: '' });
      fetchStudents(selectedClass.id); // Refresh list
    } catch (error) {
      console.error('Error adding student:', error);
      alert(error.response?.data?.detail || 'Lỗi khi thêm học sinh!  Kiểm tra email');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!selectedClass) return;
    if (!confirm('Bạn có chắc?')) return;

    setLoading(true);
    try {
      await apiV1.delete(`/classes/${selectedClass.id}/students/${studentId}`);
      alert('Đã xóa');
      fetchStudents(selectedClass.id); // Refresh list
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Lỗi khi xóa');
    } finally {
      setLoading(false);
    }
  };

  const renderAddStudentModal = () => (
    <div className="class-modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="class-modal" onClick={(e) => e.stopPropagation()}>
        <div className="class-modal-header">
          <h2>Thêm Học sinh</h2>
          <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
        </div>

        <div className="class-modal-body">
          <div className="form-group-class">
            <label>Email học sinh <span style={{color: 'red'}}>*</span></label>
            <input 
              type="email" 
              className="form-input-class" 
              placeholder="example@gmail.com" 
              value={newStudent.email}
              onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
            />
            <small style={{color: '#666', fontSize: '12px'}}>
              Nhập email của tài khoản học sinh.
            </small>
          </div>
        </div>

        <div className="class-modal-footer">
          <button className="btn-cancel-class" onClick={() => setShowAddModal(false)}>Hủy</button>
          <button 
            className="btn-add-class"
            onClick={handleAddStudent}
            disabled={loading}
          >
            <UserPlus size={18} />
            {loading ? 'Đang thêm...' : 'Thêm học sinh'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderImportModal = () => (
    <div className="class-modal-overlay" onClick={() => setShowImportModal(false)}>
      <div className="class-modal" onClick={(e) => e.stopPropagation()}>
        <div className="class-modal-header">
          <h2>Import Học sinh từ Excel</h2>
          <button className="modal-close-btn" onClick={() => setShowImportModal(false)}>×</button>
        </div>

        <div className="class-modal-body">
          {/* Download Template */}
          <div className="download-template-section">
            <div className="template-info">
              <Download size={24} className="template-icon" />
              <div>
                <h4>Tải file mẫu</h4>
                <p>Tải file Excel mẫu để import học sinh đúng định dạng</p>
              </div>
            </div>
            <button className="btn-download-template">
              <Download size={16} />
              Tải file mẫu
            </button>
          </div>

          {/* Upload Area */}
          <div className="upload-area">
            <Upload size={48} className="upload-icon" />
            <h4>Kéo thả file Excel vào đây</h4>
            <p>hoặc</p>
            <button className="btn-browse">Chọn file từ máy tính</button>
            <span className="upload-hint">Hỗ trợ: .xlsx, .xls (Tối đa 5MB)</span>
          </div>

          {/* Format Guide */}
          <div className="format-guide">
            <h4>Định dạng file Excel:</h4>
            <table className="format-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Nguyễn Văn A</td>
                  <td>nguyenvana@gmail.com</td>
                  <td>0123456789</td>
                </tr>
                <tr>
                  <td>Trần Thị B</td>
                  <td>tranthib@gmail.com</td>
                  <td>0987654321</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="class-modal-footer">
          <button className="btn-cancel-class" onClick={() => setShowImportModal(false)}>Hủy</button>
          <button className="btn-add-class">
            <Upload size={18} />
            Import học sinh
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="class-management-container">
      {/* Header */}
      <div className="class-header">
        <div className="class-header-left">
          <h1>Quản lý Lớp học</h1>
          <p>Quản lý học sinh trong các lớp bạn đang dạy</p>
        </div>
      </div>

      <div className="class-content-wrapper">
        {/* Classes List */}
        <div className="classes-sidebar">
          <div className="sidebar-title">
            <Users size={20} />
      <span>Lớp học của tôi</span>
          </div>
          <div className="classes-list">
            {loading && classes.length === 0 ? (
              <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
        Đang tải...
              </div>
            ) : classes.length === 0 ? (
              <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
        Chưa có lớp học nào
              </div>
            ) : (
              classes.map((cls) => (
                <div
                  key={cls.id}
                  className={`class-item ${selectedClass?.id === cls.id ? 'active' : ''}`}
                  onClick={() => setSelectedClass(cls)}
                >
                  <div className="class-item-icon">
                    <Users size={18} />
                  </div>
                  <div className="class-item-info">
                    <div className="class-item-name">{cls.name}</div>
          <div className="class-item-count">{cls.student_count || 0} học sinh</div>
                  </div>
                  {selectedClass?.id === cls.id && <div className="class-item-indicator" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Students List */}
        <div className="students-panel">
          {!selectedClass ? (
            <div className="empty-state-class">
              <Users size={80} strokeWidth={1} />
              <h3>Chọn lớp học</h3>
              <p>Chọn một lớp học bên trái để xem danh sách học sinh</p>
            </div>
          ) : (
            <>
              {/* Panel Header */}
              <div className="panel-header">
                <div className="panel-header-left">
                  <h2>{selectedClass.name}</h2>
                  <span className="student-count-badge">{students.length} học sinh</span>
                </div>
                <div className="panel-header-actions">
                  <button className="btn-action-class primary" onClick={() => setShowAddModal(true)}>
                    <UserPlus size={18} />
                    Thêm học sinh
                  </button>
                  <button className="btn-action-class secondary" onClick={() => setShowImportModal(true)}>
                    <Upload size={18} />
                    Import Excel
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="search-bar-class">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm học sinh theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-class"
                />
              </div>

              {/* Students Table */}
              <div className="students-table">
                {loading ? (
                  <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
          Đang tải danh sách học sinh...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="empty-search-state">
                    <Search size={48} strokeWidth={1} />
          <p>{searchTerm ? 'Không tìm thấy học sinh nào' : 'Chưa có học sinh trong lớp'}</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div key={student.id} className="student-row">
                      <div className="student-row-left">
                        <div className="student-avatar">
                          <User size={20} />
                        </div>
                        <div className="student-info">
                          <div className="student-name">{student.name}</div>
                          <div className="student-email">
                            <Mail size={14} />
                            {student.email}
                          </div>
                        </div>
                      </div>
                      <div className="student-row-right">
                        <div className={`student-status ${student.status}`}>
                          {student.status === 'active' ? (
                            <>
                <CheckCircle size={14} />
                <span>Đang học</span>
                            </>
                          ) : (
                            <>
                <XCircle size={14} />
                <span>Nghỉ học</span>
                            </>
                          )}
                        </div>
                        <button 
                          className="btn-remove-student" 
              title="Xóa học sinh"
                          onClick={() => handleRemoveStudent(student.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && renderAddStudentModal()}
      {showImportModal && renderImportModal()}

      {/* Info Box */}
      <div className="info-box-class">
        <div className="info-icon-class">
          <Users size={24} />
        </div>
        <div className="info-content-class">
          <h4>Hướng dẫn quản lý học sinh</h4>
          <ul>
            <li><strong>Thêm học sinh:</strong> Click "Thêm học sinh", nhập email của học sinh đã đăng ký trong hệ thống</li>
            <li><strong>Xóa học sinh:</strong> Click icon thùng rác bên cạnh tên học sinh để gỡ khỏi lớp</li>
            <li><strong>Tìm kiếm:</strong> Sử dụng thanh tìm kiếm để lọc học sinh theo tên hoặc email</li>
            <li><strong>Lưu ý:</strong> Học sinh phải có tài khoản trong hệ thống trước khi được thêm vào lớp</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
