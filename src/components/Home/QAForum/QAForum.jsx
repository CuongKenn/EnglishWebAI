import React from 'react';
import './QAForum.css';

const QAForum = () => {
  const questions = [
    {
      id: 1,
      author: 'Trần Thị Lan',
      avatar: 'TT',
      question: 'How to use Present Perfect tense correctly?',
      description: 'I need help understanding when to use Present Perfect vs Simple Past',
      answers: 15,
      views: 234,
      timeAgo: '2 giờ trước',
      tags: ['Grammar', 'Tenses']
    },
    {
      id: 2,
      author: 'Nguyễn Văn Minh',
      avatar: 'NM',
      question: 'What is the difference between "in" and "on"?',
      description: 'When should I use preposition "in" vs "on" for time expressions?',
      answers: 23,
      views: 456,
      timeAgo: '5 giờ trước',
      tags: ['Prepositions', 'Vocabulary']
    },
    {
      id: 3,
      author: 'Lê Hải Yến',
      avatar: 'LY',
      question: 'Tips for improving English speaking skills?',
      description: 'Any recommendations for practicing English conversation at home?',
      answers: 31,
      views: 789,
      timeAgo: '1 ngày trước',
      tags: ['Speaking', 'Practice']
    }
  ];

  return (
    <section className="qa-forum-section">
      <div className="section-header">
        <div className="header-badge badge-blue">
          <span className="badge-icon">💬</span>
          <span className="badge-text">Community Learning</span>
        </div>
        <h2 className="section-title">Hỏi đáp</h2>
        <p className="section-subtitle">
          Học cùng bạn bè - Giải đáp thắc mắc từ cộng đồng và giáo viên
        </p>
      </div>

      <div className="qa-container">
        <div className="qa-sidebar">
          <button className="ask-question-btn">
            <i className="fas fa-plus-circle"></i>
            Đặt câu hỏi mới
          </button>
          <div className="qa-stats">
            <div className="stat-box">
              <span className="stat-num">1,234</span>
              <span className="stat-label">Câu hỏi</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">5,678</span>
              <span className="stat-label">Câu trả lời</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">890</span>
              <span className="stat-label">Thành viên</span>
            </div>
          </div>
        </div>

        <div className="qa-list">
          {questions.map((q) => (
            <div key={q.id} className="qa-card">
              <div className="qa-card-left">
                <div className="user-avatar">{q.avatar}</div>
              </div>
              <div className="qa-card-content">
                <h3 className="qa-question">{q.question}</h3>
                <p className="qa-description">{q.description}</p>
                <div className="qa-meta">
                  <span className="author-name">{q.author}</span>
                  <span className="time-ago">
                    <i className="far fa-clock"></i> {q.timeAgo}
                  </span>
                  <div className="qa-tags">
                    {q.tags.map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="qa-card-stats">
                <div className="stat-item">
                  <i className="fas fa-comment-dots"></i>
                  <span>{q.answers}</span>
                </div>
                <div className="stat-item">
                  <i className="fas fa-eye"></i>
                  <span>{q.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="view-all-container">
        <button className="view-all-large-btn">
          <span>Xem tất cả câu hỏi</span>
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </section>
  );
};

export default QAForum;

