import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Award, CheckCircle, Clock,
  TrendingUp, Star, Lock, Play, ChevronRight,
  Home, Calendar, User, Headphones, Mic, BookText, PenTool
} from 'lucide-react';
import './MyCourses.css';
import { coursesAPI } from '../../services/api';
import ConsistentSidebarLayout from '../../components/Layout/ConsistentSidebarLayout';

// Loại bỏ toàn bộ mock data; sẽ load từ API public courses

const categoryColors = {
  vocabulary: { bg: '#fef3c7', text: '#92400e', accent: '#f59e0b' },
  pronunciation: { bg: '#fce7f3', text: '#831843', accent: '#ec4899' },
  listening: { bg: '#dbeafe', text: '#1e3a8a', accent: '#3b82f6' },
  grammar: { bg: '#dcfce7', text: '#14532d', accent: '#10b981' },
  reading: { bg: '#e0e7ff', text: '#312e81', accent: '#6366f1' },
  writing: { bg: '#fed7aa', text: '#7c2d12', accent: '#f97316' },
  speaking: { bg: '#e9d5ff', text: '#581c87', accent: '#a855f7' },
  general: { bg: '#e2e8f0', text: '#1e293b', accent: '#64748b' }
};

const statusLabels = {
  'completed': 'Đã hoàn thành',
  'in-progress': 'Đang học',
  'not-started': 'Chưa học',
  'locked': 'Khóa'
};

// Function to get skill icon
const getSkillIcon = (skill) => {
  const iconProps = { size: 64, strokeWidth: 1.5 };
  switch(skill?.toLowerCase()) {
    case 'listening':
      return <Headphones {...iconProps} />;
    case 'speaking':
      return <Mic {...iconProps} />;
    case 'reading':
      return <BookText {...iconProps} />;
    case 'writing':
      return <PenTool {...iconProps} />;
    default:
      return <BookOpen {...iconProps} />;
  }
};

const MyCourses = () => {
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState('Lớp 3');
  const [filterCategory, setFilterCategory] = useState('all');
  // activeMenuItem and setActiveMenuItem not used - menu handled by parent layout
  // menuItems not used - menu defined in parent layout
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fixed 12 grades for selector
  const grades = Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`);

  // Load courses from backend when grade/category changes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const g = parseInt(selectedGrade.replace('Lớp ', ''));
        const params = { grade: g };
        if (filterCategory !== 'all') params.skill = filterCategory;
        const data = await coursesAPI.getCourses(params);
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        setCourses([]);
        setError(e?.detail || 'Không tải được danh sách khoá học');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedGrade, filterCategory]);

  const filteredCourses = useMemo(() => courses, [courses]);

  const stats = {
    total: filteredCourses.length,
    completed: filteredCourses.filter(c => c.status === 'completed').length,
    inProgress: filteredCourses.filter(c => c.status === 'in-progress').length,
    totalCups: filteredCourses.reduce((sum, c) => sum + (c.cupsEarned || 0), 0)
  };

  return (
    <ConsistentSidebarLayout
      activeMenuItem="my-courses"
      courseTitle="Học bài"
    >
      <div className="my-courses-wrapper">
        <div className="my-courses-page">
        {/* Icon Banner Bar với text nổi bật */}
        <div className="icon-banner-bar">
          <div className="icon-banner-content">
            <BookOpen size={32} className="banner-icon" />
            <h1 className="banner-title">Khóa học của tôi</h1>
          </div>
        </div>

        {/* Header Section */}
        <div className="courses-header">
        <div className="header-content">
          <h1 className="page-title">
          </h1>
          <p className="page-subtitle">
            Theo dõi tiến độ học tập và hoàn thành các khóa học của bạn
          </p>
        </div>
        
        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon total">
              <BookOpen size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Tổng khóa học</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon completed">
              <CheckCircle size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Đã hoàn thành</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon progress">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.inProgress}</span>
              <span className="stat-label">Đang học</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon cups">
              <Award size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalCups}</span>
              <span className="stat-label">Cúp đạt được</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Selector */}
      <div className="grade-selector-section">
        <div className="grade-selector">
          {grades.map(grade => (
            <button
              key={grade}
              className={`grade-btn ${selectedGrade === grade ? 'active' : ''}`}
              onClick={() => setSelectedGrade(grade)}
            >
              {grade}
            </button>
          ))}
        </div>

        {/* Category Filter (4 kỹ năng) */}
        <div className="category-filter">
          <button
            className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${filterCategory === 'listening' ? 'active' : ''}`}
            onClick={() => setFilterCategory('listening')}
          >
            Nghe
          </button>
          <button
            className={`filter-btn ${filterCategory === 'speaking' ? 'active' : ''}`}
            onClick={() => setFilterCategory('speaking')}
          >
            Nói
          </button>
          <button
            className={`filter-btn ${filterCategory === 'reading' ? 'active' : ''}`}
            onClick={() => setFilterCategory('reading')}
          >
            Đọc
          </button>
          <button
            className={`filter-btn ${filterCategory === 'writing' ? 'active' : ''}`}
            onClick={() => setFilterCategory('writing')}
          >
            Viết
          </button>
        </div>
      </div>

        {/* Courses Grid */}
      <div className="courses-grid">
        {loading && (
          <div className="empty-state">
            <BookOpen size={64} className="empty-icon" />
            <h3>Đang tải khoá học...</h3>
          </div>
        )}
        {(!loading && error) && (
          <div className="empty-state">
            <BookOpen size={64} className="empty-icon" />
            <h3>{error}</h3>
          </div>
        )}
        {!loading && !error && filteredCourses.map(course => {
          const colors = categoryColors[course.category] || { bg: '#e2e8f0', text: '#1e293b', accent: '#64748b' };
          const progress = course.totalUnits ? (course.completedUnits / course.totalUnits) * 100 : 0;
          const cupProgress = course.totalCups ? (course.cupsEarned / course.totalCups) * 100 : 0;

          return (
            <div key={course.id} className="course-card">
              {/* Card Header with gradient background */}
              <div 
                className="card-header"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent}20 100%)` 
                }}
              >
                <div className="instructor-badge" style={{ color: colors.accent }}>
                  {getSkillIcon(course.category)}
                </div>
                <div className="level-badge" style={{ background: colors.accent }}>
                  {course.level}
                </div>
              </div>

              {/* Course Info */}
              <div className="card-body">
                <h3 className="course-name">{course.name}</h3>
                
                {/* Status Badge */}
                <div className={`status-badge status-${course.status}`}>
                  {course.status === 'completed' && <CheckCircle size={14} />}
                  {course.status === 'in-progress' && <Play size={14} />}
                  {course.status === 'locked' && <Lock size={14} />}
                  <span>{statusLabels[course.status]}</span>
                </div>

                {/* Progress Section */}
                {course.status !== 'locked' && (
                  <>
                    <div className="progress-section">
                      <div className="progress-header">
                        <span className="progress-label">
                          {course.status === 'completed' 
                            ? `Hoàn thành ${course.completedUnits}/${course.totalUnits} Units`
                            : `Đã học ${course.completedUnits}/${course.totalUnits} Units`
                          }
                        </span>
                        <span className="progress-percent">{Math.round(progress)}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill"
                          style={{ 
                            width: `${progress}%`,
                            background: `linear-gradient(90deg, ${colors.accent} 0%, ${colors.accent}dd 100%)`
                          }}
                        />
                      </div>
                    </div>

                    {/* Cups Progress */}
                    <div className="cups-section">
                      <div className="cups-header">
                        <Award size={18} style={{ color: colors.accent }} />
                        <span className="cups-label">
                          {course.cupsEarned}/{course.totalCups} cúp
                        </span>
                      </div>
                      <div className="cups-bar-container">
                        <div 
                          className="cups-bar-fill"
                          style={{ 
                            width: `${cupProgress}%`,
                            background: colors.accent
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Action Button */}
                <button 
                  className="course-action-btn"
                  style={{ 
                    background: course.status === 'locked' ? '#cbd5e1' : colors.accent,
                    pointerEvents: course.status === 'locked' ? 'none' : 'auto',
                    border: 'none',
                    cursor: course.status === 'locked' ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => {
                    if (course.status === 'locked') return;
                    // Điều hướng tới trang nội dung khoá học tiêu chuẩn
                    navigate(`/course/${course.id}`);
                  }}
                >
                  {course.status === 'completed' && 'Xem lại'}
                  {course.status === 'in-progress' && 'Tiếp tục học'}
                  {course.status === 'not-started' && 'Bắt đầu học'}
                  {course.status === 'locked' && 'Khóa'}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="empty-state">
          <BookOpen size={64} className="empty-icon" />
          <h3>Không có khóa học nào</h3>
          <p>Thử thay đổi bộ lọc hoặc chọn lớp khác</p>
        </div>
      )}
        </div>
      </div>
    </ConsistentSidebarLayout>
  );
};

export default MyCourses;

