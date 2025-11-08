import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parentAPI } from '../../../../services/parentService';
import { 
  BookOpenIcon, ArrowTrendingUpIcon, TrophyIcon, CalendarIcon, ClockIcon, UserGroupIcon,
  BellIcon, ChatBubbleLeftRightIcon, ChevronRightIcon, ChartBarIcon, StarIcon, ChartPieIcon,
  CurrencyDollarIcon, DocumentTextIcon, AcademicCapIcon, BoltIcon, ArrowTrendingDownIcon,
  CheckCircleIcon, ExclamationTriangleIcon, BookmarkIcon, CalendarDaysIcon, CreditCardIcon,
  CreditCardIcon as WalletIcon, InformationCircleIcon, UserPlusIcon, EyeIcon, DocumentChartBarIcon, ArrowDownTrayIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import Modal from './Modal';
import './Dashboard.css';
import Toast from '../../../../components/Toast/Toast';
import useToast from '../../../../hooks/useToast';

const Dashboard = () => {
  // onNavigate prop removed - not used in component
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState(null);
  const [showPendingExercisesModal, setShowPendingExercisesModal] = useState(false);
  const [showReportDetailModal, setShowReportDetailModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [pendingExercises, setPendingExercises] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    title: true,
    content: true,
    marks: true,
    attendance: true,
    sender: true,
    time: true
  });
  
  // Form states for adding child
  const [studentEmail, setStudentEmail] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    loadDashboardSummary();
  }, []);

  const loadDashboardSummary = async () => {
    try {
      setLoading(true);
      
      // Load children and summary data in parallel
      const [childrenData, summaryData] = await Promise.all([
        parentAPI.getChildren(),
        parentAPI.getDashboardSummary()
      ]);
      
      const transformedChildren = childrenData.map(child => ({
        id: child.id,
        name: child.name,
        grade: child.grade || 'N/A',
        avatar: child.avatar_url || child.name?.charAt(0)?.toUpperCase() || 'S',
        averageScore: child.average_score || 'N/A',
        totalClasses: child.total_classes || 0,
        attendance: child.attendance || 95,
        recentActivity: child.recent_activity || 'Hoàn thành bài tập Writing'
      }));
      
      setChildren(transformedChildren);
      
      // Use real data from API
      const summary = {
        totalChildren: summaryData.total_children || 0,
        totalClasses: summaryData.total_classes || 0,
        avgScore: summaryData.avg_score || 0,
        notifications: summaryData.notifications_count || 0,
        messages: summaryData.messages_count || 0,
        completedExercises: summaryData.completed_exercises || 0,
        totalExercises: summaryData.total_exercises || 0,
        pendingExercises: summaryData.pending_exercises || 0,
        reportsAvailable: 1, // Can be updated if needed
        avgProgress: summaryData.avg_progress || 0
      };
      
      setSummaryData(summary);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setChildren([]);
      // Set default values on error
      setSummaryData({
        totalChildren: 0,
        totalClasses: 0,
        avgScore: 0,
        notifications: 0,
        messages: 0,
        completedExercises: 0,
        totalExercises: 0,
        pendingExercises: 0,
        reportsAvailable: 0,
        avgProgress: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Hàm đóng tất cả modal
  const closeAllModals = () => {
    setShowReportModal(false);
    setShowReportDetailModal(false);
    setShowPendingExercisesModal(false);
    setShowAddChildModal(false);
    setShowExportModal(false);
    setSelectedExportType(null);
  };

  const handleExportTypeSelect = (type) => {
    setSelectedExportType(type);
    // Đóng tất cả modal khác trước
    closeAllModals();
    // Mở modal mới
    setShowExportModal(true);
  };

  const handleExportOptionToggle = (option) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const loadPendingExercises = async () => {
    try {
      const exercises = await parentAPI.getPendingExercises();
      setPendingExercises(exercises || []);
    } catch (error) {
      console.error('Error loading pending exercises:', error);
      setPendingExercises([]);
    }
  };

  const loadMonthlyReport = async (month, timeRange) => {
    try {
      setReportLoading(true);
      const year = new Date().getFullYear();
      const report = await parentAPI.getMonthlyReport(month, year, timeRange);
      setMonthlyReport(report);
    } catch (error) {
      console.error('Error loading monthly report:', error);
      setMonthlyReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportConfirm = async () => {
    if (!selectedExportType) {
      alert('Vui lòng chọn định dạng xuất báo cáo');
      return;
    }

    try {
      const year = new Date().getFullYear();
      const month = parseInt(selectedMonth) || new Date().getMonth() + 1;
      
      let blob;
      let filename;
      
      if (selectedExportType === 'pdf') {
        blob = await parentAPI.exportMonthlyReportPDF(month, year, selectedTimeRange, exportOptions);
        filename = `bao_cao_${selectedTimeRange}_${month}_${year}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;
      } else if (selectedExportType === 'excel') {
        blob = await parentAPI.exportMonthlyReportExcel(month, year, selectedTimeRange, exportOptions);
        filename = `bao_cao_${selectedTimeRange}_${month}_${year}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
      }
      
      if (blob) {
        // Create download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        alert('Xuất báo cáo thành công!');
      }
      
      setShowExportModal(false);
      setSelectedExportType(null);
      // Reset về mặc định
      setExportOptions({
        title: true,
        content: true,
        marks: true,
        attendance: true,
        sender: true,
        time: true
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại.');
    }
  };
  
  // Handle add child submission
  const handleAddChild = async (e) => {
    e.preventDefault();
    
    if (!studentEmail || !studentEmail.trim()) {
      showWarning('Vui lòng nhập email học sinh!');
      return;
    }
    
    try {
      setLinkLoading(true);
      const result = await parentAPI.linkStudent(studentEmail);
      
      showSuccess(`${result.message}\n\nEmail: ${result.student_email}\n\nHọc sinh cần xác nhận yêu cầu liên kết trong tài khoản của mình.`);
      
      setShowAddChildModal(false);
      setStudentEmail('');
      
      // Reload children list
      await loadDashboardSummary();
    } catch (error) {
      console.error('Error linking student:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Không thể gửi yêu cầu liên kết';
      showError(errorMsg);
    } finally {
      setLinkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="parent-dashboard-overview">
      {/* Welcome Header */}
      <div className="welcome-section-modern">
        <div className="welcome-content-modern">
          <h1 className="welcome-title-modern">Chào mừng trở lại, Phụ huynh! 👋</h1>
          <p className="welcome-subtitle-modern">Theo dõi và quản lý quá trình học tập của con em bạn</p>
        </div>
        <div className="current-date-card">
          <CalendarIcon className="date-icon-card" />
          <div className="date-info-card">
            <span className="date-day-card">{new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}</span>
            <span className="date-full-card">{new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Thông tin quan trọng - Dành cho dự án Smart Learn */}
      <div className="important-info-grid">
        <div className="info-card progress-card">
          <div className="info-card-header">
            <div className="info-icon-wrapper progress">
              <ArrowTrendingUpIcon className="info-icon" />
            </div>
            <span className="info-badge success">{summaryData?.avgProgress}% hoàn thành</span>
          </div>
          <div className="info-card-body">
            <p className="info-label">Tiến độ học tập</p>
            <h3 className="info-value">{summaryData?.completedExercises}/{summaryData?.totalExercises} bài</h3>
            <div className="info-footer">
              <ChartPieIcon className="footer-icon" />
              <span className="footer-text">Con em đang học tốt</span>
            </div>
          </div>
          <button className="info-action-btn" onClick={() => navigate('/track-progress')}>
            <ArrowTrendingUpIcon className="btn-icon-left" />
            Xem chi tiết
            <ChevronRightIcon className="btn-arrow-small" />
          </button>
        </div>

        <div className="info-card pending-card">
          <div className="info-card-header">
            <div className="info-icon-wrapper pending">
              <BookmarkIcon className="info-icon" />
            </div>
            <span className="info-badge warning">{summaryData?.pendingExercises} bài</span>
          </div>
          <div className="info-card-body">
            <p className="info-label">Bài tập chưa hoàn thành</p>
            <h3 className="info-value">Cần làm thêm</h3>
            <div className="info-footer">
              <ClockIcon className="footer-icon" />
              <span className="footer-text">Nhắc nhở con em hoàn thành</span>
            </div>
          </div>
          <button className="info-action-btn" onClick={async () => {
            closeAllModals();
            await loadPendingExercises();
            setShowPendingExercisesModal(true);
          }}>
            <EyeIcon className="btn-icon-left" />
            Xem danh sách
            <ChevronRightIcon className="btn-arrow-small" />
          </button>
        </div>

        <div className="info-card report-card">
          <div className="info-card-header">
            <div className="info-icon-wrapper report">
              <DocumentTextIcon className="info-icon" />
            </div>
            <span className="info-badge new">{summaryData?.reportsAvailable} mới</span>
          </div>
          <div className="info-card-body">
            <p className="info-label">Báo cáo học tập</p>
            <h3 className="info-value">Báo cáo tháng 10</h3>
            <div className="info-footer">
              <ChartBarIcon className="footer-icon" />
              <span className="footer-text">Kết quả xuất sắc</span>
            </div>
          </div>
          <button className="info-action-btn" onClick={async () => {
            closeAllModals();
            await loadMonthlyReport(parseInt(selectedMonth), selectedTimeRange);
            setShowReportDetailModal(true);
          }}>
            <DocumentTextIcon className="btn-icon-left" />
            Xem báo cáo
            <ChevronRightIcon className="btn-arrow-small" />
          </button>
        </div>
      </div>

      {/* Summary Stats - Compact */}
      <div className="summary-stats-compact">
        <div className="stat-compact stat-children">
          <UserGroupIcon className="stat-compact-icon" />
          <div className="stat-compact-info">
            <h3 className="stat-compact-value">{summaryData?.totalChildren || 0}</h3>
            <p className="stat-compact-label">Con em</p>
          </div>
        </div>

        <div className="stat-compact stat-classes">
          <BookOpenIcon className="stat-compact-icon" />
          <div className="stat-compact-info">
            <h3 className="stat-compact-value">{summaryData?.totalClasses || 0}</h3>
            <p className="stat-compact-label">Lớp học</p>
          </div>
        </div>

        <div className="stat-compact stat-score">
          <TrophyIcon className="stat-compact-icon" />
          <div className="stat-compact-info">
            <h3 className="stat-compact-value">{summaryData?.avgScore || 'N/A'}</h3>
            <p className="stat-compact-label">Điểm TB</p>
          </div>
        </div>

        <div className="stat-compact stat-notifications">
          <BellIcon className="stat-compact-icon" />
          <div className="stat-compact-info">
            <h3 className="stat-compact-value">{summaryData?.notifications || 0}</h3>
            <p className="stat-compact-label">Thông báo</p>
          </div>
        </div>

        <div className="stat-compact stat-messages">
          <ChatBubbleLeftRightIcon className="stat-compact-icon" />
          <div className="stat-compact-info">
            <h3 className="stat-compact-value">{summaryData?.messages || 0}</h3>
            <p className="stat-compact-label">Tin nhắn</p>
          </div>
        </div>
      </div>

      {/* Children Overview - Beautiful Cards */}
      {children.length > 0 ? (
        <div className="children-section-modern">
          <div className="section-header-dashboard">
            <div className="section-header-left-dash">
              <AcademicCapIcon className="section-icon-dash" />
              <div>
                <h2 className="section-title-dash">Con em của bạn</h2>
                <p className="section-subtitle-dash">Theo dõi từng con một cách chi tiết</p>
              </div>
            </div>
            <button className="section-action-btn" onClick={() => navigate('/track-progress')}>
              <UserGroupIcon className="btn-icon-left" />
              Xem tất cả
              <ChevronRightIcon className="btn-arrow-section" />
            </button>
          </div>

          <div className="children-cards-grid">
            {children.map((child) => (
              <div key={child.id} className="child-card-premium">
                <div className="child-card-top">
                  <div className="child-avatar-premium">{child.avatar}</div>
                  <div className="child-badge-premium">
                    <StarIcon className="badge-star" />
                    <span>Học sinh giỏi</span>
                  </div>
                </div>
                
                <div className="child-card-middle">
                  <h3 className="child-name-premium">{child.name}</h3>
                  <p className="child-grade-premium">{child.grade}</p>
                  
                  <div className="child-quick-stats">
                    <div className="quick-stat">
                      <div className="quick-stat-header">
                        <BookOpenIcon className="quick-stat-icon" />
                        <span className="quick-stat-label">Lớp học</span>
                      </div>
                      <span className="quick-stat-value">{child.totalClasses}</span>
                    </div>
                    
                    <div className="quick-stat">
                      <div className="quick-stat-header">
                        <TrophyIcon className="quick-stat-icon" />
                        <span className="quick-stat-label">Điểm TB</span>
                      </div>
                      <span className="quick-stat-value">{child.averageScore}</span>
                    </div>
                    
                    <div className="quick-stat">
                      <div className="quick-stat-header">
                        <CheckCircleIcon className="quick-stat-icon" />
                        <span className="quick-stat-label">Chuyên cần</span>
                      </div>
                      <span className="quick-stat-value">{child.attendance}%</span>
                    </div>
                  </div>
                  
                  <div className="child-recent-activity">
                    <BoltIcon className="activity-icon-small" />
                    <span className="activity-text">{child.recentActivity}</span>
                    </div>
                  </div>
                  
                  <button 
                  className="view-details-btn-premium"
                  onClick={() => navigate('/track-progress')}
                  >
                  <EyeIcon className="btn-icon-left" />
                    Xem chi tiết
                  <ChevronRightIcon className="btn-arrow-detail" />
                  </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-children-modern">
          <div className="empty-icon-wrapper">
            <UserGroupIcon className="empty-icon-users" />
          </div>
          <h3 className="empty-title-children">Chưa có con em nào</h3>
          <p className="empty-description-children">Hãy liên kết tài khoản con em để theo dõi tiến độ học tập</p>
          <button className="add-child-btn" onClick={() => {
            closeAllModals();
            setShowAddChildModal(true);
          }}>
            <UserPlusIcon className="btn-icon-left" />
            Thêm con em
          </button>
        </div>
      )}

      {/* Modals */}
      <Modal 
        isOpen={showReportModal} 
        onClose={() => closeAllModals()}
        title="Xuất báo cáo học tập"
        size="medium"
        zIndex={1000}
      >
        <div className="modal-content-custom">
          <p className="export-modal-subtitle">Chọn định dạng để xuất báo cáo học tập của con em</p>
          
          <div className="export-options-grid">
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

      <Modal 
        isOpen={showAddChildModal} 
        onClose={() => {
          closeAllModals();
          setStudentEmail('');
        }}
        title="Thêm con em"
        size="medium"
      >
        <div className="modal-content-custom">
          <form className="add-child-form" onSubmit={handleAddChild}>
            <div className="form-group">
              <label className="form-label">Email học sinh *</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="student@example.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
                disabled={linkLoading}
              />
              <small className="form-helper-text">
                Nhập chính xác email mà học sinh đã đăng ký
              </small>
            </div>
            
            <div className="form-info">
              <InformationCircleIcon className="info-icon-small" />
              <div>
                <p><strong>Lưu ý:</strong></p>
                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>Học sinh cần xác nhận yêu cầu liên kết trong tài khoản của mình</li>
                  <li>Sau khi xác nhận, bạn sẽ có thể theo dõi tiến độ học tập</li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button"
                className="modal-btn-secondary" 
                onClick={() => {
                  setShowAddChildModal(false);
                  setStudentEmail('');
                }}
                disabled={linkLoading}
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="modal-btn-primary"
                disabled={linkLoading}
              >
                {linkLoading ? (
                  <>
                    <div className="spinner-small"></div>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-4.5 h-4.5" />
                    Gửi yêu cầu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Export Options Detail Modal */}
      <Modal 
        isOpen={showExportModal} 
        onClose={() => closeAllModals()}
        title={`Xuất ${selectedExportType === 'pdf' ? 'PDF' : 'Excel'} - Tùy chọn nội dung báo cáo`}
        size="medium"
        zIndex={1001}
      >
        <div className="modal-content-custom">
          <p className="export-modal-subtitle">Chọn các thông tin bạn muốn xuất trong báo cáo học tập</p>
          
          <div className="export-options-checklist">
            <div 
              className={`export-checkbox-item ${exportOptions.title ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('title')}
            >
              <div className="export-checkbox">
                {exportOptions.title && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Điểm số các môn học</span>
                <span className="export-checkbox-desc">Bao gồm điểm số chi tiết từng môn</span>
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
                <span className="export-checkbox-label">Nhận xét của giáo viên</span>
                <span className="export-checkbox-desc">Nhận xét chi tiết từ giáo viên</span>
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
                <span className="export-checkbox-label">Tiến độ học tập</span>
                <span className="export-checkbox-desc">Thống kê bài tập hoàn thành</span>
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
                <span className="export-checkbox-label">Chuyên cần</span>
                <span className="export-checkbox-desc">Thông tin tham gia lớp học</span>
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
                <span className="export-checkbox-label">Thông tin giáo viên</span>
                <span className="export-checkbox-desc">Tên giáo viên chủ nhiệm và bộ môn</span>
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
                <span className="export-checkbox-label">Khoảng thời gian</span>
                <span className="export-checkbox-desc">Thời gian báo cáo được tạo</span>
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
                setShowExportModal(false);
                setShowReportModal(true);
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

      {/* Modal Bài tập chưa hoàn thành */}
      <Modal 
        isOpen={showPendingExercisesModal} 
        onClose={() => setShowPendingExercisesModal(false)}
        title="Bài tập chưa hoàn thành"
        size="large"
      >
        <div className="modal-content-custom">
          <p className="export-modal-subtitle">
            Danh sách các bài tập mà con em bạn chưa hoàn thành
          </p>
          
          <div className="pending-exercises-list">
            {pendingExercises.length > 0 ? (
              pendingExercises.map((exercise, index) => (
                <div key={exercise.exercise_id || index} className="pending-exercise-item">
                  <div className="pending-exercise-header">
                    <div className="pending-exercise-info">
                      <BookOpenIcon className="pending-exercise-icon" />
                      <div>
                        <h4 className="pending-exercise-title">{exercise.title}</h4>
                        <p className="pending-exercise-meta">
                          {exercise.class_name ? `Lớp: ${exercise.class_name} • ` : ''}
                          Môn: {exercise.skill_type ? exercise.skill_type.charAt(0).toUpperCase() + exercise.skill_type.slice(1) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className={`pending-exercise-badge ${exercise.priority}`}>
                      {exercise.due_date ? `Hạn nộp: ${new Date(exercise.due_date).toLocaleDateString('vi-VN')}` : 'Chưa có hạn'}
                      {exercise.days_until_due !== null && exercise.days_until_due >= 0 && (
                        <span> ({exercise.days_until_due} ngày)</span>
                      )}
                    </span>
                  </div>
                  <div className="pending-exercise-body">
                    <p className="pending-exercise-desc">{exercise.title}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-pending-exercises">
                <BookOpenIcon className="empty-icon" />
                <p>Không có bài tập chưa hoàn thành</p>
                <span>Tất cả bài tập đã được hoàn thành!</span>
              </div>
            )}
          </div>

          <div className="export-info-box">
            <InformationCircleIcon className="export-info-icon" />
            <div className="export-info-content">
              <h4 className="export-info-title">Lưu ý:</h4>
              <ul className="export-info-list">
                <li>Nhắc nhở con em hoàn thành bài tập trước hạn nộp</li>
                <li>Bài tập quá hạn sẽ bị trừ điểm</li>
                <li>Liên hệ giáo viên nếu cần hỗ trợ</li>
              </ul>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn-secondary" onClick={() => setShowPendingExercisesModal(false)}>
              <XMarkIcon className="btn-icon-modal" />
              Đóng
            </button>
            <button className="modal-btn-primary" onClick={() => navigate('/track-progress')}>
              <EyeIcon className="btn-icon-modal" />
              Xem chi tiết tiến độ
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Chi tiết Báo cáo học tập */}
      <Modal 
        isOpen={showReportDetailModal} 
        onClose={() => setShowReportDetailModal(false)}
        title={`Báo cáo học tập - ${selectedTimeRange === 'month' ? `Tháng ${selectedMonth}/2025` : selectedTimeRange === 'quarter' ? 'Học kỳ I/2025' : 'Cả năm học 2025'}`}
        size="large"
        zIndex={1001}
      >
        <div className="modal-content-custom">
          <p className="export-modal-subtitle">
            Tổng hợp kết quả học tập và đánh giá của giáo viên
          </p>
          
          {/* Time Range Selection */}
          <div className="time-range-selection">
            <h3 className="time-range-title">Chọn khoảng thời gian báo cáo:</h3>
            <div className="time-range-options">
              <div className="time-range-group">
                <label className="time-range-label">
                  <input 
                    type="radio" 
                    name="timeRange" 
                    value="month" 
                    checked={selectedTimeRange === 'month'}
                    onChange={async (e) => {
                      setSelectedTimeRange(e.target.value);
                      await loadMonthlyReport(parseInt(selectedMonth), e.target.value);
                    }}
                  />
                  <span className="radio-custom"></span>
                  Theo tháng
                </label>
                {selectedTimeRange === 'month' && (
                  <select 
                    className="month-selector"
                    value={selectedMonth}
                    onChange={async (e) => {
                      setSelectedMonth(e.target.value);
                      await loadMonthlyReport(parseInt(e.target.value), selectedTimeRange);
                    }}
                  >
                    <option value="9">Tháng 9</option>
                    <option value="10">Tháng 10</option>
                    <option value="11">Tháng 11</option>
                    <option value="12">Tháng 12</option>
                    <option value="1">Tháng 1</option>
                    <option value="2">Tháng 2</option>
                    <option value="3">Tháng 3</option>
                    <option value="4">Tháng 4</option>
                    <option value="5">Tháng 5</option>
                    <option value="6">Tháng 6</option>
                  </select>
                )}
              </div>
              
              <div className="time-range-group">
                <label className="time-range-label">
                  <input 
                    type="radio" 
                    name="timeRange" 
                    value="quarter" 
                    checked={selectedTimeRange === 'quarter'}
                    onChange={async (e) => {
                      setSelectedTimeRange(e.target.value);
                      await loadMonthlyReport(parseInt(selectedMonth), e.target.value);
                    }}
                  />
                  <span className="radio-custom"></span>
                  Học kỳ I
                </label>
              </div>
              
              <div className="time-range-group">
                <label className="time-range-label">
                  <input 
                    type="radio" 
                    name="timeRange" 
                    value="year" 
                    checked={selectedTimeRange === 'year'}
                    onChange={async (e) => {
                      setSelectedTimeRange(e.target.value);
                      await loadMonthlyReport(parseInt(selectedMonth), e.target.value);
                    }}
                  />
                  <span className="radio-custom"></span>
                  Cả năm học
                </label>
              </div>
            </div>
          </div>
          
          {reportLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner"></div>
              <p>Đang tải báo cáo...</p>
            </div>
          ) : monthlyReport ? (
            <>
              <div className="report-summary-stats">
                <div className="report-stat-card excellent">
                  <TrophyIcon className="report-stat-icon" />
                  <div className="report-stat-info">
                    <h4 className="report-stat-value">{monthlyReport.overall_average}/10</h4>
                    <p className="report-stat-label">Điểm trung bình</p>
                  </div>
                </div>

                <div className="report-stat-card good">
                  <CheckCircleIcon className="report-stat-icon" />
                  <div className="report-stat-info">
                    <h4 className="report-stat-value">{monthlyReport.total_completed}/{monthlyReport.total_exercises}</h4>
                    <p className="report-stat-label">Bài tập hoàn thành</p>
                  </div>
                </div>

                <div className="report-stat-card normal">
                  <ArrowTrendingUpIcon className="report-stat-icon" />
                  <div className="report-stat-info">
                    <h4 className="report-stat-value">{monthlyReport.attendance_rate}%</h4>
                    <p className="report-stat-label">Chuyên cần</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Không có dữ liệu báo cáo</p>
            </div>
          )}

          {monthlyReport && monthlyReport.subjects && monthlyReport.subjects.length > 0 ? (
            <div className="report-subjects-list">
              <h3 className="report-section-title">Điểm theo môn học</h3>
              
              {monthlyReport.subjects.map((subject, index) => {
                const scoreClass = subject.average_score >= 8.5 ? 'excellent' : 
                                   subject.average_score >= 7.0 ? 'good' : 
                                   subject.average_score >= 5.0 ? 'normal' : 'poor';
                const iconClass = subject.subject.toLowerCase();
                
                return (
                  <div key={index} className="report-subject-item">
                    <div className="report-subject-header">
                      <div className="report-subject-info">
                        <div className={`report-subject-icon-wrapper ${iconClass}`}>
                          <BookOpenIcon className="report-subject-icon" />
                        </div>
                        <div>
                          <h4 className="report-subject-name">{subject.subject}</h4>
                          <p className="report-subject-meta">
                            {subject.total_exercises} bài tập • {subject.completed_exercises} hoàn thành
                          </p>
                        </div>
                      </div>
                      <span className={`report-subject-score ${scoreClass}`}>
                        {subject.average_score > 0 ? subject.average_score.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                    {subject.teacher_comment && (
                      <p className="report-teacher-comment">
                        <ChatBubbleLeftRightIcon className="comment-icon" />
                        {subject.teacher_comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Chưa có dữ liệu môn học</p>
            </div>
          )}

          {monthlyReport && monthlyReport.general_comment && (
            <div className="export-info-box">
              <InformationCircleIcon className="export-info-icon" />
              <div className="export-info-content">
                <h4 className="export-info-title">Nhận xét chung của giáo viên:</h4>
                <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: '0.5rem 0 0 0', lineHeight: '1.6' }}>
                  {monthlyReport.general_comment}
                </p>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button className="modal-btn-secondary" onClick={() => closeAllModals()}>
              <XMarkIcon className="btn-icon-modal" />
              Đóng
            </button>
            <button className="modal-btn-primary" onClick={async () => {
              closeAllModals();
              setShowReportModal(true);
            }}>
              <ArrowDownTrayIcon className="btn-icon-modal" />
              Xuất báo cáo
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Access Section */}
      <div className="quick-access-section-modern">
        <div className="section-header-dashboard">
          <div className="section-header-left-dash">
            <ChartPieIcon className="section-icon-dash" />
            <div>
              <h2 className="section-title-dash">Truy cập nhanh</h2>
              <p className="section-subtitle-dash">Các tính năng thường dùng</p>
            </div>
          </div>
        </div>
        
        <div className="quick-access-grid-modern">
          <button 
            className="quick-card progress-card"
            onClick={() => navigate('/track-progress')}
          >
            <div className="quick-card-icon-wrapper progress">
              <ArrowTrendingUpIcon className="quick-card-icon" />
            </div>
            <h3 className="quick-card-title">Theo dõi tiến độ</h3>
            <p className="quick-card-description">Xem chi tiết quá trình học tập</p>
            <ChevronRightIcon className="quick-card-arrow" />
          </button>

          <button 
            className="quick-card notifications-card"
            onClick={() => navigate('/notifications')}
          >
            <div className="quick-card-icon-wrapper notifications">
              <BellIcon className="quick-card-icon" />
            </div>
            <h3 className="quick-card-title">Thông báo</h3>
            <p className="quick-card-description">Cập nhật từ giáo viên</p>
              {summaryData?.notifications > 0 && (
              <span className="quick-card-badge">{summaryData.notifications}</span>
              )}
            <ChevronRightIcon className="quick-card-arrow" />
          </button>

          <button 
            className="quick-card messages-card"
            onClick={() => navigate('/teacher-communication')}
          >
            <div className="quick-card-icon-wrapper messages">
              <ChatBubbleLeftRightIcon className="quick-card-icon" />
            </div>
            <h3 className="quick-card-title">Trao đổi</h3>
            <p className="quick-card-description">Liên hệ với giáo viên</p>
              {summaryData?.messages > 0 && (
              <span className="quick-card-badge">{summaryData.messages}</span>
              )}
            <ChevronRightIcon className="quick-card-arrow" />
          </button>
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
    </div>
  );
};

export default Dashboard;
