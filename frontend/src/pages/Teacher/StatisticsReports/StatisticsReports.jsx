import React, { useState, useEffect } from 'react';
import './StatisticsReports.css';
// apiClient imported but not used - API calls use different service
import { 
  UserGroupIcon, 
  StarIcon, 
  CheckCircleIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const StatisticsReports = () => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [classes, setClasses] = useState([]);
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    averageScore: 0,
    attendanceRate: 0,
    completionRate: 0,
    topPerformers: [],
    needsAttention: []
  });

  useEffect(() => {
    loadClasses();
    loadStatistics();
  }, [selectedClass, selectedPeriod]);

  const loadClasses = async () => {
    try {
      const res = await apiClient.get('/api/v1/classes/teaching');
      setClasses(res.data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadStatistics = () => {
    // Mock data - replace with API call
    setStatistics({
      totalStudents: 125,
      averageScore: 7.8,
      attendanceRate: 92,
      completionRate: 85,
      topPerformers: [
        { name: 'Nguyễn Văn A', class: 'English 10A', avgScore: 9.5, attendance: 100 },
        { name: 'Trần Thị B', class: 'English 10A', avgScore: 9.2, attendance: 98 },
        { name: 'Lê Văn C', class: 'English 11B', avgScore: 9.0, attendance: 100 }
      ],
      needsAttention: [
        { name: 'Phạm Thị D', class: 'English 10A', avgScore: 5.2, attendance: 70 },
        { name: 'Hoàng Văn E', class: 'English 11B', avgScore: 5.5, attendance: 65 }
      ]
    });
  };

  const exportReport = () => {
    alert('Đang xuất báo cáo... (Tính năng sẽ được triển khai)');
  };

  return (
    <div className="statistics-reports">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Thống kê & Báo cáo <ArrowTrendingUpIcon className="w-8 h-8 inline" />
          </h1>
          <p className="page-subtitle">Theo dõi hiệu suất học tập và tiến độ của học sinh</p>
        </div>
        <button className="btn-primary" onClick={exportReport}>
          <DocumentArrowDownIcon className="w-5 h-5 inline" /> Xuất báo cáo
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <select 
          className="filter-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="all">Tất cả lớp học</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
        <select 
          className="filter-select"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="week">Tuần này</option>
          <option value="month">Tháng này</option>
          <option value="semester">Học kỳ này</option>
          <option value="year">Năm học này</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card blue">
          <div className="metric-icon">
            <UserGroupIcon className="w-6 h-6" />
          </div>
          <div className="metric-content">
            <div className="metric-label">Tổng học sinh</div>
            <div className="metric-value">{statistics.totalStudents}</div>
            <div className="metric-trend">Trong tất cả lớp</div>
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-icon">
            <StarIcon className="w-6 h-6" />
          </div>
          <div className="metric-content">
            <div className="metric-label">Điểm trung bình</div>
            <div className="metric-value">{statistics.averageScore.toFixed(1)}/10</div>
            <div className="metric-trend positive">↑ 0.3 so với tháng trước</div>
          </div>
        </div>

        <div className="metric-card orange">
          <div className="metric-icon">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
          <div className="metric-content">
            <div className="metric-label">Tỷ lệ điểm danh</div>
            <div className="metric-value">{statistics.attendanceRate}%</div>
            <div className="metric-trend positive">↑ 2% so với tháng trước</div>
          </div>
        </div>

        <div className="metric-card purple">
          <div className="metric-icon">
            <ChartBarIcon className="w-6 h-6" />
          </div>
          <div className="metric-content">
            <div className="metric-label">Tỷ lệ hoàn thành BT</div>
            <div className="metric-value">{statistics.completionRate}%</div>
            <div className="metric-trend negative">↓ 3% so với tháng trước</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Performance Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <ChartBarIcon className="w-5 h-5 inline" /> Biểu đồ điểm trung bình theo tuần
            </h3>
            <select className="chart-select">
              <option>4 tuần gần nhất</option>
              <option>8 tuần gần nhất</option>
              <option>12 tuần gần nhất</option>
            </select>
          </div>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div className="bar" style={{height: '70%'}}><span>Tuần 1</span></div>
              <div className="bar" style={{height: '75%'}}><span>Tuần 2</span></div>
              <div className="bar" style={{height: '80%'}}><span>Tuần 3</span></div>
              <div className="bar" style={{height: '78%'}}><span>Tuần 4</span></div>
            </div>
          </div>
        </div>

        {/* Attendance Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <CheckCircleIcon className="w-5 h-5 inline" /> Tỷ lệ điểm danh theo lớp
            </h3>
          </div>
          <div className="chart-placeholder">
            <div className="attendance-bars">
              <div className="attendance-bar">
                <div className="bar-label">English 10A</div>
                <div className="bar-track">
                  <div className="bar-fill green" style={{width: '95%'}}>95%</div>
                </div>
              </div>
              <div className="attendance-bar">
                <div className="bar-label">English 10B</div>
                <div className="bar-track">
                  <div className="bar-fill green" style={{width: '88%'}}>88%</div>
                </div>
              </div>
              <div className="attendance-bar">
                <div className="bar-label">English 11A</div>
                <div className="bar-track">
                  <div className="bar-fill orange" style={{width: '75%'}}>75%</div>
                </div>
              </div>
              <div className="attendance-bar">
                <div className="bar-label">English 11B</div>
                <div className="bar-track">
                  <div className="bar-fill green" style={{width: '92%'}}>92%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Completion */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <DocumentTextIcon className="w-5 h-5 inline" /> Tình trạng hoàn thành bài tập
            </h3>
          </div>
          <div className="chart-placeholder">
            <div className="pie-chart-mockup">
              <div className="pie-segment completed">
                <div className="segment-label">Đã nộp<br/>85%</div>
              </div>
              <div className="pie-segment pending">
                <div className="segment-label">Chưa nộp<br/>15%</div>
              </div>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot green"></span>
                <span>Đã nộp (85%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot orange"></span>
                <span>Chưa nộp (15%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <ChartBarIcon className="w-5 h-5 inline" /> Phân bố điểm số
            </h3>
          </div>
          <div className="chart-placeholder">
            <div className="distribution-chart">
              <div className="dist-bar" style={{height: '30%'}}><span>0-5</span><span>12%</span></div>
              <div className="dist-bar" style={{height: '50%'}}><span>5-7</span><span>25%</span></div>
              <div className="dist-bar" style={{height: '80%'}}><span>7-8.5</span><span>40%</span></div>
              <div className="dist-bar" style={{height: '60%'}}><span>8.5-10</span><span>23%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers & Needs Attention */}
      <div className="students-grid">
        {/* Top Performers */}
        <div className="students-card">
          <div className="card-header">
            <h3>
              <StarIcon className="w-5 h-5 inline" /> Học sinh xuất sắc
            </h3>
          </div>
          <div className="students-list">
            {statistics.topPerformers.map((student, index) => (
              <div key={index} className="student-item top">
                <div className="student-rank">{index + 1}</div>
                <div className="student-info">
                  <div className="student-name">{student.name}</div>
                  <div className="student-class">{student.class}</div>
                </div>
                <div className="student-stats">
                  <span className="stat-badge green">
                    <StarIcon className="w-3 h-3 inline" /> {student.avgScore}
                  </span>
                  <span className="stat-badge blue">
                    <CheckCircleIcon className="w-3 h-3 inline" /> {student.attendance}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="students-card">
          <div className="card-header">
            <h3>
              <ExclamationTriangleIcon className="w-5 h-5 inline" /> Cần quan tâm
            </h3>
          </div>
          <div className="students-list">
            {statistics.needsAttention.map((student, index) => (
              <div key={index} className="student-item warning">
                <div className="student-icon">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
                <div className="student-info">
                  <div className="student-name">{student.name}</div>
                  <div className="student-class">{student.class}</div>
                </div>
                <div className="student-stats">
                  <span className="stat-badge orange">
                    <StarIcon className="w-3 h-3 inline" /> {student.avgScore}
                  </span>
                  <span className="stat-badge red">
                    <CheckCircleIcon className="w-3 h-3 inline" /> {student.attendance}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="activity-timeline-card">
        <div className="card-header">
          <h3>
            <CalendarIcon className="w-5 h-5 inline" /> Hoạt động gần đây
          </h3>
        </div>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot blue"></div>
            <div className="timeline-content">
              <div className="timeline-title">Tạo bài kiểm tra mới</div>
              <div className="timeline-desc">English Grammar Test - Unit 7</div>
              <div className="timeline-time">2 giờ trước</div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot green"></div>
            <div className="timeline-content">
              <div className="timeline-title">Chấm xong 25 bài tập</div>
              <div className="timeline-desc">Writing Assignment - My Favorite Book</div>
              <div className="timeline-time">5 giờ trước</div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot orange"></div>
            <div className="timeline-content">
              <div className="timeline-title">Điểm danh lớp English 10A</div>
              <div className="timeline-desc">28/30 học sinh có mặt</div>
              <div className="timeline-time">1 ngày trước</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsReports;

