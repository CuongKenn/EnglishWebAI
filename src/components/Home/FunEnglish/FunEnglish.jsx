import React from 'react';
import './FunEnglish.css';

const FunEnglish = () => {
  const funLessons = [
    {
      id: 1,
      title: 'Animals & Nature',
      description: 'Learn English through fun animal games',
      image: '🦁',
      color: 'orange',
      difficulty: 'Easy',
      lessons: 15
    },
    {
      id: 2,
      title: 'Colors & Shapes',
      description: 'Discover colors and shapes in English',
      image: '🎨',
      color: 'blue',
      difficulty: 'Easy',
      lessons: 12
    },
    {
      id: 3,
      title: 'Food & Drinks',
      description: 'Delicious English vocabulary lessons',
      image: '🍕',
      color: 'green',
      difficulty: 'Medium',
      lessons: 18
    },
    {
      id: 4,
      title: 'Sports & Games',
      description: 'Learn English while playing games',
      image: '⚽',
      color: 'purple',
      difficulty: 'Medium',
      lessons: 20
    }
  ];

  return (
    <section className="fun-english-section">
      <div className="section-header">
        <div className="header-badge">
          <span className="badge-icon">🎮</span>
          <span className="badge-text">Interactive Learning</span>
        </div>
        <h2 className="section-title">Fun English</h2>
        <p className="section-subtitle">
          Học tiếng Anh vui nhộn qua trò chơi và bài tập tương tác
        </p>
      </div>

      <div className="fun-lessons-grid">
        {funLessons.map((lesson) => (
          <div key={lesson.id} className={`fun-card fun-card-${lesson.color}`}>
            <div className="fun-card-image">
              <span className="emoji-large">{lesson.image}</span>
            </div>
            <div className="fun-card-content">
              <h3>{lesson.title}</h3>
              <p>{lesson.description}</p>
              <div className="fun-card-meta">
                <span className="difficulty-badge">{lesson.difficulty}</span>
                <span className="lessons-count">{lesson.lessons} lessons</span>
              </div>
              <button className="play-btn">
                <i className="fas fa-play"></i>
                Play Now
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="view-all-container">
        <button className="view-all-large-btn">
          <span>Xem tất cả bài học</span>
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </section>
  );
};

export default FunEnglish;

