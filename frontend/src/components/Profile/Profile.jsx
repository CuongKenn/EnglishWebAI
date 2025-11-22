import React, { useState, useEffect, useRef } from 'react';
import { User, Camera, Mail, Phone, MapPin, Calendar, Edit2, Save, X, AlertCircle, CheckCircle, Send, Link as LinkIcon, UserCheck, Shield } from 'lucide-react';
import authService from '../../services/authService';
import { linkParent, unlinkParent, getMyParents, verifyParentLink } from '../../services/userService';
import './Profile.css';
import Toast from '../Toast/Toast';
import useToast from '../../hooks/useToast';
import AvatarCropModal from './AvatarCropModal';
import FaceEnrollment from '../FaceVerification/FaceEnrollment';

const Profile = () => {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
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
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  // clickCount and clickTimerRef removed - unused Easter egg feature

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = authService.getCurrentUser();
        setUser(userData);
        setEditedUser(userData);
        setEmailVerified(userData.is_verified || false);
        
        // Fetch linked parents if user is a student
        if (userData.role === 'user') {
          const parents = await getMyParents();
          if (parents && parents.length > 0) {
            // Map to include verification status
            setLinkedParent({
              id: parents[0].parent_id,
              email: parents[0].parent?.email || 'Unknown',
              name: parents[0].parent?.full_name || parents[0].parent?.username || 'Parent',
              verified: parents[0].is_verified
            });
          }
        }
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

  const handleAvatarDoubleClick = () => {
    const avatarUrl = editedUser.avatar || editedUser.avatar_url || user?.avatar_url;
    if (avatarUrl) {
      const fullUrl = avatarUrl.startsWith('data:') ? avatarUrl : getAvatarUrl(avatarUrl);
      setTempImageUrl(fullUrl);
      setShowCropModal(true);
    }
  };

  const handleCropSave = async (croppedBlob) => {
    setShowCropModal(false);
    
    try {
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.jpg');

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${BASE_URL}/api/v1/users/me/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Upload failed');
      }

      const data = await response.json();
      
      // Update user data with new avatar URL
      const updatedUser = { ...user, avatar_url: data.avatar_url };
      setUser(updatedUser);
      setEditedUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Dispatch custom event to update navbar avatar
      window.dispatchEvent(new Event('avatarUpdated'));
      
      // Reset file input if exists
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      showSuccess('Cập nhật ảnh đại diện thành công!');
    } catch (error) {
      console.error('Error uploading cropped avatar:', error);
      showError(error.message || 'Có lỗi xảy ra khi tải ảnh lên!');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError('Định dạng ảnh không hỗ trợ. Chỉ chấp nhận: JPG, PNG, GIF, WEBP');
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('Kích thước ảnh vượt quá 5MB');
      e.target.value = ''; // Reset input
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditedUser(prev => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${BASE_URL}/api/v1/users/me/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Upload failed');
      }

      const data = await response.json();
      
      // Update user data with new avatar URL
      const updatedUser = { ...user, avatar_url: data.avatar_url };
      setUser(updatedUser);
      setEditedUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Dispatch custom event to update navbar avatar
      window.dispatchEvent(new Event('avatarUpdated'));
      
      // Reset file input to allow selecting the same file again
      e.target.value = '';
      
      showSuccess('Cập nhật ảnh đại diện thành công!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showError(error.message || 'Có lỗi xảy ra khi tải ảnh lên!');
      // Reset file input on error
      e.target.value = '';
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
    showSuccess('Cập nhật thông tin thành công!');
  };

  const handleInputChange = (field, value) => {
    setEditedUser({ ...editedUser, [field]: value });
  };

  const handleSendVerification = async () => {
    try {
      // TODO: Call API to send verification email
      showSuccess('Email xác minh đã được gửi đến ' + user.email);
      setResendCooldown(60); // 60 seconds cooldown
    } catch (error) {
      console.error('Error sending verification email:', error);
      showError('Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown === 0) {
      handleSendVerification();
    }
  };

  const handleLinkParent = async () => {
    if (!parentEmail.trim()) {
      showWarning('Vui lòng nhập email phụ huynh!');
      return;
    }

    try {
      const link = await linkParent(parentEmail);
      setLinkedParent({
        id: link.parent_id,
        email: parentEmail,
        verified: link.is_verified
      });
      setParentEmail('');
      showSuccess('Đã gửi yêu cầu liên kết đến ' + parentEmail);
    } catch (error) {
      console.error('Error linking parent:', error);
      showError(error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  const handleUnlinkParent = async () => {
    if (window.confirm('Bạn có chắc muốn hủy liên kết với phụ huynh?')) {
      try {
        await unlinkParent(linkedParent.id);
        setLinkedParent(null);
        showSuccess('Đã hủy liên kết với phụ huynh!');
      } catch (error) {
        console.error('Error unlinking parent:', error);
        showError(error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
      }
    }
  };

  const handleVerifyParent = async () => {
    if (window.confirm('Bạn có chắc muốn xác nhận liên kết với phụ huynh này?')) {
      try {
        await verifyParentLink(linkedParent.id);
        setLinkedParent({
          ...linkedParent,
          verified: true
        });
        showSuccess('Đã xác nhận liên kết với phụ huynh!');
      } catch (error) {
        console.error('Error verifying parent:', error);
        showError(error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
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

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    // If already full URL or data URL, return as is
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:')) {
      return avatarUrl;
    }
    // Otherwise prepend backend base URL
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000';
    return `${BASE_URL}${avatarUrl}`;
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
              {user?.role === 'student' && (
                <button
                  className={`profile-tab ${activeTab === 'face' ? 'active' : ''}`}
                  onClick={() => setActiveTab('face')}
                >
                  <Shield size={18} />
                  Xác minh khuôn mặt
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="profile-tab-content">
              {activeTab === 'face' && user?.role === 'student' ? (
                <div className="profile-face-tab">
                  <FaceEnrollment 
                    onEnrollmentComplete={() => {
                      showSuccess('Đăng ký khuôn mặt thành công!');
                    }}
                  />
                </div>
              ) : activeTab === 'info' ? (
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
                    <h3 className="settings-title">Cài đặt tài khoản</h3>
                    <div className="settings-actions">
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
                  </div>

                  <div className="settings-form">
                    <div className="settings-form-section">
                      <h4>Thông tin cơ bản</h4>
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
                    </div>

                    <div className="settings-form-section">
                      <h4>Thông tin bổ sung</h4>
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
                                {!linkedParent.verified && (
                                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#ff9800', fontWeight: 500 }}>
                                    ⚠️ Chưa xác nhận
                                  </p>
                                )}
                                {linkedParent.verified && (
                                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#4caf50', fontWeight: 500 }}>
                                    ✓ Đã xác nhận
                                  </p>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {!linkedParent.verified && (
                                <button className="verify-btn" onClick={handleVerifyParent} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                                  <CheckCircle size={14} />
                                  Xác nhận
                                </button>
                              )}
                              <button className="unlink-btn" onClick={handleUnlinkParent}>
                                Hủy liên kết
                              </button>
                            </div>
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
                <div 
                  className="profile-avatar-wrapper"
                  onDoubleClick={handleAvatarDoubleClick}
                  style={{ cursor: (editedUser.avatar_url || editedUser.avatar || user?.avatar_url) ? 'pointer' : 'default' }}
                  title={(editedUser.avatar_url || editedUser.avatar || user?.avatar_url) ? 'Double click để chỉnh sửa ảnh' : ''}
                >
                  {(editedUser.avatar || editedUser.avatar_url || user?.avatar_url) ? (
                    <img 
                      src={
                        editedUser.avatar 
                        || (editedUser.avatar_url ? getAvatarUrl(editedUser.avatar_url) : null)
                        || (user?.avatar_url ? getAvatarUrl(user.avatar_url) : null)
                      } 
                      alt={user?.full_name || user?.username || 'Avatar'} 
                      className="profile-avatar-img" 
                    />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      <span className="profile-avatar-initials">{getInitials(user?.full_name || user?.username || 'U')}</span>
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
                <h2 className="profile-display-name">{user.full_name || user.username}</h2>
                <span className="profile-role-badge">{getRoleDisplayName(displayRole)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}

      {showCropModal && tempImageUrl && (
        <AvatarCropModal
          imageUrl={tempImageUrl}
          onSave={handleCropSave}
          onClose={() => setShowCropModal(false)}
        />
      )}
    </div>
  );
};

export default Profile;
