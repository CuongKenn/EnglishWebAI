import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, GraduationCap, BookOpen, Target,
  Award, TrendingUp, Clock, CheckCircle, Star, Trophy,
  Zap, Heart, Book, MessageCircle, ChevronRight, BarChart3
} from 'lucide-react';
import ConsistentSidebarLayout from '../../components/Layout/ConsistentSidebarLayout';
import './LearningProfile.css';
import { studentProfileAPI } from '../../services/api';

const LearningProfile = () => {
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('profile');
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [isContentPushed, setIsContentPushed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleMenuItemClick = (itemId) => {
    setActiveMenuItem(itemId);
    setIsContentPushed(true);
    
    // Reset animation after completion
    setTimeout(() => {
      setIsContentPushed(false);
    }, 300);
  };

  // Dữ liệu thống kê tổng quan (từ backend)
  const [overallStats, setOverallStats] = useState({
    totalTime: '-',
    totalCups: 0,
    totalTests: 0,
    totalLessons: 0,
    streak: 0,
    level: 0,
    rank: 'Bronze',
    completionRate: 0,
  });

  // Thống kê theo kỹ năng chính (từ backend)
  const [skillStats, setSkillStats] = useState([]);

  // Thành tích đạt được
  const achievements = [
    { id: 1, icon: '🔥', title: 'Streak Master', description: '7 ngày học liên tiếp', earned: true, date: '15/10/2024' },
    { id: 2, icon: '🎯', title: 'Perfect Score', description: 'Đạt 100% trong 1 bài test', earned: true, date: '12/10/2024' },
    { id: 3, icon: '⚡', title: 'Speed Learner', description: 'Hoàn thành 10 bài trong 1 ngày', earned: true, date: '08/10/2024' },
    { id: 4, icon: '🏆', title: 'Champion', description: 'Top 3 trong tuần', earned: true, date: '20/10/2024' },
    { id: 5, icon: '💎', title: 'Diamond', description: 'Đạt 500 cúp', earned: false, progress: 268, target: 500 },
    { id: 6, icon: '🌟', title: 'Star Student', description: 'Hoàn thành 100 bài học', earned: false, progress: 78, target: 100 }
  ];

  // Lịch sử học tập gần đây (từ backend)
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [overview, skills, recent] = await Promise.all([
          studentProfileAPI.getOverview(),
          studentProfileAPI.getSkills(),
          studentProfileAPI.getRecent(),
        ]);
        if (!mounted) return;
        // totalTime may be null from backend
        setOverallStats({
          totalTime: overview.totalTime || '-',
          totalCups: overview.totalCups || 0,
          totalTests: overview.totalTests || 0,
          totalLessons: overview.totalLessons || 0,
          streak: overview.streak || 0,
          level: overview.level || 0,
          rank: overview.rank || 'Bronze',
          completionRate: overview.completionRate || 0,
        });
        setSkillStats(Array.isArray(skills) ? skills : []);
        setRecentActivity(Array.isArray(recent) ? recent : []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.detail || 'Không thể tải hồ sơ học tập');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Khuyến nghị
  const recommendations = [
    { id: 1, title: 'Luyện thêm Listening', reason: 'Điểm Listening cần cải thiện', priority: 'high' },
    { id: 2, title: 'Ôn tập Grammar Units 10-12', reason: 'Củng cố kiến thức cũ', priority: 'medium' },
    { id: 3, title: 'Thực hành Speaking hàng ngày', reason: 'Tăng điểm Speaking', priority: 'high' }
  ];

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
          {loading && (
            <div className="stats-section">
              <h2 className="section-title">Đang tải hồ sơ học tập...</h2>
            </div>
          )}
          {error && (
            <div className="stats-section">
              <h2 className="section-title" style={{ color: '#ef4444' }}>{error}</h2>
            </div>
          )}
          {/* Overall Stats Cards */}
          <section className="stats-section">
            <h2 className="section-title">Thống kê tổng quan</h2>
            <div className="stats-grid">
              <div className="stat-card-large time">
                <div className="stat-icon-large">
                  <Clock size={32} />
                </div>
                <div className="stat-data">
                  <span className="stat-value-large">{overallStats.totalTime || '-'}</span>
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
              {(!loading && recentActivity.length === 0) && (
                <div className="activity-item">
                  <div className="activity-details">
                    <h4>Chưa có hoạt động nào</h4>
                    <div className="activity-meta">
                      <span>Bắt đầu làm bài để thấy tiến độ tại đây</span>
                    </div>
                  </div>
                </div>
              )}
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

