import React, { useState, useEffect } from 'react';
import './Discussion.css';

const Discussion = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    subject: '',
    tags: ''
  });

  // Mock data
  useEffect(() => {
    const mockQuestions = [
      {
        id: 1,
        title: 'Cách giải bài toán phép cộng có nhớ trong phạm vi 100?',
        content: 'Em không hiểu cách làm phép cộng có nhớ, ai có thể giúp em không?',
        author: 'Nguyễn Minh Anh',
        authorRole: 'Học sinh',
        subject: 'Toán',
        grade: 'Lớp 2',
        tags: ['phép cộng', 'có nhớ', 'lớp 2'],
        answers: 3,
        views: 45,
        likes: 8,
        createdAt: '2 giờ trước',
        isAnswered: true,
        isVip: false,
        avatar: '👧'
      },
      {
        id: 2,
        title: 'Từ vựng tiếng Anh về gia đình',
        content: 'Các bạn có thể chia sẻ từ vựng tiếng Anh về gia đình không?',
        author: 'Trần Thị Hoa',
        authorRole: 'Học sinh',
        subject: 'Tiếng Anh',
        grade: 'Lớp 3',
        tags: ['từ vựng', 'gia đình', 'tiếng anh'],
        answers: 5,
        views: 78,
        likes: 12,
        createdAt: '4 giờ trước',
        isAnswered: true,
        isVip: false,
        avatar: '👩'
      },
      {
        id: 3,
        title: 'Tại sao lá cây có màu xanh?',
        content: 'Em thắc mắc tại sao lá cây lại có màu xanh, có ai biết giải thích không?',
        author: 'Lê Văn Nam',
        authorRole: 'Học sinh',
        subject: 'Khoa học',
        grade: 'Lớp 4',
        tags: ['khoa học', 'thực vật', 'màu sắc'],
        answers: 2,
        views: 32,
        likes: 6,
        createdAt: '6 giờ trước',
        isAnswered: false,
        isVip: true,
        avatar: '👦'
      }
    ];
    
    setTimeout(() => {
      setQuestions(mockQuestions);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredQuestions = questions.filter(question => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'answered' && question.isAnswered) ||
                      (activeTab === 'unanswered' && !question.isAnswered) ||
                      (activeTab === 'vip' && question.isVip);
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || question.subject === selectedSubject;
    
    return matchesTab && matchesSearch && matchesSubject;
  });

  const handleAskQuestion = (e) => {
    e.preventDefault();
    if (newQuestion.title && newQuestion.content) {
      // Logic để gửi câu hỏi
      alert('Câu hỏi của bạn đã được gửi!');
      setNewQuestion({ title: '', content: '', subject: '', tags: '' });
      setShowAskForm(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'Tất cả', count: questions.length },
    { id: 'answered', label: 'Đã trả lời', count: questions.filter(q => q.isAnswered).length },
    { id: 'unanswered', label: 'Chưa trả lời', count: questions.filter(q => !q.isAnswered).length },
    { id: 'vip', label: 'VIP', count: questions.filter(q => q.isVip).length }
  ];

  return (
    <div className="discussion-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">💬</span>
            Thảo luận / Hỏi đáp
          </h1>
          <p className="page-subtitle">
            Đặt câu hỏi và thảo luận với cộng đồng học tập
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* Ask Question Section */}
        <div className="ask-section">
          <div className="ask-header">
            <h2 className="ask-title">Đặt câu hỏi</h2>
            <button 
              className="ask-btn"
              onClick={() => setShowAskForm(!showAskForm)}
            >
              <i className="fas fa-plus"></i>
              {showAskForm ? 'Đóng' : 'Đặt câu hỏi'}
            </button>
          </div>

          {showAskForm && (
            <form className="ask-form" onSubmit={handleAskQuestion}>
              <div className="form-group">
                <label className="form-label">Tiêu đề câu hỏi:</label>
                <input
                  type="text"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                  className="form-input"
                  placeholder="Nhập tiêu đề câu hỏi của bạn..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Môn học:</label>
                  <select
                    value={newQuestion.subject}
                    onChange={(e) => setNewQuestion({...newQuestion, subject: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="">Chọn môn học</option>
                    <option value="Toán">Toán</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Khoa học">Khoa học</option>
                    <option value="Lịch sử">Lịch sử</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tags:</label>
                  <input
                    type="text"
                    value={newQuestion.tags}
                    onChange={(e) => setNewQuestion({...newQuestion, tags: e.target.value})}
                    className="form-input"
                    placeholder="Ví dụ: phép cộng, có nhớ, lớp 2"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nội dung câu hỏi:</label>
                <textarea
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                  className="form-textarea"
                  placeholder="Mô tả chi tiết câu hỏi của bạn..."
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  <i className="fas fa-paper-plane"></i>
                  Gửi câu hỏi
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAskForm(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Search and Filter */}
        <div className="search-filter-section">
          <div className="search-container">
            <div className="search-box">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-container">
            <div className="filter-group">
              <label className="filter-label">Môn học:</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                <option value="Toán">Toán</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Khoa học">Khoa học</option>
                <option value="Lịch sử">Lịch sử</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-section">
          <div className="tabs-container">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span className="tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="questions-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải câu hỏi...</p>
            </div>
          ) : (
            <div className="questions-list">
              {filteredQuestions.map((question) => (
                <div key={question.id} className={`question-card ${question.isVip ? 'vip' : ''}`}>
                  <div className="question-header">
                    <div className="author-info">
                      <div className="author-avatar">
                        <span className="avatar-emoji">{question.avatar}</span>
                      </div>
                      <div className="author-details">
                        <h4 className="author-name">{question.author}</h4>
                        <span className="author-role">{question.authorRole}</span>
                      </div>
                    </div>
                    <div className="question-meta">
                      <span className="question-time">{question.createdAt}</span>
                      {question.isVip && (
                        <span className="vip-badge">VIP</span>
                      )}
                    </div>
                  </div>

                  <div className="question-content">
                    <h3 className="question-title">{question.title}</h3>
                    <p className="question-text">{question.content}</p>
                  </div>

                  <div className="question-tags">
                    {question.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="question-stats">
                    <div className="stat-item">
                      <i className="fas fa-comments"></i>
                      <span>{question.answers} trả lời</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-eye"></i>
                      <span>{question.views} lượt xem</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-heart"></i>
                      <span>{question.likes} thích</span>
                    </div>
                    <div className="stat-item">
                      <span className="subject-badge">{question.subject}</span>
                    </div>
                    <div className="stat-item">
                      <span className="grade-badge">{question.grade}</span>
                    </div>
                  </div>

                  <div className="question-actions">
                    <button className="answer-btn">
                      <i className="fas fa-reply"></i>
                      Trả lời
                    </button>
                    <button className="like-btn">
                      <i className="fas fa-heart"></i>
                      Thích
                    </button>
                    <button className="share-btn">
                      <i className="fas fa-share"></i>
                      Chia sẻ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredQuestions.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>Không tìm thấy câu hỏi nào</h3>
              <p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discussion;


