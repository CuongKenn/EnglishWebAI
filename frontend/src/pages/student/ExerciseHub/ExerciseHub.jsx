import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trophy, BarChart3, CheckCircle, Clock, AlertCircle, Award, Star, Calendar, Eye, Edit3, Headphones, MessageSquare, BookOpen, PenTool, Target } from 'lucide-react';
import './ExerciseHub.css';
import studentService from '../../../services/studentService';

// Sidebar Component (giống AI Practice)
function ExerciseSidebar({ activeTab, onTabChange }) {
  const menuItems = [
    {
      id: "all",
      icon: FileText,
      label: "Tất cả bài tập",
      gradient: "from-blue-500 to-cyan-500",
      emoji: "📝",
    },
    {
      id: "listening",
      icon: Headphones,
      label: "Bài tập Nghe",
      gradient: "from-green-500 to-emerald-500",
      emoji: "🎧",
    },
    {
      id: "speaking",
      icon: MessageSquare,
      label: "Bài tập Nói",
      gradient: "from-purple-500 to-pink-500",
      emoji: "🗣️",
    },
    {
      id: "reading",
      icon: BookOpen,
      label: "Bài tập Đọc",
      gradient: "from-indigo-500 to-blue-500",
      emoji: "📖",
    },
    {
      id: "writing",
      icon: PenTool,
      label: "Bài tập Viết",
      gradient: "from-orange-500 to-red-500",
      emoji: "✍️",
    },
    {
      id: "tests",
      icon: AlertCircle,
      label: "Bài kiểm tra",
      gradient: "from-red-500 to-pink-500",
      emoji: "📊",
    },
    {
      id: "grades",
      icon: BarChart3,
      label: "Điểm & Tiến độ",
      gradient: "from-pink-500 to-rose-500",
      emoji: "🏆",
    },
  ];

  return (
    <div className="exercise-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-content">
          <div className="sidebar-icon-wrapper">
            <Target className="sidebar-icon" />
          </div>
          <div>
            <h2 className="sidebar-title">Exercise Hub</h2>
            <p className="sidebar-subtitle">Trung tâm Bài tập</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="sidebar-menu">
        <div className="menu-items-list">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`menu-item ${isActive ? 'active' : ''}`}
              >
                {isActive && <div className={`menu-item-bg ${item.gradient}`} />}
                
                <div className="menu-item-content">
                  <div className={`menu-item-icon ${item.gradient}`}>
                    <Icon size={20} />
                  </div>
                  
                  <div className="menu-item-text">
                    <div className="menu-item-label">
                      <span className="menu-emoji">{item.emoji}</span>
                      <span className="menu-label">{item.label}</span>
                    </div>
                  </div>
                  
                  {isActive && <div className="menu-active-indicator" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ExerciseHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [exercises, setExercises] = useState([]);
  const [tests, setTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [skillStats, setSkillStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allExercises, statsRes] = await Promise.all([
        studentService.getExercises(),
        studentService.getExerciseStatistics()
      ]);
      
      console.log('All exercises from API:', allExercises);
      
      // Filter exercises vs tests
      // Tests: quiz, test, test_15min, midterm, final
      // Exercises: assignment, skill_exercise, or items without type
      const testTypes = ['quiz', 'test', 'test_15min', 'midterm', 'final'];
      
      setTests(allExercises.filter(e => testTypes.includes(e.type)));
      setExercises(allExercises.filter(e => !testTypes.includes(e.type)));
      
  setStatistics(statsRes);
      
  const submissionsRes = await studentService.getMySubmissions();
  setSubmissions(submissionsRes);
      
      // Calculate skill-based statistics
  calculateSkillStats(submissionsRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSkillStats = (submissions) => {
    const skills = ['listening', 'speaking', 'reading', 'writing'];
    const stats = {};
    
    skills.forEach(skill => {
      const skillSubmissions = submissions.filter(s => 
        s.exercise?.skill_type === skill && s.status === 'graded'
      );
      
      if (skillSubmissions.length > 0) {
        const totalScore = skillSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
        const maxPossible = skillSubmissions.reduce((sum, s) => sum + (s.exercise?.max_score || 0), 0);
        
        stats[skill] = {
          count: skillSubmissions.length,
          average: maxPossible > 0 ? (totalScore / maxPossible * 100).toFixed(1) : 0,
          totalScore,
          maxPossible
        };
      } else {
        stats[skill] = { count: 0, average: 0, totalScore: 0, maxPossible: 0 };
      }
    });
    
    setSkillStats(stats);
  };

  const getFilteredExercises = () => {
    if (activeTab === 'all') {
      // Show both exercises and tests
      return [...exercises, ...tests];
    } else if (activeTab === 'tests') {
      return tests;
    } else if (activeTab === 'grades') {
      return null; // Will render grades view
    } else {
      // Filter by skill
      return exercises.filter(e => e.skill_type === activeTab);
    }
  };

  const renderExerciseCard = (exercise) => {
    const hasSubmission = exercise.my_submission;
    const score = hasSubmission?.score;
    const maxScore = exercise.max_score;
    const isOverdue = exercise.due_at && new Date(exercise.due_at) < new Date();
    
    let statusClass = '';
    let statusText = '';
    let statusIcon = null;
    
    if (!hasSubmission) {
      statusClass = isOverdue ? 'status-danger' : 'status-neutral';
      statusText = isOverdue ? 'Quá hạn' : 'Chưa làm';
      statusIcon = isOverdue ? <AlertCircle size={16} /> : <Clock size={16} />;
    } else if (hasSubmission.status === 'graded') {
      statusClass = 'status-success';
      statusText = 'Đã chấm';
      statusIcon = <CheckCircle size={16} />;
    } else {
      statusClass = 'status-info';
      statusText = 'Đã nộp';
      statusIcon = <Clock size={16} />;
    }
    
    return (
      <div key={exercise.id} className={`exercise-card-new ${statusClass}`}>
        <div className="card-glow-new"></div>
        
        <div className="card-header-new">
          <div className={`card-status-badge ${statusClass}`}>
            {statusIcon}
            <span>{statusText}</span>
          </div>
          {score !== null && score !== undefined && (
            <div className="card-score-badge">
              <Star size={14} fill="currentColor" />
              <span>{score}/{maxScore}</span>
            </div>
          )}
        </div>

        <div className="card-body-new">
          <h3 className="card-title-new">{exercise.title}</h3>
          {exercise.skill_type && (
            <div className="skill-badge">{getSkillEmoji(exercise.skill_type)} {getSkillName(exercise.skill_type)}</div>
          )}
          <p className="card-description-new">{exercise.description || 'Không có mô tả'}</p>
        </div>

        <div className="card-meta-new">
          <div className="meta-item-new">
            <Calendar size={14} />
            <span>{exercise.due_at ? new Date(exercise.due_at).toLocaleDateString('vi-VN') : 'Không có hạn'}</span>
          </div>
          <div className="meta-item-new">
            <Award size={14} />
            <span>{maxScore || 0} điểm</span>
          </div>
        </div>

        {hasSubmission && hasSubmission.feedback && (
          <div className="card-feedback-new">
            <Eye size={14} />
            <span>{hasSubmission.feedback}</span>
          </div>
        )}

        <div className="card-actions-new">
          {!hasSubmission ? (
            <button 
              className="btn-primary-new"
              onClick={() => navigate(`/exercise/${exercise.id}`)}
            >
              <FileText size={16} />
              <span>Bắt đầu làm</span>
            </button>
          ) : score !== null ? (
            <button 
              className="btn-success-new"
              onClick={() => navigate(`/exercise/${exercise.id}`)}
            >
              <Trophy size={16} />
              <span>Xem kết quả</span>
            </button>
          ) : (
            <>
              <button className="btn-info-new">
                <Clock size={16} />
                <span>Chờ chấm</span>
              </button>
              <button 
                className="btn-secondary-new"
                onClick={() => navigate(`/exercise/${exercise.id}`)}
              >
                <Edit3 size={16} />
                <span>Sửa bài</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const getSkillEmoji = (skill) => {
    const emojis = {
      listening: '🎧',
      speaking: '🗣️',
      reading: '📖',
      writing: '✍️'
    };
    return emojis[skill] || '📝';
  };

  const getSkillName = (skill) => {
    const names = {
      listening: 'Nghe',
      speaking: 'Nói',
      reading: 'Đọc',
      writing: 'Viết'
    };
    return names[skill] || skill;
  };

  const renderGradesView = () => {
    if (!skillStats) return null;
    
    const skills = [
      { key: 'listening', name: 'Kỹ năng Nghe', color: 'from-green-500 to-emerald-500', emoji: '🎧' },
      { key: 'speaking', name: 'Kỹ năng Nói', color: 'from-purple-500 to-pink-500', emoji: '🗣️' },
      { key: 'reading', name: 'Kỹ năng Đọc', color: 'from-indigo-500 to-blue-500', emoji: '📖' },
      { key: 'writing', name: 'Kỹ năng Viết', color: 'from-orange-500 to-red-500', emoji: '✍️' }
    ];

    return (
      <div className="grades-view-new">
        <div className="grades-header-new">
          <h2>Hệ thống Đánh giá Chi tiết</h2>
          <p>Theo dõi điểm số của bạn theo từng kỹ năng và loại bài kiểm tra</p>
        </div>

        {/* Overall Statistics */}
        {statistics && (
          <div className="overall-stats-new">
            <div className="stat-card-new total">
              <div className="stat-icon-new from-blue-500 to-cyan-500">
                <FileText size={24} />
              </div>
              <div className="stat-content-new">
                <div className="stat-value-new">{statistics.total_exercises}</div>
                <div className="stat-label-new">Tổng bài tập</div>
              </div>
            </div>

            <div className="stat-card-new completed">
              <div className="stat-icon-new from-green-500 to-emerald-500">
                <CheckCircle size={24} />
              </div>
              <div className="stat-content-new">
                <div className="stat-value-new">{statistics.completed}</div>
                <div className="stat-label-new">Đã hoàn thành</div>
              </div>
            </div>

            <div className="stat-card-new graded">
              <div className="stat-icon-new from-purple-500 to-pink-500">
                <Trophy size={24} />
              </div>
              <div className="stat-content-new">
                <div className="stat-value-new">{statistics.graded}</div>
                <div className="stat-label-new">Đã chấm điểm</div>
              </div>
            </div>

            <div className="stat-card-new average">
              <div className="stat-icon-new from-orange-500 to-red-500">
                <Award size={24} />
              </div>
              <div className="stat-content-new">
                <div className="stat-value-new">{statistics.average_score.toFixed(1)}</div>
                <div className="stat-label-new">Điểm TB Tổng</div>
              </div>
            </div>
          </div>
        )}

        {/* Skills Breakdown */}
        <div className="skills-section-new">
          <h3 className="section-title-new">Đánh giá theo 4 Kỹ năng</h3>
          <div className="skills-grid-new">
            {skills.map(skill => {
              const stat = skillStats[skill.key];
              const percentage = parseFloat(stat.average) || 0;
              
              return (
                <div key={skill.key} className="skill-card-new">
                  <div className="skill-header-new">
                    <div className={`skill-icon-new ${skill.color}`}>
                      <span className="skill-emoji-new">{skill.emoji}</span>
                    </div>
                    <div className="skill-info-new">
                      <h4>{skill.name}</h4>
                      <p>{stat.count} bài tập</p>
                    </div>
                  </div>

                  <div className="skill-progress-new">
                    <div className="progress-bar-new">
                      <div 
                        className={`progress-fill-new ${skill.color}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="progress-label-new">
                      <span className="progress-value-new">{percentage}%</span>
                      <span className="progress-text-new">{stat.totalScore}/{stat.maxPossible} điểm</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Types Breakdown */}
        <div className="test-types-section-new">
          <h3 className="section-title-new">Đánh giá theo Loại Kiểm tra</h3>
          <div className="test-types-grid-new">
            <div className="test-type-card-new">
              <div className="test-type-header-new">
                <div className="test-type-icon-new from-yellow-500 to-orange-500">
                  <Clock size={20} />
                </div>
                <h4>Kiểm tra 15 phút</h4>
              </div>
              <div className="test-type-score-new">
                <div className="score-circle-new">
                  <span className="score-value-new">8.5</span>
                  <span className="score-max-new">/10</span>
                </div>
                <div className="score-details-new">
                  <p>5 bài kiểm tra</p>
                  <p className="score-percentage-new">85%</p>
                </div>
              </div>
            </div>

            <div className="test-type-card-new">
              <div className="test-type-header-new">
                <div className="test-type-icon-new from-blue-500 to-indigo-500">
                  <FileText size={20} />
                </div>
                <h4>Kiểm tra giữa kì</h4>
              </div>
              <div className="test-type-score-new">
                <div className="score-circle-new">
                  <span className="score-value-new">7.8</span>
                  <span className="score-max-new">/10</span>
                </div>
                <div className="score-details-new">
                  <p>2 bài kiểm tra</p>
                  <p className="score-percentage-new">78%</p>
                </div>
              </div>
            </div>

            <div className="test-type-card-new">
              <div className="test-type-header-new">
                <div className="test-type-icon-new from-red-500 to-pink-500">
                  <Trophy size={20} />
                </div>
                <h4>Kiểm tra cuối kì</h4>
              </div>
              <div className="test-type-score-new">
                <div className="score-circle-new">
                  <span className="score-value-new">8.2</span>
                  <span className="score-max-new">/10</span>
                </div>
                <div className="score-details-new">
                  <p>1 bài kiểm tra</p>
                  <p className="score-percentage-new">82%</p>
                </div>
              </div>
            </div>

            <div className="test-type-card-new highlight">
              <div className="test-type-header-new">
                <div className="test-type-icon-new from-purple-500 to-pink-500">
                  <Award size={20} />
                </div>
                <h4>Điểm Trung bình Chung</h4>
              </div>
              <div className="test-type-score-new">
                <div className="score-circle-new large">
                  <span className="score-value-new">8.1</span>
                  <span className="score-max-new">/10</span>
                </div>
                <div className="score-details-new">
                  <p>Tất cả bài kiểm tra</p>
                  <p className="score-percentage-new">81%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Grades Table */}
        <div className="recent-grades-new">
          <h3 className="section-title-new">Kết quả Gần đây</h3>
          <div className="grades-table-new">
            {submissions.filter(s => s.status === 'graded' && s.score !== null).slice(0, 10).map((submission) => {
              const exercise = [...exercises, ...tests].find(e => e.id === submission.exercise_id);
              if (!exercise) return null;
              
              const percentage = (submission.score / exercise.max_score) * 100;
              const gradeLevel = percentage >= 80 ? 'excellent' : 
                                percentage >= 65 ? 'good' : 
                                percentage >= 50 ? 'average' : 'poor';
              
              return (
                <div key={submission.id} className={`grade-item-new ${gradeLevel}`}>
                  <div className="grade-item-left-new">
                    <div className="grade-item-icon-new">
                      {getSkillEmoji(exercise.skill_type)}
                    </div>
                    <div className="grade-item-info-new">
                      <div className="grade-item-title-new">{exercise.title}</div>
                      <div className="grade-item-meta-new">
                        <span>{exercise.class_name || 'Lớp học'}</span>
                        <span>•</span>
                        <span>{new Date(submission.submitted_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grade-item-right-new">
                    <div className="grade-item-score-new">
                      <span className="score-num-new">{submission.score}</span>
                      <span className="score-sep-new">/</span>
                      <span className="score-max-new">{exercise.max_score}</span>
                    </div>
                    <div className={`grade-item-badge-new ${gradeLevel}`}>
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container-new">
          <div className="loading-spinner-new"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      );
    }

    if (activeTab === 'grades') {
      return renderGradesView();
    }

    const filteredExercises = getFilteredExercises();

    if (!filteredExercises || filteredExercises.length === 0) {
      return (
        <div className="empty-state-new">
          <FileText size={80} strokeWidth={1} />
          <h3>Chưa có bài tập nào</h3>
          <p>Bài tập mới sẽ xuất hiện ở đây</p>
        </div>
      );
    }

    return (
      <div className="exercises-list-new">
        <div className="content-header-new">
          <h2>{activeTab === 'all' ? 'Tất cả Bài tập' : activeTab === 'tests' ? 'Bài Kiểm tra' : `Bài tập ${getSkillName(activeTab)}`}</h2>
          <p>{filteredExercises.length} bài tập</p>
        </div>
        <div className="exercises-grid-new">
          {filteredExercises.map(renderExerciseCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="exercise-hub-new">
      <ExerciseSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="exercise-content-new">
        <div className="content-wrapper-new">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
