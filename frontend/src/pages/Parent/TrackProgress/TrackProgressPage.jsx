import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parentAPI } from '../../../services/parentService';
import { 
  ArrowTrendingUpIcon, BookOpenIcon, TrophyIcon, CalendarIcon, ChevronRightIcon, 
  CheckCircleIcon, ClockIcon, ExclamationCircleIcon, ChartPieIcon, ChartBarIcon,
  UserGroupIcon, ArrowLeftIcon, ArrowDownTrayIcon, FunnelIcon, DocumentTextIcon, DocumentChartBarIcon, InformationCircleIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import Navbar from '../../../components/Navbar/Navbar';
import authService from '../../../services/authService';
import Modal from '../ParentDashboardV2/components/Modal';
import './TrackProgressPage.css';

const TrackProgressPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  
  // Modal states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportDetailModal, setShowExportDetailModal] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState(null);
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    student: 'all',
    subject: 'all',
    timeRange: 'all',
    evaluationType: 'all'
  });
  
  // Export options
  const [exportOptions, setExportOptions] = useState({
    studentInfo: true,
    grades: true,
    teacherComments: true,
    progressChart: true,
    attendance: true,
    overallEvaluation: true
  });

  useEffect(() => {
    loadChildren();
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




    if (!selectedChild) {
      console.error('[Export] Error: No child selected!');
      alert('Vui lòng chọn con em trước khi xuất báo cáo.');
      return;
    }
    
    if (!selectedExportType) {
      console.error('[Export] Error: No export type selected!');
      alert('Vui lòng chọn định dạng xuất báo cáo (PDF hoặc Excel).');
      return;
    }
    
    try {





      // Sanitize filename - remove special characters
      const safeName = selectedChild.name.replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      
      let blob;
      let filename;
      
      if (selectedExportType === 'pdf') {

        blob = await parentAPI.exportProgressPDF(
          selectedChild.id,
          exportOptions,
          {
            subject: filterOptions.subject,
            timeRange: filterOptions.timeRange,
            evaluationType: filterOptions.evaluationType
          }
        );
        filename = `bao_cao_tien_do_${safeName}_${dateStr}.pdf`;
      } else if (selectedExportType === 'excel') {
        
        blob = await parentAPI.exportProgressExcel(
          selectedChild.id,
          exportOptions,
          {
            subject: filterOptions.subject,
            timeRange: filterOptions.timeRange,
            evaluationType: filterOptions.evaluationType
          }
        );

        filename = `bao_cao_tien_do_${safeName}_${dateStr}.xlsx`;
      } else {
        console.error('[Export] Unknown export type:', selectedExportType);
        alert('Định dạng xuất báo cáo không hợp lệ.');
        return;
      }




      if (!blob) {
        throw new Error('Không nhận được dữ liệu từ server');
      }
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      // Close modal and reset
      setShowExportDetailModal(false);
      setSelectedExportType(null);
      
      // Reset export options to default
      setExportOptions({
        studentInfo: true,
        grades: true,
        teacherComments: true,
        progressChart: true,
        attendance: true,
        overallEvaluation: true
      });

      alert('Xuất báo cáo thành công!');
    } catch (error) {
      console.error('[Export] Error during export:', error);
      console.error('[Export] Error details:', error.response?.data);
      console.error('[Export] Error status:', error.response?.status);
      console.error('[Export] Error message:', error.message);
      console.error('[Export] Full error object:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi xuất báo cáo. ';
      if (error.response?.status === 404) {
        errorMessage += 'Không tìm thấy dữ liệu học sinh.';
      } else if (error.response?.status === 403) {
        errorMessage += 'Bạn không có quyền truy cập.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Vui lòng thử lại.';
      }
      
      alert(errorMessage);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilterOptions(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleApplyFilter = async () => {

    setShowFilterModal(false);
    
    // Reload progress with new filters
    if (selectedChild) {
      try {
        const progressData = await parentAPI.getChildProgress(selectedChild.id, {
          subject: filterOptions.subject,
          timeRange: filterOptions.timeRange,
          evaluationType: filterOptions.evaluationType
        });
        
        const transformedProgress = {
          subjectProgress: progressData.subject_progress?.map(subject => ({
            subject: subject.subject,
            progress: subject.progress,
            color: subject.color,
            completed: subject.completed_exercises,
            total: subject.total_exercises,
            averageScore: subject.average_score
          })) || [],
          attendance: {
            present: progressData.attendance?.present || 0,
            absent: progressData.attendance?.absent || 0,
            late: progressData.attendance?.late || 0,
            total: progressData.attendance?.total || 0,
          },
          recentActivities: progressData.recent_activities?.map(activity => ({
            id: activity.title,
            type: activity.type,
            title: activity.title,
            subject: activity.subject,
            score: activity.score,
            date: activity.time,
            status: activity.status,
            feedback: activity.feedback
          })) || [],
          upcomingTasks: progressData.upcoming_tasks?.map(task => ({
            id: task.title,
            title: task.title,
            dueDate: task.dueDate,
            subject: task.subject,
            priority: task.priority,
          })) || [],
        };
        
        setChildProgress(transformedProgress);
      } catch (error) {
        console.error('Error applying filter:', error);
      }
    }
  };

  const handleResetFilter = () => {
    setFilterOptions({
      student: 'all',
      subject: 'all',
      timeRange: 'all',
      evaluationType: 'all'
    });
  };

  const loadChildren = async () => {
    try {
      setLoading(true);
      const childrenData = await parentAPI.getChildren();
      
      const transformedChildren = childrenData.map(child => ({
        id: child.id,
        name: child.name,
        grade: child.grade || 'N/A',
        avatar: child.avatar_url || child.name?.charAt(0)?.toUpperCase() || 'S',
      }));
      
      setChildren(transformedChildren);
      if (transformedChildren.length > 0) {
        handleChildSelect(transformedChildren[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChildProgress = async (childId) => {
    try {
      const progressData = await parentAPI.getChildProgress(childId, {
        subject: filterOptions.subject,
        timeRange: filterOptions.timeRange,
        evaluationType: filterOptions.evaluationType
      });
      
      const transformedProgress = {
        subjectProgress: progressData.subject_progress?.map(subject => ({
          subject: subject.subject,
          progress: subject.progress,
          color: subject.color,
          completed: subject.completed_exercises || 0,
          total: subject.total_exercises || 0,
          averageScore: subject.average_score
        })) || [],
        progressOverview: {
          completedLessons: progressData.completed_lessons ?? 0,
          totalLessons: progressData.total_lessons ?? 0,
          overallProgress: (() => {
            const completed = progressData.completed_lessons ?? 0;
            const total = progressData.total_lessons ?? 0;
            return total > 0 ? Math.round((completed / total) * 100) : 0;
          })(),
          averageScore: progressData.overall_average ?? 0,
          totalSubmissions: progressData.total_submissions ?? 0
        },
        recentActivities: progressData.recent_activities?.map(activity => ({
          id: activity.title,
          type: activity.type,
          title: activity.title,
          subject: activity.subject,
          score: activity.score,
          maxScore: activity.max_score,
          date: activity.time,
          status: activity.status,
          feedback: activity.feedback,
          className: activity.class_name
        })) || [],
        upcomingTasks: progressData.upcoming_tasks?.map(task => ({
          id: task.title,
          title: task.title,
          dueDate: task.dueDate,
          subject: task.subject,
          priority: task.priority,
          className: task.class_name
        })) || [],
        overallAverage: progressData.overall_average || 0,
        totalSubmissions: progressData.total_submissions || 0
      };
      
      setChildProgress(transformedProgress);
    } catch (error) {
      console.error('Error loading child progress:', error);
      setChildProgress(null);
    }
  };

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    loadChildProgress(child.id);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <>
        <Navbar userRole="parent" isLoggedIn={true} onLogout={handleLogout} />
        <div className="track-progress-page-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userRole="parent" isLoggedIn={true} onLogout={handleLogout} />
      <div className="track-progress-page-container">
        {/* Page Header with Breadcrumb */}
        <div className="page-header-track">
          <div className="breadcrumb">
            <span className="back-btn" onClick={() => navigate('/')}>
              <ArrowLeftIcon className="back-icon" />
              Home
            </span>
            <ChevronRightIcon className="breadcrumb-separator" />
            <span className="breadcrumb-current">Theo dõi tiến độ</span>
          </div>
          
          <div className="page-title-section">
            <div className="page-title-left">
              <div className="page-icon-wrapper">
                <ArrowTrendingUpIcon className="page-icon" />
              </div>
              <div>
                <h1 className="page-title">Theo dõi tiến độ học tập</h1>
                <p className="page-subtitle">Xem chi tiết quá trình học tập và thành tích của con em</p>
              </div>
            </div>
            <div className="page-actions-modern">
              <button className="modern-action-btn filter-btn" onClick={() => setShowFilterModal(true)}>
                <div className="action-btn-icon-wrapper">
                  <FunnelIcon className="action-btn-icon" />
                </div>
                <div className="action-btn-content">
                  <span className="action-btn-title">Bộ lọc</span>
                  <span className="action-btn-desc">Lọc theo tiêu chí</span>
                </div>
              </button>
              <button className="modern-action-btn export-btn" onClick={() => setShowExportModal(true)}>
                <div className="action-btn-icon-wrapper">
                  <ArrowDownTrayIcon className="action-btn-icon" />
                </div>
                <div className="action-btn-content">
                  <span className="action-btn-title">Xuất báo cáo</span>
                  <span className="action-btn-desc">PDF hoặc Excel</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Child Selector - Beautiful Tabs */}
        {children.length > 0 && (
          <div className="child-selector-section">
            <div className="selector-header">
              <h2 className="selector-title">
                <UserGroupIcon className="selector-icon" />
                Chọn con em
              </h2>
              <span className="selector-count">{children.length} học sinh</span>
            </div>
            <div className="child-tabs-container">
              {children.map((child) => (
                <button
                  key={child.id}
                  className={`child-tab-card ${selectedChild?.id === child.id ? 'active' : ''}`}
                  onClick={() => handleChildSelect(child)}
                >
                  <div className="tab-card-avatar">{child.avatar}</div>
                  <div className="tab-card-info">
                    <span className="tab-card-name">{child.name}</span>
                    <span className="tab-card-grade">{child.grade}</span>
                  </div>
                  {selectedChild?.id === child.id && (
                    <div className="tab-card-active-indicator">
                      <CheckCircleIcon className="indicator-icon" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress Content */}
        {selectedChild && childProgress && (
          <div className="progress-main-content">
            {/* Progress Overview Section */}
            <div className="content-section">
              <div className="section-header-modern">
                <div className="section-header-left">
                  <ArrowTrendingUpIcon className="section-header-icon" />
                  <div>
                    <h2 className="section-title-modern">Tổng quan tiến độ</h2>
                    <p className="section-subtitle-modern">Theo dõi tỉ lệ hoàn thành và điểm số của con em</p>
                  </div>
                </div>
              </div>
              <div className="progress-overview-grid">
                <div className="progress-card-modern primary">
                  <div className="card-modern-header">
                    <div className="card-icon-wrapper primary">
                      <CheckCircleIcon className="card-icon" />
                    </div>
                  </div>
                  <div className="card-modern-body">
                    <h3 className="card-value">
                      {childProgress.progressOverview.totalLessons > 0 ? `${childProgress.progressOverview.overallProgress}%` : '—'}
                    </h3>
                    <p className="card-label">Tổng tiến độ</p>
                    <p className="card-subtext">
                      {childProgress.progressOverview.completedLessons}/{childProgress.progressOverview.totalLessons} bài học đã hoàn thành
                    </p>
                  </div>
                </div>

                <div className="progress-card-modern secondary">
                  <div className="card-modern-header">
                    <div className="card-icon-wrapper secondary">
                      <TrophyIcon className="card-icon" />
                    </div>
                  </div>
                  <div className="card-modern-body">
                    <h3 className="card-value">{childProgress.progressOverview.averageScore || 'N/A'}</h3>
                    <p className="card-label">Điểm trung bình</p>
                    <p className="card-subtext">Từ các bài đã chấm</p>
                  </div>
                </div>

                <div className="progress-card-modern tertiary">
                  <div className="card-modern-header">
                    <div className="card-icon-wrapper tertiary">
                      <BookOpenIcon className="card-icon" />
                    </div>
                  </div>
                  <div className="card-modern-body">
                    <h3 className="card-value">{childProgress.progressOverview.totalLessons}</h3>
                    <p className="card-label">Tổng số bài học</p>
                    <p className="card-subtext">Bao gồm tất cả bài được giao</p>
                  </div>
                </div>

                <div className="progress-card-modern neutral">
                  <div className="card-modern-header">
                    <div className="card-icon-wrapper neutral">
                      <CalendarIcon className="card-icon" />
                    </div>
                  </div>
                  <div className="card-modern-body">
                    <h3 className="card-value">{childProgress.progressOverview.totalSubmissions}</h3>
                    <p className="card-label">Bài đã nộp</p>
                    <p className="card-subtext">Trong khoảng thời gian đã chọn</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Progress - Beautiful Grid */}
            <div className="content-section">
              <div className="section-header-modern">
                <div className="section-header-left">
                  <ChartPieIcon className="section-header-icon" />
                  <div>
                    <h2 className="section-title-modern">Tiến độ theo kỹ năng</h2>
                    <p className="section-subtitle-modern">Phân tích chi tiết từng kỹ năng học tập</p>
                  </div>
                </div>
              </div>
              <div className="subject-progress-grid-modern">
                {childProgress.subjectProgress.map((subject, index) => (
                  <div key={index} className="subject-card-premium">
                    <div className="subject-card-header-modern">
                      <div className="subject-icon-wrapper" style={{ background: `${subject.color}20` }}>
                        <BookOpenIcon className="subject-icon" style={{ color: subject.color }} />
                      </div>
                      <h3 className="subject-name">{subject.subject}</h3>
                    </div>
                    
                    <div className="circular-progress-container">
                      <svg viewBox="0 0 160 160" className="circular-svg">
                        <defs>
                          <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={subject.color} stopOpacity="1" />
                            <stop offset="100%" stopColor={subject.color} stopOpacity="0.6" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="12"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke={`url(#gradient-${index})`}
                          strokeWidth="12"
                          strokeDasharray={`${subject.progress * 4.4} 440`}
                          strokeLinecap="round"
                          transform="rotate(-90 80 80)"
                          className="progress-circle-animated"
                        />
                      </svg>
                      <div className="circular-center-text">
                        <span className="progress-percent">{subject.progress}%</span>
                        <span className="progress-status">Hoàn thành</span>
                      </div>
                    </div>
                    
                    <div className="subject-card-stats">
                      <div className="stat-row">
                        <span className="stat-label">Đã học:</span>
                        <span className="stat-value">{subject.completed}/{subject.total} bài</span>
                      </div>
                      {subject.averageScore !== null && subject.averageScore !== undefined && (
                        <div className="stat-row">
                          <span className="stat-label">Điểm TB:</span>
                          <span className="stat-value">{subject.averageScore}/10</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Two Column Layout for Activities and Tasks */}
            <div className="two-column-layout">
              {/* Recent Activities */}
              <div className="content-section">
                <div className="section-header-modern">
                  <div className="section-header-left">
                    <ClockIcon className="section-header-icon" />
                    <div>
                      <h2 className="section-title-modern">Hoạt động gần đây</h2>
                      <p className="section-subtitle-modern">Các hoạt động học tập mới nhất</p>
                    </div>
                  </div>
                </div>
                <div className="timeline-modern">
                  {childProgress.recentActivities.map((activity, index) => (
                    <div key={index} className="timeline-item-modern">
                      <div className={`timeline-marker-modern type-${activity.type}`}>
                        {activity.type === 'lesson' && <BookOpenIcon className="marker-icon" />}
                        {activity.type === 'exercise' && <TrophyIcon className="marker-icon" />}
                        {activity.type === 'discussion' && '💬'}
                      </div>
                      <div className="timeline-content-modern">
                        <div className="timeline-top">
                          <h4 className="timeline-title-modern">{activity.title}</h4>
                          <span className="timeline-date-modern">{activity.date}</span>
                        </div>
                        <p className="timeline-subject-modern">
                          {activity.subject}
                          {activity.className && ` - ${activity.className}`}
                        </p>
                        <div className="timeline-bottom">
                          {activity.score !== null && activity.score !== undefined && (
                            <span className="timeline-score-modern">
                              <TrophyIcon className="score-icon-small" />
                              {activity.score}/{activity.maxScore || 10}
                            </span>
                          )}
                          <span className={`timeline-status-modern status-${activity.status}`}>
                            {activity.status === 'completed' && 'Hoàn thành'}
                            {activity.status === 'graded' && 'Đã chấm'}
                            {activity.status === 'participated' && 'Đã tham gia'}
                            {activity.status === 'submitted' && 'Đã nộp'}
                          </span>
                        </div>
                        {activity.feedback && (
                          <div className="timeline-feedback">
                            <em>"{activity.feedback}"</em>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Tasks */}
              <div className="content-section">
                <div className="section-header-modern">
                  <div className="section-header-left">
                    <ExclamationCircleIcon className="section-header-icon" />
                    <div>
                      <h2 className="section-title-modern">Công việc sắp tới</h2>
                      <p className="section-subtitle-modern">Bài tập và deadline quan trọng</p>
                    </div>
                  </div>
                </div>
                <div className="upcoming-tasks-modern">
                  {childProgress.upcomingTasks.map((task, index) => (
                    <div key={index} className={`task-card-modern priority-${task.priority}`}>
                      <div className="task-priority-indicator"></div>
                      <div className="task-card-content">
                        <div className="task-header-modern">
                          <h4 className="task-title-modern">{task.title}</h4>
                          <span className={`priority-badge badge-${task.priority}`}>
                            {task.priority === 'high' && 'Cao'}
                            {task.priority === 'medium' && 'Trung bình'}
                            {task.priority === 'low' && 'Thấp'}
                          </span>
                        </div>
                        <p className="task-subject-modern">{task.subject}</p>
                        <div className="task-footer-modern">
                          <div className="task-due-modern">
                            <CalendarIcon className="due-icon-small" />
                            <span>{task.dueDate}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRightIcon className="task-arrow-modern" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {children.length === 0 && (
          <div className="empty-state-modern">
            <div className="empty-icon-container">
              <ArrowTrendingUpIcon className="empty-icon" />
            </div>
            <h3 className="empty-title">Chưa có dữ liệu tiến độ</h3>
            <p className="empty-description">Hãy thêm con em của bạn để theo dõi tiến độ học tập</p>
            <button className="empty-action-btn" onClick={() => navigate('/parent-dashboard')}>
              Quay về Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal - Giao diện đơn giản */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Bộ lọc báo cáo tiến độ"
        size="medium"
      >
        <div className="modal-content-custom">
          <p className="filter-modal-desc">Chọn tiêu chí để xem báo cáo chi tiết</p>
          
          <div className="filter-simple-container">
            {/* Filter by Subject/Skill */}
            <div className="filter-simple-section">
              <label className="filter-simple-label">Kỹ năng</label>
              <div className="filter-simple-options">
                {[
                  { value: 'all', label: 'Tất cả kỹ năng' },
                  { value: 'listening', label: 'Listening' },
                  { value: 'speaking', label: 'Speaking' },
                  { value: 'reading', label: 'Reading' },
                  { value: 'writing', label: 'Writing' }
                ].map(subject => (
                  <button 
                    key={subject.value}
                    className={`filter-simple-btn ${filterOptions.subject === subject.value ? 'active' : ''}`}
                    onClick={() => handleFilterChange('subject', subject.value)}
                  >
                    {subject.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Time Range */}
            <div className="filter-simple-section">
              <label className="filter-simple-label">Khoảng thời gian</label>
              <div className="filter-simple-options">
                {[
                  { value: 'all', label: 'Toàn bộ' },
                  { value: 'week', label: 'Tuần này' },
                  { value: 'month', label: 'Tháng này' },
                  { value: 'quarter', label: 'Học kỳ này' },
                  { value: 'year', label: 'Năm học này' }
                ].map(time => (
                  <button 
                    key={time.value}
                    className={`filter-simple-btn ${filterOptions.timeRange === time.value ? 'active' : ''}`}
                    onClick={() => handleFilterChange('timeRange', time.value)}
                  >
                    {time.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Evaluation Type */}
            <div className="filter-simple-section">
              <label className="filter-simple-label">Loại đánh giá</label>
              <div className="filter-simple-options">
                {[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'grades', label: 'Điểm số' },
                  { value: 'comments', label: 'Nhận xét' },
                  { value: 'both', label: 'Điểm số & Nhận xét' }
                ].map(type => (
                  <button 
                    key={type.value}
                    className={`filter-simple-btn ${filterOptions.evaluationType === type.value ? 'active' : ''}`}
                    onClick={() => handleFilterChange('evaluationType', type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              className="modal-btn-secondary"
              onClick={handleResetFilter}
            >
              Đặt lại
            </button>
            <button 
              className="modal-btn-primary"
              onClick={handleApplyFilter}
            >
              Áp dụng
            </button>
          </div>
        </div>
      </Modal>

      {/* Export Modal - Chọn loại file */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Xuất báo cáo tiến độ học tập"
        size="medium"
      >
        <div className="modal-content-custom">
          <p className="export-modal-subtitle">Chọn định dạng để xuất báo cáo điểm và đánh giá của giáo viên</p>
          
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
              <h4 className="export-info-title">Báo cáo bao gồm:</h4>
              <ul className="export-info-list">
                <li>✓ Thông tin học sinh và điểm số các môn</li>
                <li>✓ Nhận xét và đánh giá từ giáo viên</li>
                <li>✓ Biểu đồ tiến độ và chuyên cần</li>
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
          <p className="export-modal-subtitle">Chọn các thông tin bạn muốn xuất trong báo cáo</p>
          
          <div className="export-options-checklist">
            <div 
              className={`export-checkbox-item ${exportOptions.studentInfo ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('studentInfo')}
            >
              <div className="export-checkbox">
                {exportOptions.studentInfo && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Thông tin học sinh</span>
                <span className="export-checkbox-desc">Họ tên, lớp, năm học của học sinh</span>
              </div>
            </div>

            <div 
              className={`export-checkbox-item ${exportOptions.grades ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('grades')}
            >
              <div className="export-checkbox">
                {exportOptions.grades && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Điểm số các môn học</span>
                <span className="export-checkbox-desc">Điểm kiểm tra, giữa kỳ, cuối kỳ</span>
              </div>
            </div>

            <div 
              className={`export-checkbox-item ${exportOptions.teacherComments ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('teacherComments')}
            >
              <div className="export-checkbox">
                {exportOptions.teacherComments && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Nhận xét của giáo viên</span>
                <span className="export-checkbox-desc">Đánh giá chi tiết từ giáo viên</span>
              </div>
            </div>

            <div 
              className={`export-checkbox-item ${exportOptions.progressChart ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('progressChart')}
            >
              <div className="export-checkbox">
                {exportOptions.progressChart && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Biểu đồ tiến độ</span>
                <span className="export-checkbox-desc">Biểu đồ phát triển theo thời gian</span>
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
                <span className="export-checkbox-desc">Thông tin điểm danh và tham gia</span>
              </div>
            </div>

            <div 
              className={`export-checkbox-item ${exportOptions.overallEvaluation ? 'checked' : ''}`}
              onClick={() => handleExportOptionToggle('overallEvaluation')}
            >
              <div className="export-checkbox">
                {exportOptions.overallEvaluation && <CheckCircleIcon className="check-icon" />}
              </div>
              <div className="export-checkbox-content">
                <span className="export-checkbox-label">Đánh giá tổng quan</span>
                <span className="export-checkbox-desc">Nhận xét chung và kết luận</span>
              </div>
            </div>
          </div>

          <div className="export-summary-box">
            <InformationCircleIcon className="export-info-icon" />
            <div className="export-summary-content">
              <span className="export-summary-text">
                Đã chọn {Object.values(exportOptions).filter(v => v).length}/6 mục
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

export default TrackProgressPage;

