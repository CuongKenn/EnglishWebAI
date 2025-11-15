import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, GraduationCap, BookOpen, Target,
  Award, TrendingUp, Clock, CheckCircle, Star, Trophy,
  Zap, Heart, Book, MessageCircle, ChevronRight, BarChart3
} from 'lucide-react';
import ConsistentSidebarLayout from '../../components/Layout/ConsistentSidebarLayout';
import './LearningProfile.css';
import { studentProfileAPI, classesAPI, authAPI, apiV1 } from '../../services/api';

const LearningProfile = () => {
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('profile');
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [isContentPushed, setIsContentPushed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User data from localStorage
  const [userData, setUserData] = useState(null);
  const [userClasses, setUserClasses] = useState([]);

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

  // Lịch sử học tập gần đây (từ backend)
  const [recentActivity, setRecentActivity] = useState([]);

  // Thành tích đạt được - computed from real data
  const [achievements, setAchievements] = useState([]);

  // Recommendations based on real data
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [overview, skills, recent, classes, userProfile] = await Promise.all([
          studentProfileAPI.getOverview(),
          studentProfileAPI.getSkills(),
          studentProfileAPI.getRecent(),
          classesAPI.getMyClasses().catch(() => []), // Don't fail if no classes
          apiV1.get('/users/me').then(res => res.data).catch(() => authAPI.getCurrentUser()) // Fallback to localStorage
        ]);
        
        if (!mounted) return;

        // Set user data
        if (userProfile) {

          setUserData(userProfile);
        }

        // Set classes
        setUserClasses(classes || []);
        
        // totalTime may be null from backend
        const stats = {
          totalTime: overview.totalTime || '-',
          totalCups: overview.totalCups || 0,
          totalTests: overview.totalTests || 0,
          totalLessons: overview.totalLessons || 0,
          streak: overview.streak || 0,
          level: overview.level || 0,
          rank: overview.rank || 'Bronze',
          completionRate: overview.completionRate || 0,
        };
        setOverallStats(stats);
        setSkillStats(Array.isArray(skills) ? skills : []);
        setRecentActivity(Array.isArray(recent) ? recent : []);

        // Generate achievements based on real data
        generateAchievements(stats, skills);

        // Generate recommendations based on skills
        generateRecommendations(skills, stats);

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

  // Generate achievements based on real stats
  const generateAchievements = (stats) => {
    // skills parameter removed - not used in function
    const achievementsList = [];
    
    // Streak achievement
    if (stats.streak >= 7) {
      achievementsList.push({
        id: 1,
        icon: '🔥',
        title: 'Streak Master',
        description: `${stats.streak} ngày học liên tiếp`,
        earned: true,
        date: new Date().toLocaleDateString('vi-VN')
      });
    } else if (stats.streak > 0) {
      achievementsList.push({
        id: 1,
        icon: '🔥',
        title: 'Streak Master',
        description: '7 ngày học liên tiếp',
        earned: false,
        progress: stats.streak,
        target: 7
      });
    }

    // Perfect score achievement
    if (stats.completionRate >= 90) {
      achievementsList.push({
        id: 2,
        icon: '🎯',
        title: 'Perfect Score',
        description: 'Đạt điểm cao trong các bài test',
        earned: true,
        date: new Date().toLocaleDateString('vi-VN')
      });
    }

    // Lessons completion achievement
    if (stats.totalLessons >= 10) {
      achievementsList.push({
        id: 3,
        icon: '⚡',
        title: 'Fast Learner',
        description: `Hoàn thành ${stats.totalLessons} bài học`,
        earned: true,
        date: new Date().toLocaleDateString('vi-VN')
      });
    }

    // Rank achievement
    if (stats.rank === 'Gold') {
      achievementsList.push({
        id: 4,
        icon: '🏆',
        title: 'Champion',
        description: 'Đạt hạng Gold',
        earned: true,
        date: new Date().toLocaleDateString('vi-VN')
      });
    }

    // Cups achievement
    if (stats.totalCups >= 500) {
      achievementsList.push({
        id: 5,
        icon: '💎',
        title: 'Diamond',
        description: 'Đạt 500 cúp',
        earned: true,
        date: new Date().toLocaleDateString('vi-VN')
      });
    } else if (stats.totalCups > 0) {
      achievementsList.push({
        id: 5,
        icon: '💎',
        title: 'Diamond',
        description: 'Đạt 500 cúp',
        earned: false,
        progress: stats.totalCups,
        target: 500
      });
    }

    // Total lessons achievement
    if (stats.totalLessons >= 100) {
      achievementsList.push({
        id: 6,
        icon: '🌟',
        title: 'Star Student',
        description: 'Hoàn thành 100 bài học',
        earned: true,
        date: new Date().toLocaleDateString('vi-VN')
      });
    } else if (stats.totalLessons > 0) {
      achievementsList.push({
        id: 6,
        icon: '🌟',
        title: 'Star Student',
        description: 'Hoàn thành 100 bài học',
        earned: false,
        progress: stats.totalLessons,
        target: 100
      });
    }

    setAchievements(achievementsList);
  };

  // Generate recommendations based on skills performance
  const generateRecommendations = (skills, stats) => {
    const recs = [];
    
    // Check which skills need improvement (below 70%)
    if (Array.isArray(skills)) {
      skills.forEach(skill => {
        if (skill.progress < 70) {
          recs.push({
            id: recs.length + 1,
            title: `Luyện thêm ${skill.skill}`,
            reason: `Điểm ${skill.skill} cần cải thiện (${skill.progress}%)`,
            priority: skill.progress < 50 ? 'high' : 'medium',
            redirectTo: '/exercise-hub'
          });
        }
      });
    }

    // If no specific skill recommendations, add general ones
    if (recs.length === 0) {
      if (stats.streak === 0) {
        recs.push({
          id: 1,
          title: 'Bắt đầu học hàng ngày',
          reason: 'Xây dựng thói quen học tập đều đặn',
          priority: 'high',
          redirectTo: '/study-plan'
        });
      }
      
      if (stats.totalTests < 5) {
        recs.push({
          id: 2,
          title: 'Làm thêm bài kiểm tra',
          reason: 'Đánh giá trình độ và tiến bộ',
          priority: 'medium',
          redirectTo: '/exercise-hub'
        });
      }

      if (stats.completionRate < 70 && stats.totalTests > 0) {
        recs.push({
          id: 3,
          title: 'Ôn tập lại kiến thức cũ',
          reason: 'Củng cố nền tảng để nâng cao điểm số',
          priority: 'high',
          redirectTo: '/study-plan'
        });
      }
    }

    // Limit to 3 recommendations
    setRecommendations(recs.slice(0, 3));
  };

  const handleRecommendationClick = (rec) => {
    const destination = rec.redirectTo || '/study-plan';
    navigate(destination);
  };

  // Get user's grade from their classes
  const getUserGrade = () => {
    if (userClasses.length > 0) {
      // Try to get grade from first class
      const firstClass = userClasses[0];
      if (firstClass.grade) {
        // Check if grade already contains "Lớp"
        const grade = String(firstClass.grade);
        return grade.toLowerCase().includes('lớp') ? grade : `Lớp ${grade}`;
      }
      // Fallback: try to extract from class name
      if (firstClass.name) {
        const match = firstClass.name.match(/(\d+[A-Za-z]*\d*)/);
        if (match) {
          return `Lớp ${match[1]}`;
        }
      }
    }
    return 'Học sinh';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userData?.full_name && userData.full_name.trim()) {
      const names = userData.full_name.trim().split(/\s+/); // Split by any whitespace
      if (names.length >= 2) {
        // For Vietnamese names: first letter of first name + first letter of last name
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    if (userData?.username) {
      return userData.username.substring(0, 2).toUpperCase();
    }
    return 'HS';
  };

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
              <span>{getUserInitials()}</span>
            </div>
            <div className="user-info-large">
              <h1>
                {loading && !userData ? 'Đang tải...' : 
                 (userData?.full_name || userData?.username || 'Học sinh')}
              </h1>
              <div className="user-meta">
                <span className="user-grade">
                  <GraduationCap size={16} />
                  {getUserGrade()}
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
              {achievements.length > 0 && (
                <Link to="#" className="see-all-link">
                  Xem tất cả <ChevronRight size={16} />
                </Link>
              )}
            </div>
            {achievements.length > 0 ? (
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
            ) : (
              <div className="activity-item">
                <div className="activity-details">
                  <h4>Chưa có thành tích nào</h4>
                  <div className="activity-meta">
                    <span>Hoàn thành bài học và bài tập để nhận thành tích</span>
                  </div>
                </div>
              </div>
            )}
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
          {recommendations.length > 0 && (
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
                    <button 
                      className="rec-action-btn"
                      onClick={() => handleRecommendationClick(rec)}
                    >
                      Bắt đầu
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
    </ConsistentSidebarLayout>
  );
};

export default LearningProfile;

