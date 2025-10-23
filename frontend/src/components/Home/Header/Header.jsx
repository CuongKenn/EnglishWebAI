// src/component/Header/Header.jsx

import React, { useState, useEffect } from 'react'; 
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ userRole = 'student', isLoggedIn = false, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const getNavigationItems = () => {
    switch (userRole) {
      case 'student':
        return [
          { path: '/join-class', label: 'Tham gia lớp học' },
          { path: '/materials', label: 'Học liệu cơ bản' },
          { path: '/exercises', label: 'Làm bài tập' },
          { path: '/results', label: 'Xem lại kết quả' },
          { path: '/discussion', label: 'Thảo luận/Hỏi đáp' },
          { path: '/progress', label: 'Theo dõi tiến độ học tập cá nhân' }
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

  return (
    <header className={`header-container ${isScrolled ? 'scrolled' : ''}`}>
      {/* Top Header Bar */}
      <div className="header-top">
        <div className="logo">
          <div className="logo-icon">🎓</div>
          <span className="logo-text">English AI</span>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Tìm kiếm bài học, bài tập, từ vựng, ngữ pháp..." />
          <button>
            <i className="fas fa-search"></i>
            <span>Tìm kiếm</span>
          </button>
        </div>
        <div className="auth-buttons">
          {isLoggedIn ? (
            <div className="user-menu">
              <span className="user-role">{userRole.toUpperCase()}</span>
              <button className="logout-btn" onClick={onLogout}>
                <i className="fas fa-sign-out-alt"></i>
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="login-btn">Đăng nhập</Link>
              <Link to="/register" className="register-btn">Đăng ký</Link>
            </>
          )}
        </div>
      </div>
      
      {/* Navigation Bar */}
      <nav className="header-nav">
        <div className="nav-container">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="nav-link"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;