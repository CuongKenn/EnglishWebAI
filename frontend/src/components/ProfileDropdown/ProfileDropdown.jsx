import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { User, LogOut, UserPlus, BookOpen } from 'lucide-react';
import authService from '../../services/authService';
import './ProfileDropdown.css';

const ProfileDropdown = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const userData = authService.getCurrentUser();
    setUser(userData);
    
    // Listen for storage changes to update avatar in real-time
    const handleStorageChange = () => {
      const updatedUserData = authService.getCurrentUser();
      setUser(updatedUserData);
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event when avatar is updated
    window.addEventListener('avatarUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('avatarUpdated', handleStorageChange);
    };
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
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
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

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    // If already full URL, return as is
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:')) {
      return avatarUrl;
    }
    // Otherwise prepend backend base URL
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000';
    return `${BASE_URL}${avatarUrl}`;
  };

  if (!user) return null;

  const dropdownMenu = isOpen && (
    <div 
      className="profile-dropdown-menu"
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
        zIndex: 999999
      }}
    >
      <div className="dropdown-header">
        <div className="profile-avatar-large">
          {user.avatar_url ? (
            <img src={getAvatarUrl(user.avatar_url)} alt={user.full_name || user.username} />
          ) : (
            <span className="profile-initials-large">{getInitials(user.full_name || user.username)}</span>
          )}
        </div>
        <div className="profile-info-dropdown">
          <h4>{user.full_name || user.username}</h4>
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
  );

  return (
    <div className="profile-dropdown-container">
      <button className="profile-trigger" onClick={toggleDropdown} ref={triggerRef}>
        <div className="profile-avatar-small">
          {user.avatar_url ? (
            <img src={getAvatarUrl(user.avatar_url)} alt={user.full_name || user.username} />
          ) : (
            <span className="profile-initials">{getInitials(user.full_name || user.username)}</span>
          )}
        </div>
        <span className="profile-username-nav">{user.full_name || user.username}</span>
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

      {dropdownMenu && createPortal(dropdownMenu, document.body)}
    </div>
  );
};

export default ProfileDropdown;

