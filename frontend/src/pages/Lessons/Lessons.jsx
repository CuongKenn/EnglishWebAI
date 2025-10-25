import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, GraduationCap, Target, User, 
  TrendingUp, Clock, Award, CheckCircle, Circle,
  Calendar, BarChart3, Sparkles, Play, ChevronRight
} from 'lucide-react';
import './Lessons.css';

const Lessons = () => {
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('overview');
  
  // Dữ liệu mô phỏng
  const userInfo = {
    name: 'Nguyễn Văn Hoài',
    grade: 'Lớp 8',
    currentLevel: 2.5,
    predictedLevel: 3.0,
    targetLevel: 5.0
  };

  const todayGoal = {
    message: 'Chà, hôm nay không có buổi học nào.',
    subMessage: 'Nghỉ ngơi và đừng quên xem lại tiến độ học nhé!',
    hasLesson: false
  };

  const studyProgress = {
    currentScore: 3.5,
    targetScore: 5.0,
    cupsEarned: 68,
    totalCups: 180,
    unitsCompleted: 28,
    totalUnits: 60,
    progress: 46, // phần trăm
    streakDays: 7,
    totalLessons: 24,
    completedLessons: 11
  };

  const learningStats = [
    { label: 'Tổng thời lượng', value: '15 phút', icon: Clock, color: '#3b82f6' },
    { label: 'Tổng số cúp đạt', value: '68', icon: Award, color: '#f59e0b' },
    { label: 'Tổng số bài test', value: '12', icon: Target, color: '#ef4444' },
    { label: 'Tổng số bài học', value: '24', icon: BookOpen, color: '#10b981' }
  ];

  const recentLessons = [
    { id: 1, title: 'Unit 15: Present Perfect', status: 'completed', score: 85 },
    { id: 2, title: 'Unit 16: Past Continuous', status: 'in-progress', score: null },
    { id: 3, title: 'Unit 17: Future Tenses', status: 'locked', score: null }
  ];

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: Home, path: '/lessons' },
    { id: 'study-plan', label: 'Kế hoạch học tập', icon: Calendar, path: '/study-plan' },
    { id: 'my-courses', label: 'Khóa học của tôi', icon: BookOpen, path: '/my-courses' },
    { id: 'practice', label: 'Luyện tập', icon: Target, path: '/lessons/practice' },
    { id: 'profile', label: 'Hồ sơ học tập', icon: User, path: '/learning-profile' }
  ];

  return (
    <div className="lessons-dashboard">
      {/* Sidebar Trái: Menu điều hướng */}
      <aside className="dashboard-sidebar-left">
        <div className="sidebar-menu">
          <div className="program-selector">
            <div className="program-badge">
              <GraduationCap size={20} />
              <span>Tiếng Anh {userInfo.grade}</span>
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

      {/* Nội dung chính */}
      <main className="dashboard-main">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="banner-content">
            <div className="greeting">
              <h1>Xin chào,</h1>
              <p>Cùng Prep tiến bộ mỗi ngày nào!</p>
            </div>
            <div className="mascot-container">
              <div className="mascot">
                <span className="mascot-emoji">🎓</span>
                <Sparkles className="sparkle sparkle-1" size={20} />
                <Sparkles className="sparkle sparkle-2" size={16} />
            </div>
          </div>
        </div>
      </div>

        {/* Mục tiêu hôm nay */}
        <section className="today-goal-section">
          <h2 className="section-title">Mục tiêu hôm nay</h2>
          <div className="today-goal-card">
            <div className="goal-message">
              <h3>{todayGoal.message}</h3>
              <p>{todayGoal.subMessage}</p>
              {!todayGoal.hasLesson && (
                <Link to="/study-plan" className="study-plan-btn">
                  Xem Kế hoạch học
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Tiến độ học tập - Cải thiện UX */}
        <section className="study-progress-section">
          <div className="section-header-with-icon">
            <TrendingUp size={24} className="section-icon" />
            <h2 className="section-title">Tiến độ học tập của bạn</h2>
          </div>
          
          <div className="progress-card">
            {/* Top Stats Row */}
            <div className="progress-stats-row">
              <div className="stat-box primary">
                <div className="stat-icon-wrapper">
                  <Target size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{studyProgress.currentScore}</span>
                  <span className="stat-label">Điểm hiện tại</span>
                </div>
              </div>

              <div className="stat-box success">
                <div className="stat-icon-wrapper">
                  <Award size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{studyProgress.cupsEarned}</span>
                  <span className="stat-label">Cúp đạt được</span>
                </div>
              </div>

              <div className="stat-box info">
                <div className="stat-icon-wrapper">
                  <CheckCircle size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{studyProgress.unitsCompleted}</span>
                  <span className="stat-label">Units hoàn thành</span>
                </div>
              </div>

              <div className="stat-box warning">
                <div className="stat-icon-wrapper">
                  <Clock size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{studyProgress.streakDays}</span>
                  <span className="stat-label">Ngày liên tiếp</span>
                </div>
              </div>
            </div>

            {/* Main Progress Section */}
            <div className="progress-main-content">
              <div className="progress-header-modern">
                <h3 className="progress-title">Tiến độ khóa học</h3>
                <div className="progress-percentage">
                  <span className="percentage-number">{studyProgress.progress}</span>
                  <span className="percentage-symbol">%</span>
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="progress-bar-modern">
                <div className="progress-track">
                  <div 
                    className="progress-fill"
                    style={{ width: `${studyProgress.progress}%` }}
                  >
                    <div className="progress-shine"></div>
                  </div>
                  <div className="progress-marker" style={{ left: `${studyProgress.progress}%` }}>
                    <div className="marker-dot"></div>
                  </div>
                </div>
                
                <div className="progress-labels">
                  <span className="label-start">0%</span>
                  <span className="label-current">{studyProgress.unitsCompleted}/{studyProgress.totalUnits} Units</span>
                  <span className="label-end">100%</span>
                </div>
              </div>

              {/* Milestones */}
              <div className="progress-milestones">
                <div className={`milestone ${studyProgress.progress >= 25 ? 'achieved' : ''}`}>
                  <div className="milestone-icon">🌱</div>
                  <span>25%</span>
                </div>
                <div className={`milestone ${studyProgress.progress >= 50 ? 'achieved' : ''}`}>
                  <div className="milestone-icon">🌿</div>
                  <span>50%</span>
                </div>
                <div className={`milestone ${studyProgress.progress >= 75 ? 'achieved' : ''}`}>
                  <div className="milestone-icon">🌳</div>
                  <span>75%</span>
                </div>
                <div className={`milestone ${studyProgress.progress >= 100 ? 'achieved' : ''}`}>
                  <div className="milestone-icon">🏆</div>
                  <span>100%</span>
                </div>
              </div>

              {/* Motivation Box */}
              <div className="motivation-box-modern">
                <div className="motivation-icon">💪</div>
                <div className="motivation-content">
                  <p className="motivation-title">Bạn đang làm rất tốt!</p>
                  <p className="motivation-text">
                    Đã hoàn thành {studyProgress.unitsCompleted} units. 
                    Còn {studyProgress.totalUnits - studyProgress.unitsCompleted} units nữa là đạt mục tiêu!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="progress-actions">
                <button className="continue-learning-btn-modern">
                  <Play size={20} />
                  <span>Tiếp tục học</span>
                  <ChevronRight size={20} />
                </button>
                <button className="view-details-btn">
                  <BarChart3 size={20} />
                  <span>Xem chi tiết</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Khóa học Writing */}
        <section className="writing-courses-section">
          <h2 className="section-title">Khóa học Writing</h2>
          <div className="courses-grid">
            <div className="course-card writing-course-card" onClick={() => navigate('/writing/essay-mastery')}>
              <div className="course-image">
                <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Essay Writing" />
                <div className="course-overlay">
                  <Play size={32} className="play-icon" />
                </div>
              </div>
              <div className="course-content">
                <div className="course-header">
                  <h3>Essay Writing Mastery</h3>
                  <span className="course-level">Intermediate</span>
                </div>
                <p className="course-description">
                  Master the art of essay writing with structured lessons and AI-powered feedback.
                </p>
                <div className="course-meta">
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>45 min</span>
                  </div>
                  <div className="meta-item">
                    <BookOpen size={16} />
                    <span>8 lessons</span>
                  </div>
                  <div className="meta-item">
                    <Target size={16} />
                    <span>Writing</span>
                  </div>
                </div>
                <div className="course-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }}></div>
                  </div>
                  <span className="progress-text">0% Complete</span>
                </div>
              </div>
            </div>

            <div className="course-card writing-course-card" onClick={() => navigate('/writing/g3_writing')}>
              <div className="course-image">
                <img src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Grade 3 Writing" />
                <div className="course-overlay">
                  <Play size={32} className="play-icon" />
                </div>
              </div>
              <div className="course-content">
                <div className="course-header">
                  <h3>Grade 3 Writing Practice</h3>
                  <span className="course-level">Grade 3</span>
                </div>
                <p className="course-description">
                  Develop basic writing skills with age-appropriate exercises and guided practice.
                </p>
                <div className="course-meta">
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>30 min</span>
                  </div>
                  <div className="meta-item">
                    <BookOpen size={16} />
                    <span>6 lessons</span>
                  </div>
                  <div className="meta-item">
                    <Target size={16} />
                    <span>Writing</span>
                  </div>
                </div>
                <div className="course-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }}></div>
                  </div>
                  <span className="progress-text">0% Complete</span>
                </div>
              </div>
            </div>

            <div className="course-card writing-course-card" onClick={() => navigate('/writing/creative-writing')}>
              <div className="course-image">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Creative Writing" />
                <div className="course-overlay">
                  <Play size={32} className="play-icon" />
                </div>
              </div>
              <div className="course-content">
                <div className="course-header">
                  <h3>Creative Writing Workshop</h3>
                  <span className="course-level">Advanced</span>
                </div>
                <p className="course-description">
                  Unleash your creativity with storytelling, poetry, and creative expression exercises.
                </p>
                <div className="course-meta">
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>60 min</span>
                  </div>
                  <div className="meta-item">
                    <BookOpen size={16} />
                    <span>10 lessons</span>
                  </div>
                  <div className="meta-item">
                    <Target size={16} />
                    <span>Writing</span>
                  </div>
                </div>
                <div className="course-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }}></div>
                  </div>
                  <span className="progress-text">0% Complete</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Khóa học Reading */}
        <section className="reading-courses-section">
          <h2 className="section-title">Khóa học Reading</h2>
          <div className="courses-grid">
            <div className="course-card reading-course-card" onClick={() => navigate('/learn/traffic-congestion')}>
              <div className="course-image">
                <img src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Traffic Congestion" />
                <div className="course-overlay">
                  <Play size={32} className="play-icon" />
                </div>
              </div>
              <div className="course-content">
                <div className="course-header">
                  <h3>Traffic Congestion: A Global Problem</h3>
                  <span className="course-level">Intermediate</span>
                </div>
                <p className="course-description">
                  Learn about traffic problems worldwide through interactive reading exercises and comprehension activities.
                </p>
                <div className="course-meta">
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>15 min</span>
                  </div>
                  <div className="meta-item">
                    <BookOpen size={16} />
                    <span>5 lessons</span>
                  </div>
                  <div className="meta-item">
                    <Target size={16} />
                    <span>Reading</span>
                  </div>
                </div>
                <div className="course-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }}></div>
                  </div>
                  <span className="progress-text">0% Complete</span>
                </div>
              </div>
            </div>

            <div className="course-card reading-course-card" onClick={() => navigate('/learn/climate-change')}>
              <div className="course-image">
                <img src="https://images.unsplash.com/photo-1569163139394-de446e504b1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Climate Change" />
                <div className="course-overlay">
                  <Play size={32} className="play-icon" />
                </div>
              </div>
              <div className="course-content">
                <div className="course-header">
                  <h3>Climate Change and Environment</h3>
                  <span className="course-level">Advanced</span>
                </div>
                <p className="course-description">
                  Explore environmental issues and climate change through comprehensive reading materials.
                </p>
                <div className="course-meta">
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>20 min</span>
                  </div>
                  <div className="meta-item">
                    <BookOpen size={16} />
                    <span>7 lessons</span>
                  </div>
                  <div className="meta-item">
                    <Target size={16} />
                    <span>Reading</span>
                  </div>
                </div>
                <div className="course-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }}></div>
                  </div>
                  <span className="progress-text">0% Complete</span>
                </div>
              </div>
            </div>

            <div className="course-card reading-course-card" onClick={() => navigate('/learn/technology-innovation')}>
              <div className="course-image">
                <img src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Technology Innovation" />
                <div className="course-overlay">
                  <Play size={32} className="play-icon" />
                </div>
              </div>
              <div className="course-content">
                <div className="course-header">
                  <h3>Technology and Innovation</h3>
                  <span className="course-level">Intermediate</span>
                </div>
                <p className="course-description">
                  Discover the latest technological advances and their impact on society through engaging texts.
                </p>
                <div className="course-meta">
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>18 min</span>
                  </div>
                  <div className="meta-item">
                    <BookOpen size={16} />
                    <span>6 lessons</span>
                  </div>
                  <div className="meta-item">
                    <Target size={16} />
                    <span>Reading</span>
                  </div>
                </div>
                <div className="course-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }}></div>
                  </div>
                  <span className="progress-text">0% Complete</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bài học gần đây */}
        <section className="recent-lessons-section">
          <h2 className="section-title">Bài học gần đây</h2>
          <div className="lessons-list">
            {recentLessons.map(lesson => (
              <div key={lesson.id} className={`lesson-item ${lesson.status}`}>
                <div className="lesson-icon">
                  {lesson.status === 'completed' ? (
                    <CheckCircle size={24} className="icon-completed" />
                  ) : lesson.status === 'in-progress' ? (
                    <Circle size={24} className="icon-inprogress" />
                  ) : (
                    <Circle size={24} className="icon-locked" />
                  )}
                </div>
                <div className="lesson-info">
                  <h4>{lesson.title}</h4>
                  {lesson.score && <span className="lesson-score">Điểm: {lesson.score}/100</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Sidebar Phải: Hồ sơ học tập */}
      <aside className="dashboard-sidebar-right">
        <div className="learning-profile-card">
          <div className="profile-header">
            <h3>Hồ sơ học tập</h3>
            <Link to="/learning-profile" className="view-all-link">Xem tất cả</Link>
          </div>

          <div className="grade-info">
            <h4>Lớp của bạn</h4>
            <div className="grade-levels">
              <div className="level-item">
                <div className="level-label">Hiện tại</div>
                <div className="level-value current">{userInfo.currentLevel}</div>
              </div>
              <div className="level-item">
                <div className="level-label">Dự đoán</div>
                <div className="level-value predicted">{userInfo.predictedLevel}</div>
              </div>
              <div className="level-item">
                <div className="level-label">Mục tiêu</div>
                <div className="level-value target">{userInfo.targetLevel}</div>
        </div>
      </div>
          </div>

          <div className="learning-summary">
            <h4>Tổng kết học tập</h4>
            <div className="stats-list">
              {learningStats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                    <stat.icon size={18} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">{stat.label}</span>
                    <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="motivation-box">
            <div className="motivation-icon">🐝</div>
            <p>Không có giáo dục nào tốt hơn việc học hỏi từ trải nghiệm</p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Lessons;