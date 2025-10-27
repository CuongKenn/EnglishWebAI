import { useState } from 'react';
import { 
  Plus, Search, Filter, FileQuestion, Zap, TrendingUp, AlertTriangle,
  Edit, Copy, Trash2, Upload, Download, Sparkles, Database, X, FileText
} from 'lucide-react';
import './QuestionBank.css';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([
    {
      id: 1,
      question_text: 'What is the main topic of the listening passage?',
      question_type: 'multiple_choice',
      options: ['A. Travel', 'B. Food', 'C. Sports', 'D. Music'],
      correct_answer: 'A',
      skill_type: 'listening',
      difficulty: 'easy',
      topic: 'Comprehension',
      tags: ['listening', 'main_idea'],
      points: 2,
      times_used: 5,
      created_at: '2025-01-15'
    },
    {
      id: 2,
      question_text: 'Fill in the blank: She ___ to school every day.',
      question_type: 'fill_blank',
      correct_answer: 'goes',
      skill_type: 'writing',
      difficulty: 'easy',
      topic: 'Grammar',
      tags: ['present_simple', 'verb'],
      points: 1,
      times_used: 12,
      created_at: '2025-01-10'
    },
    {
      id: 3,
      question_text: 'According to the passage, climate change affects...',
      question_type: 'multiple_choice',
      options: ['A. Only oceans', 'B. All ecosystems', 'C. Mountains only', 'D. Deserts only'],
      correct_answer: 'B',
      skill_type: 'reading',
      difficulty: 'medium',
      topic: 'Comprehension',
      tags: ['reading', 'environment'],
      points: 3,
      times_used: 8,
      created_at: '2025-01-12'
    }
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [filterSkill, setFilterSkill] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter logic
  const filteredQuestions = questions.filter(q => {
    const matchesSkill = !filterSkill || q.skill_type === filterSkill;
    const matchesType = !filterType || q.question_type === filterType;
    const matchesDifficulty = !filterDifficulty || q.difficulty === filterDifficulty;
    const matchesSearch = !searchTerm || 
      q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSkill && matchesType && matchesDifficulty && matchesSearch;
  });
  
  // Stats
  const totalQuestions = questions.length;
  const easyCount = questions.filter(q => q.difficulty === 'easy').length;
  const mediumCount = questions.filter(q => q.difficulty === 'medium').length;
  const hardCount = questions.filter(q => q.difficulty === 'hard').length;
  
  const handleDeleteQuestion = (id) => {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };
  
  const handleDuplicateQuestion = (question) => {
    const newQuestion = {
      ...question,
      id: Date.now(),
      question_text: question.question_text + ' (Copy)',
      times_used: 0,
      created_at: new Date().toISOString().split('T')[0]
    };
    setQuestions([...questions, newQuestion]);
  };
  
  const getSkillIcon = (skill) => {
    const icons = {
      listening: '🎧',
      speaking: '🗣️',
      reading: '📖',
      writing: '✍️'
    };
    return icons[skill] || '📝';
  };

  return (
    <div className="question-bank-container">
      {/* Header */}
      <div className="qb-header">
        <div>
          <h1>Ngân hàng Câu hỏi</h1>
          <p>Quản lý và tạo đề từ ngân hàng câu hỏi</p>
        </div>
        <div className="qb-actions">
          <button className="btn-import-qb" onClick={() => alert('Import from Excel')}>
            <Upload size={18} />
            Import Excel
          </button>
          <button className="btn-add-qb" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Thêm câu hỏi
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="qb-stats">
        <div className="qb-stat-card total">
          <FileQuestion size={32} />
          <div>
            <div className="qb-stat-value">{totalQuestions}</div>
            <div className="qb-stat-label">Tổng câu hỏi</div>
          </div>
        </div>
        <div className="qb-stat-card easy">
          <Zap size={32} />
          <div>
            <div className="qb-stat-value">{easyCount}</div>
            <div className="qb-stat-label">Dễ</div>
          </div>
        </div>
        <div className="qb-stat-card medium">
          <TrendingUp size={32} />
          <div>
            <div className="qb-stat-value">{mediumCount}</div>
            <div className="qb-stat-label">Trung bình</div>
          </div>
        </div>
        <div className="qb-stat-card hard">
          <AlertTriangle size={32} />
          <div>
            <div className="qb-stat-value">{hardCount}</div>
            <div className="qb-stat-label">Khó</div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="qb-filters">
        <div className="search-box-qb">
          <Search size={18} />
          <input 
            type="search"
            placeholder="Tìm kiếm câu hỏi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="filter-select-qb"
          value={filterSkill}
          onChange={(e) => setFilterSkill(e.target.value)}
        >
          <option value="">Tất cả kỹ năng</option>
          <option value="listening">🎧 Nghe</option>
          <option value="speaking">🗣️ Nói</option>
          <option value="reading">📖 Đọc</option>
          <option value="writing">✍️ Viết</option>
        </select>
        
        <select 
          className="filter-select-qb"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Tất cả loại</option>
          <option value="multiple_choice">Trắc nghiệm</option>
          <option value="fill_blank">Điền từ</option>
          <option value="true_false">Đúng/Sai</option>
          <option value="short_answer">Tự luận ngắn</option>
        </select>
        
        <select 
          className="filter-select-qb"
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
        >
          <option value="">Tất cả độ khó</option>
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
        </select>
        
        <button className="btn-clear-filters" onClick={() => {
          setFilterSkill('');
          setFilterType('');
          setFilterDifficulty('');
          setSearchTerm('');
        }}>
          Xóa bộ lọc
        </button>
      </div>
      
      {/* Question List */}
      <div className="qb-list">
        <div className="qb-list-header">
          <h3>
            Danh sách câu hỏi 
            {(filterSkill || filterType || filterDifficulty || searchTerm) && (
              <span className="filtered-count"> (Lọc: {filteredQuestions.length}/{totalQuestions})</span>
            )}
          </h3>
        </div>
        
        <div className="qb-cards-grid">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="question-card-bank">
              <div className="question-card-header-bank">
                <div className="badges-group">
                  <span className={`difficulty-badge-qb ${q.difficulty}`}>
                    {q.difficulty}
                  </span>
                  <span className={`skill-badge-qb ${q.skill_type}`}>
                    {getSkillIcon(q.skill_type)} {q.skill_type}
                  </span>
                  <span className="type-badge-qb">{q.question_type}</span>
                </div>
                <span className="points-badge-qb">{q.points} điểm</span>
              </div>
              
              <div className="question-card-body-bank">
                <p className="question-text-bank">{q.question_text}</p>
                
                {q.question_type === 'multiple_choice' && (
                  <div className="options-preview-qb">
                    {q.options.map((opt, i) => (
                      <span 
                        key={i} 
                        className={`option-preview ${opt[0] === q.correct_answer ? 'correct' : ''}`}
                      >
                        {opt} {opt[0] === q.correct_answer && '✓'}
                      </span>
                    ))}
                  </div>
                )}
                
                {(q.question_type === 'fill_blank' || q.question_type === 'short_answer') && (
                  <div className="answer-preview-qb">
                    <strong>Đáp án:</strong> {q.correct_answer}
                  </div>
                )}
                
                {q.topic && (
                  <div className="topic-tags-qb">
                    <span className="topic-tag">{q.topic}</span>
                    {q.tags && q.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} className="tag-small">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="question-card-footer-bank">
                <span className="usage-info-qb">
                  📊 Đã dùng: {q.times_used} lần
                </span>
                <div className="question-actions-bank">
                  <button 
                    className="btn-action-qb edit"
                    onClick={() => alert('Edit question ' + q.id)}
                    title="Chỉnh sửa"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="btn-action-qb duplicate"
                    onClick={() => handleDuplicateQuestion(q)}
                    title="Nhân bản"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    className="btn-action-qb delete"
                    onClick={() => handleDeleteQuestion(q.id)}
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredQuestions.length === 0 && (
          <div className="qb-empty-state">
            <Database size={64} />
            <h3>Không tìm thấy câu hỏi</h3>
            <p>Thử thay đổi bộ lọc hoặc thêm câu hỏi mới</p>
          </div>
        )}
      </div>
      
      {/* Generate Test Section */}
      <div className="generate-test-section-qb">
        <div className="generate-test-card">
          <div className="generate-test-header">
            <Sparkles size={32} />
            <div>
              <h3>Tạo đề từ Ngân hàng</h3>
              <p>AI tự động chọn câu hỏi phù hợp và tạo đề</p>
            </div>
          </div>
          
          <div className="generate-test-form">
            <div className="form-row-qb">
              <select className="form-select-qb">
                <option value="">Chọn kỹ năng</option>
                <option value="listening">🎧 Nghe</option>
                <option value="speaking">🗣️ Nói</option>
                <option value="reading">📖 Đọc</option>
                <option value="writing">✍️ Viết</option>
              </select>
              
              <select className="form-select-qb">
                <option value="mixed">Độ khó: Trộn lẫn</option>
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
              
              <input 
                type="number"
                className="form-input-qb"
                placeholder="Số câu hỏi"
                defaultValue="10"
                min="5"
                max="50"
              />
            </div>
            
            <button 
              className="btn-generate-test-qb"
              onClick={() => setShowGenerateModal(true)}
            >
              <Sparkles size={18} />
              Tạo đề tự động
            </button>
          </div>
        </div>
      </div>
      
      {/* Add Question Modal */}
      {showAddModal && (
        <AddQuestionModal
          onClose={() => setShowAddModal(false)}
          onAdd={(newQuestion) => {
            setQuestions([...questions, { ...newQuestion, id: Date.now(), times_used: 0 }]);
            setShowAddModal(false);
          }}
        />
      )}
      
      {/* Generate Test Modal */}
      {showGenerateModal && (
        <GenerateTestModal
          onClose={() => setShowGenerateModal(false)}
          questions={questions}
        />
      )}
    </div>
  );
}

// Add Question Modal Component
function AddQuestionModal({ onClose, onAdd }) {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [skillType, setSkillType] = useState('listening');
  const [difficulty, setDifficulty] = useState('medium');
  const [topic, setTopic] = useState('');
  const [points, setPoints] = useState(2);
  
  const handleSubmit = () => {
    if (!questionText) {
      alert('Vui lòng nhập câu hỏi!');
      return;
    }
    
    const newQuestion = {
      question_text: questionText,
      question_type: questionType,
      options: questionType === 'multiple_choice' ? options : null,
      correct_answer: correctAnswer,
      skill_type: skillType,
      difficulty,
      topic,
      points,
      created_at: new Date().toISOString().split('T')[0]
    };
    
    onAdd(newQuestion);
  };
  
  return (
    <div className="modal-overlay-qb" onClick={onClose}>
      <div className="modal-content-qb" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-qb">
          <h2>Thêm câu hỏi mới</h2>
          <button onClick={onClose} className="close-btn-qb">×</button>
        </div>
        
        <div className="modal-body-qb">
          <div className="form-group-qb">
            <label>Kỹ năng *</label>
            <select value={skillType} onChange={(e) => setSkillType(e.target.value)}>
              <option value="listening">🎧 Nghe</option>
              <option value="speaking">🗣️ Nói</option>
              <option value="reading">📖 Đọc</option>
              <option value="writing">✍️ Viết</option>
            </select>
          </div>
          
          <div className="form-group-qb">
            <label>Loại câu hỏi *</label>
            <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
              <option value="multiple_choice">Trắc nghiệm</option>
              <option value="fill_blank">Điền từ</option>
              <option value="true_false">Đúng/Sai</option>
              <option value="short_answer">Tự luận ngắn</option>
            </select>
          </div>
          
          <div className="form-group-qb">
            <label>Câu hỏi *</label>
            <textarea 
              rows="3"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Nhập câu hỏi..."
            />
          </div>
          
          {questionType === 'multiple_choice' && (
            <>
              <div className="form-group-qb">
                <label>Đáp án</label>
                {options.map((opt, i) => (
                  <input 
                    key={i}
                    type="text"
                    placeholder={`${String.fromCharCode(65 + i)}. Đáp án ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[i] = e.target.value;
                      setOptions(newOpts);
                    }}
                  />
                ))}
              </div>
              <div className="form-group-qb">
                <label>Đáp án đúng *</label>
                <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
                  <option value="">Chọn...</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
            </>
          )}
          
          {(questionType === 'fill_blank' || questionType === 'short_answer') && (
            <div className="form-group-qb">
              <label>Đáp án đúng *</label>
              <input 
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Nhập đáp án..."
              />
            </div>
          )}
          
          {questionType === 'true_false' && (
            <div className="form-group-qb">
              <label>Đáp án đúng *</label>
              <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
                <option value="">Chọn...</option>
                <option value="true">Đúng</option>
                <option value="false">Sai</option>
              </select>
            </div>
          )}
          
          <div className="form-row-qb">
            <div className="form-group-qb">
              <label>Độ khó</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>
            <div className="form-group-qb">
              <label>Điểm</label>
              <input 
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                min="0.5"
                step="0.5"
              />
            </div>
          </div>
          
          <div className="form-group-qb">
            <label>Chủ đề</label>
            <input 
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Grammar, Vocabulary, Comprehension..."
            />
          </div>
        </div>
        
        <div className="modal-footer-qb">
          <button onClick={onClose} className="btn-cancel-qb">Hủy</button>
          <button onClick={handleSubmit} className="btn-submit-qb">
            <Plus size={18} />
            Thêm câu hỏi
          </button>
        </div>
      </div>
    </div>
  );
}

// Generate Test Modal Component
function GenerateTestModal({ onClose, questions }) {
  const [selectedSkill, setSelectedSkill] = useState('listening');
  const [selectedDifficulty, setSelectedDifficulty] = useState('mixed');
  const [numQuestions, setNumQuestions] = useState(10);
  const [generatedTest, setGeneratedTest] = useState(null);
  
  const handleGenerate = () => {
    // Filter questions by skill
    let filtered = questions.filter(q => q.skill_type === selectedSkill);
    
    // Filter by difficulty if not mixed
    if (selectedDifficulty !== 'mixed') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }
    
    // Random selection
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(numQuestions, shuffled.length));
    
    setGeneratedTest(selected);
  };
  
  const handleDownloadTest = () => {
    alert('Đang tạo file PDF...');
    // TODO: Call API to generate PDF
  };
  
  return (
    <div className="modal-overlay-qb" onClick={onClose}>
      <div className="modal-content-qb large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-qb">
          <h2>Tạo đề từ Ngân hàng</h2>
          <button onClick={onClose} className="close-btn-qb">×</button>
        </div>
        
        <div className="modal-body-qb">
          {!generatedTest ? (
            <>
              <div className="form-group-qb">
                <label>Kỹ năng</label>
                <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)}>
                  <option value="listening">🎧 Nghe</option>
                  <option value="speaking">🗣️ Nói</option>
                  <option value="reading">📖 Đọc</option>
                  <option value="writing">✍️ Viết</option>
                </select>
              </div>
              
              <div className="form-group-qb">
                <label>Độ khó</label>
                <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
                  <option value="mixed">Trộn lẫn</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
              
              <div className="form-group-qb">
                <label>Số câu hỏi</label>
                <input 
                  type="number"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  min="5"
                  max="50"
                />
              </div>
              
              <button onClick={handleGenerate} className="btn-generate-full">
                <Sparkles size={18} />
                Tạo đề
              </button>
            </>
          ) : (
            <div className="generated-test-preview">
              <h3>Đề đã tạo ({generatedTest.length} câu)</h3>
              <div className="generated-questions-list">
                {generatedTest.map((q, idx) => (
                  <div key={q.id} className="generated-question-item">
                    <div className="gen-q-number">Câu {idx + 1}</div>
                    <div className="gen-q-text">{q.question_text}</div>
                    <div className="gen-q-meta">
                      <span className={`diff-badge ${q.difficulty}`}>{q.difficulty}</span>
                      <span className="points-badge">{q.points} điểm</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="generated-test-actions">
                <button onClick={() => setGeneratedTest(null)} className="btn-regenerate">
                  Tạo lại
                </button>
                <button onClick={handleDownloadTest} className="btn-download-test">
                  <Download size={18} />
                  Tải xuống PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
