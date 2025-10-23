import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import './AdminDashboard.css';

// Import admin pages
import ManageAccounts from '../ManageAccounts/ManageAccounts';
import ManageClasses from '../ManageClasses/ManageClasses';
import OverviewStats from '../OverviewStats/OverviewStats';

const AdminDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-dashboard-wrapper">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
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
            <Route path="/" element={<Navigate to="/admin-dashboard/overview-stats" replace />} />
            <Route path="/manage-accounts" element={<ManageAccounts />} />
            <Route path="/manage-classes" element={<ManageClasses />} />
            <Route path="/overview-stats" element={<OverviewStats />} />
            <Route path="/settings" element={<ComingSoon title="Cấu hình hệ thống" />} />
            <Route path="/backup" element={<ComingSoon title="Sao lưu dữ liệu" />} />
            <Route path="/logs" element={<ComingSoon title="Nhật ký hệ thống" />} />
          </Routes>
        </div>
      </main>

      {/* Sidebar Toggle Button */}
      <button 
        className="sidebar-toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
      >
        {sidebarCollapsed ? '→' : '←'}
      </button>
    </div>
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

