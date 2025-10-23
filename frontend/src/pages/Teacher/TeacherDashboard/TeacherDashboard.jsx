import React from 'react';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  // Sample data
  const projects = [
    {
      id: 1,
      name: 'English A1 - Morning Class',
      date: 'Jan 30, 2025',
      progress: 65,
      status: 'on-track',
      assigned: ['GV', 'HS'],
      count: 5
    },
    {
      id: 2,
      name: 'English B2 - Advanced',
      date: 'Feb 10, 2025',
      progress: 20,
      status: 'delayed',
      assigned: ['GV', 'HS'],
      count: 2
    },
    {
      id: 3,
      name: 'IELTS Preparation Course',
      date: 'Mar 1, 2025',
      progress: 45,
      status: 'at-risk',
      assigned: ['GV', 'HS'],
      count: 1
    },
    {
      id: 4,
      name: 'Business English Workshop',
      date: 'Feb 15, 2025',
      progress: 89,
      status: 'on-track',
      assigned: ['GV', 'HS'],
      count: 1
    },
    {
      id: 5,
      name: 'Conversation Club',
      date: 'Jan 25, 2025',
      progress: 100,
      status: 'completed',
      assigned: ['GV', 'HS'],
      count: 1
    }
  ];

  const getProgressFillClass = (progress) => {
    if (progress >= 70) return '';
    if (progress >= 40) return 'warning';
    return 'danger';
  };

  return (
    <div className="teacher-dashboard">
      <div className="teacher-container">
        {/* Header */}
        <div className="teacher-header">
          <div className="teacher-welcome">
            <div className="welcome-text">
              <h1>Chào mừng, Giáo viên! 👋</h1>
              <p>Đây là bảng điều khiển quản lý lớp học của bạn</p>
            </div>
            <div className="header-actions">
              <button className="btn-icon" title="Tìm kiếm">🔍</button>
              <button className="btn-icon" title="Thông báo">🔔</button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-title">Tổng dự án</div>
              <div className="stat-icon green">📦</div>
            </div>
            <div className="stat-value">6</div>
            <div className="stat-subtitle">2 Hoàn thành</div>
          </div>

          <div className="stat-card task">
            <div className="stat-header">
              <div className="stat-title">Nhiệm vụ</div>
              <div className="stat-icon blue">📋</div>
            </div>
            <div className="stat-value">132</div>
            <div className="stat-subtitle">28 Hoàn thành</div>
          </div>

          <div className="stat-card members">
            <div className="stat-header">
              <div className="stat-title">Học sinh</div>
              <div className="stat-icon orange">👥</div>
            </div>
            <div className="stat-value">8</div>
            <div className="stat-subtitle">2 Hoàn thành</div>
          </div>

          <div className="stat-card productivity">
            <div className="stat-header">
              <div className="stat-title">Năng suất</div>
              <div className="stat-icon purple">🏃</div>
            </div>
            <div className="stat-value">76%</div>
            <div className="stat-subtitle">26% Tăng</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Active Projects */}
          <div className="projects-section">
            <div className="section-header">
              <h2 className="section-title">Lớp học đang hoạt động</h2>
              <button className="btn-primary">+ Tạo lớp mới</button>
            </div>

            <table className="projects-table">
              <thead>
                <tr>
                  <th>Tên lớp</th>
                  <th>Tiến độ</th>
                  <th>Trạng thái</th>
                  <th>Phân công</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id}>
                    <td>
                      <div className="project-name">{project.name}</div>
                      <div className="project-date">{project.date}</div>
                    </td>
                    <td>
                      <div className="progress-bar-wrapper">
                        <div className="progress-text">{project.progress}%</div>
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${getProgressFillClass(project.progress)}`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${project.status}`}>
                        {project.status === 'on-track' && 'Đúng tiến độ'}
                        {project.status === 'delayed' && 'Trễ hạn'}
                        {project.status === 'at-risk' && 'Có rủi ro'}
                        {project.status === 'completed' && 'Hoàn thành'}
                      </span>
                    </td>
                    <td>
                      <div className="assigned-avatars">
                        <div className="avatar-group">
                          {project.assigned.map((initial, idx) => (
                            <div key={idx} className="avatar">{initial}</div>
                          ))}
                        </div>
                        {project.count > 0 && (
                          <div className="avatar-count">+{project.count}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <button className="action-btn" title="Tùy chọn">⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Task Progress */}
          <div className="task-progress-card">
            <div className="section-header" style={{ marginBottom: '20px' }}>
              <h3 className="section-title">Tiến độ công việc</h3>
            </div>

            <div className="progress-circle">
              <div style={{ 
                width: '150px', 
                height: '150px', 
                margin: '0 auto',
                borderRadius: '50%',
                background: 'conic-gradient(#10b981 0% 64%, #e5e7eb 64% 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  background: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  64%
                </div>
              </div>
              <div className="circle-value" style={{ fontSize: '24px', margin: '15px 0 0 0' }}>Tiến độ tổng thể</div>
            </div>

            <div className="progress-breakdown">
              <div className="breakdown-item completed">
                <div className="breakdown-icon">✅</div>
                <div className="breakdown-value">8</div>
                <div className="breakdown-label">Hoàn thành</div>
              </div>
              <div className="breakdown-item in-progress">
                <div className="breakdown-icon">🔄</div>
                <div className="breakdown-value">12</div>
                <div className="breakdown-label">Đang làm</div>
              </div>
              <div className="breakdown-item upcoming">
                <div className="breakdown-icon">⏰</div>
                <div className="breakdown-value">14</div>
                <div className="breakdown-label">Sắp tới</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

