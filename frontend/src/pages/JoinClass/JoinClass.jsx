import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useClasses } from '../../hooks';
import { classesAPI } from '../../services/api';
import { 
  BookOpenIcon,
  ChartBarIcon,
  StarIcon,
  ChevronRightIcon,
  TrophyIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';
import './JoinClass.css';

// --- [BẮT ĐẦU] CẬP NHẬT DỮ LIỆU MẪU ---
const mockGradeCourses = {
  'Lớp 1': {
    subjects: [
      {
        name: 'Phonics & Vocabulary (Phát âm & Từ vựng)',
        courses: [
          { id: 'en1_phonics_adventure', title: 'Phonics Adventure: Học phát âm qua trò chơi', image: '/images/courses/english/g1_phonics.png', lessons: 150, resources: 45, skill: 'reading' },
          { id: 'en1_first_words', title: 'My First 100 Words: Từ vựng cơ bản', image: '/images/courses/english/g1_vocab.png', lessons: 120, resources: 60, skill: 'reading' },
        ]
      },
      {
        name: 'Listening & Speaking (Nghe & Nói)',
        courses: [
          { id: 'en1_songs_stories', title: 'Sing & Learn: Học tiếng Anh qua bài hát', image: '/images/courses/english/g1_songs.png', lessons: 80, resources: 30, skill: 'listening' },
          { id: 'en1_greetings', title: 'Hello & Friends: Luyện tập chào hỏi', image: '/images/courses/english/g1_speaking.png', lessons: 65, resources: 25, skill: 'speaking' },
        ]
      }
    ]
  },
  'Lớp 7': {
    subjects: [
       {
        name: 'General English',
        courses: [
          { id: 'en7_general_1', title: 'Chương trình Tiếng Anh toàn diện Lớp 7', image: '/images/courses/english/default.png', lessons: 150, resources: 50, skill: 'general' },
          { id: 'en7_listening_master', title: 'Listening Master Class Lớp 7', image: '/images/courses/english/g6_reading.png', lessons: 80, resources: 30, skill: 'listening' },
          { id: 'en7_speaking_flow', title: 'Speaking with Flow Lớp 7', image: '/images/courses/english/g6_speaking.png', lessons: 75, resources: 25, skill: 'speaking' },
          { id: 'en7_reading_comp', title: 'Reading Comprehension Lớp 7', image: '/images/courses/english/g10_ielts.png', lessons: 90, resources: 40, skill: 'reading' },
          { id: 'en7_writing_skills', title: 'Creative Writing Lớp 7', image: '/images/courses/english/g10_writing.png', lessons: 60, resources: 35, skill: 'writing' },
        ]
      }
    ]
  },
  ...Object.fromEntries(
    ['Mẫu giáo', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'].map(grade => [
      grade,
      {
        subjects: [
          {
            name: 'General English',
            courses: [
              { id: `en_general_${grade.replace(' ', '')}`, title: `Chương trình Tiếng Anh toàn diện ${grade}`, image: '/images/courses/english/default.png', lessons: 150, resources: 50, skill: 'general' }
            ]
          }
        ]
      }
    ])
  )
};

const leaderboardDataWeek = [
  { rank: 1, name: 'Đặng Quốc Bảo', score: 1599, change: 29 },
  { rank: 2, name: 'Lê Phi Geo Phat', score: 1169, change: 40 },
  { rank: 3, name: 'Nguyễn Hiếu Minh Hiếu', score: 1087, change: 30 },
];
const leaderboardDataMonth = [
  { rank: 1, name: 'Lê Phi Geo Phat', score: 8540, change: 150 },
  { rank: 2, name: 'Đặng Quốc Bảo', score: 7820, change: 125 },
  { rank: 3, name: 'Trần Anh Thư', score: 6950, change: 210 },
];
// --- [KẾT THÚC] CẬP NHẬT DỮ LIỆU MẪU ---

const JoinClass = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const gradeNumber = selectedGrade && selectedGrade !== 'all' ? (selectedGrade.match(/\d+/)?.[0] || null) : null;
  const skillParam = selectedSkill !== 'all' ? selectedSkill : undefined;
  // joinClass function from hook not used directly (using classesAPI instead)
  const { classes, loading, error } = useClasses({ grade: gradeNumber || undefined, skill: skillParam });
  const [params] = useSearchParams();
  const navigate = useNavigate();
  
  const selGrade = params.get('grade'); 
  
  const [activeSkillFilter, setActiveSkillFilter] = useState('all');
  const skillFilters = ['all', 'listening', 'speaking', 'reading', 'writing'];
  const filterLabels = { all: 'Tất cả', listening: 'Nghe', speaking: 'Nói', reading: 'Đọc', writing: 'Viết' };

  const [leaderboardPeriod, setLeaderboardPeriod] = useState('week');
  const leaderboardData = leaderboardPeriod === 'week' ? leaderboardDataWeek : leaderboardDataMonth;

  const courseDataForGrade = selGrade && mockGradeCourses[selGrade] ? mockGradeCourses[selGrade] : { subjects: [] };
  const gradeList = ['Mẫu giáo', ...Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`)];

  useEffect(() => {
    const q = params.get('grade');
    if (q) setSelectedGrade(q);
  }, [params]);

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) || classItem.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || classItem.grade === selectedGrade;
    const matchesSkill = selectedSkill === 'all' || (classItem.skill || '').toLowerCase() === selectedSkill.toLowerCase();
    return matchesSearch && matchesGrade && matchesSkill;
  });

  const handleJoinClass = async (classId) => {
    try {
      try { 
        await classesAPI.joinClass(classId); 
      } catch {
        // Silent error - will navigate anyway
      }
      navigate(`/course/${classId}`);
    } catch {
      // Navigate even on error
      navigate(`/course/${classId}`);
    }
  };

  if (selGrade) {
    return (
      <div className="join-class-page grade-view-layout">
        <aside className="sidebar-left">
          <nav className="grade-nav">
            <ul>
              {gradeList.map(grade => (
                <li key={grade}>
                  <Link to={`/join-class?grade=${encodeURIComponent(grade)}`} className={selGrade === grade ? 'active' : ''}>
                    <BookOpenIcon className="w-4 h-4" /><span>{grade}</span><ChevronRightIcon className="w-4 h-4 chevron" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          <h1 className="main-title">Các khóa học {selGrade}</h1>
          
          <div className="course-filters">
            {skillFilters.map(skill => (
              <button
                key={skill}
                className={`filter-skill-btn ${activeSkillFilter === skill ? 'active' : ''}`}
                onClick={() => setActiveSkillFilter(skill)}
              >
                {filterLabels[skill]}
              </button>
            ))}
          </div>

          {courseDataForGrade.subjects.map(subject => (
            <section key={subject.name} className="subject-section">
              <h2 className="subject-title">{subject.name}</h2>
              <div className="course-grid">
                {subject.courses
                  .filter(course => activeSkillFilter === 'all' || course.skill === activeSkillFilter || course.skill === 'general')
                  .map(course => (
                  <Link key={course.id} to={`/course/${course.id}`} className="course-item-card-link">
                      <div className="course-item-card">
                        <div className="course-image-container">
                          <img src={course.image || '/images/courses/default.png'} alt={course.title} className="course-image" />
                        </div>
                        <div className="course-info">
                          <h3 className="course-title">{course.title}</h3>
                          <div className="course-meta">
                            <span>{course.lessons} bài học</span><span>•</span><span>{course.resources} tài liệu</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                ))}
              </div>
            </section>
          ))}
        </main>

        <aside className="sidebar-right">
          <div className="leaderboard-card redesigned">
            <div className="leaderboard-top">
              <div className="card-header">
                <h4><ChartBarIcon className="w-4.5 h-4.5" /> Bảng vinh danh</h4>
                <Link to="#" className="details-link">Chi tiết</Link>
              </div>
            </div>
            
            <div className="leaderboard-bottom">
              <div className="leaderboard-filters">
                <button 
                  className={`filter-btn ${leaderboardPeriod === 'week' ? 'active' : ''}`}
                  onClick={() => setLeaderboardPeriod('week')}
                >
                  Tuần này
                </button>
                <button 
                  className={`filter-btn ${leaderboardPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => setLeaderboardPeriod('month')}
                >
                  Tháng này
                </button>
              </div>
              <ul className="leaderboard-list">
                {leaderboardData.map(user => (
                  <li key={user.rank}>
                    <div className="leaderboard-user-info">
                      <div className={`rank-badge rank-${user.rank}`}>
                        {user.rank <= 3 ? <TrophyIconSolid className="w-4 h-4" /> : user.rank}
                      </div>
                      <span className="name">{user.name}</span>
                    </div>
                    <div className="score-col">
                      <span className="score">{user.score}</span>
                      <span className="change green">
                        <ArrowUpIcon className="w-3 h-3" /> (+{user.change})
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="user-profile-card redesigned">
             <div className="user-info">
                <div className="user-avatar">NV</div>
                <div className="user-details">
                  <span className="user-name">nguyễn văn hoài...</span>
                  <span className="user-level"><StarIcon className="w-3 h-3" /> Cấp 1</span>
                </div>
             </div>
             <div className="user-score"><TrophyIconSolid className="w-4.5 h-4.5" /><span>0</span></div>
          </div>
        </aside>
      </div>
    );
  }

  // Giao diện mặc định (đầy đủ)
  return (
    <div className="join-class-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title fade-in">
            <span className="title-icon">👥</span>
            Lớp học của tôi
          </h1>
          <p className="page-subtitle fade-in">
            Tìm và tham gia các lớp học phù hợp với trình độ của bạn
          </p>
        </div>
      </div>

      <div className="page-content">
        <div className="search-filter-section slide-up">
          <div className="search-container">
            <div className="search-box">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Tìm kiếm lớp học, giáo viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-container">
            <div className="filter-group">
              <label className="filter-label">Khối lớp:</label>
              <select 
                value={selectedGrade} 
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={`Lớp ${g}`}>{`Lớp ${g}`}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Kỹ năng:</label>
              <select 
                value={selectedSkill} 
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                <option value="listening">Listening</option>
                <option value="speaking">Speaking</option>
                <option value="reading">Reading</option>
                <option value="writing">Writing</option>
              </select>
            </div>
          </div>
        </div>

        <div className="classes-section fade-in">
          <div className="section-header">
            <h2 className="section-title">Lớp học có sẵn</h2>
            <div className="results-count">
              {filteredClasses.length} lớp học
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải danh sách lớp học...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          ) : (
            <div className="classes-grid">
              {filteredClasses.map((classItem) => (
                <div key={classItem.id} className={`class-card class-card-${classItem.color || 'blue'}`}>
                  <div className="class-header">
                    <div className="class-image">
                      <span className="class-emoji">{classItem.image || '📚'}</span>
                    </div>
                    <div className="class-info">
                      <h3 className="class-name">{classItem.name}</h3>
                      <p className="class-teacher">
                        <i className="fas fa-user"></i>
                        {classItem.teacher_name || 'Chưa có giáo viên'}
                      </p>
                    </div>
                  </div>

                  <div className="class-details">
                    <div className="detail-item">
                      <i className="fas fa-graduation-cap"></i>
                      <span>{classItem.grade || 'N/A'}</span>
                    </div>
                  <div className="detail-item">
                    <i className="fas fa-book"></i>
                    <span>{(classItem.skill ? (classItem.skill.charAt(0).toUpperCase() + classItem.skill.slice(1)) : 'N/A')}</span>
                  </div>
                    <div className="detail-item">
                      <i className="fas fa-clock"></i>
                      <span>{classItem.schedule || 'Chưa có lịch học'}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-users"></i>
                      <span>{classItem.students || 0}/{classItem.maxStudents || classItem.max_students || 30} học sinh</span>
                    </div>
                  </div>

                  <p className="class-description">{classItem.description || 'Không có mô tả'}</p>

                  <div className="class-actions">
                    <button 
                      className="join-btn"
                      onClick={() => handleJoinClass(classItem.id)}
                    >
                      <i className="fas fa-plus"></i>
                      Tham gia
                    </button>
                    <button className="info-btn">
                      <i className="fas fa-info-circle"></i>
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredClasses.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>Không tìm thấy lớp học nào</h3>
              <p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          )}
      </div>
    </div>
  </div>
  );
};

export default JoinClass;