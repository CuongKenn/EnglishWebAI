// ParentDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../../services/authService';
import { parentAPI } from '../../../services/parentService';
import { Plus } from 'lucide-react';
import './ParentDashboard.css';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      setLoading(true);
      const childrenData = await parentAPI.getChildren();
      
      // Transform API data to match component structure
      const transformedChildren = childrenData.map(child => ({
        id: child.id,
        name: child.name,
        grade: child.grade || 'N/A',
        avatar: child.avatar_url || '�',
        totalClasses: child.total_classes,
        completedLessons: child.completed_lessons,
        totalLessons: child.total_lessons,
        averageScore: child.average_score,
      }));
      
      setChildren(transformedChildren);
      if (transformedChildren.length > 0) {
        setSelectedChild(transformedChildren[0]);
        loadChildProgress(transformedChildren[0].id);
      }
    } catch (error) {
      console.error('Error loading parent data:', error);
      // Fallback to empty state on error
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChildProgress = async (childId) => {
    try {
      const progressData = await parentAPI.getChildProgress(childId);
      
      // Transform API data to match component structure
      const transformedProgress = {
        recentActivities: progressData.recent_activities.map(activity => ({
          id: activity.title,
          type: activity.type,
          title: activity.title,
          subject: activity.subject,
          score: activity.score ? `${activity.score}/10` : undefined,
          date: activity.time,
          status: activity.status,
        })),
        upcomingTasks: progressData.upcoming_tasks.map(task => ({
          id: task.title,
          title: task.title,
          dueDate: task.dueDate,
          subject: task.subject,
          priority: task.priority,
        })),
        subjectProgress: progressData.subject_progress.map(subject => ({
          subject: subject.subject,
          progress: subject.progress,
          color: subject.color,
        })),
        attendance: {
          present: progressData.attendance.present,
          absent: progressData.attendance.absent,
          late: progressData.attendance.late,
          total: progressData.attendance.total,
        },
      };
      
      setChildProgress(transformedProgress);
    } catch (error) {
      console.error('Error loading child progress:', error);
      // Set empty state on error
      setChildProgress(null);
    }
  };

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    loadChildProgress(child.id);
  };

  const handleAddChild = async () => {
    if (!studentEmail.trim()) {
      alert('Vui lòng nhập email học sinh!');
      return;
    }

    try {
      setLoading(true);
      await parentAPI.linkStudent(studentEmail);
      alert('Đã gửi yêu cầu liên kết đến học sinh. Đợi học sinh xác nhận.');
      setShowAddChildModal(false);
      setStudentEmail('');
      // Reload children list
      loadParentData();
    } catch (error) {
      console.error('Error linking student:', error);
      alert(error.message || 'Không thể gửi yêu cầu. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Con của bạn</h3>
            <button 
              className="add-child-btn"
              onClick={() => setShowAddChildModal(true)}
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              title="Thêm con"
            >
              <Plus size={20} />
            </button>
          </div>
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

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="modal-overlay" onClick={() => setShowAddChildModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Thêm con</h3>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Nhập email tài khoản học sinh của con bạn. Học sinh cần xác nhận để hoàn tất kết nối.
            </p>
            <input
              type="email"
              placeholder="Nhập email học sinh"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddChild()}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddChildModal(false);
                  setStudentEmail('');
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  background: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleAddChild}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: '#4CAF50',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
