import React, { useState } from 'react';
import './ManageAccounts.css';

const ManageAccounts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);

  // Sample data - sẽ thay thế bằng API call sau
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      role: 'teacher',
      status: 'active',
      classes: 5,
      students: 120,
      joinDate: '15/01/2024'
    },
    {
      id: 2,
      name: 'Trần Thị B',
      email: 'tranthib@example.com',
      role: 'teacher',
      status: 'active',
      classes: 3,
      students: 85,
      joinDate: '20/02/2024'
    },
    {
      id: 3,
      name: 'Lê Minh C',
      email: 'leminhc@example.com',
      role: 'student',
      status: 'active',
      classes: 2,
      students: 0,
      joinDate: '01/03/2024'
    },
    {
      id: 4,
      name: 'Phạm Thu D',
      email: 'phamthud@example.com',
      role: 'student',
      status: 'inactive',
      classes: 1,
      students: 0,
      joinDate: '10/03/2024'
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    password: '',
    status: 'active'
  });

  // Statistics
  const stats = {
    totalUsers: users.length,
    totalTeachers: users.filter(u => u.role === 'teacher').length,
    totalStudents: users.filter(u => u.role === 'student').length,
    activeUsers: users.filter(u => u.status === 'active').length,
  };

  const handleOpenModal = (mode, user = null) => {
    setModalMode(mode);
    if (mode === 'edit' && user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        password: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'student',
        password: '',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'student',
      password: '',
      status: 'active'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      // Thêm user mới
      const newUser = {
        id: users.length + 1,
        ...formData,
        classes: 0,
        students: 0,
        joinDate: new Date().toLocaleDateString('vi-VN')
      };
      setUsers([...users, newUser]);
    } else {
      // Cập nhật user
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...formData }
          : u
      ));
    }
    handleCloseModal();
  };

  const handleDelete = (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-container">
      <div className="admin-content">
        {/* Header */}
        <div className="admin-header">
          <h1>👥 Quản lý tài khoản</h1>
          <p>Quản lý tài khoản giáo viên và học sinh trong hệ thống</p>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Tổng số người dùng</span>
              <span className="stat-change positive">+26.5%</span>
            </div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-subtitle">Tất cả tài khoản</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Giáo viên</span>
              <span className="stat-change positive">+15.3%</span>
            </div>
            <div className="stat-value">{stats.totalTeachers}</div>
            <div className="stat-subtitle">Đang hoạt động</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Học sinh</span>
              <span className="stat-change positive">+32.1%</span>
            </div>
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-subtitle">Đã đăng ký</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Đang hoạt động</span>
              <span className="stat-change negative">-2.4%</span>
            </div>
            <div className="stat-value">{stats.activeUsers}</div>
            <div className="stat-subtitle">Tài khoản active</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="content-header">
            <h2 className="content-title">Danh sách tài khoản</h2>
            <div className="header-actions">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="filter-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">Tất cả vai trò</option>
                <option value="teacher">Giáo viên</option>
                <option value="student">Học sinh</option>
              </select>
              <button className="btn-primary" onClick={() => handleOpenModal('add')}>
                ➕ Thêm tài khoản
              </button>
            </div>
          </div>

          {/* Table */}
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Số lớp</th>
                <th>Ngày tham gia</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td>{user.classes} lớp</td>
                  <td>{user.joinDate}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="icon-btn edit"
                        onClick={() => handleOpenModal('edit', user)}
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button 
                        className="icon-btn delete"
                        onClick={() => handleDelete(user.id)}
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              Không tìm thấy kết quả nào
            </div>
          )}

          {/* Pagination */}
          <div className="pagination">
            <button disabled>← Trước</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>Sau →</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Thêm tài khoản mới' : 'Chỉnh sửa tài khoản'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Nhập email"
                />
              </div>
              <div className="form-group">
                <label>Vai trò</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên</option>
                </select>
              </div>
              {modalMode === 'add' && (
                <div className="form-group">
                  <label>Mật khẩu</label>
                  <input
                    type="password"
                    required={modalMode === 'add'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Nhập mật khẩu"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'add' ? 'Thêm mới' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccounts;

