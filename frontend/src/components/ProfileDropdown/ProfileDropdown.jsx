import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, UserPlus, BookOpen } from 'lucide-react';
import authService from '../../services/authService';
import './ProfileDropdown.css';

const ProfileDropdown = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const userData = authService.getCurrentUser();
    setUser(userData);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuClick = () => {
    setIsOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button className="profile-trigger" onClick={toggleDropdown}>
        <div className="profile-avatar-small">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            <span className="profile-initials">{getInitials(user.username)}</span>
          )}
        </div>
        <span className="profile-username-nav">{user.username}</span>
        <svg 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`} 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none"
        >
          <path 
            d="M2.5 4.5L6 8L9.5 4.5" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="dropdown-header">
            <div className="profile-avatar-large">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <span className="profile-initials-large">{getInitials(user.username)}</span>
              )}
            </div>
            <div className="profile-info-dropdown">
              <h4>{user.username}</h4>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-menu-items">
            <Link to="/profile" className="dropdown-item" onClick={handleMenuClick}>
              <User size={18} />
              <span>Thông tin</span>
            </Link>

            {/* Chỉ hiển thị nút Học bạ cho học sinh (role 'user' hoặc 'student') */}
            {(user.role === 'user' || user.role === 'student') && (
              <Link to="/report-card" className="dropdown-item" onClick={handleMenuClick}>
                <BookOpen size={18} />
                <span>Học bạ</span>
              </Link>
            )}

            <Link to="/invite-friends" className="dropdown-item" onClick={handleMenuClick}>
              <UserPlus size={18} />
              <span>Giới thiệu bạn bè</span>
            </Link>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-menu-items">
            <button className="dropdown-item logout-item" onClick={() => {
              handleMenuClick();
              onLogout();
            }}>
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;

