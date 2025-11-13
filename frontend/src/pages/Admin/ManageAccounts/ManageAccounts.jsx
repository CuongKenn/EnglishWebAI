import React, { useEffect, useState } from 'react';
import { MdPeople, MdSchool, MdPersonOutline, MdCheckCircle, MdSearch, MdRefresh, MdAdd, MdTableChart, MdEdit, MdDelete, MdClose, MdInbox } from 'react-icons/md';
import './ManageAccounts.css';
import { adminAPI } from '../../../services/api';
import ExcelImportModal from '../../../components/ExcelImportModal';

const ManageAccounts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showExcelImport, setShowExcelImport] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

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
        skip: 0,
        limit: 1000 // Load nhiều để không bị giới hạn
      };

      const data = await adminAPI.getUsers(params);

      setUsers(Array.isArray(data) ? data : []);
      setCurrentPage(1); // Reset về trang 1 khi reload
      
      // Empty data check (currently no action needed)
    } catch (e) {
      console.error('❌ Error loading users:', e);
      setError(`Không tải được danh sách người dùng: ${e.message || 'Unknown error'}`);
      setUsers([]);
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
    } catch {
      // Error saving account
      alert('Có lỗi khi lưu tài khoản');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await adminAPI.deleteUser(userId);
        await loadUsers();
      } catch {
        // Error deleting account
        alert('Xóa tài khoản thất bại');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });
  
  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="admin-container">
      <div className="admin-content">
        {/* Header */}
        <div className="admin-header">
          <h1><MdPeople className="inline-block mr-2" /> Quản lý tài khoản</h1>
          <p>Quản lý tài khoản giáo viên và học sinh trong hệ thống</p>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-box blue"><MdPeople size={32} /></div>
            <div className="stat-info">
              <div className="stat-title">Tổng số người dùng</div>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-subtitle">Toàn hệ thống</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box green"><MdSchool size={32} /></div>
            <div className="stat-info">
              <div className="stat-title">Giáo viên</div>
              <div className="stat-value">{stats.totalTeachers}</div>
              <div className="stat-subtitle">Đang hoạt động</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box orange"><MdPersonOutline size={32} /></div>
            <div className="stat-info">
              <div className="stat-title">Học sinh</div>
              <div className="stat-value">{stats.totalStudents}</div>
              <div className="stat-subtitle">Đã đăng ký</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box purple"><MdCheckCircle size={32} /></div>
            <div className="stat-info">
              <div className="stat-title">Đang hoạt động</div>
              <div className="stat-value">{stats.activeUsers}</div>
              <div className="stat-subtitle">Tài khoản active</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="content-header">
            <h2 className="content-title">Danh sách tài khoản</h2>
            <div className="header-actions">
              <div className="search-box">
                <span className="search-icon"><MdSearch size={20} /></span>
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
              {(searchTerm || filterRole !== 'all') && (
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRole('all');
                  }}
                  title="Xóa bộ lọc"
                  style={{ marginRight: '10px' }}
                >
                  <MdRefresh className="inline-block mr-2" /> Reset
                </button>
              )}
              <button className="btn-primary" onClick={() => handleOpenModal('add')}>
                <MdAdd className="inline-block mr-2" /> Thêm tài khoản
              </button>
              <button className="btn-primary" onClick={() => setShowExcelImport(true)}>
                <MdTableChart className="inline-block mr-2" /> Import Excel
              </button>
            </div>
          </div>

          {/* Loading & Error States */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
              <div style={{ color: '#6b7280' }}>Đang tải dữ liệu...</div>
            </div>
          )}
          
          {error && (
            <div style={{ 
              backgroundColor: '#fee2e2', 
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '16px', 
              margin: '20px 0',
              color: '#dc2626'
            }}>
              <strong><MdClose className="inline-block mr-1" /> Lỗi:</strong> {error}
              <br />
              <button 
                onClick={loadUsers}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <MdRefresh className="inline-block mr-1" /> Thử lại
              </button>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
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
                {currentUsers.map(user => (
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
                        <MdEdit />
                      </button>
                      <button 
                        className="icon-btn delete"
                        onClick={() => handleDelete(user.id)}
                        title="Xóa"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && !error && filteredUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}><MdInbox size={48} /></div>
              <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                Không tìm thấy kết quả nào
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {searchTerm || filterRole !== 'all' 
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                  : 'Chưa có tài khoản nào trong hệ thống. Hãy thêm tài khoản mới hoặc import từ Excel.'}
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && filteredUsers.length > 0 && (
            <div className="pagination">
              <button 
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                ← Trước
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Chỉ hiển thị 5 trang gần current page
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      className={currentPage === pageNumber ? 'active' : ''}
                      onClick={() => goToPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === currentPage - 3 ||
                  pageNumber === currentPage + 3
                ) {
                  return <span key={pageNumber}>...</span>;
                }
                return null;
              })}
              
              <button 
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                Sau →
              </button>
            </div>
          )}
          
          {/* Pagination Info */}
          {!loading && !error && filteredUsers.length > 0 && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '16px', 
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsers.length)} trong tổng {filteredUsers.length} tài khoản
            </div>
          )}
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

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showExcelImport}
        onClose={() => {
          setShowExcelImport(false);
          // Reload users sau khi đóng modal (dù thành công hay thất bại)
          loadUsers();
        }}
        onSuccess={() => {
          // Reload users ngay khi import thành công
          loadUsers();
        }}
      />
    </div>
  );
};

export default ManageAccounts;

