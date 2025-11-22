import { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, FileText, Video, ChevronRight, Download, Eye, PlayCircle, Star, Clock, Award, TrendingUp, CheckCircle2, Target, Bell, AlertCircle, HandRaisedIcon as HandRaised, PenLine, FileCheck, X, FolderOpen } from 'lucide-react';
import './MyClasses.css';
import { apiV1 } from '../../../services/api';

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [playingVideo, setPlayingVideo] = useState(null);
  const [viewingSlides, setViewingSlides] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassDetails(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      const response = await apiV1.get('/classes/my-classes');
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassDetails = async (classId) => {
    try {
      const [lessonsRes, exercisesRes, materialsRes] = await Promise.all([
        apiV1.get(`/classes/${classId}/lessons`),
        apiV1.get(`/classes/${classId}/exercises`),
        apiV1.get(`/classes/${classId}/materials`)
      ]);
      
      setLessons(lessonsRes.data);
      setExercises(exercisesRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      console.error('Error fetching class details:', error);
    }
  };

  if (loading) {
    return (
      <div className="my-classes-loading">
        <div className="loading-spinner-classes"></div>
        <p>Đang tải lớp học của bạn...</p>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="my-classes-empty">
        <div className="empty-icon-classes">
          <BookOpen size={100} strokeWidth={1} />
        </div>
        <h2>Chưa có lớp học nào</h2>
        <p>Bạn chưa tham gia lớp học nào. Hãy liên hệ giáo viên để được thêm vào lớp!</p>
      </div>
    );
  }

  return (
    <div className="my-classes-wrapper">
      {/* Hero Section */}
      <div className="classes-hero-new">
        <div className="hero-bg-new"></div>
        <div className="hero-content-new">
          <div className="hero-badge-new">
            <Target size={16} />
            <span>Lớp học của tôi</span>
          </div>
          <h1 className="hero-title-new">Chào mừng trở lại! 👋</h1>
          <p className="hero-subtitle-new">Bạn đang tham gia {classes.length} lớp học</p>
        </div>
      </div>

      {/* Class Cards */}
      <div className="class-selector-new">
        <div className="class-cards-new">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className={`class-card-item ${selectedClass?.id === cls.id ? 'active' : ''}`}
              onClick={() => setSelectedClass(cls)}
            >
              <div className="class-card-header-new">
                <div className="class-icon-new">
                  <BookOpen size={22} />
                </div>
                <div className="class-badge-new">
                  <Users size={12} />
                  <span>{cls.student_count || 0}</span>
                </div>
              </div>
              <h3 className="class-name-new">{cls.name}</h3>
              <p className="class-teacher-new">{cls.teacher_name}</p>
              <div className="class-footer-new">
                <span>Xem chi tiết</span>
                <ChevronRight size={16} className="arrow-icon-new" />
              </div>
              {selectedClass?.id === cls.id && <div className="active-bar-new"></div>}
            </div>
          ))}
        </div>
      </div>

      {selectedClass && (
        <>
          {/* Class Info Banner */}
          <div className="class-banner-new">
            <div className="banner-bg-new"></div>
            <div className="banner-content-new">
              <div className="banner-left-new">
                <div className="banner-icon-new">
                  <BookOpen size={32} />
                </div>
                <div className="banner-info-new">
                  <h2>{selectedClass.name}</h2>
                  <p>{selectedClass.description || 'Không có mô tả'}</p>
                  <div className="banner-meta-new">
                    <span>
                      <Calendar size={14} />
                      {selectedClass.schedule || 'Chưa có lịch học'}
                    </span>
                    <span>
                      <Users size={14} />
                      {selectedClass.student_count || 0} học sinh
                    </span>
                  </div>
                </div>
              </div>
              <div className="banner-stats-new">
                <div className="mini-stat-new">
                  <div className="mini-stat-icon-new from-blue-500">
                    <BookOpen size={18} />
                  </div>
                  <div className="mini-stat-text-new">
                    <div className="mini-stat-value-new">{lessons.length}</div>
                    <div className="mini-stat-label-new">Bài giảng</div>
                  </div>
                </div>
                <div className="mini-stat-new">
                  <div className="mini-stat-icon-new from-purple-500">
                    <FileText size={18} />
                  </div>
                  <div className="mini-stat-text-new">
                    <div className="mini-stat-value-new">{exercises.length}</div>
                    <div className="mini-stat-label-new">Bài tập</div>
                  </div>
                </div>
                <div className="mini-stat-new">
                  <div className="mini-stat-icon-new from-green-500">
                    <Video size={18} />
                  </div>
                  <div className="mini-stat-text-new">
                    <div className="mini-stat-value-new">{materials.length}</div>
                    <div className="mini-stat-label-new">Tài liệu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="tabs-nav-new">
            <button
              className={`tab-btn-new ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <TrendingUp size={18} />
              <span>Tổng quan</span>
            </button>
            <button
              className={`tab-btn-new ${activeTab === 'lessons' ? 'active' : ''}`}
              onClick={() => setActiveTab('lessons')}
            >
              <PlayCircle size={18} />
              <span>Bài giảng</span>
              <span className="tab-count-new">{lessons.length}</span>
            </button>
            <button
              className={`tab-btn-new ${activeTab === 'exercises' ? 'active' : ''}`}
              onClick={() => setActiveTab('exercises')}
            >
              <FileText size={18} />
              <span>Bài tập</span>
              <span className="tab-count-new">{exercises.length}</span>
            </button>
            <button
              className={`tab-btn-new ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => setActiveTab('materials')}
            >
              <FolderOpen size={18} />
              <span>Tài liệu</span>
              <span className="tab-count-new">{materials.length}</span>
            </button>
          </div>

          {/* Content */}
          <div className="content-area-new">
            {activeTab === 'overview' && (
              <div className="overview-new">
                <div className="overview-grid-new">
                  {/* Progress Card */}
                  <div className="overview-card-new progress">
                    <div className="overview-card-header-new">
                      <h3>Tiến độ học tập</h3>
                      <Award size={22} />
                    </div>
                    <div className="progress-display-new">
                      <div className="circular-chart-new">
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" className="chart-bg-new" />
                          <circle cx="50" cy="50" r="45" className="chart-fill-new" 
                            style={{ strokeDashoffset: `${283 - (283 * 75) / 100}` }} />
                        </svg>
                        <div className="chart-value-new">75%</div>
                      </div>
                      <div className="progress-text-new">
                        <div className="progress-row-new">
                          <CheckCircle2 size={16} className="text-green" />
                          <span>Hoàn thành: {exercises.filter(e => e.my_submission).length}/{exercises.length}</span>
                        </div>
                        <div className="progress-row-new">
                          <Clock size={16} className="text-orange" />
                          <span>Đang làm: {exercises.filter(e => !e.my_submission).length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Lessons */}
                  <div className="overview-card-new recent">
                    <div className="overview-card-header-new">
                      <h3>Bài giảng gần đây</h3>
                      <PlayCircle size={22} />
                    </div>
                    <div className="recent-items-new">
                      {lessons.slice(0, 3).map((lesson) => (
                        <div key={lesson.id} className="recent-item-new">
                          <div className="recent-icon-new">
                            <BookOpen size={16} />
                          </div>
                          <div className="recent-text-new">
                            <div className="recent-title-new">{lesson.title}</div>
                            <div className="recent-date-new">
                              {lesson.lesson_date ? new Date(lesson.lesson_date).toLocaleDateString('vi-VN') : 'Chưa có ngày'}
                            </div>
                          </div>
                          <button className="recent-action-new">
                            <Eye size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Exercises */}
                  <div className="overview-card-new upcoming">
                    <div className="overview-card-header-new">
                      <h3>Bài tập sắp đến hạn</h3>
                      <Clock size={22} />
                    </div>
                    <div className="upcoming-items-new">
                      {exercises.slice(0, 3).map((exercise) => (
                        <div key={exercise.id} className="upcoming-item-new">
                          <div className="upcoming-dot-new urgent"></div>
                          <div className="upcoming-text-new">
                            <div className="upcoming-title-new">{exercise.title}</div>
                            <div className="upcoming-date-new">
                              Hạn: {exercise.due_at ? new Date(exercise.due_at).toLocaleDateString('vi-VN') : 'Không có'}
                            </div>
                          </div>
                          <button className="upcoming-btn-new">Làm bài</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reminder Box */}
                <div className="reminder-box-new">
                  <div className="reminder-icon-new">
                    <Bell size={24} />
                  </div>
                  <div className="reminder-content-new">
                    <h4>💡 Nhắc nhở quan trọng</h4>
                    <p>Nhớ làm bài tập về nhà đúng hạn để đạt kết quả tốt nhất. Hãy kiểm tra phần "Bài tập sắp đến hạn" thường xuyên!</p>
                  </div>
                  <div className="reminder-close-new">
                    <AlertCircle size={20} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lessons' && (
              <div className="lessons-new">
                <div className="section-header-new">
                  <h2>Bài giảng theo buổi</h2>
                  <p>Xem lại tài liệu và PowerPoint các buổi học</p>
                </div>
                {lessons.length === 0 ? (
                  <div className="empty-section-new">
                    <PlayCircle size={64} strokeWidth={1} />
                    <p>Chưa có bài giảng nào</p>
                  </div>
                ) : (
                  <div className="lessons-grid-new">
                    {lessons.map((lesson, index) => (
                      <div key={lesson.id} className="lesson-item-new">
                        <div className="lesson-header-new">
                          <div className="lesson-badge-new">Buổi {lesson.session_number || index + 1}</div>
                          {lesson.lesson_date && (
                            <div className="lesson-date-new">
                              <Calendar size={13} />
                              {new Date(lesson.lesson_date).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                        <div className="lesson-body-new">
                          <h3>{lesson.title}</h3>
                          <p>{lesson.content || 'Không có nội dung'}</p>
                          
                          {/* Video Lessons List */}
                          {lesson.video_lessons && lesson.video_lessons.length > 0 && (
                            <div className="lesson-videos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '15px' }}>
                              {lesson.video_lessons.map(video => (
                                <div key={video.id} 
                                  className="video-card-item"
                                  onClick={() => video.status === 'completed' && setPlayingVideo(video)}
                                  style={{ 
                                    cursor: video.status === 'completed' ? 'pointer' : 'default',
                                    border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden',
                                    opacity: video.status === 'completed' ? 1 : 0.7,
                                    backgroundColor: '#fff'
                                  }}
                                >
                                  <div className="video-thumbnail" style={{ position: 'relative', paddingTop: '56.25%', background: '#f3f4f6' }}>
                                    {video.thumbnail_url ? (
                                      <img src={video.thumbnail_url} alt={video.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                        <Video size={32} />
                                      </div>
                                    )}
                                    {video.status === 'completed' && (
                                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '8px', display: 'flex' }}>
                                        <PlayCircle size={24} color="white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="video-info" style={{ padding: '8px' }}>
                                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={video.title}>{video.title}</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#6b7280' }}>
                                       <span>{video.duration_seconds ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}` : '--:--'}</span>
                                       <span style={{ textTransform: 'capitalize' }}>{video.status === 'completed' ? 'Sẵn sàng' : video.status}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="lesson-actions-new">
                          <button className="lesson-btn-new secondary">
                            <Download size={16} />
                            <span>Tài liệu</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exercises' && (
              <div className="exercises-new">
                <div className="section-header-new">
                  <h2>Bài tập về nhà</h2>
                  <p>Hoàn thành bài tập để nâng cao kỹ năng</p>
                </div>
                {exercises.length === 0 ? (
                  <div className="empty-section-new">
                    <FileText size={64} strokeWidth={1} />
                    <p>Chưa có bài tập nào</p>
                  </div>
                ) : (
                  <div className="exercises-grid-new">
                    {exercises.map((exercise) => {
                      const hasSubmission = exercise.my_submission;
                      const isGraded = hasSubmission && exercise.my_submission.score !== null;
                      const isOverdue = exercise.due_at && new Date(exercise.due_at) < new Date();
                      
                      return (
                        <div key={exercise.id} className={`exercise-item-new ${isGraded ? 'graded' : hasSubmission ? 'submitted' : isOverdue ? 'overdue' : ''}`}>
                          <div className="exercise-header-new">
                            <div className="exercise-type-new">
                              {exercise.type === 'quiz' ? (
                                <>
                                  <FileCheck size={14} className="inline-block mr-1" />
                                  Kiểm tra
                                </>
                              ) : (
                                <>
                                  <PenLine size={14} className="inline-block mr-1" />
                                  Bài tập
                                </>
                              )}
                            </div>
                            {isGraded && (
                              <div className="exercise-score-new">
                                <Star size={13} fill="currentColor" />
                                {exercise.my_submission.score}/{exercise.max_score}
                              </div>
                            )}
                          </div>
                          <div className="exercise-body-new">
                            <h3>{exercise.title}</h3>
                            <p>{exercise.description || 'Không có mô tả'}</p>
                            <div className="exercise-meta-new">
                              <span>
                                <Calendar size={13} />
                                {exercise.due_at ? new Date(exercise.due_at).toLocaleDateString('vi-VN') : 'Không có hạn'}
                              </span>
                              {exercise.max_score && (
                                <span>
                                  <Award size={13} />
                                  {exercise.max_score} điểm
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="exercise-actions-new">
                            {!hasSubmission ? (
                              <button className="exercise-btn-new start">
                                <PlayCircle size={15} />
                                Bắt đầu làm
                              </button>
                            ) : isGraded ? (
                              <button className="exercise-btn-new done">
                                <CheckCircle2 size={15} />
                                Xem kết quả
                              </button>
                            ) : (
                              <button className="exercise-btn-new pending">
                                <Clock size={15} />
                                Chờ chấm điểm
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="materials-new">
                <div className="section-header-new">
                  <h2>Tài liệu học tập</h2>
                  <p>Tài liệu tham khảo và bài đọc thêm</p>
                </div>
                {materials.length === 0 ? (
                  <div className="empty-section-new">
                    <FolderOpen size={64} strokeWidth={1} />
                    <p>Chưa có tài liệu nào</p>
                  </div>
                ) : (
                  <div className="materials-grid-new" style={{ display: 'grid', gap: '12px' }}>
                    {materials.map((material) => (
                      <div key={material.id} className="material-item-new" style={{
                        display: 'flex', alignItems: 'center', gap: '15px', padding: '15px',
                        background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px'
                      }}>
                        <div className="material-icon" style={{
                          width: '40px', height: '40px', background: '#eff6ff', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb'
                        }}>
                          <FileText size={20} />
                        </div>
                        <div className="material-info" style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', color: '#1f2937' }}>{material.title}</h3>
                          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{material.description || 'Không có mô tả'}</p>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                            {new Date(material.created_at).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        {material.url && (
                          <a 
                            href={material.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="material-action-btn"
                            style={{
                              padding: '8px 16px', background: '#f3f4f6', color: '#374151',
                              borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '500',
                              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                            }}
                          >
                            <Download size={16} />
                            Tải về
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="video-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setPlayingVideo(null)}>
          <div className="video-modal-content" style={{
            width: '95%', maxWidth: '1200px', background: 'black',
            borderRadius: '12px', overflow: 'hidden', position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937', color: 'white' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{playingVideo.title}</h3>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {playingVideo.slides_metadata && playingVideo.slides_metadata.length > 0 && (
                  <button 
                    onClick={() => {
                      setViewingSlides(playingVideo);
                      setPlayingVideo(null);
                      setCurrentSlideIndex(0);
                    }}
                    style={{
                      background: '#3b82f6', border: 'none', color: 'white', 
                      padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500'
                    }}
                  >
                    <FileText size={16} />
                    Xem Slide
                  </button>
                )}
                <button onClick={() => setPlayingVideo(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                  <X size={24} />
                </button>
              </div>
            </div>
            <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
              <video 
                src={playingVideo.video_url} 
                controls 
                autoPlay 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Slide Viewer Modal */}
      {viewingSlides && (
        <div className="slide-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 1000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setViewingSlides(null)}>
          
          {/* Header */}
          <div style={{ 
            width: '100%', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            position: 'absolute', top: 0, left: 0, zIndex: 10, background: 'rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}>
              {viewingSlides.title} - Slide {currentSlideIndex + 1}/{viewingSlides.slides_metadata.length}
            </h3>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => {
                  setPlayingVideo(viewingSlides);
                  setViewingSlides(null);
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', 
                  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Video size={16} />
                Xem Video
              </button>
              <button onClick={() => setViewingSlides(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Main Slide Image */}
          <div style={{ 
            flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            padding: '60px 20px 20px', boxSizing: 'border-box', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Prev Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlideIndex(prev => Math.max(0, prev - 1));
              }}
              disabled={currentSlideIndex === 0}
              style={{
                position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                width: '50px', height: '50px', borderRadius: '50%', cursor: currentSlideIndex === 0 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: currentSlideIndex === 0 ? 0.3 : 1, transition: 'all 0.2s'
              }}
            >
              <ChevronRight size={32} style={{ transform: 'rotate(180deg)' }} />
            </button>

            <img 
              src={viewingSlides.slides_metadata[currentSlideIndex]} 
              alt={`Slide ${currentSlideIndex + 1}`}
              style={{ 
                maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', 
                boxShadow: '0 0 20px rgba(0,0,0,0.5)', borderRadius: '4px'
              }}
            />

            {/* Next Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlideIndex(prev => Math.min(viewingSlides.slides_metadata.length - 1, prev + 1));
              }}
              disabled={currentSlideIndex === viewingSlides.slides_metadata.length - 1}
              style={{
                position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                width: '50px', height: '50px', borderRadius: '50%', cursor: currentSlideIndex === viewingSlides.slides_metadata.length - 1 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: currentSlideIndex === viewingSlides.slides_metadata.length - 1 ? 0.3 : 1, transition: 'all 0.2s'
              }}
            >
              <ChevronRight size={32} />
            </button>
          </div>

          {/* Thumbnails Strip */}
          <div style={{ 
            height: '80px', width: '100%', background: 'rgba(0,0,0,0.8)', 
            display: 'flex', gap: '10px', padding: '10px', overflowX: 'auto',
            justifyContent: 'center'
          }} onClick={e => e.stopPropagation()}>
            {viewingSlides.slides_metadata.map((slide, idx) => (
              <div 
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                style={{
                  height: '100%', aspectRatio: '16/9', cursor: 'pointer',
                  border: idx === currentSlideIndex ? '2px solid #3b82f6' : '2px solid transparent',
                  borderRadius: '4px', overflow: 'hidden', flexShrink: 0,
                  opacity: idx === currentSlideIndex ? 1 : 0.6, transition: 'all 0.2s'
                }}
              >
                <img src={slide} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
