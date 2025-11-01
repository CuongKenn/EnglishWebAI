import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, Info } from 'lucide-react';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

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

  // Fetch notifications từ API (có thể thêm sau)
  useEffect(() => {
    // TODO: Fetch notifications from API
    // const fetchNotifications = async () => {
    //   const response = await api.get('/notifications');
    //   setNotifications(response.data);
    // };
    // fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      <button 
        className="notification-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3 className="notification-title">
              <Bell size={18} />
              Thông báo
            </h3>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" title="Đánh dấu tất cả đã đọc">
                <Check size={16} />
              </button>
            )}
          </div>

          <div className="notification-content">
            {notifications.length > 0 ? (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  >
                    <div className="notification-icon-wrapper">
                      <Info size={18} />
                    </div>
                    <div className="notification-text">
                      <h4 className="notification-item-title">{notification.title}</h4>
                      <p className="notification-item-message">{notification.message}</p>
                      <span className="notification-item-time">{notification.time}</span>
                    </div>
                    <button className="notification-close-btn" title="Xóa">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="notification-empty">
                <Bell size={48} className="empty-icon" />
                <h4>Chưa có thông báo</h4>
                <p>Bạn sẽ nhận được thông báo ở đây khi có cập nhật mới</p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button className="view-all-btn">
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

