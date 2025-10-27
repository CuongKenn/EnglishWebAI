import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="auth-modal-close" onClick={onClose} aria-label="Đóng">
          <i className="fas fa-times"></i>
        </button>

        {/* Animated Icon */}
        <div className="auth-modal-icon">
          <div className="icon-circle">
            <i className="fas fa-lock"></i>
          </div>
          <div className="icon-particles">
            <span className="particle"></span>
            <span className="particle"></span>
            <span className="particle"></span>
            <span className="particle"></span>
          </div>
        </div>

        {/* Content */}
        <div className="auth-modal-body">
          <h2 className="auth-modal-title">
            Yêu cầu đăng nhập
          </h2>
          <p className="auth-modal-message">
            Bạn cần <strong>đăng nhập</strong> hoặc <strong>đăng ký</strong> tài khoản để sử dụng tính năng này.
          </p>

          {/* Features List */}
          <div className="auth-modal-features">
            <div className="feature-item">
              <i className="fas fa-check-circle"></i>
              <span>Truy cập đầy đủ các khóa học</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-check-circle"></i>
              <span>Luyện tập với AI thông minh</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-check-circle"></i>
              <span>Theo dõi tiến độ học tập</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="auth-modal-actions">
            <Link 
              to="/login" 
              className="auth-action-btn auth-login-btn"
              onClick={onClose}
            >
              <i className="fas fa-sign-in-alt"></i>
              <span>Đăng nhập</span>
            </Link>
            <Link 
              to="/register" 
              className="auth-action-btn auth-register-btn"
              onClick={onClose}
            >
              <i className="fas fa-user-plus"></i>
              <span>Đăng ký ngay</span>
            </Link>
          </div>

          {/* Footer Note */}
          <div className="auth-modal-footer">
            <i className="fas fa-info-circle"></i>
            <span>Hoàn toàn miễn phí để bắt đầu!</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;

