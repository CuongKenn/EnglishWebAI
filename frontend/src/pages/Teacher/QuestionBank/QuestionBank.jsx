import React, { useState, useEffect } from 'react';
import './QuestionBank.css';
import apiClient from '../../../services/api';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    subject: '',
    grade_level: '',
    difficulty: 'medium',
    points: 1,
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    tags: ''
  });
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = () => {
    // Mock data - replace with API call
    setQuestions([
      {
        id: 1,
        question_text: 'What is the past tense of "go"?',
        question_type: 'multiple_choice',
        subject: 'English',
        grade_level: 'Grade 10',
        difficulty: 'easy',
        points: 1,
        options: ['goed', 'went', 'gone', 'goes'],
        correct_answer: 'went',
        tags: 'grammar, verb tense',
        created_at: '2025-01-15'
      },
      {
        id: 2,
        question_text: 'Translate "Xin chào" to English',
        question_type: 'short_answer',
        subject: 'English',
        grade_level: 'Grade 8',
        difficulty: 'easy',
        points: 1,
        correct_answer: 'Hello',
        tags: 'vocabulary, greeting',
        created_at: '2025-01-14'
      },
      {
        id: 3,
        question_text: 'Explain the difference between Present Simple and Present Continuous',
        question_type: 'essay',
        subject: 'English',
        grade_level: 'Grade 11',
        difficulty: 'hard',
        points: 5,
        tags: 'grammar, tenses',
        created_at: '2025-01-13'
      }
    ]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        // Update question
        alert('Cập nhật câu hỏi thành công');
      } else {
        // Create new question
        alert('Thêm câu hỏi thành công');
      }
      setShowModal(false);
      resetForm();
      loadQuestions();
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const handleDelete = (id) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    alert('Xóa câu hỏi thành công');
    loadQuestions();
  };

  const openEditModal = (question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      subject: question.subject,
      grade_level: question.grade_level,
      difficulty: question.difficulty,
      points: question.points,
      options: question.options || ['', '', '', ''],
      correct_answer: question.correct_answer || '',
      explanation: question.explanation || '',
      tags: question.tags || ''
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_type: 'multiple_choice',
      subject: '',
      grade_level: '',
      difficulty: 'medium',
      points: 1,
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      tags: ''
    });
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (q.tags || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || q.subject === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchesType = filterType === 'all' || q.question_type === filterType;
    return matchesSearch && matchesSubject && matchesDifficulty && matchesType;
  });

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'gray';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'multiple_choice': return 'Trắc nghiệm';
      case 'short_answer': return 'Trả lời ngắn';
      case 'essay': return 'Tự luận';
      case 'true_false': return 'Đúng/Sai';
      default: return type;
    }
  };

  return (
    <div className="question-bank">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ngân hàng câu hỏi 💭</h1>
          <p className="page-subtitle">Quản lý kho câu hỏi cá nhân cho bài tập và kiểm tra</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">📥 Import</button>
          <button className="btn-primary" onClick={openCreateModal}>
            ➕ Thêm câu hỏi
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-number">{questions.length}</div>
          <div className="stat-label">Tổng câu hỏi</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{questions.filter(q => q.question_type === 'multiple_choice').length}</div>
          <div className="stat-label">Trắc nghiệm</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{questions.filter(q => q.question_type === 'essay').length}</div>
          <div className="stat-label">Tự luận</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{questions.filter(q => q.difficulty === 'hard').length}</div>
          <div className="stat-label">Câu khó</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Tìm kiếm câu hỏi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">Tất cả loại</option>
          <option value="multiple_choice">Trắc nghiệm</option>
          <option value="short_answer">Trả lời ngắn</option>
          <option value="essay">Tự luận</option>
          <option value="true_false">Đúng/Sai</option>
        </select>
        <select 
          className="filter-select"
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
        >
          <option value="all">Tất cả độ khó</option>
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
        </select>
        <select 
          className="filter-select"
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
        >
          <option value="all">Tất cả môn</option>
          <option value="English">Tiếng Anh</option>
          <option value="Math">Toán</option>
          <option value="Science">Khoa học</option>
        </select>
      </div>

      {/* Questions List */}
      <div className="questions-list">
        {filteredQuestions.map(question => (
          <div key={question.id} className="question-card">
            <div className="question-header">
              <div className="question-badges">
                <span className={`badge difficulty ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty === 'easy' && '🟢 Dễ'}
                  {question.difficulty === 'medium' && '🟡 TB'}
                  {question.difficulty === 'hard' && '🔴 Khó'}
                </span>
                <span className="badge type">{getTypeLabel(question.question_type)}</span>
                <span className="badge points">⭐ {question.points} điểm</span>
              </div>
              <div className="question-actions">
                <button className="action-btn" onClick={() => openEditModal(question)} title="Sửa">✏️</button>
                <button className="action-btn" title="Sao chép">📋</button>
                <button className="action-btn delete" onClick={() => handleDelete(question.id)} title="Xóa">🗑️</button>
              </div>
            </div>

            <div className="question-body">
              <h3 className="question-text">{question.question_text}</h3>
              
              {question.question_type === 'multiple_choice' && question.options && (
                <div className="question-options">
                  {question.options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`option ${option === question.correct_answer ? 'correct' : ''}`}
                    >
                      <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                      <span className="option-text">{option}</span>
                      {option === question.correct_answer && <span className="check-icon">✓</span>}
                    </div>
                  ))}
                </div>
              )}

              {question.question_type === 'short_answer' && (
                <div className="answer-preview">
                  <strong>Đáp án:</strong> {question.correct_answer}
                </div>
              )}
            </div>

            <div className="question-footer">
              <div className="question-meta">
                <span className="meta-tag">📚 {question.subject}</span>
                <span className="meta-tag">🎓 {question.grade_level}</span>
                {question.tags && question.tags.split(',').map((tag, i) => (
                  <span key={i} className="meta-tag tag">🏷️ {tag.trim()}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có câu hỏi nào</h3>
          <p>Bắt đầu xây dựng ngân hàng câu hỏi của bạn</p>
          <button className="btn-primary" onClick={openCreateModal}>
            ➕ Thêm câu hỏi đầu tiên
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingQuestion ? '✏️ Chỉnh sửa câu hỏi' : '➕ Thêm câu hỏi mới'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Loại câu hỏi <span className="required">*</span></label>
                    <select 
                      value={formData.question_type}
                      onChange={(e) => setFormData({...formData, question_type: e.target.value})}
                    >
                      <option value="multiple_choice">Trắc nghiệm</option>
                      <option value="short_answer">Trả lời ngắn</option>
                      <option value="essay">Tự luận</option>
                      <option value="true_false">Đúng/Sai</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Độ khó <span className="required">*</span></label>
                    <select 
                      value={formData.difficulty}
                      onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                    >
                      <option value="easy">🟢 Dễ</option>
                      <option value="medium">🟡 Trung bình</option>
                      <option value="hard">🔴 Khó</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Điểm <span className="required">*</span></label>
                    <input 
                      type="number"
                      min="1"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Môn học <span className="required">*</span></label>
                    <input 
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="VD: Tiếng Anh"
                    />
                  </div>

                  <div className="form-group">
                    <label>Khối lớp <span className="required">*</span></label>
                    <input 
                      type="text"
                      required
                      value={formData.grade_level}
                      onChange={(e) => setFormData({...formData, grade_level: e.target.value})}
                      placeholder="VD: Lớp 10"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Câu hỏi <span className="required">*</span></label>
                  <textarea 
                    required
                    rows="3"
                    value={formData.question_text}
                    onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                    placeholder="Nhập nội dung câu hỏi..."
                  />
                </div>

                {formData.question_type === 'multiple_choice' && (
                  <>
                    <div className="form-group">
                      <label>Các lựa chọn <span className="required">*</span></label>
                      {formData.options.map((option, index) => (
                        <div key={index} className="option-input">
                          <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                          <input 
                            type="text"
                            required
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...formData.options];
                              newOptions[index] = e.target.value;
                              setFormData({...formData, options: newOptions});
                            }}
                            placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="form-group">
                      <label>Đáp án đúng <span className="required">*</span></label>
                      <select 
                        required
                        value={formData.correct_answer}
                        onChange={(e) => setFormData({...formData, correct_answer: e.target.value})}
                      >
                        <option value="">-- Chọn đáp án đúng --</option>
                        {formData.options.map((option, index) => (
                          <option key={index} value={option}>
                            {String.fromCharCode(65 + index)}. {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {formData.question_type === 'short_answer' && (
                  <div className="form-group">
                    <label>Đáp án <span className="required">*</span></label>
                    <input 
                      type="text"
                      required
                      value={formData.correct_answer}
                      onChange={(e) => setFormData({...formData, correct_answer: e.target.value})}
                      placeholder="Nhập đáp án đúng"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Giải thích (tùy chọn)</label>
                  <textarea 
                    rows="2"
                    value={formData.explanation}
                    onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                    placeholder="Giải thích đáp án hoặc gợi ý..."
                  />
                </div>

                <div className="form-group">
                  <label>Tags (phân cách bằng dấu phẩy)</label>
                  <input 
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="grammar, vocabulary, ..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingQuestion ? '💾 Cập nhật' : '➕ Thêm câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;

