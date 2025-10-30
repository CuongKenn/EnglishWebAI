import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parentAPI } from '../../../../services/parentService';
import { 
  BookOpen, TrendingUp, Award, Calendar, Clock, Users,
  Bell, MessageCircle, ChevronRight, BarChart3, Star, Target,
  DollarSign, FileText, GraduationCap, Activity, TrendingDown,
  CheckCircle, AlertTriangle, BookMarked, CalendarDays, Wallet,
  CreditCard, Info, UserPlus, Eye, FileSpreadsheet, Download, X
} from 'lucide-react';
import Modal from './Modal';
import './Dashboard.css';
import Toast from '../../../../components/Toast/Toast';
import useToast from '../../../../hooks/useToast';

const Dashboard = ({ onNavigate }) => {
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
  const [selectedMonth, setSelectedMonth] = useState('10');
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
      const childrenData = await parentAPI.getChildren();
      
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
      
      // Summary statistics cho dự án English AI
      const summary = {
        totalChildren: transformedChildren.length,
        totalClasses: transformedChildren.reduce((sum, child) => sum + child.totalClasses, 0),
        avgScore: transformedChildren.length > 0 
          ? (transformedChildren.reduce((sum, child) => sum + (parseFloat(child.averageScore) || 0), 0) / transformedChildren.length).toFixed(1)
          : 'N/A',
        notifications: 5,
        messages: 3,
        // Dữ liệu cho English AI
        completedExercises: 45,
        totalExercises: 60,
        pendingExercises: 5,
        reportsAvailable: 2,
        avgProgress: 75 // phần trăm tiến độ trung bình
      };
      
      setSummaryData(summary);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setChildren([]);
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

  const handleExportConfirm = () => {
    // Logic xuất file theo type và options
    console.log('Xuất file:', selectedExportType, exportOptions);
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
          <Calendar className="date-icon-card" />
          <div className="date-info-card">
            <span className="date-day-card">{new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}</span>
            <span className="date-full-card">{new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Thông tin quan trọng - Dành cho dự án English AI */}
      <div className="important-info-grid">
        <div className="info-card progress-card">
          <div className="info-card-header">
            <div className="info-icon-wrapper progress">
              <TrendingUp className="info-icon" />
            </div>
            <span className="info-badge success">{summaryData?.avgProgress}% hoàn thành</span>
          </div>
          <div className="info-card-body">
            <p className="info-label">Tiến độ học tập</p>
            <h3 className="info-value">{summaryData?.completedExercises}/{summaryData?.totalExercises} bài</h3>
            <div className="info-footer">
              <Target className="footer-icon" />
              <span className="footer-text">Con em đang học tốt</span>
            </div>
          </div>
          <button className="info-action-btn" onClick={() => navigate('/track-progress')}>
            <TrendingUp className="btn-icon-left" />
            Xem chi tiết
            <ChevronRight className="btn-arrow-small" />
          </button>
        </div>

        <div className="info-card pending-card">
          <div className="info-card-header">
            <div className="info-icon-wrapper pending">
              <BookMarked className="info-icon" />
            </div>
            <span className="info-badge warning">{summaryData?.pendingExercises} bài</span>
          </div>
          <div className="info-card-body">
            <p className="info-label">Bài tập chưa hoàn thành</p>
            <h3 className="info-value">Cần làm thêm</h3>
            <div className="info-footer">
              <Clock className="footer-icon" />
              <span className="footer-text">Nhắc nhở con em hoàn thành</span>
            </div>
          </div>
          <button className="info-action-btn" onClick={() => {
            closeAllModals();
            setShowPendingExercisesModal(true);
          }}>
            <Eye className="btn-icon-left" />
            Xem danh sách
            <ChevronRight className="btn-arrow-small" />
          </button>
        </div>

        <div className="info-card report-card">
          <div className="info-card-header">
            <div className="info-icon-wrapper report">
              <FileText className="info-icon" />
            </div>
            <span className="info-badge new">{summaryData?.reportsAvailable} mới</span>
          </div>
          <div className="info-card-body">
            <p className="info-label">Báo cáo học tập</p>
            <h3 className="info-value">Báo cáo tháng 10</h3>
            <div className="info-footer">
              <BarChart3 className="footer-icon" />
              <span className="footer-text">Kết quả xuất sắc</span>
            </div>
          </div>
          <button className="info-action-btn" onClick={() => {
            closeAllModals();
            setShowReportDetailModal(true);
          }}>
            <FileText className="btn-icon-left" />
            Xem báo cáo
            <ChevronRight className="btn-arrow-small" />
          </button>
        </div>
      </div>

      {/* Summary Stats - Compact */}
      <div className="summary-stats-compact">
        <div className="stat-compact stat-children">
          <Users className="stat-compact-icon" />
          <div className="stat-compact-info">
            <h3 className="stat-compact-value">{summaryData?.totalChildren || 0}</h3>
            <p className="stat-compact-label">Con em</p>
          </div>
        </div>

        <div className="stat-compact stat-classes">
          <BookOpen className="stat-compact-icon" />
          <div className="stat-compact-info">
            <h3 className="stat-compact-value">{summaryData?.totalClasses || 0}</h3>
            <p className="stat-compact-label">Lớp học</p>
          </div>
        </div>

        <div className="stat-compact stat-score">
          <Award className="stat-compact-icon" />
          <div className="stat-compact-info">
            <h3 className="stat-compact-value">{summaryData?.avgScore || 'N/A'}</h3>
            <p className="stat-compact-label">Điểm TB</p>
          </div>
        </div>

        <div className="stat-compact stat-notifications">
          <Bell className="stat-compact-icon" />
          <div className="stat-compact-info">
            <h3 className="stat-compact-value">{summaryData?.notifications || 0}</h3>
            <p className="stat-compact-label">Thông báo</p>
          </div>
        </div>

        <div className="stat-compact stat-messages">
          <MessageCircle className="stat-compact-icon" />
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
              <GraduationCap className="section-icon-dash" />
              <div>
                <h2 className="section-title-dash">Con em của bạn</h2>
                <p className="section-subtitle-dash">Theo dõi từng con một cách chi tiết</p>
              </div>
            </div>
            <button className="section-action-btn" onClick={() => navigate('/track-progress')}>
              <Users className="btn-icon-left" />
              Xem tất cả
              <ChevronRight className="btn-arrow-section" />
            </button>
          </div>

          <div className="children-cards-grid">
            {children.map((child) => (
              <div key={child.id} className="child-card-premium">
                <div className="child-card-top">
                  <div className="child-avatar-premium">{child.avatar}</div>
                  <div className="child-badge-premium">
                    <Star className="badge-star" />
                    <span>Học sinh giỏi</span>
                  </div>
                </div>
                
                <div className="child-card-middle">
                  <h3 className="child-name-premium">{child.name}</h3>
                  <p className="child-grade-premium">{child.grade}</p>
                  
                  <div className="child-quick-stats">
                    <div className="quick-stat">
                      <div className="quick-stat-header">
                        <BookOpen className="quick-stat-icon" />
                        <span className="quick-stat-label">Lớp học</span>
                      </div>
                      <span className="quick-stat-value">{child.totalClasses}</span>
                    </div>
                    
                    <div className="quick-stat">
                      <div className="quick-stat-header">
                        <Award className="quick-stat-icon" />
                        <span className="quick-stat-label">Điểm TB</span>
                      </div>
                      <span className="quick-stat-value">{child.averageScore}</span>
                    </div>
                    
                    <div className="quick-stat">
                      <div className="quick-stat-header">
                        <CheckCircle className="quick-stat-icon" />
                        <span className="quick-stat-label">Chuyên cần</span>
                      </div>
                      <span className="quick-stat-value">{child.attendance}%</span>
                    </div>
                  </div>
                  
                  <div className="child-recent-activity">
                    <Activity className="activity-icon-small" />
                    <span className="activity-text">{child.recentActivity}</span>
                    </div>
                  </div>
                  
                  <button 
                  className="view-details-btn-premium"
                  onClick={() => navigate('/track-progress')}
                  >
                  <Eye className="btn-icon-left" />
                    Xem chi tiết
                  <ChevronRight className="btn-arrow-detail" />
                  </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-children-modern">
          <div className="empty-icon-wrapper">
            <Users className="empty-icon-users" />
          </div>
          <h3 className="empty-title-children">Chưa có con em nào</h3>
          <p className="empty-description-children">Hãy liên kết tài khoản con em để theo dõi tiến độ học tập</p>
          <button className="add-child-btn" onClick={() => {
            closeAllModals();
            setShowAddChildModal(true);
          }}>
            <UserPlus className="btn-icon-left" />
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
              <Info className="info-icon-small" />
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
                    <UserPlus size={18} />
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
                {exportOptions.title && <CheckCircle className="check-icon" />}
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
                {exportOptions.content && <CheckCircle className="check-icon" />}
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
                {exportOptions.marks && <CheckCircle className="check-icon" />}
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
                {exportOptions.attendance && <CheckCircle className="check-icon" />}
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
                {exportOptions.sender && <CheckCircle className="check-icon" />}
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
                {exportOptions.time && <CheckCircle className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Khoảng thời gian</span>
                <span className="export-checkbox-desc">Thời gian báo cáo được tạo</span>
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
                setShowExportModal(false);
                setShowReportModal(true);
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
            {/* Sample data - Backend sẽ cung cấp data này */}
            <div className="pending-exercise-item">
              <div className="pending-exercise-header">
                <div className="pending-exercise-info">
                  <BookOpen className="pending-exercise-icon" />
                  <div>
                    <h4 className="pending-exercise-title">Bài tập Reading - Unit 5</h4>
                    <p className="pending-exercise-meta">Lớp: English A1 • Môn: Reading</p>
                  </div>
                </div>
                <span className="pending-exercise-badge urgent">Hạn nộp: 30/10</span>
              </div>
              <div className="pending-exercise-body">
                <p className="pending-exercise-desc">Hoàn thành bài đọc hiểu và trả lời câu hỏi</p>
                <div className="pending-exercise-student">
                  <Users className="student-icon" />
                  <span>Học sinh: {children[0]?.name || 'Chưa có'}</span>
                </div>
              </div>
            </div>

            <div className="pending-exercise-item">
              <div className="pending-exercise-header">
                <div className="pending-exercise-info">
                  <BookOpen className="pending-exercise-icon" />
                  <div>
                    <h4 className="pending-exercise-title">Bài tập Listening - Unit 4</h4>
                    <p className="pending-exercise-meta">Lớp: English A1 • Môn: Listening</p>
                  </div>
                </div>
                <span className="pending-exercise-badge warning">Hạn nộp: 01/11</span>
              </div>
              <div className="pending-exercise-body">
                <p className="pending-exercise-desc">Nghe và điền từ còn thiếu</p>
                <div className="pending-exercise-student">
                  <Users className="student-icon" />
                  <span>Học sinh: {children[0]?.name || 'Chưa có'}</span>
                </div>
              </div>
            </div>

            <div className="pending-exercise-item">
              <div className="pending-exercise-header">
                <div className="pending-exercise-info">
                  <BookOpen className="pending-exercise-icon" />
                  <div>
                    <h4 className="pending-exercise-title">Writing Essay - My Family</h4>
                    <p className="pending-exercise-meta">Lớp: English A1 • Môn: Writing</p>
                  </div>
                </div>
                <span className="pending-exercise-badge normal">Hạn nộp: 05/11</span>
              </div>
              <div className="pending-exercise-body">
                <p className="pending-exercise-desc">Viết đoạn văn về gia đình (150 từ)</p>
                <div className="pending-exercise-student">
                  <Users className="student-icon" />
                  <span>Học sinh: {children[0]?.name || 'Chưa có'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="export-info-box">
            <Info className="export-info-icon" />
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
              <X className="btn-icon-modal" />
              Đóng
            </button>
            <button className="modal-btn-primary" onClick={() => navigate('/track-progress')}>
              <Eye className="btn-icon-modal" />
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
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  Theo tháng
                </label>
                {selectedTimeRange === 'month' && (
                  <select 
                    className="month-selector"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
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
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
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
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  Cả năm học
                </label>
              </div>
            </div>
          </div>
          
          <div className="report-summary-stats">
            <div className="report-stat-card excellent">
              <Award className="report-stat-icon" />
              <div className="report-stat-info">
                <h4 className="report-stat-value">8.5/10</h4>
                <p className="report-stat-label">Điểm trung bình</p>
              </div>
            </div>

            <div className="report-stat-card good">
              <CheckCircle className="report-stat-icon" />
              <div className="report-stat-info">
                <h4 className="report-stat-value">45/60</h4>
                <p className="report-stat-label">Bài tập hoàn thành</p>
              </div>
            </div>

            <div className="report-stat-card normal">
              <TrendingUp className="report-stat-icon" />
              <div className="report-stat-info">
                <h4 className="report-stat-value">95%</h4>
                <p className="report-stat-label">Chuyên cần</p>
              </div>
            </div>
          </div>

          <div className="report-subjects-list">
            <h3 className="report-section-title">Điểm theo môn học</h3>
            
            <div className="report-subject-item">
              <div className="report-subject-header">
                <div className="report-subject-info">
                  <div className="report-subject-icon-wrapper reading">
                    <BookOpen className="report-subject-icon" />
                  </div>
                  <div>
                    <h4 className="report-subject-name">Reading</h4>
                    <p className="report-subject-meta">15 bài tập • 12 hoàn thành</p>
                  </div>
                </div>
                <span className="report-subject-score excellent">9.0</span>
              </div>
              <p className="report-teacher-comment">
                <MessageCircle className="comment-icon" />
                Em đọc hiểu rất tốt, tiếp tục phát huy!
              </p>
            </div>

            <div className="report-subject-item">
              <div className="report-subject-header">
                <div className="report-subject-info">
                  <div className="report-subject-icon-wrapper listening">
                    <Activity className="report-subject-icon" />
                  </div>
                  <div>
                    <h4 className="report-subject-name">Listening</h4>
                    <p className="report-subject-meta">20 bài tập • 18 hoàn thành</p>
                  </div>
                </div>
                <span className="report-subject-score good">8.5</span>
              </div>
              <p className="report-teacher-comment">
                <MessageCircle className="comment-icon" />
                Khả năng nghe tốt, cần luyện tập thêm phát âm.
              </p>
            </div>

            <div className="report-subject-item">
              <div className="report-subject-header">
                <div className="report-subject-info">
                  <div className="report-subject-icon-wrapper writing">
                    <FileText className="report-subject-icon" />
                  </div>
                  <div>
                    <h4 className="report-subject-name">Writing</h4>
                    <p className="report-subject-meta">12 bài tập • 10 hoàn thành</p>
                  </div>
                </div>
                <span className="report-subject-score normal">7.8</span>
              </div>
              <p className="report-teacher-comment">
                <MessageCircle className="comment-icon" />
                Cần cải thiện ngữ pháp và từ vựng.
              </p>
            </div>
          </div>

          <div className="export-info-box">
            <Info className="export-info-icon" />
            <div className="export-info-content">
              <h4 className="export-info-title">Nhận xét chung của giáo viên:</h4>
              <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: '0.5rem 0 0 0', lineHeight: '1.6' }}>
                Em có tiến bộ rõ rệt trong tháng này. Thái độ học tập nghiêm túc, 
                tích cực tham gia các hoạt động trên lớp. Cần tập trung hơn vào 
                phần Writing và Grammar để cải thiện điểm số.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn-secondary" onClick={() => closeAllModals()}>
              <X className="btn-icon-modal" />
              Đóng
            </button>
            <button className="modal-btn-primary" onClick={() => {
              closeAllModals();
              setShowReportModal(true);
            }}>
              <Download className="btn-icon-modal" />
              Xuất báo cáo
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Access Section */}
      <div className="quick-access-section-modern">
        <div className="section-header-dashboard">
          <div className="section-header-left-dash">
            <Target className="section-icon-dash" />
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
              <TrendingUp className="quick-card-icon" />
            </div>
            <h3 className="quick-card-title">Theo dõi tiến độ</h3>
            <p className="quick-card-description">Xem chi tiết quá trình học tập</p>
            <ChevronRight className="quick-card-arrow" />
          </button>

          <button 
            className="quick-card notifications-card"
            onClick={() => navigate('/notifications')}
          >
            <div className="quick-card-icon-wrapper notifications">
              <Bell className="quick-card-icon" />
            </div>
            <h3 className="quick-card-title">Thông báo</h3>
            <p className="quick-card-description">Cập nhật từ giáo viên</p>
              {summaryData?.notifications > 0 && (
              <span className="quick-card-badge">{summaryData.notifications}</span>
              )}
            <ChevronRight className="quick-card-arrow" />
          </button>

          <button 
            className="quick-card messages-card"
            onClick={() => navigate('/teacher-communication')}
          >
            <div className="quick-card-icon-wrapper messages">
              <MessageCircle className="quick-card-icon" />
            </div>
            <h3 className="quick-card-title">Trao đổi</h3>
            <p className="quick-card-description">Liên hệ với giáo viên</p>
              {summaryData?.messages > 0 && (
              <span className="quick-card-badge">{summaryData.messages}</span>
              )}
            <ChevronRight className="quick-card-arrow" />
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
