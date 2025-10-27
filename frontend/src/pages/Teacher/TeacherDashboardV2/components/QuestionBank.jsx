import React, { useState } from 'react';
import { FileText, Headphones, Mic, BookOpen, PenTool, FolderOpen, Plus, Download, Sparkles, Eye, Edit, Trash2 } from 'lucide-react';
import './QuestionBank.css';

const QuestionBank = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const skillTabs = [
    { id: 'all', label: 'Tất cả', count: 4, icon: FileText },
    { id: 'listening', label: 'Nghe', count: 1, icon: Headphones },
    { id: 'speaking', label: 'Nói', count: 0, icon: Mic },
    { id: 'reading', label: 'Đọc', count: 1, icon: BookOpen },
    { id: 'writing', label: 'Viết', count: 1, icon: PenTool },
    { id: 'comprehensive', label: 'Tổng hợp', count: 0, icon: FolderOpen }
  ];

  const questions = [
    {
      id: 1,
      skill: 'Nghe',
      skillType: 'listening',
      difficulty: 'Trung bình',
      unit: 'Unit 5 - Daily Activities',
      question: 'What is the main topic of the conversation?',
      options: [
        { id: 'A', text: 'Shopping', isCorrect: true },
        { id: 'B', text: 'Traveling', isCorrect: false },
        { id: 'C', text: 'Working', isCorrect: false },
        { id: 'D', text: 'Studying', isCorrect: false }
      ],
      createdAt: '26/10/2025'
    },
    {
      id: 2,
      skill: 'Đọc',
      skillType: 'reading',
      difficulty: 'Khó',
      unit: 'Unit 6 - Environment',
      question: 'According to the passage, what is the author\'s main argument?',
      options: [
        { id: 'A', text: 'Climate change is real', isCorrect: false },
        { id: 'B', text: 'We need to act now', isCorrect: false },
        { id: 'C', text: 'Both A and B', isCorrect: true },
        { id: 'D', text: 'None of the above', isCorrect: false }
      ],
      createdAt: '25/10/2025'
    }
  ];

  const filteredQuestions = questions.filter(q => {
    const matchesTab = activeTab === 'all' || q.skillType === activeTab;
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.unit.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getSkillColor = (skill) => {
    const colors = {
      'Nghe': '#3b82f6',
      'Nói': '#10b981',
      'Đọc': '#f59e0b',
      'Viết': '#8b5cf6',
      'Tổng hợp': '#64748b'
    };
    return colors[skill] || '#64748b';
  };

  return (
    <div className="question-bank-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ngân hàng câu hỏi</h1>
          <p className="page-subtitle">Quản lý câu hỏi theo 4 kỹ năng và bổ đề tổng hợp</p>
        </div>
      </div>

      {/* Skill Tabs */}
      <div className="skill-tabs">
        {skillTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`skill-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <div className="tab-content">
                <span className="tab-label">{tab.label}</span>
                <span className="tab-count">{tab.count} câu</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search and Controls */}
      <div className="question-controls">
        <input
          type="text"
          placeholder="Tìm kiếm câu hỏi theo nội dung hoặc chủ đề..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="controls-right">
          <select className="filter-select">
            <option>Tất cả độ khó</option>
            <option>Dễ</option>
            <option>Trung bình</option>
            <option>Khó</option>
          </select>
          <button className="import-btn">
            <Download size={16} />
            Import
          </button>
          <button className="create-btn">
            <Plus size={16} />
            Thêm câu hỏi
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="questions-list">
        {filteredQuestions.map(question => (
          <div key={question.id} className="question-card">
            <div className="question-header">
              <div className="question-badges">
                <span 
                  className="skill-badge"
                  style={{ background: getSkillColor(question.skill) }}
                >
                  {question.skill}
                </span>
                <span className="difficulty-badge">{question.difficulty}</span>
                <span className="unit-badge">{question.unit}</span>
              </div>
              <div className="question-actions">
                <button className="icon-btn view-btn" title="Xem">
                  <Eye size={16} />
                  Xem
                </button>
                <button className="icon-btn edit-btn" title="Sửa">
                  <Edit size={16} />
                  Sửa
                </button>
                <button className="icon-btn delete-btn" title="Xóa">
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </div>

            <div className="question-content">
              <h3 className="question-text">{question.question}</h3>
              
              <div className="question-options">
                {question.options.map(option => (
                  <div 
                    key={option.id}
                    className={`option ${option.isCorrect ? 'correct' : ''}`}
                  >
                    <span className="option-id">{option.id}.</span>
                    <span className="option-text">{option.text}</span>
                  </div>
                ))}
              </div>

              <div className="question-footer">
                <span className="created-date">Tạo ngày: {question.createdAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="empty-state">
          <p>Tìm thấy 0 câu hỏi</p>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
