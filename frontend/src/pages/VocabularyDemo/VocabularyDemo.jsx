import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VocabularyDemo.css';

const VocabularyDemo = () => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState(null);

  const vocabularyCourses = [
    {
      id: 'basic-vocabulary',
      title: 'Từ vựng cơ bản',
      description: 'Học các từ vựng cơ bản trong tiếng Anh',
      level: 'Cơ bản',
      duration: '2 tuần',
      lessons: 12,
      color: '#10b981'
    },
    {
      id: 'intermediate-vocabulary',
      title: 'Từ vựng trung cấp',
      description: 'Mở rộng vốn từ vựng với các chủ đề phức tạp hơn',
      level: 'Trung cấp',
      duration: '3 tuần',
      lessons: 18,
      color: '#3b82f6'
    },
    {
      id: 'advanced-vocabulary',
      title: 'Từ vựng nâng cao',
      description: 'Từ vựng chuyên sâu cho người học nâng cao',
      level: 'Nâng cao',
      duration: '4 tuần',
      lessons: 24,
      color: '#8b5cf6'
    },
    {
      id: 'business-vocabulary',
      title: 'Từ vựng kinh doanh',
      description: 'Từ vựng chuyên ngành kinh doanh và thương mại',
      level: 'Chuyên nghiệp',
      duration: '3 tuần',
      lessons: 15,
      color: '#f59e0b'
    }
  ];

  const handleStartCourse = (courseId) => {
    navigate(`/vocabulary/${courseId}`);
  };

  return (
    <div className="vocabulary-demo">
      <div className="demo-container">
        <div className="demo-header">
          <h1 className="demo-title">Khóa học từ vựng tiếng Anh</h1>
          <p className="demo-subtitle">
            Nâng cao vốn từ vựng của bạn với các bài tập tương tác và thú vị
          </p>
        </div>

        <div className="courses-grid">
          {vocabularyCourses.map((course) => (
            <div 
              key={course.id} 
              className={`course-card ${selectedCourse === course.id ? 'selected' : ''}`}
              onClick={() => setSelectedCourse(course.id)}
              style={{ '--course-color': course.color }}
            >
              <div className="course-header">
                <div className="course-level">{course.level}</div>
                <div className="course-duration">{course.duration}</div>
              </div>
              
              <div className="course-content">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">{course.description}</p>
                
                <div className="course-stats">
                  <div className="stat">
                    <span className="stat-icon">📚</span>
                    <span className="stat-text">{course.lessons} bài học</span>
                  </div>
                </div>
              </div>
              
              <div className="course-footer">
                <button 
                  className="start-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartCourse(course.id);
                  }}
                >
                  Bắt đầu học
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="demo-features">
          <h2>Tính năng nổi bật</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <h3>Bài tập tương tác</h3>
              <p>Làm bài tập điền từ với giao diện thân thiện</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Theo dõi tiến độ</h3>
              <p>Xem điểm số và tiến độ học tập của bạn</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔄</div>
              <h3>Luyện tập lặp lại</h3>
              <p>Hệ thống luyện tập thông minh giúp ghi nhớ lâu</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🏆</div>
              <h3>Thành tích</h3>
              <p>Thu thập điểm số và mở khóa các cấp độ mới</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabularyDemo;
