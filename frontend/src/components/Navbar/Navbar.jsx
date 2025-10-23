import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ userRole = 'student', isLoggedIn = false, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const getNavigationItems = () => {
    switch (userRole) {
      case 'student':
        return [
          { path: '/lessons', label: 'Học bài' },
          { path: '/news', label: 'Tin tức' },
          { path: '/join-class', label: 'Tham gia lớp học' },
          { path: '/materials', label: 'Học liệu cơ bản' },
          { path: '/exercises', label: 'Làm bài tập' },
          { path: '/discussion', label: 'Hỏi đáp' }
        ];
      case 'teacher':
        return [
          { path: '/manage-classes', label: 'Quản lý lớp học' },
          { path: '/manage-materials', label: 'Tạo và quản lý học liệu' },
          { path: '/question-bank', label: 'Ngân hàng câu hỏi cá nhân' },
          { path: '/assign-exercises', label: 'Giao bài tập và kiểm tra' },
          { path: '/grading', label: 'Chấm điểm và phản hồi' },
          { path: '/statistics', label: 'Thống kê và báo cáo' },
          { path: '/online-teaching', label: 'Tích hợp dạy học trực tuyến' }
        ];
      case 'parent':
        return [
          { path: '/track-progress', label: 'Theo dõi kết quả học tập' },
          { path: '/notifications', label: 'Nhận thông báo' },
          { path: '/teacher-communication', label: 'Trao đổi với giáo viên' }
        ];
      case 'admin':
        return [
          { path: '/manage-accounts', label: 'Quản lý tài khoản giáo viên và học sinh' },
          { path: '/manage-classes-admin', label: 'Quản lý lớp học và phân công giảng dạy' },
          { path: '/overview-stats', label: 'Xem thống kê tổng quan' }
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <div className="brand-icon">🎓</div>
            <span className="brand-text">English AI</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-nav desktop-nav">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          {isLoggedIn ? (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-role">{userRole.toUpperCase()}</span>
                <span className="user-name">Người dùng</span>
              </div>
              <button className="logout-btn" onClick={onLogout}>
                <i className="fas fa-sign-out-alt"></i>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">
                <i className="fas fa-sign-in-alt"></i>
                Đăng nhập
              </Link>
              <Link to="/register" className="register-btn">
                <i className="fas fa-user-plus"></i>
                Đăng ký
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-content">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


