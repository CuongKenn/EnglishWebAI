import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCircle, AlertCircle, Info, Award, BookOpen, 
  Calendar, Trash2, Check, ArrowLeft, ChevronRight, Filter,
  Search, Download, FileText, FileSpreadsheet
} from 'lucide-react';
import Navbar from '../../../components/Navbar/Navbar';
import Modal from '../ParentDashboardV2/components/Modal';
import authService from '../../../services/authService';
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

  const handleExportConfirm = () => {
    console.log('Xuất file thông báo:', selectedExportType, exportOptions);
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
  };

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
        student: 'Nguyễn Văn A',
        priority: 'high'
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
        student: 'Nguyễn Văn A',
        priority: 'medium'
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
        student: 'Nguyễn Văn A',
        priority: 'low'
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
        student: 'Nguyễn Văn A',
        priority: 'high'
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
        student: 'Nguyễn Văn A',
        priority: 'medium'
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
        student: 'Nguyễn Văn A',
        priority: 'medium'
      }
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
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
              <ArrowLeft className="back-icon" />
              Home
            </span>
            <ChevronRight className="breadcrumb-separator" />
            <span className="breadcrumb-current">Thông báo</span>
          </div>

          <div className="page-title-section-notif">
            <div className="page-title-left-notif">
              <div className="page-icon-wrapper-notif">
                <Bell className="page-icon-notif" />
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
                  <Check className="btn-icon-notif" />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
              <button className="action-btn-primary-notif" onClick={() => setShowExportModal(true)}>
                <Download className="btn-icon-notif" />
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
            <Search className="search-icon-notif" />
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
                      <Trash2 className="delete-icon-modern" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-notifications-modern">
              <div className="empty-icon-container-notif">
                <Bell className="empty-icon-notif" />
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
                <FileText className="export-option-icon" />
              </div>
              <h3 className="export-option-title">Tải báo cáo PDF</h3>
              <p className="export-option-description">Định dạng PDF, dễ in ấn và chia sẻ</p>
            </button>

            <button 
              className="export-option-card excel-option"
              onClick={() => handleExportTypeSelect('excel')}
            >
              <div className="export-option-icon-wrapper excel">
                <FileSpreadsheet className="export-option-icon" />
              </div>
              <h3 className="export-option-title">Xuất dữ liệu Excel</h3>
              <p className="export-option-description">Định dạng Excel, dễ phân tích dữ liệu</p>
            </button>
          </div>

          <div className="export-info-box">
            <Info className="export-info-icon" />
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
                {exportOptions.title && <CheckCircle className="check-icon" />}
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
                {exportOptions.content && <CheckCircle className="check-icon" />}
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
                {exportOptions.marks && <CheckCircle className="check-icon" />}
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
                {exportOptions.attendance && <CheckCircle className="check-icon" />}
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
                {exportOptions.sender && <CheckCircle className="check-icon" />}
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
                {exportOptions.time && <CheckCircle className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Thời gian</span>
                <span className="export-checkbox-desc">Ngày giờ gửi thông báo</span>
              </div>
            </div>
          </div>

          <div className="export-summary-box">
            <Info className="export-info-icon" />
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
              <ChevronRight className="btn-icon-back" style={{ transform: 'rotate(180deg)' }} />
              Quay lại
            </button>
            <button 
              className="modal-btn-primary"
              onClick={handleExportConfirm}
            >
              <Download className="btn-icon-modal" />
              Xuất {selectedExportType === 'pdf' ? 'PDF' : 'Excel'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default NotificationsPage;

