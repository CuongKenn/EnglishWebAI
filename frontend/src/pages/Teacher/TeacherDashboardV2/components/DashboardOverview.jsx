import React, { useState, useEffect } from 'react';
import { Users, FileCheck, HelpCircle, Clock } from 'lucide-react';
import './DashboardOverview.css';

const DashboardOverview = () => {
  const [teacherName, setTeacherName] = useState('Thầy/Cô Nguyễn Văn A');
  const [stats, setStats] = useState({
    totalClasses: 8,
    totalStudents: 245,
    totalTests: 32,
    totalQuestions: 1248
  });

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      title: 'Lớp 10A1 hoàn thành bài kiểm tra giữa kỳ',
      time: '10 phút trước',
      type: 'success'
    },
    {
      id: 2,
      title: 'Đã thêm 15 câu hỏi mới vào ngân hàng',
      time: '1 giờ trước',
      type: 'info'
    },
    {
      id: 3,
      title: 'Bài kiểm tra "Unit 5 - Listening" đã được tạo',
      time: '2 giờ trước',
      type: 'info'
    },
    {
      id: 4,
      title: 'Lớp 11B2 cần chấm điểm (25 bài)',
      time: '3 giờ trước',
      type: 'warning'
    }
  ]);

  const [upcomingTests, setUpcomingTests] = useState([
    {
      id: 1,
      className: '10A1',
      title: 'Kiểm tra 15 phút - Unit 6',
      date: '28/10/2025',
      students: 32
    },
    {
      id: 2,
      className: '11B2',
      title: 'Kiểm tra giữa kỳ HK1',
      date: '30/10/2025',
      students: 28
    },
    {
      id: 3,
      className: '10A3',
      title: 'Bài tập về nhà - Reading',
      date: '01/11/2025',
      students: 30
    }
  ]);

  useEffect(() => {
    // Fetch teacher info from localStorage or API
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.full_name) {
          setTeacherName(`Thầy/Cô ${user.full_name}`);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'success':
        return '●';
      case 'info':
        return '●';
      case 'warning':
        return '●';
      default:
        return '●';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'info':
        return '#3b82f6';
      case 'warning':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="dashboard-overview">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Chào mừng, {teacherName}</h1>
          <p className="dashboard-subtitle">Tổng quan hoạt động giảng dạy của bạn</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6' }}>
            <Users size={24} color="white" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Tổng số lớp</div>
            <div className="stat-value">{stats.totalClasses}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <Users size={24} color="white" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Học sinh</div>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf6' }}>
            <FileCheck size={24} color="white" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Bài kiểm tra</div>
            <div className="stat-value">{stats.totalTests}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f97316' }}>
            <HelpCircle size={24} color="white" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Câu hỏi</div>
            <div className="stat-value">{stats.totalQuestions.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Recent Activities */}
        <div className="activity-card">
          <div className="card-header">
            <Clock size={20} color="#8b5cf6" />
            <h2 className="card-title">Hoạt động gần đây</h2>
          </div>
          <div className="activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <span 
                  className="activity-dot" 
                  style={{ color: getActivityColor(activity.type) }}
                >
                  {getActivityIcon(activity.type)}
                </span>
                <div className="activity-info">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tests */}
        <div className="upcoming-card">
          <div className="card-header">
            <FileCheck size={20} color="#8b5cf6" />
            <h2 className="card-title">Bài kiểm tra sắp tới</h2>
          </div>
          <div className="upcoming-list">
            {upcomingTests.map((test) => (
              <div key={test.id} className="upcoming-item">
                <div className="upcoming-badge" style={{
                  background: test.className.includes('10') ? '#ede9fe' : 
                              test.className.includes('11') ? '#fce7f3' : '#dbeafe',
                  color: test.className.includes('10') ? '#7c3aed' : 
                         test.className.includes('11') ? '#db2777' : '#2563eb'
                }}>
                  {test.className}
                </div>
                <div className="upcoming-info">
                  <div className="upcoming-title">{test.title}</div>
                  <div className="upcoming-meta">
                    <span>{test.date}</span>
                    <span>{test.students} học sinh</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
