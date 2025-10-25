import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, BarChart2, Star, ChevronRight, Crown, ArrowUp, Trophy, Film, ClipboardCheck, PenSquare, HelpCircle, CheckCircle } from 'lucide-react';
import './CourseContentPage.css';

// --- MOCK DATA: Dữ liệu chi tiết cho từng khóa học ---
// Trong thực tế, bạn sẽ fetch dữ liệu này từ API dựa trên courseId
const mockCourseDetails = {
  'en1_phonics_adventure': {
    title: 'Phonics Adventure: Học phát âm qua trò chơi',
    weeks: [
      {
        title: 'Tuần 1: The Alphabet',
        lessons: [
          { title: 'Bài 1: a - c', hasVideo: true, hasPractice: true, hasTest: true, isCompleted: true },
          { title: 'Bài 2: d - f', hasVideo: true, hasPractice: true, hasTest: false, isCompleted: true },
          { title: 'Bài 3: g - i', hasVideo: true, hasPractice: false, hasTest: false, isCompleted: false },
          { type: 'worksheet', title: 'Phiếu bài tập cuối tuần 1 - Tự luận' }
        ]
      },
      {
        title: 'Tuần 2: Short Vowels',
        lessons: [
          { title: 'Bài 4: Short a (cat, bat)', hasVideo: true, hasPractice: true, hasTest: true, isCompleted: false },
          { title: 'Bài 5: Short e (pen, web)', hasVideo: true, hasPractice: true, hasTest: true, isCompleted: false },
          { title: 'Bài 6: Ôn tập', hasVideo: false, hasPractice: true, hasTest: true, isCompleted: false },
          { type: 'worksheet', title: 'Phiếu bài tập cuối tuần 2 - Tự luận' }
        ]
      },
    ]
  },
  // Thêm dữ liệu cho các khóa học khác nếu cần
  'default': {
    title: 'Chương trình Tiếng Anh toàn diện',
    weeks: [ { title: 'Tuần 1', lessons: [{ title: 'Bài 1: Introduction', hasVideo: true, hasPractice: true, hasTest: false, isCompleted: false }] } ]
  }
};

const leaderboardData = [
  { rank: 1, name: 'Phạm Duy Tiên', score: 999, avatar: 'PD' },
  { rank: 2, name: 'Đỗ Minh Hiếu', score: 557, avatar: 'ĐM' },
  { rank: 3, name: 'Nguyễn Lê An Nhiên', score: 453, avatar: 'NA' },
];

const CourseContentPage = () => {
  const { courseId } = useParams(); // Lấy ID khóa học từ URL
  const [courseData, setCourseData] = useState(null);

  useEffect(() => {
    // Tìm dữ liệu khóa học tương ứng. Nếu không có, dùng dữ liệu mặc định.
    const data = mockCourseDetails[courseId] || mockCourseDetails['default'];
    setCourseData(data);
  }, [courseId]);

  if (!courseData) {
    return <div>Đang tải nội dung khóa học...</div>; // Hoặc một component loading đẹp hơn
  }

  return (
    <div className="course-content-page">
      {/* ===== Sidebar Trái: Điều hướng trong khóa học ===== */}
      <aside className="course-sidebar-left">
        <nav className="course-nav">
          <ul>
            <li><Link to="#" className="active">Nội dung khóa học</Link></li>
            <li><Link to="#">Hướng dẫn khóa học hè 2024</Link></li>
            <li><Link to="#">Thi kiểm tra</Link></li>
            <li><Link to="#">Hỏi đáp</Link></li>
          </ul>
          <div className="course-meta-info">
            <span className="info-title">Xem lịch sử học tập</span>
            <div className="qr-code">
                {/* Giả sử bạn có ảnh QR code */}
                <img src="/images/qr-code.png" alt="QR Code" />
            </div>
          </div>
        </nav>
      </aside>

      {/* ===== Nội dung chính: Danh sách bài học ===== */}
      <main className="course-main-content">
        <h1 className="course-page-title">{courseData.title}</h1>
        <div className="lessons-container">
          {courseData.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="week-section">
              <h2 className="week-title">{week.title}</h2>
              <ul className="lessons-list">
                {week.lessons.map((lesson, lessonIndex) => (
                  <li key={lessonIndex} className={`lesson-item ${lesson.type === 'worksheet' ? 'worksheet-item' : ''}`}>
                    <div className="lesson-info">
                      {lesson.type === 'worksheet' ? (
                        <PenSquare size={18} className="lesson-icon" />
                      ) : (
                        <BookOpen size={18} className="lesson-icon" />
                      )}
                      <span className="lesson-title">{lesson.title}</span>
                    </div>
                    {lesson.type !== 'worksheet' && (
                      <div className="lesson-actions">
                        {lesson.hasVideo && <Film size={20} className="action-icon video" title="Bài giảng video" />}
                        {lesson.hasPractice && <ClipboardCheck size={20} className="action-icon practice" title="Luyện tập" />}
                        {lesson.hasTest && <PenSquare size={20} className="action-icon test" title="Kiểm tra" />}
                        {lesson.isCompleted && <CheckCircle size={20} className="action-icon completed" title="Đã hoàn thành" />}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      {/* ===== Sidebar Phải: Khóa học liên quan & Xếp hạng ===== */}
      <aside className="course-sidebar-right">
        <div className="related-courses-card">
            <h4><BookOpen size={16}/> KHÓA HỌC LIÊN QUAN</h4>
            <div className="related-course-item">
                <img src="/images/courses/default.png" alt="Course thumbnail"/>
                <div className="related-course-info">
                    <h5>Toán lớp 1 (Hỗ trợ học bộ...)</h5>
                </div>
            </div>
        </div>
        <div className="leaderboard-card redesigned">
            <div className="card-header">
                <h4><BarChart2 size={18} /> XẾP HẠNG TRONG KHÓA HỌC</h4>
                <Link to="#" className="details-link">Chi tiết</Link>
            </div>
            <div className="leaderboard-filters">
                <button className="filter-btn active">Tuần này</button>
            </div>
            <ul className="leaderboard-list">
                {leaderboardData.map(user => (
                  <li key={user.rank}>
                    <div className="leaderboard-user-info">
                      <div className={`rank-badge rank-${user.rank}`}>{user.rank}</div>
                      <span className="name">{user.name}</span>
                    </div>
                    <div className="score-col">
                      <span className="score">{user.score}</span>
                      <Star size={14} className="star-icon" />
                    </div>
                  </li>
                ))}
            </ul>
        </div>
        <div className="user-profile-card redesigned">
            <div className="user-info">
                <div className="user-avatar">HT</div>
                <div className="user-details">
                    <span className="user-name">Hoàng Trần</span>
                </div>
            </div>
            <div className="user-score"><Star size={18} /><span>0</span></div>
        </div>
      </aside>
    </div>
  );
};

export default CourseContentPage;