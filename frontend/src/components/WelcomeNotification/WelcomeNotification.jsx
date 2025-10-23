import React, { useState, useEffect } from 'react';
import './WelcomeNotification.css';

const WelcomeNotification = ({ isVisible, onClose, userRole }) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isVisible) return;

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto close after 3 seconds
    const closeTimer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(closeTimer);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return {
          icon: '👑',
          title: 'Chào mừng Super Admin!',
          message: 'Bạn có toàn quyền quản lý hệ thống',
          badge: 'Quản trị viên',
          features: [
            { icon: '👥', label: 'Quản lý Users' },
            { icon: '📚', label: 'Quản lý Lớp' },
            { icon: '📊', label: 'Thống kê' }
          ]
        };
      case 'teacher':
        return {
          icon: '👨‍🏫',
          title: 'Chào mừng Giáo viên!',
          message: 'Sẵn sàng để chia sẻ kiến thức',
          badge: 'Giáo viên',
          features: [
            { icon: '📖', label: 'Lớp học' },
            { icon: '✍️', label: 'Bài tập' },
            { icon: '📈', label: 'Tiến độ' }
          ]
        };
      case 'parent':
        return {
          icon: '👨‍👩‍👧',
          title: 'Chào mừng Phụ huynh!',
          message: 'Theo dõi con em học tập',
          badge: 'Phụ huynh',
          features: [
            { icon: '📊', label: 'Kết quả' },
            { icon: '🔔', label: 'Thông báo' },
            { icon: '💬', label: 'Trao đổi' }
          ]
        };
      default: // student
        return {
          icon: '🎓',
          title: 'Chào mừng Học sinh!',
          message: 'Chúc bạn học tập hiệu quả',
          badge: 'Học sinh',
          features: [
            { icon: '📚', label: 'Học bài' },
            { icon: '✏️', label: 'Bài tập' },
            { icon: '💬', label: 'Hỏi đáp' }
          ]
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="welcome-overlay">
      <div className={`welcome-notification ${userRole}`}>
        <div className="welcome-icon">{roleInfo.icon}</div>
        <h2 className="welcome-title">{roleInfo.title}</h2>
        <p className="welcome-message">{roleInfo.message}</p>
        <span className="welcome-role">{roleInfo.badge}</span>

        <div className="welcome-features">
          {roleInfo.features.map((feature, index) => (
            <div key={index} className="feature-item">
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-label">{feature.label}</div>
            </div>
          ))}
        </div>

        <div className="welcome-progress">
          <div className="welcome-progress-bar"></div>
        </div>
        <div className="welcome-countdown">
          Đóng tự động sau {countdown} giây...
        </div>
      </div>
    </div>
  );
};

export default WelcomeNotification;

