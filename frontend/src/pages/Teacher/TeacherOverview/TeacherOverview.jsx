import React, { useEffect, useState } from 'react';
import { BellIcon, MagnifyingGlassIcon, BuildingLibraryIcon, UserGroupIcon, ClipboardDocumentListIcon, ChartBarIcon, ClockIcon, PlusIcon, CheckCircleIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import './TeacherOverview.css';
import apiClient from '../../../services/api';

const TeacherOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    upcomingTests: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      // Load classes
      const classesRes = await apiClient.get('/api/v1/classes/teaching');
      const classes = classesRes.data || [];
      
      // Calculate stats
      const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);
      
      setStats({
        totalClasses: classes.length,
        totalStudents: totalStudents,
        pendingSubmissions: 12, // TODO: Get from backend
        upcomingTests: 3 // TODO: Get from backend
      });

      // Mock upcoming classes
      setUpcomingClasses(classes.slice(0, 3).map(c => ({
        id: c.id,
        name: c.name,
        time: c.schedule || 'Thứ 2, 8:00-9:30',
        students: c.student_count || 0,
        color: c.color || 'blue'
      })));

      // Mock recent activities
      setRecentActivities([
        { id: 1, type: 'submission', text: 'Nguyễn Văn A đã nộp bài tập Tiếng Anh 12', time: '5 phút trước' },
        { id: 2, type: 'grade', text: 'Bạn đã chấm xong 15 bài kiểm tra', time: '1 giờ trước' },
        { id: 3, type: 'class', text: 'Lớp English 10A bắt đầu trong 30 phút', time: '2 giờ trước' },
        { id: 4, type: 'material', text: 'Đã thêm học liệu mới cho Lớp 11B', time: '3 giờ trước' }
      ]);

    } catch (error) {
      console.error('Failed to load overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-overview">
      <div className="overview-header">
        <div>
          <h1 className="page-title">Xin chào, Giáo viên!</h1>
          <p className="page-subtitle">Đây là tổng quan về hoạt động giảng dạy của bạn</p>
        </div>
        <div className="header-actions">
          <button className="btn-icon" title="Thông báo">
            <span className="notification-badge">3</span>
            <BellIcon className="w-5 h-5" />
          </button>
          <button className="btn-icon" title="Tìm kiếm"><MagnifyingGlassIcon className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Stats Cards - Larger and more prominent */}
      <div className="stats-grid">
        <div className="stat-card blue-gradient">
          <div className="stat-icon-wrapper blue">
            <span className="stat-icon"><BuildingLibraryIcon className="w-6 h-6" /></span>
          </div>
          <div className="stat-content">
            <div className="stat-label">Tổng số lớp học</div>
            <div className="stat-value">{stats.totalClasses}</div>
            <div className="stat-trend positive">↑ Đang giảng dạy</div>
          </div>
        </div>

        <div className="stat-card orange-gradient">
          <div className="stat-icon-wrapper orange">
            <span className="stat-icon"><UserGroupIcon className="w-6 h-6" /></span>
          </div>
          <div className="stat-content">
            <div className="stat-label">Tổng số học sinh</div>
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-trend">Đang theo học</div>
          </div>
        </div>

        <div className="stat-card purple-gradient">
          <div className="stat-icon-wrapper purple">
            <span className="stat-icon"><ClipboardDocumentListIcon className="w-6 h-6" /></span>
          </div>
          <div className="stat-content">
            <div className="stat-label">Bài tập chờ chấm</div>
            <div className="stat-value">{stats.pendingSubmissions}</div>
            <div className="stat-trend warning">⚠ Cần xử lý</div>
          </div>
        </div>

        <div className="stat-card green-gradient">
          <div className="stat-icon-wrapper green">
            <span className="stat-icon"><ChartBarIcon className="w-6 h-6" /></span>
          </div>
          <div className="stat-content">
            <div className="stat-label">Bài kiểm tra sắp tới</div>
            <div className="stat-value">{stats.upcomingTests}</div>
            <div className="stat-trend">📅 Tuần này</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="overview-grid">
        {/* Upcoming Classes */}
        <div className="overview-card">
          <div className="card-header">
            <h3 className="card-title">Lớp học sắp tới</h3>
            <button className="btn-text" onClick={() => navigate('/teacher-dashboard/classes')}>
              Xem tất cả →
            </button>
          </div>
          <div className="upcoming-classes-list">
            {upcomingClasses.map(cls => (
              <div key={cls.id} className="upcoming-class-item">
                <div className={`class-color-bar ${cls.color}`}></div>
                <div className="class-info">
                  <h4 className="class-name">{cls.name}</h4>
                  <p className="class-time"><ClockIcon className="inline w-4 h-4 mr-1" /> {cls.time}</p>
                </div>
                <div className="class-students">
                  <span className="student-count">{cls.students} HS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="overview-card">
          <div className="card-header">
            <h3 className="card-title">Hoạt động gần đây</h3>
            <button className="btn-text">Xem tất cả →</button>
          </div>
          <div className="activity-list">
            {recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'submission' && <ClipboardDocumentListIcon className="w-4 h-4" />}
                  {activity.type === 'grade' && <CheckCircleIcon className="w-4 h-4" />}
                  {activity.type === 'class' && <BuildingLibraryIcon className="w-4 h-4" />}
                  {activity.type === 'material' && <BookOpenIcon className="w-4 h-4" />}
                </div>
                <div className="activity-content">
                  <p className="activity-text">{activity.text}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overview-card quick-actions-card">
          <div className="card-header">
            <h3 className="card-title">Thao tác nhanh</h3>
          </div>
          <div className="quick-actions-grid">
            <button 
              className="quick-action-btn blue"
              onClick={() => navigate('/teacher-dashboard/assignments')}
            >
              <span className="action-icon"><PlusIcon className="w-5 h-5" /></span>
              <span className="action-text">Tạo bài tập mới</span>
            </button>
            <button 
              className="quick-action-btn green"
              onClick={() => navigate('/teacher-dashboard/grading')}
            >
              <span className="action-icon"><CheckCircleIcon className="w-5 h-5" /></span>
              <span className="action-text">Chấm điểm</span>
            </button>
            <button 
              className="quick-action-btn purple"
              onClick={() => navigate('/teacher-dashboard/materials')}
            >
              <span className="action-icon"><BookOpenIcon className="w-5 h-5" /></span>
              <span className="action-text">Thêm học liệu</span>
            </button>
            <button 
              className="quick-action-btn orange"
              onClick={() => navigate('/teacher-dashboard/statistics')}
            >
              <span className="action-icon"><ChartBarIcon className="w-5 h-5" /></span>
              <span className="action-text">Xem báo cáo</span>
            </button>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="overview-card chart-card">
          <div className="card-header">
            <h3 className="card-title">Hiệu suất giảng dạy</h3>
            <select className="chart-filter">
              <option>Tuần này</option>
              <option>Tháng này</option>
              <option>Năm này</option>
            </select>
          </div>
          <div className="chart-placeholder">
            <div className="chart-bars">
              <div className="bar" style={{height: '60%'}}><span>T2</span></div>
              <div className="bar" style={{height: '80%'}}><span>T3</span></div>
              <div className="bar" style={{height: '70%'}}><span>T4</span></div>
              <div className="bar" style={{height: '90%'}}><span>T5</span></div>
              <div className="bar" style={{height: '75%'}}><span>T6</span></div>
              <div className="bar" style={{height: '50%'}}><span>T7</span></div>
              <div className="bar" style={{height: '40%'}}><span>CN</span></div>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot blue"></span>
                <span>Số lượng bài đã chấm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherOverview;

