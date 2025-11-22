import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Calendar,
  MessageSquare,
  Target,
  Activity
} from 'lucide-react';
import './ReportCard.css';

const ReportCard = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with mock data
    const loadReportData = async () => {
      setLoading(true);
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData = {
        studentName: "Nguyễn Văn A",
        summary: {
          totalExercises: 24,
          gradedExercises: 24,
          averageScore: 82.5,
          overallTrend: "improving", // improving, declining, stable
          skillScores: [
            { skill: "reading", averageScore: 85.2, totalExercises: 8, trend: "improving" },
            { skill: "writing", averageScore: 78.8, totalExercises: 6, trend: "stable" },
            { skill: "listening", averageScore: 84.1, totalExercises: 5, trend: "improving" },
            { skill: "speaking", averageScore: 79.3, totalExercises: 5, trend: "declining" }
          ]
        },
        recentExercises: [
          {
            id: 1,
            exerciseTitle: "Reading Comprehension - Environment",
            skillType: "reading",
            score: 88,
            maxScore: 100,
            feedback: "Tuyệt vời! Bạn đã nắm vững các ý chính và chi tiết quan trọng. Tiếp tục phát huy!",
            submittedAt: "2024-01-15T10:30:00Z",
            gradedAt: "2024-01-16T14:20:00Z"
          },
          {
            id: 2,
            exerciseTitle: "Essay Writing - Technology Impact",
            skillType: "writing",
            score: 82,
            maxScore: 100,
            feedback: "Bài viết có cấu trúc tốt, từ vựng phong phú. Cần chú ý hơn đến ngữ pháp và sự đa dạng trong câu văn.",
            submittedAt: "2024-01-12T09:15:00Z",
            gradedAt: "2024-01-13T11:45:00Z"
          },
          {
            id: 3,
            exerciseTitle: "Listening Practice - News Report",
            skillType: "listening",
            score: 90,
            maxScore: 100,
            feedback: "Khả năng nghe hiểu xuất sắc! Bạn đã nắm bắt được hầu hết thông tin quan trọng.",
            submittedAt: "2024-01-10T16:20:00Z",
            gradedAt: "2024-01-11T10:30:00Z"
          },
          {
            id: 4,
            exerciseTitle: "Speaking Presentation - Hobbies",
            skillType: "speaking",
            score: 76,
            maxScore: 100,
            feedback: "Phát âm rõ ràng, nội dung tốt. Cần cải thiện sự tự tin và tốc độ nói.",
            submittedAt: "2024-01-08T14:10:00Z",
            gradedAt: "2024-01-09T13:15:00Z"
          },
          {
            id: 5,
            exerciseTitle: "Grammar Quiz - Past Tenses",
            skillType: "writing",
            score: 85,
            maxScore: 100,
            feedback: "Kiến thức ngữ pháp vững chắc! Chỉ có vài lỗi nhỏ về thì quá khứ.",
            submittedAt: "2024-01-05T11:45:00Z",
            gradedAt: "2024-01-06T09:20:00Z"
          }
        ],
        skillProgress: {
          reading: {
            "2023-10": 75.2,
            "2023-11": 78.8,
            "2023-12": 82.1,
            "2024-01": 85.2
          },
          writing: {
            "2023-10": 72.1,
            "2023-11": 74.9,
            "2023-12": 76.2,
            "2024-01": 78.8
          },
          listening: {
            "2023-11": 76.5,
            "2023-12": 80.3,
            "2024-01": 84.1
          },
          speaking: {
            "2023-11": 82.3,
            "2023-12": 80.9,
            "2024-01": 79.3
          }
        }
      };

      setReportData(mockData);
      setLoading(false);
    };

    loadReportData();
  }, []);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp size={16} className="trend-icon improving" />;
      case 'declining':
        return <TrendingDown size={16} className="trend-icon declining" />;
      default:
        return <Minus size={16} className="trend-icon stable" />;
    }
  };

  const getSkillColor = (skill) => {
    const colors = {
      reading: '#3B82F6',    // Blue
      writing: '#10B981',    // Green
      listening: '#F59E0B',  // Yellow
      speaking: '#EF4444'    // Red
    };
    return colors[skill] || '#6B7280';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 80) return '#3B82F6'; // Blue
    if (score >= 70) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  if (loading) {
    return (
      <div className="report-card-page">
        <div className="report-card-header">
          <BookOpen size={48} />
          <h1>Học bạ</h1>
          <p>Đang tải dữ liệu...</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải học bạ của bạn...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="report-card-page">
        <div className="report-card-header">
          <BookOpen size={48} />
          <h1>Học bạ</h1>
          <p>Theo dõi kết quả học tập của bạn</p>
        </div>
        <div className="error-container">
          <p>Không thể tải dữ liệu học bạ. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-card-page">
      <div className="report-card-header">
        <BookOpen size={48} />
        <h1>Học bạ</h1>
        <p>Theo dõi kết quả học tập của bạn</p>
      </div>

      <div className="report-card-content">
        {/* Overall Summary */}
        <div className="summary-section">
          <div className="summary-card main-summary">
            <div className="summary-header">
              <Award size={24} />
              <h3>Tổng quan</h3>
            </div>
            <div className="summary-stats">
              <div className="stat-item">
                <div className="stat-value">{reportData.summary.averageScore.toFixed(1)}</div>
                <div className="stat-label">Điểm trung bình</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{reportData.summary.gradedExercises}</div>
                <div className="stat-label">Bài đã chấm</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {getTrendIcon(reportData.summary.overallTrend)}
                  <span className={`trend-text ${reportData.summary.overallTrend}`}>
                    {reportData.summary.overallTrend === 'improving' ? 'Đang tiến bộ' :
                     reportData.summary.overallTrend === 'declining' ? 'Cần cải thiện' : 'Ổn định'}
                  </span>
                </div>
                <div className="stat-label">Xu hướng</div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Overview */}
        <div className="skills-section">
          <div className="section-header">
            <Target size={20} />
            <h3>Phân tích kỹ năng</h3>
          </div>
          <div className="skills-grid">
            {reportData.summary.skillScores.map((skill) => (
              <div key={skill.skill} className="skill-card">
                <div className="skill-header">
                  <div
                    className="skill-icon"
                    style={{ backgroundColor: getSkillColor(skill.skill) }}
                  >
                    {skill.skill === 'reading' && <BookOpen size={20} />}
                    {skill.skill === 'writing' && <MessageSquare size={20} />}
                    {skill.skill === 'listening' && <Activity size={20} />}
                    {skill.skill === 'speaking' && <Target size={20} />}
                  </div>
                  <div className="skill-info">
                    <h4>{skill.skill.charAt(0).toUpperCase() + skill.skill.slice(1)}</h4>
                    <div className="skill-trend">
                      {getTrendIcon(skill.trend)}
                    </div>
                  </div>
                </div>
                <div className="skill-stats">
                  <div className="skill-score">{skill.averageScore.toFixed(1)}</div>
                  <div className="skill-exercises">{skill.totalExercises} bài</div>
                </div>
                <div className="skill-progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${skill.averageScore}%`,
                      backgroundColor: getSkillColor(skill.skill)
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Exercises */}
        <div className="exercises-section">
          <div className="section-header">
            <Calendar size={20} />
            <h3>Bài tập gần đây</h3>
          </div>
          <div className="exercises-list">
            {reportData.recentExercises.map((exercise) => (
              <div key={exercise.id} className="exercise-card">
                <div className="exercise-header">
                  <div className="exercise-title">{exercise.exerciseTitle}</div>
                  <div className="exercise-skill" style={{ color: getSkillColor(exercise.skillType) }}>
                    {exercise.skillType.charAt(0).toUpperCase() + exercise.skillType.slice(1)}
                  </div>
                </div>
                <div className="exercise-score">
                  <div
                    className="score-display"
                    style={{ color: getScoreColor(exercise.score) }}
                  >
                    {exercise.score}/{exercise.maxScore}
                  </div>
                  <div className="score-percentage">
                    {((exercise.score / exercise.maxScore) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="exercise-feedback">
                  <MessageSquare size={16} />
                  <p>{exercise.feedback}</p>
                </div>
                <div className="exercise-dates">
                  <div className="date-item">
                    <span>Nộp:</span> {formatDate(exercise.submittedAt)}
                  </div>
                  <div className="date-item">
                    <span>Chấm:</span> {formatDate(exercise.gradedAt)}
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

export default ReportCard;
