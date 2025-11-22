import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, Award, BookOpen, Calendar, Trash2, Check } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    // Mock data - replace with actual API call
    const mockNotifications = [
      {
        id: 1,
        type: 'grade',
        icon: Award,
        color: '#f59e0b',
        title: 'Điểm bài kiểm tra mới',
        message: 'Con bạn đã nhận điểm 9/10 cho bài kiểm tra "Unit 5: Present Perfect" trong lớp Tiếng Anh 10A1',
        from: 'Cô Nguyễn Thu Hà',
        time: '10 phút trước',
        isRead: false,
        student: 'Nguyễn Văn A'
      },
      {
        id: 2,
        type: 'info',
        icon: Info,
        color: '#3b82f6',
        title: 'Thông báo từ giáo viên',
        message: 'Lớp học ngày mai sẽ bắt đầu lúc 8:00 AM thay vì 7:30 AM như thường lệ',
        from: 'Thầy Trần Văn B',
        time: '2 giờ trước',
        isRead: false,
        student: 'Nguyễn Văn A'
      },
      {
        id: 3,
        type: 'success',
        icon: CheckCircle,
        color: '#10b981',
        title: 'Hoàn thành bài học',
        message: 'Con bạn đã hoàn thành bài học "Vocabulary: Family Members" với kết quả xuất sắc',
        from: 'Hệ thống',
        time: '5 giờ trước',
        isRead: true,
        student: 'Nguyễn Văn A'
      },
      {
        id: 4,
        type: 'alert',
        icon: AlertCircle,
        color: '#ef4444',
        title: 'Bài tập sắp hết hạn',
        message: 'Bài tập "Writing: Describe your family" sẽ hết hạn vào ngày mai. Nhắc nhở con hoàn thành bài tập',
        from: 'Hệ thống',
        time: '1 ngày trước',
        isRead: true,
        student: 'Nguyễn Văn A'
      },
      {
        id: 5,
        type: 'info',
        icon: Calendar,
        color: '#8b5cf6',
        title: 'Lịch học mới',
        message: 'Lịch học tuần tới đã được cập nhật. Vui lòng kiểm tra để chuẩn bị',
        from: 'Cô Nguyễn Thu Hà',
        time: '2 ngày trước',
        isRead: true,
        student: 'Nguyễn Văn A'
      },
      {
        id: 6,
        type: 'grade',
        icon: Award,
        color: '#f59e0b',
        title: 'Kết quả bài tập về nhà',
        message: 'Bài tập "Grammar: Past Simple" đã được chấm điểm: 8.5/10. Giáo viên có nhận xét: "Làm tốt lắm!"',
        from: 'Thầy Trần Văn B',
        time: '3 ngày trước',
        isRead: true,
        student: 'Nguyễn Văn A'
      }
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, isRead: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="spinner"></div>
        <p>Đang tải thông báo...</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <div>
          <h1 className="notifications-title">
            <Bell className="title-bell-icon" />
            Thông báo
          </h1>
          <p className="notifications-subtitle">
            {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã được đọc'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-read-btn" onClick={markAllAsRead}>
            <Check className="btn-icon" />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả
          <span className="tab-badge">{notifications.length}</span>
        </button>
        <button
          className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Chưa đọc
          {unreadCount > 0 && <span className="tab-badge badge-primary">{unreadCount}</span>}
        </button>
        <button
          className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          Đã đọc
          <span className="tab-badge">{notifications.filter(n => n.isRead).length}</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
              >
                <div className="notification-icon-wrapper" style={{ background: `${notification.color}15` }}>
                  <Icon className="notification-icon" style={{ color: notification.color }} />
                </div>
                <div className="notification-content">
                  <div className="notification-header-row">
                    <h3 className="notification-title-text">{notification.title}</h3>
                    {!notification.isRead && <span className="unread-dot"></span>}
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-meta">
                    <span className="notification-from">{notification.from}</span>
                    <span className="notification-separator">•</span>
                    <span className="notification-student">Con: {notification.student}</span>
                    <span className="notification-separator">•</span>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                </div>
                <button
                  className="delete-notification-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <Trash2 className="delete-icon" />
                </button>
              </div>
            );
          })
        ) : (
          <div className="empty-notifications">
            <Bell className="empty-bell-icon" />
            <h3>Không có thông báo nào</h3>
            <p>
              {filter === 'unread' && 'Bạn đã đọc hết tất cả thông báo'}
              {filter === 'read' && 'Chưa có thông báo nào được đọc'}
              {filter === 'all' && 'Bạn chưa có thông báo nào'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

