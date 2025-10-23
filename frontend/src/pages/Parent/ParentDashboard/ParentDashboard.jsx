// ParentDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';
import { usersAPI, classesAPI, exercisesAPI } from '../../../services/api';
import './ParentDashboard.css';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      setLoading(true);
      // TODO: Implement API to get children list
      // For now, use mock data
      const mockChildren = [
        {
          id: 1,
          name: 'Nguyễn Văn A',
          grade: 'Lớp 3',
          avatar: '👦',
          totalClasses: 5,
          completedLessons: 45,
          totalLessons: 60,
          averageScore: 8.5,
        },
        {
          id: 2,
          name: 'Nguyễn Thị B',
          grade: 'Lớp 5',
          avatar: '👧',
          totalClasses: 6,
          completedLessons: 78,
          totalLessons: 90,
          averageScore: 9.2,
        },
      ];
      setChildren(mockChildren);
      if (mockChildren.length > 0) {
        setSelectedChild(mockChildren[0]);
        loadChildProgress(mockChildren[0].id);
      }
    } catch (error) {
      console.error('Error loading parent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildProgress = async (childId) => {
    try {
      // TODO: Implement API to get child progress
      const mockProgress = {
        recentActivities: [
          {
            id: 1,
            type: 'lesson',
            title: 'Hoàn thành bài học: Phép cộng trong phạm vi 1000',
            subject: 'Toán',
            date: '2 giờ trước',
            status: 'completed',
          },
          {
            id: 2,
            type: 'exercise',
            title: 'Nộp bài tập: Luyện tập phép trừ',
            subject: 'Toán',
            score: '9/10',
            date: '5 giờ trước',
            status: 'graded',
          },
          {
            id: 3,
            type: 'discussion',
            title: 'Tham gia thảo luận: Cách học từ vựng hiệu quả',
            subject: 'Tiếng Anh',
            date: '1 ngày trước',
            status: 'participated',
          },
        ],
        upcomingTasks: [
          {
            id: 1,
            title: 'Bài kiểm tra giữa kỳ - Toán',
            dueDate: '2 ngày nữa',
            subject: 'Toán',
            priority: 'high',
          },
          {
            id: 2,
            title: 'Nộp bài tập về nhà - Tiếng Việt',
            dueDate: '3 ngày nữa',
            subject: 'Tiếng Việt',
            priority: 'medium',
          },
        ],
        subjectProgress: [
          { subject: 'Toán', progress: 85, color: '#3B82F6' },
          { subject: 'Tiếng Việt', progress: 78, color: '#10B981' },
          { subject: 'Tiếng Anh', progress: 92, color: '#F59E0B' },
          { subject: 'Khoa học', progress: 70, color: '#8B5CF6' },
        ],
        attendance: {
          present: 42,
          absent: 2,
          late: 1,
          total: 45,
        },
      };
      setChildProgress(mockProgress);
    } catch (error) {
      console.error('Error loading child progress:', error);
    }
  };

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    loadChildProgress(child.id);
  };

  if (loading) {
    return (
      <div className="parent-dashboard-loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="parent-dashboard">
      {/* Header */}
      <div className="parent-dashboard-header">
        <div className="header-content">
          <h1>👨‍👩‍👧‍👦 Dashboard Phụ Huynh</h1>
          <p>Theo dõi tiến độ học tập của con bạn</p>
        </div>
      </div>

      <div className="parent-dashboard-content">
        {/* Children List Sidebar */}
        <div className="children-sidebar">
          <h3>Con của bạn</h3>
          {children.map((child) => (
            <div
              key={child.id}
              className={`child-card ${selectedChild?.id === child.id ? 'active' : ''}`}
              onClick={() => handleChildSelect(child)}
            >
              <div className="child-avatar">{child.avatar}</div>
              <div className="child-info">
                <h4>{child.name}</h4>
                <p>{child.grade}</p>
              </div>
              <div className="child-score">{child.averageScore}</div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="main-content">
          {selectedChild && (
            <>
              {/* Child Overview Cards */}
              <div className="overview-cards">
                <div className="overview-card">
                  <div className="card-icon" style={{ background: '#EEF2FF' }}>
                    📚
                  </div>
                  <div className="card-content">
                    <h3>{selectedChild.totalClasses}</h3>
                    <p>Lớp học</p>
                  </div>
                </div>
                <div className="overview-card">
                  <div className="card-icon" style={{ background: '#ECFDF5' }}>
                    ✅
                  </div>
                  <div className="card-content">
                    <h3>{selectedChild.completedLessons}/{selectedChild.totalLessons}</h3>
                    <p>Bài học hoàn thành</p>
                  </div>
                </div>
                <div className="overview-card">
                  <div className="card-icon" style={{ background: '#FEF3C7' }}>
                    ⭐
                  </div>
                  <div className="card-content">
                    <h3>{selectedChild.averageScore}</h3>
                    <p>Điểm trung bình</p>
                  </div>
                </div>
                <div className="overview-card">
                  <div className="card-icon" style={{ background: '#FCE7F3' }}>
                    📅
                  </div>
                  <div className="card-content">
                    <h3>{childProgress?.attendance.present}/{childProgress?.attendance.total}</h3>
                    <p>Ngày học</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Tổng quan
                </button>
                <button
                  className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
                  onClick={() => setActiveTab('progress')}
                >
                  Tiến độ học tập
                </button>
                <button
                  className={`tab ${activeTab === 'activities' ? 'active' : ''}`}
                  onClick={() => setActiveTab('activities')}
                >
                  Hoạt động gần đây
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'overview' && childProgress && (
                  <div className="overview-content">
                    {/* Subject Progress */}
                    <div className="section">
                      <h3>Tiến độ theo môn học</h3>
                      <div className="subject-progress-list">
                        {childProgress.subjectProgress.map((subject, index) => (
                          <div key={index} className="subject-progress-item">
                            <div className="subject-header">
                              <span>{subject.subject}</span>
                              <span>{subject.progress}%</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
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

                    {/* Upcoming Tasks */}
                    <div className="section">
                      <h3>Công việc sắp tới</h3>
                      <div className="upcoming-tasks">
                        {childProgress.upcomingTasks.map((task) => (
                          <div key={task.id} className={`task-card priority-${task.priority}`}>
                            <div className="task-icon">
                              {task.priority === 'high' ? '🔴' : '🟡'}
                            </div>
                            <div className="task-content">
                              <h4>{task.title}</h4>
                              <p>{task.subject} • {task.dueDate}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'progress' && childProgress && (
                  <div className="progress-content">
                    {/* Attendance */}
                    <div className="section">
                      <h3>Chuyên cần</h3>
                      <div className="attendance-grid">
                        <div className="attendance-item present">
                          <span className="attendance-icon">✅</span>
                          <span className="attendance-number">{childProgress.attendance.present}</span>
                          <span className="attendance-label">Có mặt</span>
                        </div>
                        <div className="attendance-item absent">
                          <span className="attendance-icon">❌</span>
                          <span className="attendance-number">{childProgress.attendance.absent}</span>
                          <span className="attendance-label">Vắng</span>
                        </div>
                        <div className="attendance-item late">
                          <span className="attendance-icon">⏰</span>
                          <span className="attendance-number">{childProgress.attendance.late}</span>
                          <span className="attendance-label">Muộn</span>
                        </div>
                      </div>
                    </div>

                    {/* Subject Progress Details */}
                    <div className="section">
                      <h3>Chi tiết tiến độ</h3>
                      <div className="progress-details">
                        {childProgress.subjectProgress.map((subject, index) => (
                          <div key={index} className="progress-detail-card">
                            <h4>{subject.subject}</h4>
                            <div className="circular-progress">
                              <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="none"
                                  stroke={subject.color}
                                  strokeWidth="8"
                                  strokeDasharray={`${subject.progress * 2.51} 251`}
                                  strokeLinecap="round"
                                  transform="rotate(-90 50 50)"
                                />
                              </svg>
                              <span className="progress-text">{subject.progress}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'activities' && childProgress && (
                  <div className="activities-content">
                    <div className="section">
                      <h3>Hoạt động gần đây</h3>
                      <div className="activities-timeline">
                        {childProgress.recentActivities.map((activity) => (
                          <div key={activity.id} className={`activity-item ${activity.type}`}>
                            <div className="activity-icon">
                              {activity.type === 'lesson' && '📖'}
                              {activity.type === 'exercise' && '✍️'}
                              {activity.type === 'discussion' && '💬'}
                            </div>
                            <div className="activity-content">
                              <h4>{activity.title}</h4>
                              <p>{activity.subject}</p>
                              {activity.score && <span className="activity-score">{activity.score}</span>}
                              <span className="activity-date">{activity.date}</span>
                            </div>
                            <div className={`activity-status status-${activity.status}`}>
                              {activity.status === 'completed' && '✓'}
                              {activity.status === 'graded' && '⭐'}
                              {activity.status === 'participated' && '💬'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
