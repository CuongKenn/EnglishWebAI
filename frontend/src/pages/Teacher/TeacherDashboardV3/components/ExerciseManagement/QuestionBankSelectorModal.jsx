import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Check } from 'lucide-react';
import './ExerciseManagement.css';

const QuestionBankSelectorModal = React.memo(function QuestionBankSelectorModal({ skillType, onClose, onSelect }) {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkill, setFilterSkill] = useState(skillType || 'all');
  const [filterType, setFilterType] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  
  // Mock data - Backend sẽ thay bằng API call
  useEffect(() => {
    // TODO: Fetch from backend API
    const mockQuestions = [
      {
        id: 1,
        skill_type: 'listening',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'What is the main topic of the conversation?',
        options: ['Travel', 'Education', 'Food', 'Sports'],
        correct_answer: 'A',
        points: 2
      },
      {
        id: 2,
        skill_type: 'reading',
        type: 'true_false',
        difficulty: 'medium',
        question_text: 'The author agrees with the statement.',
        correct_answer: 'true',
        points: 1.5
      },
      {
        id: 3,
        skill_type: 'listening',
        type: 'fill_blank',
        difficulty: 'medium',
        question_text: 'The meeting is scheduled for ___ o\'clock.',
        correct_answer: 'three',
        points: 2
      },
      // Add more mock questions...
    ];
    setQuestions(mockQuestions);
    setFilteredQuestions(mockQuestions);
  }, []);
  
  // Apply filters
  useEffect(() => {
    let filtered = questions;
    
    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterSkill !== 'all') {
      filtered = filtered.filter(q => q.skill_type === filterSkill);
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(q => q.type === filterType);
    }
    
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === filterDifficulty);
    }
    
    setFilteredQuestions(filtered);
  }, [searchTerm, filterSkill, filterType, filterDifficulty, questions]);
  
  const toggleQuestion = (question) => {
    if (selectedQuestions.find(q => q.id === question.id)) {
      setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions([...filteredQuestions]);
    }
  };
  
  const handleConfirm = () => {
    // Convert to exercise question format
    const exerciseQuestions = selectedQuestions.map(q => ({
      id: Date.now() + Math.random(),
      type: q.type,
      question: q.question_text,
      options: q.options || ['', '', '', ''],
      correct_answer: q.correct_answer,
      points: q.points
    }));
    onSelect(exerciseQuestions);
  };
  
  const getSkillIcon = (skill) => {
    switch(skill) {
      case 'listening': return '🎧';
      case 'speaking': return '🗣️';
      case 'reading': return '📖';
      case 'writing': return '✍️';
      default: return '📝';
    }
  };
  
  const getTypeLabel = (type) => {
    switch(type) {
      case 'multiple_choice': return 'Trắc nghiệm';
      case 'fill_blank': return 'Điền từ';
      case 'true_false': return 'Đúng/Sai';
      case 'short_answer': return 'Tự luận';
      default: return type;
    }
  };
  
  const getDifficultyClass = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'diff-easy';
      case 'medium': return 'diff-medium';
      case 'hard': return 'diff-hard';
      default: return '';
    }
  };
  
  return (
    <div className="qb-selector-overlay" onClick={onClose}>
      <div className="qb-selector-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qb-modal-header">
          <div>
            <h2>Chọn câu hỏi từ Ngân hàng</h2>
            <p>Chọn các câu hỏi để thêm vào bài tập</p>
          </div>
          <button className="qb-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        {/* Filters */}
        <div className="qb-filters">
          <div className="qb-search-box">
            <Search size={18} />
            <input 
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="qb-filter-row">
            <select 
              className="qb-filter-select"
              value={filterSkill}
              onChange={(e) => setFilterSkill(e.target.value)}
            >
              <option value="all">Tất cả kỹ năng</option>
              <option value="listening">Nghe</option>
              <option value="speaking">Nói</option>
              <option value="reading">Đọc</option>
              <option value="writing">Viết</option>
            </select>
            
            <select 
              className="qb-filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tất cả loại</option>
              <option value="multiple_choice">Trắc nghiệm</option>
              <option value="fill_blank">Điền từ</option>
              <option value="true_false">Đúng/Sai</option>
              <option value="short_answer">Tự luận</option>
            </select>
            
            <select 
              className="qb-filter-select"
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
            >
              <option value="all">Tất cả độ khó</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
            
            <button className="qb-select-all-btn" onClick={handleSelectAll}>
              {selectedQuestions.length === filteredQuestions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
        </div>
        
        {/* Questions List */}
        <div className="qb-questions-list">
          {filteredQuestions.length === 0 ? (
            <div className="qb-empty">
              <p>Không tìm thấy câu hỏi nào</p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isSelected = !!selectedQuestions.find(sq => sq.id === q.id);
              return (
                <div 
                  key={q.id}
                  className={`qb-question-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleQuestion(q)}
                >
                  <div className="qb-checkbox">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                    />
                    {isSelected && <Check size={14} className="check-icon" />}
                  </div>
                  
                  <div className="qb-question-content">
                    <div className="qb-question-header-row">
                      <div className="qb-badges">
                        <span className="qb-badge qb-badge-skill">
                          {getSkillIcon(q.skill_type)} {q.skill_type}
                        </span>
                        <span className="qb-badge qb-badge-type">
                          {getTypeLabel(q.type)}
                        </span>
                        <span className={`qb-badge qb-badge-difficulty ${getDifficultyClass(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                        <span className="qb-badge qb-badge-points">
                          {q.points} điểm
                        </span>
                      </div>
                    </div>
                    
                    <p className="qb-question-text">{q.question_text}</p>
                    
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="qb-options-preview">
                        {q.options.map((opt, idx) => (
                          <span key={idx} className="qb-option">
                            {String.fromCharCode(65 + idx)}. {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Footer */}
        <div className="qb-modal-footer">
          <div className="qb-selected-count">
            <span className="count-badge">{selectedQuestions.length}</span>
            <span>câu đã chọn</span>
          </div>
          <div className="qb-footer-actions">
            <button className="qb-cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button 
              className="qb-confirm-btn" 
              onClick={handleConfirm}
              disabled={selectedQuestions.length === 0}
            >
              <Check size={18} />
              Thêm vào bài tập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default QuestionBankSelectorModal;