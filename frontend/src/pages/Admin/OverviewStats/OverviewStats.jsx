import React, { useState } from 'react';
import './OverviewStats.css';

const OverviewStats = () => {
  const [timeFilter, setTimeFilter] = useState('7days');

  // Sample statistics data
  const stats = {
    totalOrders: 16247,
    orderChange: -6.8,
    newCustomers: 356,
    customerChange: 26.5,
    totalRevenue: '₫245.8M',
    revenueChange: 12.3,
    avgCompletion: '85%',
    completionChange: 4.2
  };

  const courseCompletion = [
    { name: 'English A1', progress: 92 },
    { name: 'English A2', progress: 78 },
    { name: 'English B1', progress: 85 },
    { name: 'English B2', progress: 65 },
    { name: 'English C1', progress: 58 }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'success',
      icon: '✅',
      title: 'Học sinh mới đăng ký',
      description: 'Nguyễn Văn A đã đăng ký khóa English A1',
      time: '5 phút trước'
    },
    {
      id: 2,
      type: 'info',
      icon: '📚',
      title: 'Lớp học mới được tạo',
      description: 'Giáo viên Trần B tạo lớp English B2 - Morning',
      time: '15 phút trước'
    },
    {
      id: 3,
      type: 'warning',
      icon: '⚠️',
      title: 'Cảnh báo sĩ số',
      description: 'Lớp English A1 sắp đầy (28/30)',
      time: '1 giờ trước'
    },
    {
      id: 4,
      type: 'success',
      icon: '🎓',
      title: 'Hoàn thành khóa học',
      description: '15 học sinh hoàn thành khóa English A2',
      time: '2 giờ trước'
    }
  ];

  const topTeachers = [
    { id: 1, name: 'Nguyễn Văn A', role: 'Giáo viên', score: 985 },
    { id: 2, name: 'Trần Thị B', role: 'Giáo viên', score: 892 },
    { id: 3, name: 'Lê Minh C', role: 'Giáo viên', score: 845 },
    { id: 4, name: 'Phạm Thu D', role: 'Giáo viên', score: 798 },
    { id: 5, name: 'Hoàng Văn E', role: 'Giáo viên', score: 756 }
  ];

  const getRankClass = (index) => {
    switch(index) {
      case 0: return 'gold';
      case 1: return 'silver';
      case 2: return 'bronze';
      default: return 'default';
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-content">
        {/* Header */}
        <div className="admin-header">
          <h1>📊 Thống kê tổng quan</h1>
          <p>Xem báo cáo và phân tích hiệu suất hệ thống</p>
        </div>

        {/* Main Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Tổng đơn hàng</span>
              <span className={`stat-change ${stats.orderChange > 0 ? 'positive' : 'negative'}`}>
                {stats.orderChange > 0 ? '+' : ''}{stats.orderChange}%
              </span>
            </div>
            <div className="stat-value">{stats.totalOrders.toLocaleString()}</div>
            <div className="stat-subtitle">7 ngày qua</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Học sinh mới</span>
              <span className={`stat-change ${stats.customerChange > 0 ? 'positive' : 'negative'}`}>
                +{stats.customerChange}%
              </span>
            </div>
            <div className="stat-value">{stats.newCustomers}</div>
            <div className="stat-subtitle">7 ngày qua</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Doanh thu</span>
              <span className={`stat-change ${stats.revenueChange > 0 ? 'positive' : 'negative'}`}>
                +{stats.revenueChange}%
              </span>
            </div>
            <div className="stat-value">{stats.totalRevenue}</div>
            <div className="stat-subtitle">7 ngày qua</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Tỷ lệ hoàn thành</span>
              <span className={`stat-change ${stats.completionChange > 0 ? 'positive' : 'negative'}`}>
                +{stats.completionChange}%
              </span>
            </div>
            <div className="stat-value">{stats.avgCompletion}</div>
            <div className="stat-subtitle">Trung bình khóa học</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          {/* Course Completion Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Tiến độ khóa học</h3>
                <p className="chart-subtitle">Tỷ lệ hoàn thành theo khóa học</p>
              </div>
            </div>
            <div className="progress-bars">
              {courseCompletion.map((course, index) => (
                <div key={index} className="progress-item">
                  <div className="progress-header">
                    <span className="progress-label">{course.name}</span>
                    <span className="progress-value">{course.progress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Mức độ tương tác</h3>
                <p className="chart-subtitle">Người dùng hoạt động vs không hoạt động</p>
              </div>
              <div className="time-filter">
                <button 
                  className={timeFilter === '7days' ? 'active' : ''}
                  onClick={() => setTimeFilter('7days')}
                >
                  7 ngày
                </button>
                <button 
                  className={timeFilter === '30days' ? 'active' : ''}
                  onClick={() => setTimeFilter('30days')}
                >
                  30 ngày
                </button>
                <button 
                  className={timeFilter === '90days' ? 'active' : ''}
                  onClick={() => setTimeFilter('90days')}
                >
                  90 ngày
                </button>
              </div>
            </div>
            <div className="pie-chart-container">
              <div className="pie-chart">
                <div className="pie-chart-center">
                  <div className="pie-chart-percentage">72%</div>
                  <div className="pie-chart-label">Đang hoạt động</div>
                </div>
              </div>
              <div className="legend">
                <div className="legend-item">
                  <div className="legend-label">
                    <div className="legend-color primary"></div>
                    <span>Người dùng hoạt động</span>
                  </div>
                  <div className="legend-value">72%</div>
                </div>
                <div className="legend-item">
                  <div className="legend-label">
                    <div className="legend-color secondary"></div>
                    <span>Không hoạt động</span>
                  </div>
                  <div className="legend-value">28%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity and Leaderboard Section */}
        <div className="charts-grid">
          {/* Recent Activity */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Hoạt động gần đây</h3>
                <p className="chart-subtitle">Các sự kiện mới nhất trong hệ thống</p>
              </div>
            </div>
            <div className="activity-list">
              {recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.icon}
                  </div>
                  <div className="activity-details">
                    <h4 className="activity-title">{activity.title}</h4>
                    <p className="activity-description">{activity.description}</p>
                  </div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Teachers Leaderboard */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Giáo viên xuất sắc</h3>
                <p className="chart-subtitle">Top 5 giáo viên có điểm cao nhất</p>
              </div>
            </div>
            <div className="leaderboard">
              {topTeachers.map((teacher, index) => (
                <div key={teacher.id} className="leaderboard-item">
                  <div className={`leaderboard-rank ${getRankClass(index)}`}>
                    {index + 1}
                  </div>
                  <div className="leaderboard-avatar">
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="leaderboard-info">
                    <div className="leaderboard-name">{teacher.name}</div>
                    <div className="leaderboard-role">{teacher.role}</div>
                  </div>
                  <div className="leaderboard-score">{teacher.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Overview Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Tổng quan hiệu suất</h3>
              <p className="chart-subtitle">Biểu đồ theo dõi các chỉ số chính</p>
            </div>
            <div className="time-filter">
              <button className="active">01 May</button>
              <button>02 May</button>
              <button>03 May</button>
              <button>04 May</button>
              <button>05 May</button>
              <button>06 May</button>
              <button>07 May</button>
            </div>
          </div>
          <div className="chart-placeholder">
            📈 Biểu đồ tương tác sẽ được hiển thị ở đây (có thể tích hợp Chart.js hoặc Recharts)
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewStats;

