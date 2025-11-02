import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BellIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, TrophyIcon, BookOpenIcon, 
  CalendarIcon, TrashIcon, CheckIcon, ArrowLeftIcon, ChevronRightIcon, FunnelIcon,
  MagnifyingGlassIcon, ArrowDownTrayIcon, DocumentTextIcon, DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import Navbar from '../../../components/Navbar/Navbar';
import Modal from '../ParentDashboardV2/components/Modal';
import authService from '../../../services/authService';
import notificationService from '../../../services/notificationService';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportDetailModal, setShowExportDetailModal] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState(null);
  const [exportOptions, setExportOptions] = useState({
    title: true,
    content: true,
    marks: true,
    attendance: true,
    sender: true,
    time: true
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleExportTypeSelect = (type) => {
    setSelectedExportType(type);
    setShowExportModal(false);
    setShowExportDetailModal(true);
  };

  const handleExportOptionToggle = (option) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleExportConfirm = async () => {
    try {
      let blob;
      
      if (selectedExportType === 'pdf') {
        blob = await notificationService.exportToPDF(exportOptions);
      } else if (selectedExportType === 'excel') {
        blob = await notificationService.exportToExcel(exportOptions);
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const extension = selectedExportType === 'pdf' ? 'pdf' : 'xlsx';
      link.download = `ThongBao_${timestamp}.${extension}`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message (optional - có thể thêm toast notification)

    } catch (error) {
      console.error('Lỗi khi xuất file:', error);
      alert('Không thể xuất file. Vui lòng thử lại!');
    } finally {
      setShowExportDetailModal(false);
      setSelectedExportType(null);
      setExportOptions({
        title: true,
        content: true,
        marks: true,
        attendance: true,
        sender: true,
        time: true
      });
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Gọi API để lấy notifications
      const data = await notificationService.getNotifications({
        skip: 0,
        limit: 100
      });
      
      // Map data từ API sang format của UI
      const mappedNotifications = data.map(notif => {
        // Xác định icon và color dựa vào type
        let icon, color, priority;
        
        switch(notif.type) {
          case 'grade':
            icon = Award;
            color = '#f59e0b';
            priority = 'high';
            break;
          case 'warning':
            icon = AlertCircle;
            color = '#f59e0b';
            priority = 'high';
            break;
          case 'alert':
            icon = AlertCircle;
            color = '#ef4444';
            priority = 'high';
            break;
          case 'success':
            icon = CheckCircle;
            color = '#10b981';
            priority = 'low';
            break;
          case 'info':
            icon = Info;
            color = '#3b82f6';
            priority = 'medium';
            break;
          default:
            icon = Bell;
            color = '#6b7280';
            priority = 'medium';
        }
        
        // Format thời gian
        const createdAt = new Date(notif.created_at);
        const now = new Date();
        const diffMs = now - createdAt;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        let timeText;
        if (diffMins < 1) timeText = 'Vừa xong';
        else if (diffMins < 60) timeText = `${diffMins} phút trước`;
        else if (diffHours < 24) timeText = `${diffHours} giờ trước`;
        else if (diffDays < 7) timeText = `${diffDays} ngày trước`;
        else timeText = createdAt.toLocaleDateString('vi-VN');
        
        return {
          id: notif.id,
          type: notif.type,
          icon: icon,
          color: color,
          title: notif.title,
          message: notif.message,
          from: 'Hệ thống', // Có thể enhance thêm từ backend
          time: timeText,
          isRead: notif.is_read,
          priority: priority,
          student: '', // Có thể enhance thêm từ backend
          related_id: notif.related_id,
          related_type: notif.related_type
        };
      });
      
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Show empty state nếu có lỗi
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      // Update local state
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Update local state
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      // Update local state
      setNotifications(notifications.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'unread' ? !notif.isRead :
      notif.isRead;

    const matchesSearch = 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.from.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <>
        <Navbar userRole="parent" isLoggedIn={true} onLogout={handleLogout} />
        <div className="notifications-page-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải thông báo...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userRole="parent" isLoggedIn={true} onLogout={handleLogout} />
      <div className="notifications-page-container">
        {/* Page Header */}
        <div className="page-header-notifications">
          <div className="breadcrumb">
            <span className="back-btn" onClick={() => navigate('/')}>
              <ArrowLeftIcon className="back-icon" />
              Home
            </span>
            <ChevronRightIcon className="breadcrumb-separator" />
            <span className="breadcrumb-current">Thông báo</span>
          </div>

          <div className="page-title-section-notif">
            <div className="page-title-left-notif">
              <div className="page-icon-wrapper-notif">
                <BellIcon className="page-icon-notif" />
                {unreadCount > 0 && (
                  <span className="notification-badge-header">{unreadCount}</span>
                )}
              </div>
              <div>
                <h1 className="page-title-notif">Thông báo</h1>
                <p className="page-subtitle-notif">
                  {unreadCount > 0 
                    ? `Bạn có ${unreadCount} thông báo chưa đọc` 
                    : 'Tất cả thông báo đã được đọc'}
                </p>
              </div>
            </div>
            <div className="page-actions-notif">
              {unreadCount > 0 && (
                <button className="action-btn-secondary-notif" onClick={markAllAsRead}>
                  <CheckIcon className="btn-icon-notif" />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
              <button className="action-btn-primary-notif" onClick={() => setShowExportModal(true)}>
                <ArrowDownTrayIcon className="btn-icon-notif" />
                Xuất danh sách
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="notifications-controls">
          <div className="filter-tabs-modern">
            <button
              className={`filter-tab-modern ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <span>Tất cả</span>
              <span className="tab-count">{notifications.length}</span>
            </button>
            <button
              className={`filter-tab-modern ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              <span>Chưa đọc</span>
              {unreadCount > 0 && <span className="tab-count highlight">{unreadCount}</span>}
            </button>
            <button
              className={`filter-tab-modern ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              <span>Đã đọc</span>
              <span className="tab-count">{notifications.filter(n => n.isRead).length}</span>
            </button>
          </div>

          <div className="search-notifications">
            <MagnifyingGlassIcon className="search-icon-notif" />
            <input
              type="text"
              placeholder="Tìm kiếm thông báo..."
              className="search-input-notif"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="notifications-content">
          {filteredNotifications.length > 0 ? (
            <div className="notifications-grid">
              {filteredNotifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`notification-card-modern ${!notification.isRead ? 'unread' : ''} priority-${notification.priority}`}
                    onClick={() => !notification.isRead && markAsRead(notification.id)}
                  >
                    {!notification.isRead && <div className="unread-indicator"></div>}
                    
                    <div className="notification-icon-container" style={{ background: `${notification.color}15` }}>
                      <Icon className="notification-icon-modern" style={{ color: notification.color }} />
                    </div>

                    <div className="notification-content-modern">
                      <div className="notification-header-modern">
                        <h3 className="notification-title-modern">{notification.title}</h3>
                        <span className={`priority-indicator priority-${notification.priority}`}>
                          {notification.priority === 'high' && 'Quan trọng'}
                          {notification.priority === 'medium' && 'Bình thường'}
                          {notification.priority === 'low' && 'Thấp'}
                        </span>
                      </div>

                      <p className="notification-message-modern">{notification.message}</p>

                      <div className="notification-meta-modern">
                        <div className="meta-left">
                          <span className="notification-from-modern">{notification.from}</span>
                          <span className="meta-dot">•</span>
                          <span className="notification-student-modern">Con: {notification.student}</span>
                        </div>
                        <span className="notification-time-modern">{notification.time}</span>
                      </div>
                    </div>

                    <button
                      className="delete-notification-btn-modern"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Xóa thông báo"
                    >
                      <TrashIcon className="delete-icon-modern" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-notifications-modern">
              <div className="empty-icon-container-notif">
                <BellIcon className="empty-icon-notif" />
              </div>
              <h3 className="empty-title-notif">Không có thông báo nào</h3>
              <p className="empty-description-notif">
                {filter === 'unread' && 'Bạn đã đọc hết tất cả thông báo'}
                {filter === 'read' && 'Chưa có thông báo nào được đọc'}
                {filter === 'all' && searchQuery && 'Không tìm thấy thông báo phù hợp'}
                {filter === 'all' && !searchQuery && 'Bạn chưa có thông báo nào'}
              </p>
              {searchQuery && (
                <button 
                  className="empty-action-btn-notif"
                  onClick={() => setSearchQuery('')}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Export Modal - Chọn loại file */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Xuất danh sách thông báo"
        size="medium"
      >
        <div className="modal-content-custom">
          <p className="export-modal-subtitle">Chọn định dạng để xuất danh sách thông báo của bạn</p>
          
          <div className="export-options-grid-horizontal">
            <button 
              className="export-option-card pdf-option"
              onClick={() => handleExportTypeSelect('pdf')}
            >
              <div className="export-option-icon-wrapper pdf">
                <DocumentTextIcon className="export-option-icon" />
              </div>
              <h3 className="export-option-title">Tải báo cáo PDF</h3>
              <p className="export-option-description">Định dạng PDF, dễ in ấn và chia sẻ</p>
            </button>

            <button 
              className="export-option-card excel-option"
              onClick={() => handleExportTypeSelect('excel')}
            >
              <div className="export-option-icon-wrapper excel">
                <DocumentChartBarIcon className="export-option-icon" />
              </div>
              <h3 className="export-option-title">Xuất dữ liệu Excel</h3>
              <p className="export-option-description">Định dạng Excel, dễ phân tích dữ liệu</p>
            </button>
          </div>

          <div className="export-info-box">
            <InformationCircleIcon className="export-info-icon" />
            <div className="export-info-content">
              <h4 className="export-info-title">Danh sách bao gồm:</h4>
              <ul className="export-info-list">
                <li>✓ Tiêu đề và nội dung thông báo</li>
                <li>✓ Điểm danh và tham gia lớp học</li>
                <li>✓ Người gửi và thời gian</li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>

      {/* Export Detail Modal - Chi tiết tùy chọn */}
      <Modal 
        isOpen={showExportDetailModal} 
        onClose={() => {
          setShowExportDetailModal(false);
          setSelectedExportType(null);
        }}
        title={`Xuất ${selectedExportType === 'pdf' ? 'PDF' : 'Excel'} - Tùy chọn nội dung`}
        size="medium"
      >
        <div className="modal-content-custom">
          <p className="export-modal-subtitle">Chọn các thông tin bạn muốn xuất</p>
          
          <div className="export-options-checklist">
            <div 
              className={`export-checkbox-item ${exportOptions.title ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('title')}
            >
              <div className="export-checkbox">
                {exportOptions.title && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Tiêu đề thông báo</span>
                <span className="export-checkbox-desc">Bao gồm tiêu đề của các thông báo</span>
              </div>
            </div>

            <div 
              className={`export-checkbox-item ${exportOptions.content ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('content')}
            >
              <div className="export-checkbox">
                {exportOptions.content && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Nội dung thông báo</span>
                <span className="export-checkbox-desc">Nội dung chi tiết của thông báo</span>
              </div>
            </div>

            <div 
              className={`export-checkbox-item ${exportOptions.marks ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('marks')}
            >
              <div className="export-checkbox">
                {exportOptions.marks && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Điểm danh</span>
                <span className="export-checkbox-desc">Thông tin điểm danh của học sinh</span>
              </div>
            </div>

            <div 
              className={`export-checkbox-item ${exportOptions.attendance ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('attendance')}
            >
              <div className="export-checkbox">
                {exportOptions.attendance && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Tham gia lớp học</span>
                <span className="export-checkbox-desc">Thông tin tham gia các lớp học</span>
              </div>
            </div>

            <div 
              className={`export-checkbox-item ${exportOptions.sender ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('sender')}
            >
              <div className="export-checkbox">
                {exportOptions.sender && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Người gửi</span>
                <span className="export-checkbox-desc">Tên giáo viên hoặc người gửi thông báo</span>
              </div>
            </div>

            <div 
              className={`export-checkbox-item ${exportOptions.time ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('time')}
            >
              <div className="export-checkbox">
                {exportOptions.time && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Thời gian</span>
                <span className="export-checkbox-desc">Ngày giờ gửi thông báo</span>
              </div>
            </div>
          </div>

          <div className="export-summary-box">
            <InformationCircleIcon className="export-info-icon" />
            <div className="export-summary-content">
              <span className="export-summary-text">
                Đã chọn {Object.values(exportOptions).filter(v => v).length}/6 tùy chọn
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              className="modal-btn-secondary" 
              onClick={() => {
                setShowExportDetailModal(false);
                setShowExportModal(true);
                setSelectedExportType(null);
              }}
            >
              <ChevronRightIcon className="btn-icon-back" style={{ transform: 'rotate(180deg)' }} />
              Quay lại
            </button>
            <button 
              className="modal-btn-primary"
              onClick={handleExportConfirm}
            >
              <ArrowDownTrayIcon className="btn-icon-modal" />
              Xuất {selectedExportType === 'pdf' ? 'PDF' : 'Excel'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default NotificationsPage;

