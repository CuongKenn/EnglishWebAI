import React, { useState } from 'react';
import { Users, TrendingUp, CheckCircle, Award, Download } from 'lucide-react';
import './StatisticsReports.css';

const StatisticsReports = () => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('current');

  const stats = [
    { label: 'Tổng học sinh', value: 118, icon: Users, color: '#3b82f6' },
    { label: 'Điểm TB chung', value: 7.9, icon: TrendingUp, color: '#10b981' },
    { label: 'Hoàn thành', value: '86%', icon: CheckCircle, color: '#8b5cf6' },
    { label: 'Xuất sắc', value: '43 HS', icon: Award, color: '#f97316' }
  ];

  const classPerformance = [
    { className: '10A1', avgScore: 7.8, students: 32 },
    { className: '10A2', avgScore: 8.2, students: 30 },
    { className: '11B1', avgScore: 7.5, students: 28 },
    { className: '11B2', avgScore: 8.0, students: 28 }
  ];

  const gradeDistribution = [
    { range: 'Xuất sắc (9-10)', count: 35, color: '#10b981', percentage: 30 },
    { range: 'Giỏi (8-8.9)', count: 42, color: '#3b82f6', percentage: 35 },
    { range: 'Khá (7-7.9)', count: 28, color: '#f59e0b', percentage: 24 },
    { range: 'Trung bình (5-6.9)', count: 13, color: '#ef4444', percentage: 11 }
  ];

  const maxScore = Math.max(...classPerformance.map(c => c.avgScore));

  return (
    <div className="statistics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Thống kê & Báo cáo</h1>
          <p className="page-subtitle">Phân tích kết quả học tập và tiến độ của học sinh</p>
        </div>
        <button className="export-btn">
          <Download size={16} />
          Xuất báo cáo
        </button>
      </div>

      {/* Filters */}
      <div className="stats-filters">
        <select 
          className="filter-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="all">Tất cả lớp</option>
          <option value="10A1">Lớp 10A1</option>
          <option value="10A2">Lớp 10A2</option>
          <option value="11B1">Lớp 11B1</option>
          <option value="11B2">Lớp 11B2</option>
        </select>
        <select 
          className="filter-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="current">Tháng này</option>
          <option value="last">Tháng trước</option>
          <option value="quarter">Quý này</option>
          <option value="year">Năm nay</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ background: stat.color }}>
                <Icon size={24} color="white" />
              </div>
              <div className="stat-content">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Class Performance Chart */}
        <div className="chart-card">
          <h2 className="chart-title">Kết quả theo lớp</h2>
          <div className="bar-chart">
            {classPerformance.map((cls, index) => (
              <div key={index} className="bar-item">
                <div className="bar-wrapper">
                  <div 
                    className="bar-fill"
                    style={{ 
                      height: `${(cls.avgScore / 10) * 100}%`
                    }}
                  >
                    <span className="bar-value">{cls.avgScore}</span>
                  </div>
                </div>
                <div className="bar-label">{cls.className}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-dot" style={{ background: '#8b5cf6' }}></span>
              Điểm TB
            </span>
          </div>
        </div>

        {/* Grade Distribution Chart */}
        <div className="chart-card">
          <h2 className="chart-title">Phân bố điểm</h2>
          <div className="pie-chart">
            <div className="pie-visual">
              <svg viewBox="0 0 100 100" className="pie-svg">
                <circle cx="50" cy="50" r="40" fill="#10b981" />
                <circle cx="50" cy="50" r="40"
                  strokeDasharray="75 25" 
                  strokeDashoffset="0"
                  stroke="#3b82f6"
                  strokeWidth="80"
                  fill="none"
                  transform="rotate(-90 50 50)"
                />
                <circle cx="50" cy="50" r="40"
                  strokeDasharray="24 76" 
                  strokeDashoffset="-75"
                  stroke="#f59e0b"
                  strokeWidth="80"
                  fill="none"
                  transform="rotate(-90 50 50)"
                />
                <circle cx="50" cy="50" r="40"
                  strokeDasharray="11 89" 
                  strokeDashoffset="-99"
                  stroke="#ef4444"
                  strokeWidth="80"
                  fill="none"
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </div>
          </div>
          <div className="grade-legend">
            {gradeDistribution.map((grade, index) => (
              <div key={index} className="grade-item">
                <span 
                  className="grade-dot"
                  style={{ background: grade.color }}
                ></span>
                <span className="grade-label">{grade.range}</span>
                <span className="grade-value">{grade.count} HS ({grade.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="additional-stats">
        <div className="stat-section">
          <h2 className="section-title">Phân tích theo kỹ năng</h2>
          <div className="skill-stats">
            <div className="skill-item">
              <span className="skill-name">Reading</span>
              <div className="skill-bar">
                <div className="skill-fill" style={{ width: '85%' }}></div>
              </div>
              <span className="skill-score">8.5</span>
            </div>
            <div className="skill-item">
              <span className="skill-name">Writing</span>
              <div className="skill-bar">
                <div className="skill-fill" style={{ width: '75%' }}></div>
              </div>
              <span className="skill-score">7.5</span>
            </div>
            <div className="skill-item">
              <span className="skill-name">Listening</span>
              <div className="skill-bar">
                <div className="skill-fill" style={{ width: '80%' }}></div>
              </div>
              <span className="skill-score">8.0</span>
            </div>
            <div className="skill-item">
              <span className="skill-name">Speaking</span>
              <div className="skill-bar">
                <div className="skill-fill" style={{ width: '70%' }}></div>
              </div>
              <span className="skill-score">7.0</span>
            </div>
          </div>
        </div>

        <div className="stat-section">
          <h2 className="section-title">Tiến độ theo tháng</h2>
          <div className="month-progress">
            <div className="progress-item">
              <span className="month-label">Tháng 10</span>
              <span className="progress-value">7.9</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsReports;
