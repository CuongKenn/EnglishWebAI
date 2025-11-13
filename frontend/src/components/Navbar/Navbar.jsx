import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, BookOpenIcon, UserGroupIcon, ChatBubbleLeftRightIcon, 
  EnvelopeIcon, BellIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, 
  UserIcon, Bars3Icon, XMarkIcon, ChevronDownIcon, SparklesIcon, 
  AcademicCapIcon 
} from '@heroicons/react/24/outline';
import ProfileDropdown from '../ProfileDropdown/ProfileDropdown';
import AuthModal from './AuthModal';
import authService from '../../services/authService';
import './Navbar.css';

const Navbar = ({ userRole = 'student', isLoggedIn: isLoggedInProp = false, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(isLoggedInProp);
  const location = useLocation();
  // No imperative navigation needed in this Navbar; links handle routing.

  // Check login status from localStorage on mount and location change
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = authService.isAuthenticated();
      setIsLoggedIn(loggedIn);
    };

    checkLoginStatus();
    
    // Listen for storage changes (in case user logs in from another tab)
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, [location.pathname]);

  // Also update when prop changes
  useEffect(() => {
    setIsLoggedIn(isLoggedInProp);
  }, [isLoggedInProp]);

  const getNavigationItems = () => {
    // Menu cơ bản cho student
    const studentMenu = [
      { path: '/about', label: 'Giới thiệu', icon: 'fa-info-circle' },
      { path: '/lessons', label: 'Học bài', icon: 'fa-book-open' },
      { path: '/news', label: 'Tin tức', icon: 'fa-newspaper' },
      { path: '/my-classes', label: 'Lớp học của tôi', icon: 'fa-chalkboard-teacher' },
      { path: '/ai-practice', label: 'Thực hành AI', icon: 'fa-robot' },
      { path: '/exercise-hub', label: 'Làm bài tập', icon: 'fa-pen-to-square' },
      { path: '/discussion', label: 'Hỏi đáp', icon: 'fa-comments' }
    ];

    switch (userRole) {
      case 'user':
      case 'student':
        return studentMenu;
      
      case 'teacher':
        // Teacher: chỉ menu quản trị, không có Học bài, Lớp học, Thực hành AI, Làm bài tập
        return [
          { path: '/about', label: 'Giới thiệu', icon: 'fa-info-circle' },
          { path: '/news', label: 'Tin tức', icon: 'fa-newspaper' },
          { path: '/discussion', label: 'Hỏi đáp', icon: 'fa-comments' },
          { path: '/teacher-dashboard', label: 'Dashboard', icon: 'fa-gauge-high', special: true }
        ];
      
      case 'parent':
        // Parent: các trang theo dõi + Thông tin chung cuối
        return [
          { path: '/about', label: 'Giới thiệu', icon: 'fa-info-circle' },
          { path: '/track-progress', label: 'Theo dõi tiến độ', icon: 'fa-chart-line' },
          { path: '/notifications', label: 'Thông báo', icon: 'fa-bell' },
          { path: '/teacher-communication', label: 'Trao đổi', icon: 'fa-message' },
          { path: '/parent-dashboard', label: 'Thông tin chung', icon: 'fa-gauge-high', special: true }
        ];
      
      case 'admin':
      case 'superadmin':
        // Admin: chỉ menu quản trị, không có Học bài, Lớp học, Thực hành AI, Làm bài tập
        return [
          { path: '/about', label: 'Giới thiệu', icon: 'fa-info-circle' },
          { path: '/news', label: 'Tin tức', icon: 'fa-newspaper' },
          { path: '/discussion', label: 'Hỏi đáp', icon: 'fa-comments' },
          { path: '/admin-dashboard', label: 'Dashboard', icon: 'fa-gauge-high', special: true }
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
    // Logic isActive với hỗ trợ nested routes
    if (path === '/my-classes') {
      return location.pathname === '/my-classes';
    }
    
    if (path === '/exercise-hub') {
      return location.pathname === '/exercise-hub';
    }
    
    // Dashboard routes - match với cả nested routes
    if (path === '/admin-dashboard' || path === '/teacher-dashboard' || path === '/parent-dashboard') {
      return location.pathname.startsWith(path);
    }
    
    return location.pathname === path;
  };

  const handleNavClick = (e) => {
    // Check if user is logged in
    if (!isLoggedIn) {
      e.preventDefault();
      setShowAuthModal(true);
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <AcademicCapIcon className="brand-icon" style={{width: 40, height: 40}} />
            <span className="brand-text">Smart Learn</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-nav desktop-nav">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''} ${item.special ? 'special-link' : ''}`}
              title={item.label}
              onClick={(e) => handleNavClick(e)}
            >
              {item.icon && <i className={`fas ${item.icon}`}></i>}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          {isLoggedIn ? (
            <>
              <ProfileDropdown onLogout={onLogout} />
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn" title="Đăng nhập vào hệ thống">
                <i className="fas fa-sign-in-alt"></i>
                <span>Đăng nhập</span>
              </Link>
              <Link to="/register" className="register-btn" title="Đăng ký tài khoản mới">
                <i className="fas fa-user-plus"></i>
                <span>Đăng ký</span>
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
              className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''} ${item.special ? 'special-link' : ''}`}
              onClick={(e) => {
                handleNavClick(e);
                if (isLoggedIn) setIsMenuOpen(false);
              }}
            >
              {item.icon && <i className={`fas ${item.icon}`}></i>}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </nav>
  );
};

export default Navbar;