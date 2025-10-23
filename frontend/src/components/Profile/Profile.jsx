import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import authService from '../../services/authService';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'superadmin':
        return 'Siêu quản trị viên';
      case 'teacher':
        return 'Giáo viên';
      case 'parent':
        return 'Phụ huynh';
      case 'user':
        return 'Học sinh';
      default:
        return role;
    }
  };

  // Force render role even if undefined
  const displayRole = user?.role || 'parent'; // Default to parent for testing

  return (
    <div className="profile-frame">
      <div className="profile-header">
        <h1 className="profile-title">Hồ sơ tài khoản</h1>
      </div>
      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            <div className="profile-avatar-inner">
              <User className="profile-user-icon" />
            </div>
          </div>
        </div>
        <div className="profile-info">
          <h2 className="profile-username">{user.username}</h2>
          <span className="profile-role">
            {getRoleDisplayName(displayRole)}
          </span>
        </div>
        <div className="profile-divider"></div>
        <div className="profile-details">
          <div className="profile-item email">
            <i className="fas fa-envelope"></i>
            <div className="profile-item-content">
              <span className="profile-item-label">Email</span>
              <span className="profile-item-value">{user.email}</span>
            </div>
          </div>
          {user.full_name && (
            <div className="profile-item full_name">
              <i className="fas fa-user"></i>
              <div className="profile-item-content">
                <span className="profile-item-label">Họ và tên</span>
                <span className="profile-item-value">{user.full_name}</span>
              </div>
            </div>
          )}
          {user.phone && (
            <div className="profile-item phone">
              <i className="fas fa-phone"></i>
              <div className="profile-item-content">
                <span className="profile-item-label">Số điện thoại</span>
                <span className="profile-item-value">{user.phone}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
