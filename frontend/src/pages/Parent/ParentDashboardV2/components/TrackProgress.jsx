import { useState, useEffect } from 'react';
import { parentAPI } from '../../../../services/parentService';
import { TrendingUp, BookOpen, Award, Calendar, ChevronRight, CheckCircle, Clock, AlertCircle, Target } from 'lucide-react';
import './TrackProgress.css';

const TrackProgress = () => {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);

  useEffect(() => {
    loadChildren();
  }, []);

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
      const progressData = await parentAPI.getChildProgress(childId);
      
      const transformedProgress = {
        subjectProgress: progressData.subject_progress?.map(subject => ({
          subject: subject.subject,
          progress: subject.progress,
          color: subject.color,
          completed: Math.floor((subject.progress / 100) * 50),
          total: 50,
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
          date: activity.time,
          status: activity.status,
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
      console.error('Error loading child progress:', error);
      setChildProgress(null);
    }
  };

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    loadChildProgress(child.id);
  };

  if (loading) {
    return (
      <div className="progress-loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="track-progress-page">
      {/* Header */}
      <div className="progress-header">
        <div>
          <h1 className="progress-title">Theo dõi tiến độ</h1>
          <p className="progress-subtitle">Xem chi tiết quá trình học tập của con em</p>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 0 && (
        <div className="child-selector">
          {children.map((child) => (
            <button
              key={child.id}
              className={`child-tab ${selectedChild?.id === child.id ? 'active' : ''}`}
              onClick={() => handleChildSelect(child)}
            >
              <div className="child-tab-avatar">{child.avatar}</div>
              <div className="child-tab-info">
                <span className="child-tab-name">{child.name}</span>
                <span className="child-tab-grade">{child.grade}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Progress Content */}
      {selectedChild && childProgress && (
        <div className="progress-content">
          {/* Overall Progress Section */}
          <div className="progress-section">
            <div className="section-header-progress">
              <h2 className="section-title-progress">
                <Target className="section-icon-progress" />
                Tổng quan tiến độ
              </h2>
            </div>
            <div className="progress-overview-cards">
              <div className="progress-overview-card primary">
                <div className="progress-overview-icon">
                  <CheckCircle className="overview-icon" />
                </div>
                <div className="progress-overview-info">
                  <span className="overview-label">Tổng tiến độ</span>
                  <h3 className="overview-value">{childProgress.progressOverview.totalLessons > 0 ? `${childProgress.progressOverview.overallProgress}%` : '—'}</h3>
                  <p className="overview-subtext">
                    {childProgress.progressOverview.completedLessons}/{childProgress.progressOverview.totalLessons} bài học đã hoàn thành
                  </p>
                </div>
              </div>

              <div className="progress-overview-card">
                <div className="progress-overview-icon secondary">
                  <TrendingUp className="overview-icon" />
                </div>
                <div className="progress-overview-info">
                  <span className="overview-label">Điểm trung bình</span>
                  <h3 className="overview-value">{childProgress.progressOverview.averageScore || 'N/A'}</h3>
                  <p className="overview-subtext">Từ các bài đã chấm</p>
                </div>
              </div>

              <div className="progress-overview-card">
                <div className="progress-overview-icon tertiary">
                  <Calendar className="overview-icon" />
                </div>
                <div className="progress-overview-info">
                  <span className="overview-label">Bài đã nộp</span>
                  <h3 className="overview-value">{childProgress.progressOverview.totalSubmissions}</h3>
                  <p className="overview-subtext">Trong khoảng thời gian đã chọn</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Progress Section */}
          <div className="progress-section">
            <div className="section-header-progress">
              <h2 className="section-title-progress">
                <TrendingUp className="section-icon-progress" />
                Tiến độ theo kỹ năng
              </h2>
            </div>
            <div className="subject-progress-grid">
              {childProgress.subjectProgress.map((subject, index) => (
                <div key={index} className="subject-card">
                  <div className="subject-card-header">
                    <BookOpen className="subject-card-icon" style={{ color: subject.color }} />
                    <h3 className="subject-card-title">{subject.subject}</h3>
                  </div>
                  <div className="circular-progress-wrapper">
                    <svg viewBox="0 0 120 120" className="circular-progress-svg">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke={subject.color}
                        strokeWidth="10"
                        strokeDasharray={`${subject.progress * 3.14} 314`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        className="progress-circle"
                      />
                    </svg>
                    <div className="circular-progress-text">
                      <span className="progress-percentage">{subject.progress}%</span>
                    </div>
                  </div>
                  <div className="subject-card-stats">
                    <span className="subject-stat">{subject.completed}/{subject.total} bài học</span>
                  </div>
                  <div className="progress-bar-small">
                    <div
                      className="progress-fill-small"
                      style={{
                        width: `${subject.progress}%`,
                        background: subject.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities Section */}
          <div className="progress-section">
            <div className="section-header-progress">
              <h2 className="section-title-progress">
                <Clock className="section-icon-progress" />
                Hoạt động gần đây
              </h2>
            </div>
            <div className="timeline">
              {childProgress.recentActivities.map((activity, index) => (
                <div key={index} className="timeline-item">
                  <div className={`timeline-marker marker-${activity.type}`}>
                    {activity.type === 'lesson' && <BookOpen className="timeline-icon" />}
                    {activity.type === 'exercise' && <Award className="timeline-icon" />}
                    {activity.type === 'discussion' && '💬'}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h4 className="timeline-title">{activity.title}</h4>
                      <span className="timeline-date">{activity.date}</span>
                    </div>
                    <p className="timeline-subject">{activity.subject}</p>
                    <div className="timeline-footer">
                      {activity.score && (
                        <span className="timeline-score">
                          <Award className="score-icon" />
                          Điểm: {activity.score}/10
                        </span>
                      )}
                      <span className={`timeline-status status-${activity.status}`}>
                        {activity.status === 'completed' && 'Hoàn thành'}
                        {activity.status === 'graded' && 'Đã chấm'}
                        {activity.status === 'participated' && 'Đã tham gia'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Tasks Section */}
          <div className="progress-section">
            <div className="section-header-progress">
              <h2 className="section-title-progress">
                <AlertCircle className="section-icon-progress" />
                Công việc sắp tới
              </h2>
            </div>
            <div className="upcoming-tasks-list">
              {childProgress.upcomingTasks.map((task, index) => (
                <div key={index} className={`upcoming-task-card priority-${task.priority}`}>
                  <div className="task-priority-dot"></div>
                  <div className="task-content-full">
                    <h4 className="task-title-full">{task.title}</h4>
                    <p className="task-subject">{task.subject}</p>
                  </div>
                  <div className="task-due">
                    <Calendar className="due-icon" />
                    <span className="due-date">{task.dueDate}</span>
                  </div>
                  <ChevronRight className="task-arrow" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {children.length === 0 && (
        <div className="empty-progress">
          <TrendingUp className="empty-icon-large" />
          <h3>Chưa có dữ liệu tiến độ</h3>
          <p>Hãy thêm con em của bạn để theo dõi tiến độ học tập</p>
        </div>
      )}
    </div>
  );
};

export default TrackProgress;

