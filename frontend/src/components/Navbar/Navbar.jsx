import React, { useState } from 'react'; // <--- SỬA LỖI 1: Đã sửa lại cú pháp import
import { Link, useLocation } from 'react-router-dom';
import ProfileDropdown from '../ProfileDropdown/ProfileDropdown';
import './Navbar.css';

const Navbar = ({ userRole = 'student', isLoggedIn = false, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const getNavigationItems = () => {
    // Menu cơ bản cho student và user
    const studentMenu = [
      { path: '/lessons', label: 'Học bài' },
      { path: '/news', label: 'Tin tức' },
      { path: '/join-class', label: 'Lớp học của tôi' },
      { path: '/materials', label: 'Học liệu cơ bản' },
      { path: '/exercises', label: 'Làm bài tập' },
      { path: '/discussion', label: 'Hỏi đáp' }
    ];

    switch (userRole) {
      case 'user':
      case 'student':
        return studentMenu;
      
      case 'teacher':
        // Teacher có menu student + menu giáo viên
        return [
          ...studentMenu,
          { path: '/teacher-dashboard', label: 'Trang giáo viên', special: true }
        ];
      
      case 'parent':
        return [
          { path: '/track-progress', label: 'Theo dõi kết quả học tập' },
          { path: '/notifications', label: 'Nhận thông báo' },
          { path: '/teacher-communication', label: 'Trao đổi với giáo viên' }
        ];
      
      case 'admin':
      case 'superadmin':
        // Admin có menu student + menu quản lý
        return [
          ...studentMenu,
          { path: '/admin-dashboard', label: 'Quản lý', special: true }
        ];
      
      default:
        return studentMenu;
    }
  };

  const navigationItems = getNavigationItems();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen); // <--- SỬA LỖI 2: Đã sửa lại tên biến
  };

  const isActive = (path) => {
    // Cải tiến logic `isActive` để highlight đúng tab "Lớp học của tôi"
    if (path.startsWith('/join-class')) {
      return location.pathname === '/join-class';
    }
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
              className={`nav-link ${isActive(item.path) ? 'active' : ''} ${item.special ? 'special-link' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          {isLoggedIn ? (
            <ProfileDropdown onLogout={onLogout} />
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