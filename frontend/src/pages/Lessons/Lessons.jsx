import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowTrendingUpIcon, ClockIcon, TrophyIcon, CheckCircleIcon, 
  CalendarIcon, ChartBarIcon, SparklesIcon, PlayIcon, 
  ChevronRightIcon, BookOpenIcon, BoltIcon, AcademicCapIcon
} from '@heroicons/react/24/outline';
import { CircleIcon } from '@heroicons/react/24/solid';
import ConsistentSidebarLayout from '../../components/Layout/ConsistentSidebarLayout';
import './Lessons.css';

const Lessons = () => {
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('overview');
  const [isContentPushed, setIsContentPushed] = useState(false);
  
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

  const handleMenuItemClick = (itemId) => {
    setActiveMenuItem(itemId);
    setIsContentPushed(true);
    
    // Reset animation after completion
    setTimeout(() => {
      setIsContentPushed(false);
    }, 300);
  };

  return (
    <ConsistentSidebarLayout 
      activeMenuItem={activeMenuItem}
      onMenuItemClick={handleMenuItemClick}
      courseTitle="Học bài"
    >
      <div className={`lessons-content-wrapper ${isContentPushed ? 'pushed-out' : ''}`}>
        {/* Nội dung chính */}
        <main className="dashboard-main">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="banner-content">
            <div className="greeting">
              <h1>Xin chào,</h1>
              <p>Cùng chúng tôi tiến bộ nên mỗi ngày</p>
            </div>
            <div className="mascot-container">
              <div className="mascot">
                <AcademicCapIcon className="mascot-icon" style={{width: 48, height: 48, strokeWidth: 2}} />
                <SparklesIcon className="sparkle sparkle-1" style={{width: 20, height: 20}} />
                <SparklesIcon className="sparkle sparkle-2" style={{width: 16, height: 16}} />
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
                  <div className="milestone-icon"><TrophyIcon className="w-6 h-6" /></div>
                  <span>75%</span>
                </div>
                <div className={`milestone ${studyProgress.progress >= 100 ? 'achieved' : ''}`}>
                  <div className="milestone-icon"><TrophyIcon className="w-6 h-6" /></div>
                  <span>100%</span>
                </div>
              </div>

              {/* Motivation Box */}
              <div className="motivation-box-modern">
                <div className="motivation-icon"><BoltIcon className="w-6 h-6" /></div>
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
                  <PlayIcon className="w-5 h-5" />
                  <span>Tiếp tục học</span>
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                <button className="view-details-btn">
                  <ChartBarIcon className="w-5 h-5" />
                  <span>Xem chi tiết</span>
                </button>
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
  </ConsistentSidebarLayout>
  );
};

export default Lessons;