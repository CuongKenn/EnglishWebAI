import React, { useState, useEffect, useRef } from 'react';
import { User, Camera, Mail, Phone, MapPin, Calendar, Edit2, Save, X, AlertCircle, CheckCircle, Send, Link as LinkIcon, UserCheck } from 'lucide-react';
import authService from '../../services/authService';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'settings'
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [linkedParent, setLinkedParent] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = authService.getCurrentUser();
        setUser(userData);
        setEditedUser(userData);
        // TODO: Get from API
        setEmailVerified(userData.email_verified || false);
        setLinkedParent(userData.linked_parent || null);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Generate stars
  useEffect(() => {
    const starsContainer = document.querySelector('.profile-stars');
    if (!starsContainer) return;

    // Clear existing stars
    starsContainer.innerHTML = '';

    // Create 50 stars
    const starCount = 50;
    const sizes = ['small', 'medium', 'large'];

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = `star ${sizes[Math.floor(Math.random() * sizes.length)]}`;
      
      // Random position
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      
      // Random animation duration
      star.style.animationDuration = `${6 + Math.random() * 4}s, ${2 + Math.random() * 2}s`;
      
      starsContainer.appendChild(star);
    }
  }, []);

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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedUser({ ...editedUser, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(user);
  };

  const handleSave = () => {
    // TODO: Save to backend
    setUser(editedUser);
    setIsEditing(false);
    // Show success message
    alert('Cập nhật thông tin thành công!');
  };

  const handleInputChange = (field, value) => {
    setEditedUser({ ...editedUser, [field]: value });
  };

  const handleSendVerification = async () => {
    try {
      // TODO: Call API to send verification email
      alert('Email xác minh đã được gửi đến ' + user.email);
      setResendCooldown(60); // 60 seconds cooldown
    } catch (error) {
      console.error('Error sending verification email:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown === 0) {
      handleSendVerification();
    }
  };

  const handleLinkParent = async () => {
    if (!parentEmail.trim()) {
      alert('Vui lòng nhập email phụ huynh!');
      return;
    }

    try {
      // TODO: Call API to link parent account
      // Mock data for now
      setLinkedParent({
        email: parentEmail,
        name: 'Phụ huynh',
        verified: false
      });
      setParentEmail('');
      alert('Đã gửi yêu cầu liên kết đến ' + parentEmail);
    } catch (error) {
      console.error('Error linking parent:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  const handleUnlinkParent = async () => {
    if (window.confirm('Bạn có chắc muốn hủy liên kết với phụ huynh?')) {
      try {
        // TODO: Call API to unlink parent
        setLinkedParent(null);
        alert('Đã hủy liên kết với phụ huynh!');
      } catch (error) {
        console.error('Error unlinking parent:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại!');
      }
    }
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

  if (loading) {
  return (
      <div className="profile-page">
        <div className="profile-stars"></div>
        <div className="profile-loading">
          <div className="profile-spinner"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayRole = user?.role || 'user';

  return (
    <div className="profile-page">
      {/* Starry background */}
      <div className="profile-stars"></div>
      
      {/* iPad-like container */}
      <div className="profile-ipad-container">
        <div className="ipad-frame">
          {/* iPad Header */}
          <div className="ipad-header">
            <div className="ipad-camera"></div>
            <div className="ipad-speaker"></div>
          </div>

          {/* iPad Screen */}
          <div className="ipad-screen">
            {/* Main Content Container - Left Side */}
            <div className="profile-content-container">
              {/* Tabs */}
              <div className="profile-tabs">
              <button
                className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <User size={18} />
                Thông tin tài khoản
              </button>
              <button
                className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Edit2 size={18} />
                Cài đặt tài khoản
              </button>
            </div>

            {/* Tab Content */}
            <div className="profile-tab-content">
              {activeTab === 'info' ? (
                <div className="profile-info-tab">
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-icon">
                        <User size={20} />
                      </div>
                      <div className="info-content">
                        <label>Tên hiển thị</label>
                        <p>{user.username}</p>
          </div>
        </div>

                    <div className="info-item">
                      <div className="info-icon">
                        <Mail size={20} />
        </div>
                      <div className="info-content">
                        <label>Email</label>
                        <p>{user.email}</p>
            </div>
          </div>

          {user.full_name && (
                      <div className="info-item">
                        <div className="info-icon">
                          <User size={20} />
                        </div>
                        <div className="info-content">
                          <label>Họ và tên</label>
                          <p>{user.full_name}</p>
              </div>
            </div>
          )}

          {user.phone && (
                      <div className="info-item">
                        <div className="info-icon">
                          <Phone size={20} />
                        </div>
                        <div className="info-content">
                          <label>Số điện thoại</label>
                          <p>{user.phone}</p>
                        </div>
                      </div>
                    )}

                    {user.address && (
                      <div className="info-item">
                        <div className="info-icon">
                          <MapPin size={20} />
                        </div>
                        <div className="info-content">
                          <label>Địa chỉ</label>
                          <p>{user.address}</p>
                        </div>
                      </div>
                    )}

                    {user.date_of_birth && (
                      <div className="info-item">
                        <div className="info-icon">
                          <Calendar size={20} />
                        </div>
                        <div className="info-content">
                          <label>Ngày sinh</label>
                          <p>{user.date_of_birth}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="profile-settings-tab">
                  <div className="settings-header">
                    {!isEditing ? (
                      <button className="edit-btn" onClick={handleEdit}>
                        <Edit2 size={18} />
                        Chỉnh sửa
                      </button>
                    ) : (
                      <div className="edit-actions">
                        <button className="save-btn" onClick={handleSave}>
                          <Save size={18} />
                          Lưu
                        </button>
                        <button className="cancel-btn" onClick={handleCancel}>
                          <X size={18} />
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="settings-form">
                    <div className="form-group">
                      <label>Tên hiển thị</label>
                      <input
                        type="text"
                        value={editedUser.username || ''}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Nhập tên hiển thị"
                      />
                    </div>

                    <div className="form-group">
                      <label>Email đăng nhập</label>
                      <input
                        type="email"
                        value={editedUser.email || ''}
                        disabled
                        placeholder="Email"
                      />
                      <small>Email không thể thay đổi</small>
                    </div>

                    <div className="form-group">
                      <label>Họ và tên</label>
                      <input
                        type="text"
                        value={editedUser.full_name || ''}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Nhập họ và tên đầy đủ"
                      />
                    </div>

                    <div className="form-group">
                      <label>Số điện thoại</label>
                      <input
                        type="tel"
                        value={editedUser.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>

                    <div className="form-group">
                      <label>Địa chỉ</label>
                      <input
                        type="text"
                        value={editedUser.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Nhập địa chỉ"
                      />
                    </div>

                    <div className="form-group">
                      <label>Ngày sinh</label>
                      <input
                        type="date"
                        value={editedUser.date_of_birth || ''}
                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="form-group">
                      <label>Giới tính</label>
                      <select
                        value={editedUser.gender || ''}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        disabled={!isEditing}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>

                    {/* Email Verification Section */}
                    <div className={`verification-section ${emailVerified ? 'verified' : ''}`}>
                      <div className="verification-header">
                        <div className={`verification-icon ${emailVerified ? 'success' : 'warning'}`}>
                          {emailVerified ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <div className="verification-content">
                          <h4>{emailVerified ? 'Email đã xác minh' : 'Email chưa xác minh'}</h4>
                          <p>
                            {emailVerified 
                              ? `Email ${user.email} đã được xác minh thành công` 
                              : 'Vui lòng xác minh email để bảo mật tài khoản'}
                          </p>
                        </div>
                      </div>
                      {!emailVerified && (
                        <div className="verification-actions">
                          <button className="verify-btn" onClick={handleSendVerification}>
                            <Send size={16} />
                            Gửi email xác minh
                          </button>
                          <button 
                            className="resend-btn" 
                            onClick={handleResendVerification}
                            disabled={resendCooldown > 0}
                          >
                            <Send size={16} />
                            {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Parent Linking Section - Only for students */}
                    {displayRole === 'user' && (
                      <div className={`parent-linking-section ${linkedParent ? 'linked' : ''}`}>
                        <div className="verification-header">
                          <div className={`verification-icon ${linkedParent ? 'success' : 'warning'}`}>
                            {linkedParent ? <UserCheck size={20} /> : <LinkIcon size={20} />}
                          </div>
                          <div className="verification-content">
                            <h4>{linkedParent ? 'Đã liên kết với phụ huynh' : 'Liên kết với phụ huynh'}</h4>
                            <p>
                              {linkedParent 
                                ? 'Phụ huynh có thể theo dõi kết quả học tập của bạn' 
                                : 'Nhập email phụ huynh để họ có thể theo dõi kết quả học tập'}
                            </p>
                          </div>
                        </div>
                        
                        {linkedParent ? (
                          <div className="linked-parent-info">
                            <div className="linked-parent-details">
                              <div className="parent-avatar">
                                {linkedParent.name ? linkedParent.name[0].toUpperCase() : 'P'}
                              </div>
                              <div>
                                <strong>{linkedParent.name || 'Phụ huynh'}</strong>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6c757d' }}>
                                  {linkedParent.email}
                                </p>
                              </div>
                            </div>
                            <button className="unlink-btn" onClick={handleUnlinkParent}>
                              Hủy liên kết
                            </button>
                          </div>
                        ) : (
                          <div className="linking-form">
                            <input
                              type="email"
                              value={parentEmail}
                              onChange={(e) => setParentEmail(e.target.value)}
                              placeholder="Nhập email phụ huynh"
                            />
                            <button className="link-btn" onClick={handleLinkParent}>
                              <LinkIcon size={16} />
                              Liên kết
                            </button>
                          </div>
                        )}
                      </div>
                    )}
              </div>
                </div>
              )}
            </div>
            </div>

            {/* Profile Header with Avatar - Right Side */}
            <div className="profile-header-section">
              <div className="profile-avatar-container">
                <div className="profile-avatar-wrapper">
                  {editedUser.avatar ? (
                    <img src={editedUser.avatar} alt={user.username} className="profile-avatar-img" />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      <span className="profile-avatar-initials">{getInitials(user.username)}</span>
                    </div>
                  )}
                  {activeTab === 'settings' && (
                    <button className="avatar-upload-btn" onClick={handleAvatarClick}>
                      <Camera size={20} />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                </div>
                <h2 className="profile-display-name">{user.username}</h2>
                <span className="profile-role-badge">{getRoleDisplayName(displayRole)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
