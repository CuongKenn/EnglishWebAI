import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  ArrowTrendingUpIcon, ClockIcon, TrophyIcon, CheckCircleIcon, 
  CalendarIcon, ChartBarIcon, SparklesIcon, PlayIcon, 
  ChevronRightIcon, BookOpenIcon, BoltIcon, AcademicCapIcon, LightBulbIcon
} from '@heroicons/react/24/outline';
import { CircleIcon } from '@heroicons/react/24/solid';
// Lucide-react icons for features not in Heroicons
import { TrendingUp, Target, Award, CheckCircle, Clock, Circle, BookOpen } from 'lucide-react';
import ConsistentSidebarLayout from '../../components/Layout/ConsistentSidebarLayout';
import './Lessons.css';
import { studentProfileAPI, classesAPI } from '../../services/api';

const MENU_MAP = {
  '/lessons': 'overview',
  '/study-plan': 'study-plan',
  '/my-courses': 'my-courses',
  '/learning-profile': 'profile'
};

const Lessons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenuItem, setActiveMenuItem] = useState('overview');
  const [isContentPushed, setIsContentPushed] = useState(false);

  const [overviewData, setOverviewData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const pathname = location.pathname;
    const matchedKey = Object.keys(MENU_MAP).find((key) => pathname === key || pathname.startsWith(`${key}/`));
    if (matchedKey) {
      setActiveMenuItem(MENU_MAP[matchedKey]);
    } else {
      setActiveMenuItem('overview');
    }
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [overviewRes, recentRes, classesRes] = await Promise.all([
          studentProfileAPI.getOverview().catch(() => null),
          studentProfileAPI.getRecent().catch(() => []),
          classesAPI.getMyClasses().catch(() => [])
        ]);

        if (!isMounted) return;

        setOverviewData(overviewRes);
        setRecentActivity(Array.isArray(recentRes) ? recentRes : []);
        setMyClasses(Array.isArray(classesRes) ? classesRes : []);
      } catch (e) {
        if (!isMounted) return;
        setError(e?.detail || e?.message || 'Không thể tải dữ liệu học tập');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const studyProgress = useMemo(() => {
    if (!overviewData) {
      return {
        currentScore: 0,
        targetScore: 5,
        cupsEarned: 0,
        totalCups: 0,
        unitsCompleted: 0,
        progress: 0,
        streakDays: 0,
        totalLessons: 0,
        testsCompleted: 0,
        activitiesCompleted: 0
      };
    }

    const unitsCompleted = overviewData.totalLessons || 0;
    const testsCompleted = overviewData.totalTests || 0;
    const completionRateRaw = typeof overviewData.completionRate === 'number' ? overviewData.completionRate : null;
    const progressPercent = completionRateRaw !== null
      ? Math.max(0, Math.min(100, Math.round(completionRateRaw)))
      : (unitsCompleted + testsCompleted) > 0
        ? Math.min(100, Math.round((unitsCompleted / (unitsCompleted + testsCompleted)) * 100))
        : 0;

    return {
      currentScore: Number((progressPercent / 20 || 0).toFixed(1)),
      targetScore: 5.0,
      cupsEarned: overviewData.totalCups || 0,
      totalCups: overviewData.totalCups || 0,
      unitsCompleted,
      testsCompleted,
      activitiesCompleted: unitsCompleted + testsCompleted,
      progress: progressPercent,
      streakDays: overviewData.streak || 0,
      totalLessons: overviewData.totalLessons || 0
    };
  }, [overviewData]);

  const learningStats = useMemo(() => {
    if (!overviewData) {
      return [
        { label: 'Tổng thời lượng', value: '-', icon: Clock, color: '#3b82f6' },
        { label: 'Tổng số cúp đạt', value: '0', icon: Award, color: '#f59e0b' },
        { label: 'Tổng số bài test', value: '0', icon: Target, color: '#ef4444' },
        { label: 'Tổng số bài học', value: '0', icon: BookOpen, color: '#10b981' }
      ];
    }

    const totalTimeMinutes = overviewData.totalTime ? Math.round((overviewData.totalTime || 0) / 60) : null;

    return [
      {
        label: 'Tổng thời lượng',
        value: totalTimeMinutes ? `${totalTimeMinutes} phút` : '-',
        icon: Clock,
        color: '#3b82f6'
      },
      { label: 'Tổng số cúp đạt', value: String(overviewData.totalCups || 0), icon: Award, color: '#f59e0b' },
      { label: 'Tổng số bài test', value: String(overviewData.totalTests || 0), icon: Target, color: '#ef4444' },
      { label: 'Tổng số bài học', value: String(overviewData.totalLessons || 0), icon: BookOpen, color: '#10b981' }
    ];
  }, [overviewData]);

  const recentLessons = useMemo(() => {
    if (!recentActivity.length) {
      return [];
    }

    return recentActivity.map((item, index) => {
      let status = 'locked';
      if (item.score !== null && item.score !== undefined) {
        status = item.score >= 70 ? 'completed' : 'in-progress';
      } else if (item.type === 'lesson') {
        status = 'in-progress';
      }

      return {
        id: item.id || index,
        title: item.title || 'Bài học',
        status,
        score: item.score
      };
    });
  }, [recentActivity]);

  const todayGoal = useMemo(() => {
    const today = new Date();
    const formattedToday = today.toLocaleDateString('vi-VN');
    const activityToday = recentActivity.find((item) => item.date === formattedToday);

    if (activityToday) {
      return {
        message: 'Tuyệt vời! Bạn đã hoàn thành nội dung hôm nay.',
        subMessage: `Tiếp tục duy trì chuỗi ${studyProgress.streakDays} ngày học liên tiếp nhé!`,
        hasLesson: true
      };
    }

    if (myClasses.length > 0) {
      return {
        message: 'Bạn có thể tiếp tục học trong các lớp đã tham gia.',
        subMessage: 'Mở “Khóa học của tôi” để xem lộ trình chi tiết.',
        hasLesson: false
      };
    }

    return {
      message: 'Chà, hôm nay chưa có hoạt động nào được ghi nhận.',
      subMessage: 'Hãy bắt đầu buổi học mới hoặc xem lại bài cũ để tiến bộ nhé!',
      hasLesson: false
    };
  }, [recentActivity, myClasses.length, studyProgress.streakDays]);

  const handleMenuItemClick = (itemId) => {
    setActiveMenuItem(itemId);
    setIsContentPushed(true);

    setTimeout(() => {
      setIsContentPushed(false);
    }, 300);
  };

  const handleContinueLearning = () => {
    if (recentLessons.length || myClasses.length) {
      navigate('/my-classes');
      return;
    }
    navigate('/study-plan');
  };

  const handleViewDetails = () => {
    navigate('/learning-profile');
  };

  if (loading) {
    return (
      <ConsistentSidebarLayout
        activeMenuItem={activeMenuItem}
        onMenuItemClick={handleMenuItemClick}
        courseTitle="Học bài"
      >
        <div className="lessons-content-wrapper">
          <main className="dashboard-main">
            <div className="study-progress-section" style={{ textAlign: 'center' }}>
              <h2 className="section-title">Đang tải dữ liệu học tập...</h2>
            </div>
          </main>
        </div>
      </ConsistentSidebarLayout>
    );
  }

  if (error) {
    return (
      <ConsistentSidebarLayout
        activeMenuItem={activeMenuItem}
        onMenuItemClick={handleMenuItemClick}
        courseTitle="Học bài"
      >
        <div className="lessons-content-wrapper">
          <main className="dashboard-main">
            <div className="study-progress-section" style={{ textAlign: 'center' }}>
              <h2 className="section-title" style={{ color: '#ef4444' }}>{error}</h2>
              <p>Vui lòng thử tải lại trang sau ít phút.</p>
            </div>
          </main>
        </div>
      </ConsistentSidebarLayout>
    );
  }

  const userInfo = {
    name: overviewData?.fullName || overviewData?.username || 'Học sinh',
    grade: myClasses[0]?.grade || 'Học sinh',
    currentLevel: studyProgress.currentScore,
    predictedLevel: Math.min(5, Number((studyProgress.currentScore + 0.5).toFixed(1))),
    targetLevel: 5.0
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
                  <span className="label-current">Hoàn thành {studyProgress.progress}% lộ trình</span>
                  <span className="label-end">100%</span>
                </div>
              </div>

              {/* Milestones */}
              <div className="progress-milestones">
                <div className={`milestone ${studyProgress.progress >= 25 ? 'achieved' : ''}`}>
                  <div className="milestone-icon"><SparklesIcon className="w-5 h-5" /></div>
                  <span>25%</span>
                </div>
                <div className={`milestone ${studyProgress.progress >= 50 ? 'achieved' : ''}`}>
                  <div className="milestone-icon"><BoltIcon className="w-5 h-5" /></div>
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
                    Đã hoàn thành {studyProgress.unitsCompleted} bài học
                    {studyProgress.testsCompleted ? ` và ${studyProgress.testsCompleted} bài kiểm tra.` : '.'}
                    {studyProgress.progress ? ` Bạn đã đạt ${studyProgress.progress}% mục tiêu.` : ''}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="progress-actions">
                <button className="continue-learning-btn-modern" onClick={handleContinueLearning}>
                  <PlayIcon className="w-5 h-5" />
                  <span>Tiếp tục học</span>
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                <button className="view-details-btn" onClick={handleViewDetails}>
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
            {recentLessons.length === 0 ? (
              <div className="lesson-item empty">
                <div className="lesson-info">
                  <h4>Chưa có hoạt động nào gần đây</h4>
                  <span className="lesson-score">Bắt đầu học để xem tiến độ tại đây</span>
                </div>
              </div>
            ) : (
              recentLessons.map((lesson) => (
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
                    {lesson.score !== undefined && lesson.score !== null && (
                      <span className="lesson-score">Điểm: {lesson.score}/100</span>
                    )}
                  </div>
                </div>
              ))
            )}
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
            <div className="motivation-icon"><LightBulbIcon className="w-5 h-5" /></div>
            <p>Không có giáo dục nào tốt hơn việc học hỏi từ trải nghiệm</p>
          </div>
        </div>
      </aside>
    </div>
  </ConsistentSidebarLayout>
  );
};

export default Lessons;