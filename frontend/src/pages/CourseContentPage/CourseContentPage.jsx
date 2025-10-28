import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BookOpen, BarChart2, Star, Film, PenSquare, CheckCircle, Headphones, Play, Clock } from 'lucide-react';
import './CourseContentPage.css';
import { coursesAPI } from '../../services/api';

const CourseContentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const cid = useMemo(() => {
    try {
      const s = String(courseId ?? '').trim();
      const onlyDigits = s.replace(/[^0-9]/g, '');
      const n = parseInt(onlyDigits, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch { return null; }
  }, [courseId]);
  const [title, setTitle] = useState('Khóa học');
  const [courseData, setCourseData] = useState(null);
  const [units, setUnits] = useState([]);
  const [openUnitId, setOpenUnitId] = useState(null);
  const [questions, setQuestions] = useState({}); // { [unitId]: [] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        if (!cid) throw new Error('ID khóa học không hợp lệ');
        const course = await coursesAPI.getCourse(cid);
        setTitle(course?.title || 'Khóa học');
        setCourseData(course);
        const us = await coursesAPI.getUnits(cid);
        setUnits(Array.isArray(us) ? us : []);
      } catch (e) { setError(e?.detail || 'Không tải được nội dung khóa học'); }
      finally { setLoading(false); }
    };
    load();
  }, [cid]);

  const weeks = useMemo(() => {
    const map = new Map();
    for (const u of units) {
      const w = u.week_index || 1;
      if (!map.has(w)) map.set(w, []);
      map.get(w).push(u);
    }
    return Array.from(map.entries()).sort((a,b)=>a[0]-b[0]).map(([week, list])=>({ week, list }));
  }, [units]);

  const loadQuestions = async (unitId) => {
    try { const data = await coursesAPI.getQuestions(unitId); setQuestions((p)=>({ ...p, [unitId]: data })); }
    catch { /* ignore */ }
  };

  // Hàm xử lý click vào bài học
  const handleLessonClick = (unit) => {
    // Debug: Log courseData để kiểm tra
    console.log('Course Data:', courseData);
    console.log('Course Title:', courseData?.title);
    console.log('Course Category:', courseData?.category);
    
    // Kiểm tra nếu là khóa học Reading thì điều hướng đến trang reading exercise
    const isReadingCourse = courseData && (
      courseData.category === 'reading' || 
      courseData.title?.toLowerCase().includes('reading') ||
      courseData.title?.toLowerCase().includes('đọc')
    );
    
    // Kiểm tra nếu là khóa học Writing thì điều hướng đến trang writing exercise
    const isWritingCourse = courseData && (
      courseData.category === 'writing' || 
      courseData.title?.toLowerCase().includes('writing') ||
      courseData.title?.toLowerCase().includes('viết')
    );
    
    // Kiểm tra nếu là khóa học Speaking thì điều hướng đến trang speaking exercise
    const isSpeakingCourse = courseData && (
      courseData.category === 'speaking' || 
      courseData.title?.toLowerCase().includes('speaking') ||
      courseData.title?.toLowerCase().includes('nói')
    );
    
    // Kiểm tra nếu là khóa học Listening thì điều hướng đến trang listening exercise
    const isListeningCourse = courseData && (
      courseData.category === 'listening' || 
      courseData.title?.toLowerCase().includes('listening') ||
      courseData.title?.toLowerCase().includes('nghe')
    );
    
    // Fallback: Kiểm tra title hiện tại của trang
    const currentTitleReading = title?.toLowerCase().includes('reading') || title?.toLowerCase().includes('đọc');
    const currentTitleWriting = title?.toLowerCase().includes('writing') || title?.toLowerCase().includes('viết');
    const currentTitleSpeaking = title?.toLowerCase().includes('speaking') || title?.toLowerCase().includes('nói');
    const currentTitleListening = title?.toLowerCase().includes('listening') || title?.toLowerCase().includes('nghe');
    
    console.log('Is Reading Course:', isReadingCourse);
    console.log('Is Writing Course:', isWritingCourse);
    console.log('Is Speaking Course:', isSpeakingCourse);
    console.log('Is Listening Course:', isListeningCourse);
    console.log('Current Title Reading Check:', currentTitleReading);
    console.log('Current Title Writing Check:', currentTitleWriting);
    console.log('Current Title Speaking Check:', currentTitleSpeaking);
    console.log('Current Title Listening Check:', currentTitleListening);
    
    if (isReadingCourse || currentTitleReading) {
      navigate(`/reading-exercise/${courseId}/${unit.id}`);
    } else if (isWritingCourse || currentTitleWriting) {
      navigate(`/writing-exercise/${courseId}/${unit.id}`);
    } else if (isSpeakingCourse || currentTitleSpeaking) {
      navigate(`/speaking-exercise/${courseId}/${unit.id}`);
    } else if (isListeningCourse || currentTitleListening) {
      navigate(`/listening-exercise/${courseId}/${unit.id}`);
    } else {
      // Với các loại khóa học khác, mở/đóng panel câu hỏi như cũ
      setOpenUnitId(openUnitId === unit.id ? null : unit.id);
      if (!questions[unit.id]) {
        loadQuestions(unit.id);
      }
    }
  };

  return (
    <div className="course-content-page">
      <aside className="course-sidebar-left">
        <nav className="course-nav">
          <ul>
            <li><Link to="#" className="active">Nội dung khóa học</Link></li>
            <li><button onClick={() => setShowComingSoon(true)} className="exam-btn">Thi kiểm tra</button></li>
            <li><Link to="/discussion">Hỏi đáp</Link></li>
          </ul>
        </nav>
      </aside>

      <main className="course-main-content">
        <h1 className="course-page-title">{title}</h1>
        {loading && <div>Đang tải nội dung...</div>}
        {!loading && error && <div style={{ color: '#b91c1c' }}>{error}</div>}
        {!loading && !error && (
          <div className="lessons-container">
            {weeks.length === 0 && (
              <div className="empty" style={{ padding: 16, color: '#64748b' }}>
                Chưa có bài (Unit) nào trong khóa học này. Hãy vào Trang giáo viên → Khoá học công khai → Cài đặt để thêm bài.
              </div>
            )}
            {weeks.map(({ week, list }) => (
              <div key={week} className="week-section">
                <h2 className="week-title">Tuần {week}</h2>
                <ul className="lessons-list">
                  {list.map((u) => (
                    <li key={u.id} className="lesson-item">
                      <div className="lesson-info" onClick={() => handleLessonClick(u)} style={{ cursor: 'pointer' }}>
                        <BookOpen size={18} className="lesson-icon" />
                        <span className="lesson-title">{u.title}</span>
                      </div>
                      <div className="lesson-actions">
                        <span className="badge">{u.questions} câu hỏi</span>
                        {((courseData && (courseData.category === 'reading' || courseData.title?.toLowerCase().includes('reading') || courseData.title?.toLowerCase().includes('đọc'))) || (title?.toLowerCase().includes('reading') || title?.toLowerCase().includes('đọc'))) && (
                          <button 
                            className="start-lesson-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/reading-exercise/${courseId}/${u.id}`);
                            }}
                          >
                            <Play size={14} />
                            Bắt đầu học
                          </button>
                        )}
                        {((courseData && (courseData.category === 'writing' || courseData.title?.toLowerCase().includes('writing') || courseData.title?.toLowerCase().includes('viết'))) || (title?.toLowerCase().includes('writing') || title?.toLowerCase().includes('viết'))) && (
                          <button 
                            className="start-lesson-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/writing-exercise/${courseId}/${u.id}`);
                            }}
                          >
                            <Play size={14} />
                            Bắt đầu học
                          </button>
                        )}
                        {((courseData && (courseData.category === 'speaking' || courseData.title?.toLowerCase().includes('speaking') || courseData.title?.toLowerCase().includes('nói'))) || (title?.toLowerCase().includes('speaking') || title?.toLowerCase().includes('nói'))) && (
                          <button 
                            className="start-lesson-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/speaking-exercise/${courseId}/${u.id}`);
                            }}
                          >
                            <Play size={14} />
                            Bắt đầu học
                          </button>
                        )}
                        {((courseData && (courseData.category === 'listening' || courseData.title?.toLowerCase().includes('listening') || courseData.title?.toLowerCase().includes('nghe'))) || (title?.toLowerCase().includes('listening') || title?.toLowerCase().includes('nghe'))) && (
                          <button 
                            className="start-lesson-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/listening-exercise/${courseId}/${u.id}`);
                            }}
                          >
                            <Play size={14} />
                            Bắt đầu học
                          </button>
                        )}
                      </div>

                      {openUnitId === u.id && (
                        <div className="questions-panel">
                          {(questions[u.id]||[]).map((q)=> (
                            <div key={q.id} className="question-item">
                              <div className="q-header">
                                {q.type === 'mcq' && <PenSquare size={16} />}
                                {q.type === 'mcq-audio' && <Headphones size={16} />}
                                {q.type === 'prompt' && <PenSquare size={16} />}
                                {q.type === 'essay' && <PenSquare size={16} />}
                                <span>{q.prompt}</span>
                              </div>
                              {q.media_url && (
                                <audio controls src={q.media_url} style={{ marginTop: 8 }} />
                              )}
                              {Array.isArray(q.options) && q.options.length > 0 && (
                                <ul className="options-list">
                                  {q.options.map((opt, idx)=> (
                                    <li key={idx} className={q?.answer?.correct===idx? 'correct':''}>{String.fromCharCode(65+idx)}. {opt}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                          {(questions[u.id]?.length||0)===0 && (<div className="empty">Chưa có câu hỏi</div>)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>

      <aside className="course-sidebar-right">
        <div className="related-courses-card">
            <h4><BookOpen size={16}/> KHÓA HỌC LIÊN QUAN</h4>
            <div className="related-course-item">
                <img src="/vite.svg" alt="Course thumbnail"/>
                <div className="related-course-info">
                    <h5>Course mẫu</h5>
                </div>
            </div>
        </div>
        <div className="leaderboard-card redesigned">
            <div className="card-header">
                <h4><BarChart2 size={18} /> XẾP HẠNG TRONG KHÓA HỌC</h4>
                <Link to="#" className="details-link">Chi tiết</Link>
            </div>
            <ul className="leaderboard-list">
                {[{rank:1,name:'Học sinh A',score:120},{rank:2,name:'Học sinh B',score:90}].map(u => (
                  <li key={u.rank}>
                    <div className="leaderboard-user-info">
                      <div className={`rank-badge rank-${u.rank}`}>{u.rank}</div>
                      <span className="name">{u.name}</span>
                    </div>
                    <div className="score-col">
                      <span className="score">{u.score}</span>
                      <Star size={14} className="star-icon" />
                    </div>
                  </li>
                ))}
            </ul>
        </div>
      </aside>

      {showComingSoon && (
        <div className="coming-soon-modal-overlay" onClick={() => setShowComingSoon(false)}>
          <div className="coming-soon-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowComingSoon(false)} aria-label="Close modal">
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>×</span>
            </button>
            <div className="coming-soon-content">
              <Clock size={64} className="coming-soon-icon" />
              <h2>Coming Soon</h2>
              <p>Tính năng thi kiểm tra đang được phát triển. Vui lòng quay lại sau!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContentPage;

