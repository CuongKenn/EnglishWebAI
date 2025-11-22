import React, { useState, useEffect } from 'react';
import notificationService from '../../../services/notificationService';
import { 
  FaBell, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTimesCircle,
  FaCheck,
  FaTrash,
  FaFilter
} from 'react-icons/fa';
import './Notifications.css';

const Notifications = () => {
  // navigate not currently used
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [filterType, filterRead]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filterType !== 'all') {
        params.notification_type = filterType;
      }
      
      if (filterRead === 'unread') {
        params.unread_only = true;
      }
      
      const data = await notificationService.getNotifications(params);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    if (window.confirm('Bạn có chắc muốn xóa thông báo này?')) {
      try {
        await notificationService.deleteNotification(notificationId);
        loadNotifications();
        loadUnreadCount();
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả thông báo?')) {
      try {
        await notificationService.deleteAllNotifications();
        loadNotifications();
        loadUnreadCount();
      } catch (error) {
        console.error('Error deleting all notifications:', error);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="notification-icon success" />;
      case 'warning':
        return <FaExclamationTriangle className="notification-icon warning" />;
      case 'error':
        return <FaTimesCircle className="notification-icon error" />;
      default:
        return <FaInfoCircle className="notification-icon info" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-title">
          <FaBell className="page-icon" />
          <h1>Thông Báo</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>

        <div className="header-actions">
          {notifications.length > 0 && (
            <>
              <button 
                className="btn-mark-all-read"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <FaCheck /> Đánh dấu tất cả đã đọc
              </button>
              <button 
                className="btn-delete-all"
                onClick={handleDeleteAll}
              >
                <FaTrash /> Xóa tất cả
              </button>
            </>
          )}
        </div>
      </div>

      <div className="notifications-filters">
        <div className="filter-group">
          <FaFilter className="filter-icon" />
          <label>Loại:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả</option>
            <option value="info">Thông tin</option>
            <option value="success">Thành công</option>
            <option value="warning">Cảnh báo</option>
            <option value="error">Lỗi</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Trạng thái:</label>
          <select 
            value={filterRead} 
            onChange={(e) => setFilterRead(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả</option>
            <option value="unread">Chưa đọc</option>
          </select>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <FaBell className="empty-icon" />
            <h3>Không có thông báo</h3>
            <p>Bạn chưa có thông báo nào</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`notification-card ${notification.is_read ? 'read' : 'unread'}`}
            >
              <div className="notification-content">
                {getNotificationIcon(notification.type)}
                <div className="notification-text">
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  <span className="notification-time">
                    {formatDate(notification.created_at)}
                  </span>
                </div>
              </div>

              <div className="notification-actions">
                {!notification.is_read && (
                  <button
                    className="btn-mark-read"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Đánh dấu đã đọc"
                  >
                    <FaCheck />
                  </button>
                )}
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(notification.id)}
                  title="Xóa thông báo"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;

