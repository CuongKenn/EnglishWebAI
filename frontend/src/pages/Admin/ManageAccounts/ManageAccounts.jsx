import React, { useEffect, useState } from 'react';
import './ManageAccounts.css';
import { adminAPI } from '../../../services/api';

const ManageAccounts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    role: 'user',
    password: '',
    status: 'active'
  });

  const roleLabel = (role) => {
    switch (role) {
      case 'teacher':
        return 'Giáo viên';
      case 'user':
        return 'Học sinh';
      case 'parent':
        return 'Phụ huynh';
      case 'admin':
        return 'Quản trị';
      default:
        return role;
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search: searchTerm || undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
      };
      const data = await adminAPI.getUsers(params);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole, searchTerm]);

  // Statistics
  const stats = {
    totalUsers: users.length,
    totalTeachers: users.filter(u => u.role === 'teacher').length,
    totalStudents: users.filter(u => u.role === 'user').length,
    activeUsers: users.filter(u => u.status === 'active').length,
  };

  const handleOpenModal = (mode, user = null) => {
    setModalMode(mode);
    if (mode === 'edit' && user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        username: user.username || '',
        role: user.role,
        status: user.status,
        password: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        username: '',
        role: 'user',
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
      username: '',
      role: 'user',
      password: '',
      status: 'active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const payload = {
          name: formData.name,
          email: formData.email,
          username: formData.username || undefined,
          role: formData.role,
          password: formData.password,
          status: formData.status,
        };
        await adminAPI.createUser(payload);
      } else if (selectedUser) {
        const payload = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          // password is not required for edit; backend updates if provided
        };
        await adminAPI.updateUser(selectedUser.id, payload);
      }
      await loadUsers();
      handleCloseModal();
    } catch (err) {
      alert('Có lỗi khi lưu tài khoản');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await adminAPI.deleteUser(userId);
        await loadUsers();
      } catch (e) {
        alert('Xóa tài khoản thất bại');
      }
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
                <option value="user">Học sinh</option>
                <option value="parent">Phụ huynh</option>
                <option value="teacher">Giáo viên</option>
                <option value="admin">Quản trị</option>
              </select>
              <button className="btn-primary" onClick={() => handleOpenModal('add')}>
                ➕ Thêm tài khoản
              </button>
              <button className="btn-primary" onClick={() => { setShowImport(true); setImportResult(null); }}>
                📥 Import CSV
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
                      {roleLabel(user.role)}
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
              {modalMode === 'add' && (
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Nhập username (tùy chọn)"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Vai trò</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">Học sinh</option>
                  <option value="parent">Phụ huynh</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="admin">Quản trị</option>
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

      {/* Import CSV Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import tài khoản từ CSV</h2>
              <button className="close-btn" onClick={() => setShowImport(false)}>×</button>
            </div>
            {!importResult ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!importFile) { alert('Chọn file CSV trước'); return; }
                try {
                  const result = await adminAPI.importUsersCSV(importFile);
                  setImportResult(result);
                  await loadUsers();
                } catch (err) {
                  alert(err?.detail || 'Import thất bại');
                }
              }}>
                <div className="form-group">
                  <label>Chọn file (.csv hoặc .txt)</label>
                  <input type="file" accept=".csv,.txt" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                </div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  Cột được hỗ trợ: name, email, username (tùy chọn), role, status, password. Role cho phép: user/student, teacher, parent, admin.
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowImport(false)}>Hủy</button>
                  <button type="submit" className="btn-primary">Import</button>
                </div>
              </form>
            ) : (
              <div>
                <p><strong>Kết quả:</strong></p>
                <p>Đã tạo: {importResult.created} | Bỏ qua: {importResult.skipped}</p>
                {importResult.errors?.length > 0 && (
                  <div style={{ maxHeight: 200, overflow: 'auto', background: '#f9fafb', padding: 10, borderRadius: 8 }}>
                    {importResult.errors.map((e, i) => (
                      <div key={i} style={{ color: '#991b1b' }}>Dòng {e.row}: {e.message}</div>
                    ))}
                  </div>
                )}
                {importResult.preview?.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#374151' }}>
                    Một số tài khoản:
                    <ul>
                      {importResult.preview.map((u) => (
                        <li key={u.id}>{u.username} - {u.email} ({u.role})</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="modal-actions">
                  <button className="btn-primary" onClick={() => setShowImport(false)}>Đóng</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccounts;

