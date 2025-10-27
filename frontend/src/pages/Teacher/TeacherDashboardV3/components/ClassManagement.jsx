import { useState } from 'react';
import { Users, UserPlus, Upload, Download, Search, Trash2, Mail, User, CheckCircle, XCircle } from 'lucide-react';
import './ClassManagement.css';

export default function ClassManagement() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - trong thực tế sẽ fetch từ API
  const classes = [
    {
      id: 1,
      name: 'Lớp 10A1',
      grade: 10,
      students: [
        { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', status: 'active' },
        { id: 2, name: 'Trần Thị B', email: 'tranthib@gmail.com', status: 'active' },
        { id: 3, name: 'Lê Văn C', email: 'levanc@gmail.com', status: 'inactive' },
      ]
    },
    {
      id: 2,
      name: 'Lớp 10A2',
      grade: 10,
      students: [
        { id: 4, name: 'Phạm Thị D', email: 'phamthid@gmail.com', status: 'active' },
        { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@gmail.com', status: 'active' },
      ]
    },
    {
      id: 3,
      name: 'Lớp 11B1',
      grade: 11,
      students: [
        { id: 6, name: 'Vũ Thị F', email: 'vuthif@gmail.com', status: 'active' },
      ]
    },
  ];

  const filteredStudents = selectedClass
    ? selectedClass.students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const renderAddStudentModal = () => (
    <div className="class-modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="class-modal" onClick={(e) => e.stopPropagation()}>
        <div className="class-modal-header">
          <h2>Thêm Học sinh</h2>
          <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
        </div>

        <div className="class-modal-body">
          <div className="form-group-class">
            <label>Họ và tên</label>
            <input type="text" className="form-input-class" placeholder="Nguyễn Văn A" />
          </div>

          <div className="form-group-class">
            <label>Email</label>
            <input type="email" className="form-input-class" placeholder="nguyenvana@gmail.com" />
          </div>

          <div className="form-group-class">
            <label>Số điện thoại (tùy chọn)</label>
            <input type="tel" className="form-input-class" placeholder="0123456789" />
          </div>
        </div>

        <div className="class-modal-footer">
          <button className="btn-cancel-class" onClick={() => setShowAddModal(false)}>Hủy</button>
          <button className="btn-add-class">
            <UserPlus size={18} />
            Thêm học sinh
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
            <h4>📋 Định dạng file Excel:</h4>
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
            {classes.map((cls) => (
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
                  <div className="class-item-count">{cls.students.length} học sinh</div>
                </div>
                {selectedClass?.id === cls.id && <div className="class-item-indicator" />}
              </div>
            ))}
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
                  <span className="student-count-badge">{selectedClass.students.length} học sinh</span>
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
                {filteredStudents.length === 0 ? (
                  <div className="empty-search-state">
                    <Search size={48} strokeWidth={1} />
                    <p>Không tìm thấy học sinh nào</p>
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
                        <button className="btn-remove-student" title="Xóa học sinh">
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
          <h4>💡 Hướng dẫn quản lý học sinh</h4>
          <ul>
            <li><strong>Thêm học sinh thủ công:</strong> Click "Thêm học sinh" và điền thông tin</li>
            <li><strong>Import từ Excel:</strong> Tải file mẫu, điền thông tin, và upload lên hệ thống</li>
            <li><strong>Xóa học sinh:</strong> Click icon 🗑️ bên cạnh tên học sinh</li>
            <li><strong>Lưu ý:</strong> Chỉ Admin mới có thể tạo lớp học mới. Giáo viên chỉ quản lý học sinh trong lớp được phân công</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
