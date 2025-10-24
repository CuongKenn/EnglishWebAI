import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import ProfileDropdown from '../../../components/ProfileDropdown/ProfileDropdown';
import authService from '../../../services/authService';

// Import admin pages
import ManageAccounts from '../ManageAccounts/ManageAccounts';
import ManageClasses from '../ManageClasses/ManageClasses';
import OverviewStats from '../OverviewStats/OverviewStats';
import Settings from '../Settings/Settings';
import Backup from '../Backup/Backup';
import Logs from '../Logs/Logs';

const AdminDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="admin-top-navbar">
        <div className="admin-navbar-left">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="admin-navbar-logo">🎓</span>
            <h1 className="admin-navbar-title">English AI</h1>
          </Link>
        </div>
        <div className="admin-navbar-center">
          <Link to="/lessons" className="admin-navbar-link">Học bài</Link>
          <Link to="/news" className="admin-navbar-link">Tin tức</Link>
          <Link to="/join-class" className="admin-navbar-link">Lớp học của tôi</Link>
          <Link to="/materials" className="admin-navbar-link">Học liệu cơ bản</Link>
          <Link to="/exercises" className="admin-navbar-link">Làm bài tập</Link>
          <Link to="/discussion" className="admin-navbar-link">Hỏi đáp</Link>
          <Link to="/admin-dashboard" className="admin-navbar-link admin-navbar-link-special">Quản lý</Link>
        </div>
        <div className="admin-navbar-right">
          <button className="admin-navbar-icon-btn" title="Tìm kiếm">🔍</button>
          <button className="admin-navbar-icon-btn" title="Thông báo">🔔</button>
          <ProfileDropdown onLogout={handleLogout} />
        </div>
      </nav>

      <div className="admin-dashboard-wrapper">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Toggle Button */}
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
        
        <div className="sidebar-header">
          <h2 className="sidebar-title">
            <span>⚙️</span>
            <span>Quản lý hệ thống</span>
          </h2>
          <p className="sidebar-subtitle">Thanh điều hướng</p>
        </div>

        <nav className="sidebar-nav">
          {/* QUẢN LÝ TÀI KHOẢN */}
          <div className="nav-section">
            <div className="nav-section-title">Quản lý tài khoản</div>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link 
                  to="/admin-dashboard/manage-accounts" 
                  className={`sidebar-link ${isActive('/admin-dashboard/manage-accounts') ? 'active' : ''}`}
                >
                  <span className="link-icon">👥</span>
                  <span className="link-text">Tài khoản người dùng</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* QUẢN LÝ LỚP HỌC VÀ KHÓA HỌC */}
          <div className="nav-section">
            <div className="nav-section-title">Quản lý lớp học và khóa học</div>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link 
                  to="/admin-dashboard/manage-classes" 
                  className={`sidebar-link ${isActive('/admin-dashboard/manage-classes') ? 'active' : ''}`}
                >
                  <span className="link-icon">📚</span>
                  <span className="link-text">Lớp học & Phân công</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* THỐNG KÊ VÀ BÁO CÁO */}
          <div className="nav-section">
            <div className="nav-section-title">Thống kê và báo cáo</div>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link 
                  to="/admin-dashboard/overview-stats" 
                  className={`sidebar-link ${isActive('/admin-dashboard/overview-stats') ? 'active' : ''}`}
                >
                  <span className="link-icon">📊</span>
                  <span className="link-text">Thống kê tổng quan</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* CÀI ĐẶT */}
          <div className="nav-section">
            <div className="nav-section-title">Cài đặt</div>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link to="/admin-dashboard/settings" className="sidebar-link">
                  <span className="link-icon">⚙️</span>
                  <span className="link-text">Cấu hình hệ thống</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link to="/admin-dashboard/backup" className="sidebar-link">
                  <span className="link-icon">💾</span>
                  <span className="link-text">Sao lưu dữ liệu</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link to="/admin-dashboard/logs" className="sidebar-link">
                  <span className="link-icon">📋</span>
                  <span className="link-text">Nhật ký hệ thống</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

      </aside>

      {/* Main Content */}
      <main className="admin-main-content">
        <div className="dashboard-content">
          <Routes>
            <Route index element={<Navigate to="overview-stats" replace />} />
            <Route path="/" element={<Navigate to="overview-stats" replace />} />
            <Route path="/manage-accounts" element={<ManageAccounts />} />
            <Route path="/manage-classes" element={<ManageClasses />} />
            <Route path="/overview-stats" element={<OverviewStats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </div>
      </main>
    </div>
    </>
  );
};

// Component Coming Soon placeholder
const ComingSoon = ({ title }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    padding: '40px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '80px', marginBottom: '20px' }}>🚧</div>
    <h2 style={{ fontSize: '28px', color: '#1f2937', marginBottom: '10px' }}>{title}</h2>
    <p style={{ fontSize: '16px', color: '#6b7280' }}>Tính năng đang được phát triển</p>
  </div>
);

export default AdminDashboard;

