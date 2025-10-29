import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, GraduationCap, BookOpen, Target,
  Award, TrendingUp, Clock, CheckCircle, Star, Trophy,
  Zap, Heart, Book, MessageCircle, ChevronRight, BarChart3, Loader
} from 'lucide-react';
import ConsistentSidebarLayout from '../../components/Layout/ConsistentSidebarLayout';
import { coursesAPI } from '../../services/api';
import './LearningProfile.css';

const LearningProfile = () => {
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('profile');
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [isContentPushed, setIsContentPushed] = useState(false);
  
  // NEW: State for real data
  const [loading, setLoading] = useState(true);
  const [profileStats, setProfileStats] = useState(null);
  const [error, setError] = useState(null);

  const handleMenuItemClick = (itemId) => {
    setActiveMenuItem(itemId);
    setIsContentPushed(true);
    
    // Reset animation after completion
    setTimeout(() => {
      setIsContentPushed(false);
    }, 300);
  };

  // Fetch real data from API
  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.getLearningProfileStats();
        
        if (response.success) {
          setProfileStats(response.stats);
        }
      } catch (error) {
        console.error('Failed to load profile stats:', error);
        setError('Không thể tải thống kê. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileStats();
  }, []);

  // Computed values from real data or fallback to defaults
  const overallStats = profileStats ? {
    totalTime: profileStats.total_time.formatted,
    totalCups: profileStats.total_cups,
    totalTests: profileStats.total_tests,
    totalLessons: profileStats.total_lessons_completed,
    streak: 0, // TODO: Implement streak tracking
    level: 8, // TODO: Calculate from total_cups or other metrics
    rank: 'Gold',
    completionRate: 78 // TODO: Calculate from completed/total
  } : {
    totalTime: '0 giờ 0 phút',
    totalCups: 0,
    totalTests: 0,
    totalLessons: 0,
    streak: 0,
    level: 1,
    rank: 'Bronze',
    completionRate: 0
  };

  // Thống kê theo 4 kỹ năng chính - FROM REAL DATA
  const skillStats = profileStats ? [
    { 
      skill: 'Nghe', 
      icon: '🎧', 
      score: profileStats.skills.listening.score, 
      maxScore: profileStats.skills.listening.max_score, 
      progress: profileStats.skills.listening.percentage, 
      color: '#3b82f6',
      attempts: profileStats.skills.listening.attempts_count
    },
    { 
      skill: 'Nói', 
      icon: '🗣️', 
      score: profileStats.skills.speaking.score, 
      maxScore: profileStats.skills.speaking.max_score, 
      progress: profileStats.skills.speaking.percentage, 
      color: '#ec4899',
      attempts: profileStats.skills.speaking.attempts_count
    },
    { 
      skill: 'Đọc', 
      icon: '📖', 
      score: profileStats.skills.reading.score, 
      maxScore: profileStats.skills.reading.max_score, 
      progress: profileStats.skills.reading.percentage, 
      color: '#10b981',
      attempts: profileStats.skills.reading.attempts_count
    },
    { 
      skill: 'Viết', 
      icon: '✍️', 
      score: profileStats.skills.writing.score, 
      maxScore: profileStats.skills.writing.max_score, 
      progress: profileStats.skills.writing.percentage, 
      color: '#f59e0b',
      attempts: profileStats.skills.writing.attempts_count
    }
  ] : [
    { skill: 'Nghe', icon: '🎧', score: 0, maxScore: 10, progress: 0, color: '#3b82f6', attempts: 0 },
    { skill: 'Nói', icon: '🗣️', score: 0, maxScore: 10, progress: 0, color: '#ec4899', attempts: 0 },
    { skill: 'Đọc', icon: '📖', score: 0, maxScore: 10, progress: 0, color: '#10b981', attempts: 0 },
    { skill: 'Viết', icon: '✍️', score: 0, maxScore: 10, progress: 0, color: '#f59e0b', attempts: 0 }
  ];

  // Thành tích đạt được
  const achievements = [
    { id: 1, icon: '🔥', title: 'Streak Master', description: '7 ngày học liên tiếp', earned: true, date: '15/10/2024' },
    { id: 2, icon: '🎯', title: 'Perfect Score', description: 'Đạt 100% trong 1 bài test', earned: true, date: '12/10/2024' },
    { id: 3, icon: '⚡', title: 'Speed Learner', description: 'Hoàn thành 10 bài trong 1 ngày', earned: true, date: '08/10/2024' },
    { id: 4, icon: '🏆', title: 'Champion', description: 'Top 3 trong tuần', earned: true, date: '20/10/2024' },
    { id: 5, icon: '💎', title: 'Diamond', description: 'Đạt 500 cúp', earned: false, progress: 268, target: 500 },
    { id: 6, icon: '🌟', title: 'Star Student', description: 'Hoàn thành 100 bài học', earned: false, progress: 78, target: 100 }
  ];

  // Lịch sử học tập gần đây
  const recentActivity = [
    { id: 1, type: 'lesson', title: 'Hoàn thành Unit 15: Present Perfect', date: '24/10/2024', time: '14:30', score: 95 },
    { id: 2, type: 'test', title: 'Kiểm tra Grammar - Part 3', date: '24/10/2024', time: '10:15', score: 88 },
    { id: 3, type: 'achievement', title: 'Đạt thành tích: Streak Master', date: '23/10/2024', time: '18:20' },
    { id: 4, type: 'lesson', title: 'Hoàn thành Unit 14: Past Perfect', date: '23/10/2024', time: '16:45', score: 92 },
    { id: 5, type: 'lesson', title: 'Hoàn thành Unit 13: Modal Verbs', date: '22/10/2024', time: '15:30', score: 85 }
  ];

  // Khuyến nghị
  const recommendations = [
    { id: 1, title: 'Luyện thêm Listening', reason: 'Điểm Listening cần cải thiện', priority: 'high' },
    { id: 2, title: 'Ôn tập Grammar Units 10-12', reason: 'Củng cố kiến thức cũ', priority: 'medium' },
    { id: 3, title: 'Thực hành Speaking hàng ngày', reason: 'Tăng điểm Speaking', priority: 'high' }
  ];

  // Loading state
  if (loading) {
    return (
      <ConsistentSidebarLayout 
        activeMenuItem={activeMenuItem}
        onMenuItemClick={handleMenuItemClick}
        courseTitle="Học bài"
      >
        <div className="profile-content-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader className="animate-spin" size={48} style={{ margin: '0 auto 16px', color: '#8b5cf6' }} />
            <p style={{ color: '#6b7280' }}>Đang tải thống kê...</p>
          </div>
        </div>
      </ConsistentSidebarLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <ConsistentSidebarLayout 
        activeMenuItem={activeMenuItem}
        onMenuItemClick={handleMenuItemClick}
        courseTitle="Học bài"
      >
        <div className="profile-content-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                padding: '12px 24px', 
                background: '#8b5cf6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer' 
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </ConsistentSidebarLayout>
    );
  }

  return (
    <ConsistentSidebarLayout 
      activeMenuItem={activeMenuItem}
      onMenuItemClick={handleMenuItemClick}
      courseTitle="Học bài"
    >
      <div className={`profile-content-wrapper ${isContentPushed ? 'pushed-out' : ''}`}>
        {/* Main Content */}
        <main className="profile-main">
        {/* Header */}
        <div className="profile-header">
          <div className="header-content">
            <div className="user-avatar-large">
              <span>NV</span>
            </div>
            <div className="user-info-large">
              <h1>Nguyễn Văn Hoài</h1>
              <div className="user-meta">
                <span className="user-grade">
                  <GraduationCap size={16} />
                  Lớp 8
                </span>
                <span className="user-level">
                  <Star size={16} />
                  Level {overallStats.level}
                </span>
              </div>
            </div>
          </div>

          {/* Period Selector */}
          <div className="period-selector">
            <button 
              className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('week')}
            >
              Tuần này
            </button>
            <button 
              className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('month')}
            >
              Tháng này
            </button>
            <button 
              className={`period-btn ${selectedPeriod === 'all-time' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('all-time')}
            >
              Tổng thời gian
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="profile-content">
          {/* Overall Stats Cards */}
          <section className="stats-section">
            <h2 className="section-title">Thống kê tổng quan</h2>
            <div className="stats-grid">
              <div className="stat-card-large time">
                <div className="stat-icon-large">
                  <Clock size={32} />
                </div>
                <div className="stat-data">
                  <span className="stat-value-large">{overallStats.totalTime}</span>
                  <span className="stat-label-large">Tổng thời gian học</span>
                </div>
              </div>

              <div className="stat-card-large cups">
                <div className="stat-icon-large">
                  <Award size={32} />
                </div>
                <div className="stat-data">
                  <span className="stat-value-large">{overallStats.totalCups}</span>
                  <span className="stat-label-large">Tổng cúp đạt được</span>
                </div>
              </div>

              <div className="stat-card-large tests">
                <div className="stat-icon-large">
                  <Target size={32} />
                </div>
                <div className="stat-data">
                  <span className="stat-value-large">{overallStats.totalTests}</span>
                  <span className="stat-label-large">Bài kiểm tra</span>
                </div>
              </div>

              <div className="stat-card-large lessons">
                <div className="stat-icon-large">
                  <BookOpen size={32} />
                </div>
                <div className="stat-data">
                  <span className="stat-value-large">{overallStats.totalLessons}</span>
                  <span className="stat-label-large">Bài học hoàn thành</span>
                </div>
              </div>
            </div>
          </section>

          {/* Skills Performance */}
          <section className="skills-section">
            <h2 className="section-title">Kết quả theo kỹ năng</h2>
            <div className="skills-grid">
              {skillStats.map((skill, index) => (
                <div key={index} className="skill-card">
                  <div className="skill-header">
                    <div className="skill-icon">{skill.icon}</div>
                    <div className="skill-info">
                      <h3>{skill.skill}</h3>
                      <span className="skill-score">{skill.score}/{skill.maxScore}</span>
                    </div>
                  </div>
                  <div className="skill-progress">
                    <div className="skill-progress-bar">
                      <div 
                        className="skill-progress-fill"
                        style={{ 
                          width: `${skill.progress}%`,
                          background: skill.color
                        }}
                      />
                    </div>
                    <span className="skill-percentage">{skill.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Achievements */}
          <section className="achievements-section">
            <div className="section-header-flex">
              <h2 className="section-title">Thành tích</h2>
              <Link to="#" className="see-all-link">
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
            <div className="achievements-grid">
              {achievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}
                >
                  <div className="achievement-icon">{achievement.icon}</div>
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                  {achievement.earned ? (
                    <span className="earned-date">Đạt được: {achievement.date}</span>
                  ) : (
                    <div className="achievement-progress">
                      <div className="progress-mini-bar">
                        <div 
                          className="progress-mini-fill"
                          style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                        />
                      </div>
                      <span className="progress-mini-text">{achievement.progress}/{achievement.target}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="activity-section">
            <h2 className="section-title">Hoạt động gần đây</h2>
            <div className="activity-list">
              {recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-type-icon ${activity.type}`}>
                    {activity.type === 'lesson' && <BookOpen size={20} />}
                    {activity.type === 'test' && <Target size={20} />}
                    {activity.type === 'achievement' && <Trophy size={20} />}
                  </div>
                  <div className="activity-details">
                    <h4>{activity.title}</h4>
                    <div className="activity-meta">
                      <span>{activity.date}</span>
                      <span>•</span>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                  {activity.score && (
                    <div className="activity-score">
                      <span className="score-number">{activity.score}</span>
                      <span className="score-max">/100</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Recommendations */}
          <section className="recommendations-section">
            <h2 className="section-title">Đề xuất cho bạn</h2>
            <div className="recommendations-list">
              {recommendations.map(rec => (
                <div key={rec.id} className={`recommendation-card priority-${rec.priority}`}>
                  <div className="rec-content">
                    <div className="rec-header">
                      <h3>{rec.title}</h3>
                      <span className={`priority-badge ${rec.priority}`}>
                        {rec.priority === 'high' ? 'Ưu tiên cao' : 'Ưu tiên trung bình'}
                      </span>
                    </div>
                    <p>{rec.reason}</p>
                  </div>
                  <button className="rec-action-btn">
                    Bắt đầu
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
    </ConsistentSidebarLayout>
  );
};

export default LearningProfile;

