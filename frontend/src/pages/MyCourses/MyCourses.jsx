import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Award, CheckCircle, Clock, Target,
  TrendingUp, Star, Lock, Play, ChevronRight,
  Home, Calendar, User, GraduationCap
} from 'lucide-react';
import './MyCourses.css';

// Dữ liệu giả đầy đủ cho các khóa học từ lớp 1-12
const coursesData = {
  'Lớp 1': [
    {
      id: 'g1_vocab_foundation',
      name: 'Nền Tảng Từ Vựng',
      category: 'vocabulary',
      totalUnits: 18,
      completedUnits: 18,
      cupsEarned: 40,
      totalCups: 30,
      status: 'completed',
      instructor: '👩‍🏫',
      level: 'Beginner'
    },
    {
      id: 'g1_phonics',
      name: 'Phát Âm Cơ Bản',
      category: 'pronunciation',
      totalUnits: 18,
      completedUnits: 12,
      cupsEarned: 28,
      totalCups: 36,
      status: 'in-progress',
      instructor: '👨‍🏫',
      level: 'Beginner'
    },
    {
      id: 'g1_listening',
      name: 'Nghe Chép Chính Tả',
      category: 'listening',
      totalUnits: 15,
      completedUnits: 0,
      cupsEarned: 1,
      totalCups: 30,
      status: 'not-started',
      instructor: '👩‍🏫',
      level: 'Beginner'
    },
    {
      id: 'g1_speaking',
      name: 'Ngữ Pháp Cơ Bản',
      category: 'grammar',
      totalUnits: 20,
      completedUnits: 0,
      cupsEarned: 0,
      totalCups: 34,
      status: 'locked',
      instructor: '👨‍🏫',
      level: 'Beginner'
    }
  ],
  'Lớp 2': [
    {
      id: 'g2_vocab',
      name: 'Từ Vựng Nâng Cao',
      category: 'vocabulary',
      totalUnits: 20,
      completedUnits: 15,
      cupsEarned: 35,
      totalCups: 40,
      status: 'in-progress',
      instructor: '👩‍🏫',
      level: 'Elementary'
    },
    {
      id: 'g2_reading',
      name: 'Đọc Hiểu Cơ Bản',
      category: 'reading',
      totalUnits: 16,
      completedUnits: 8,
      cupsEarned: 18,
      totalCups: 32,
      status: 'in-progress',
      instructor: '👨‍🏫',
      level: 'Elementary'
    },
    {
      id: 'g2_writing',
      name: 'Viết Câu Đơn Giản',
      category: 'writing',
      totalUnits: 14,
      completedUnits: 0,
      cupsEarned: 0,
      totalCups: 28,
      status: 'not-started',
      instructor: '👩‍🏫',
      level: 'Elementary'
    },
    {
      id: 'g2_grammar',
      name: 'Ngữ Pháp Tiếp Theo',
      category: 'grammar',
      totalUnits: 18,
      completedUnits: 0,
      cupsEarned: 0,
      totalCups: 36,
      status: 'locked',
      instructor: '👨‍🏫',
      level: 'Elementary'
    }
  ],
  'Lớp 3': [
    {
      id: 'g3_speaking',
      name: 'Speaking Cơ Bản Plus',
      category: 'speaking',
      totalUnits: 24,
      completedUnits: 20,
      cupsEarned: 42,
      totalCups: 48,
      status: 'in-progress',
      instructor: '👩‍🏫',
      level: 'Pre-Intermediate'
    },
    {
      id: 'g3_writing',
      name: 'Writing Cơ Bản Plus 2',
      category: 'writing',
      totalUnits: 26,
      completedUnits: 12,
      cupsEarned: 24,
      totalCups: 52,
      status: 'in-progress',
      instructor: '👨‍🏫',
      level: 'Pre-Intermediate'
    },
    {
      id: 'g3_reading',
      name: 'Reading Cơ Bản',
      category: 'reading',
      totalUnits: 20,
      completedUnits: 5,
      cupsEarned: 10,
      totalCups: 40,
      status: 'in-progress',
      instructor: '👩‍🏫',
      level: 'Pre-Intermediate'
    },
    {
      id: 'g3_grammar',
      name: 'Từ Vựng Cơ Bản Plus',
      category: 'vocabulary',
      totalUnits: 22,
      completedUnits: 0,
      cupsEarned: 1,
      totalCups: 44,
      status: 'not-started',
      instructor: '👨‍🏫',
      level: 'Pre-Intermediate'
    }
  ],
  'Lớp 4': [
    {
      id: 'g4_vocab',
      name: 'Từ Vựng Trung Cấp',
      category: 'vocabulary',
      totalUnits: 25,
      completedUnits: 18,
      cupsEarned: 38,
      totalCups: 50,
      status: 'in-progress',
      instructor: '👩‍🏫',
      level: 'Intermediate'
    },
    {
      id: 'g4_grammar',
      name: 'Ngữ Pháp Trung Cấp',
      category: 'grammar',
      totalUnits: 28,
      completedUnits: 10,
      cupsEarned: 22,
      totalCups: 56,
      status: 'in-progress',
      instructor: '👨‍🏫',
      level: 'Intermediate'
    },
    {
      id: 'g4_listening',
      name: 'Listening Skills',
      category: 'listening',
      totalUnits: 20,
      completedUnits: 0,
      cupsEarned: 0,
      totalCups: 40,
      status: 'not-started',
      instructor: '👩‍🏫',
      level: 'Intermediate'
    }
  ],
  'Lớp 5': [
    {
      id: 'g5_reading',
      name: 'Reading Comprehension',
      category: 'reading',
      totalUnits: 30,
      completedUnits: 25,
      cupsEarned: 52,
      totalCups: 60,
      status: 'in-progress',
      instructor: '👩‍🏫',
      level: 'Upper-Intermediate'
    },
    {
      id: 'g5_writing',
      name: 'Essay Writing Basics',
      category: 'writing',
      totalUnits: 24,
      completedUnits: 15,
      cupsEarned: 32,
      totalCups: 48,
      status: 'in-progress',
      instructor: '👨‍🏫',
      level: 'Upper-Intermediate'
    },
    {
      id: 'g5_speaking',
      name: 'Conversation Skills',
      category: 'speaking',
      totalUnits: 22,
      completedUnits: 8,
      cupsEarned: 16,
      totalCups: 44,
      status: 'in-progress',
      instructor: '👩‍🏫',
      level: 'Upper-Intermediate'
    }
  ],
  'Lớp 6': [
    {
      id: 'g6_grammar',
      name: 'Grammar Mastery',
      category: 'grammar',
      totalUnits: 32,
      completedUnits: 28,
      cupsEarned: 58,
      totalCups: 64,
      status: 'in-progress',
      instructor: '👨‍🏫',
      level: 'Advanced'
    },
    {
      id: 'g6_vocab',
      name: 'Academic Vocabulary',
      category: 'vocabulary',
      totalUnits: 28,
      completedUnits: 20,
      cupsEarned: 42,
      totalCups: 56,
      status: 'in-progress',
      instructor: '👩‍🏫',
      level: 'Advanced'
    },
    {
      id: 'g6_writing',
      name: 'Advanced Writing',
      category: 'writing',
      totalUnits: 26,
      completedUnits: 12,
      cupsEarned: 25,
      totalCups: 52,
      status: 'in-progress',
      instructor: '👨‍🏫',
      level: 'Advanced'
    }
  ]
};

// Generate data for grades 7-12
for (let grade = 7; grade <= 12; grade++) {
  coursesData[`Lớp ${grade}`] = [
    {
      id: `g${grade}_comprehensive`,
      name: `Tiếng Anh Toàn Diện Lớp ${grade}`,
      category: 'general',
      totalUnits: 35 + grade,
      completedUnits: Math.floor(Math.random() * (35 + grade)),
      cupsEarned: Math.floor(Math.random() * 70),
      totalCups: 70 + grade * 2,
      status: Math.random() > 0.3 ? 'in-progress' : 'not-started',
      instructor: grade % 2 === 0 ? '👩‍🏫' : '👨‍🏫',
      level: grade <= 8 ? 'Advanced' : 'Expert'
    },
    {
      id: `g${grade}_reading`,
      name: `Reading Advanced Level ${grade}`,
      category: 'reading',
      totalUnits: 30,
      completedUnits: Math.floor(Math.random() * 30),
      cupsEarned: Math.floor(Math.random() * 60),
      totalCups: 60,
      status: Math.random() > 0.5 ? 'in-progress' : 'not-started',
      instructor: '👩‍🏫',
      level: grade <= 8 ? 'Advanced' : 'Expert'
    },
    {
      id: `g${grade}_writing`,
      name: `Writing Skills Lớp ${grade}`,
      category: 'writing',
      totalUnits: 28,
      completedUnits: Math.floor(Math.random() * 28),
      cupsEarned: Math.floor(Math.random() * 56),
      totalCups: 56,
      status: Math.random() > 0.4 ? 'in-progress' : 'not-started',
      instructor: '👨‍🏫',
      level: grade <= 8 ? 'Advanced' : 'Expert'
    }
  ];
}

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

const MyCourses = () => {
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState('Lớp 3');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeMenuItem, setActiveMenuItem] = useState('my-courses');

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: Home, path: '/lessons' },
    { id: 'study-plan', label: 'Kế hoạch học tập', icon: Calendar, path: '/study-plan' },
    { id: 'my-courses', label: 'Khóa học của tôi', icon: BookOpen, path: '/my-courses' },
    { id: 'practice', label: 'Luyện tập', icon: Target, path: '/lessons/practice' },
    { id: 'profile', label: 'Hồ sơ học tập', icon: User, path: '/learning-profile' }
  ];

  const grades = Object.keys(coursesData);
  const currentCourses = coursesData[selectedGrade] || [];
  
  const filteredCourses = filterCategory === 'all' 
    ? currentCourses 
    : currentCourses.filter(c => c.category === filterCategory);

  const stats = {
    total: currentCourses.length,
    completed: currentCourses.filter(c => c.status === 'completed').length,
    inProgress: currentCourses.filter(c => c.status === 'in-progress').length,
    totalCups: currentCourses.reduce((sum, c) => sum + c.cupsEarned, 0)
  };

  return (
    <div className="my-courses-wrapper">
      {/* Sidebar Trái: Menu điều hướng */}
      <aside className="courses-sidebar-left">
        <div className="sidebar-menu">
          <div className="program-selector">
            <div className="program-badge">
              <GraduationCap size={20} />
              <span>Tiếng Anh Lớp 8</span>
            </div>
          </div>
          
          <nav className="menu-nav">
            {menuItems.map(item => (
              item.path ? (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
                  onClick={() => setActiveMenuItem(item.id)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ) : (
                <button
                  key={item.id}
                  className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
                  onClick={() => setActiveMenuItem(item.id)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              )
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="back-to-home-btn" onClick={() => navigate('/')}>
              ← Trở về trang chủ
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
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

        {/* Category Filter */}
        <div className="category-filter">
          <button
            className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${filterCategory === 'vocabulary' ? 'active' : ''}`}
            onClick={() => setFilterCategory('vocabulary')}
          >
            Từ vựng
          </button>
          <button
            className={`filter-btn ${filterCategory === 'grammar' ? 'active' : ''}`}
            onClick={() => setFilterCategory('grammar')}
          >
            Ngữ pháp
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
          <button
            className={`filter-btn ${filterCategory === 'speaking' ? 'active' : ''}`}
            onClick={() => setFilterCategory('speaking')}
          >
            Nói
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="courses-grid">
        {filteredCourses.map(course => {
          const colors = categoryColors[course.category];
          const progress = (course.completedUnits / course.totalUnits) * 100;
          const cupProgress = (course.cupsEarned / course.totalCups) * 100;

          return (
            <div key={course.id} className="course-card">
              {/* Card Header with gradient background */}
              <div 
                className="card-header"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent}20 100%)` 
                }}
              >
                <div className="instructor-badge">{course.instructor}</div>
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
                    console.log('=== DEBUG INFO ===');
                    console.log('Course category:', course.category);
                    console.log('Course ID:', course.id);
                    console.log('Course name:', course.name);
                    console.log('Is speaking?', course.category === 'speaking');
                    let targetUrl;
                    if (course.category === 'speaking') {
                      targetUrl = `/speaking/${course.id}`;
                    } else if (course.category === 'writing') {
                      targetUrl = `/writing/${course.id}`;
                    } else if (course.category === 'vocabulary') {
                      targetUrl = `/vocabulary/${course.id}`;
                    } else {
                      targetUrl = `/learn/${course.id}`;
                    }
                    console.log('Target URL:', targetUrl);
                    console.log('Current URL:', window.location.href);
                    console.log('==================');
                    
                    // Force navigation
                    window.location.href = targetUrl;
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
  );
};

export default MyCourses;

