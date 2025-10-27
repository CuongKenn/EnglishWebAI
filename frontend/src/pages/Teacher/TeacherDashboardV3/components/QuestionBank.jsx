import { useState } from 'react';
<<<<<<< HEAD
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Upload, Plus, Search, Filter, Edit, Trash2, Eye, Headphones, Mic, BookOpen, PenTool, FileText } from 'lucide-react';
import { Textarea } from '../../../../components/ui/textarea';
import { Label } from '../../../../components/ui/label';

const QuestionBank = () => {
  const [activeSkill, setActiveSkill] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const questions = [
    {
      id: '1',
      skill: 'listening',
      type: 'multiple-choice',
      content: 'What is the main topic of the conversation?',
      level: 'medium',
      topic: 'Unit 5 - Daily Activities',
      answers: ['Shopping', 'Traveling', 'Working', 'Studying'],
      correctAnswer: 0,
      createdDate: '26/10/2025'
    },
    {
      id: '2',
      skill: 'reading',
      type: 'multiple-choice',
      content: 'According to the passage, what is the author\'s main argument?',
      level: 'hard',
      topic: 'Unit 6 - Environment',
      answers: ['Climate change is real', 'We need to act now', 'Both A and B', 'None of the above'],
      correctAnswer: 2,
      createdDate: '25/10/2025'
    },
    {
      id: '3',
      skill: 'writing',
      type: 'essay',
      content: 'Write an essay about the advantages and disadvantages of social media (200 words)',
      level: 'hard',
      topic: 'Unit 7 - Technology',
      createdDate: '24/10/2025'
    },
    {
      id: '4',
      skill: 'speaking',
      type: 'speaking',
      content: 'Describe your favorite place to visit and explain why you like it',
      level: 'medium',
      topic: 'Unit 8 - Travel',
      createdDate: '23/10/2025'
    }
  ];

  const skills = [
    { id: 'all', label: 'Tất cả', icon: FileText, count: questions.length },
    { id: 'listening', label: 'Nghe', icon: Headphones, count: questions.filter(q => q.skill === 'listening').length },
    { id: 'speaking', label: 'Nói', icon: Mic, count: questions.filter(q => q.skill === 'speaking').length },
    { id: 'reading', label: 'Đọc', icon: BookOpen, count: questions.filter(q => q.skill === 'reading').length },
    { id: 'writing', label: 'Viết', icon: PenTool, count: questions.filter(q => q.skill === 'writing').length },
    { id: 'comprehensive', label: 'Tổng hợp', icon: FileText, count: 0 }
  ];

  const filteredQuestions = questions.filter(q => {
    const matchSkill = activeSkill === 'all' || q.skill === activeSkill;
    const matchSearch = q.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLevel = selectedLevel === 'all' || q.level === selectedLevel;
    return matchSkill && matchSearch && matchLevel;
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelText = (level) => {
    switch (level) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return level;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ngân hàng câu hỏi</h1>
        <p className="text-gray-600">Quản lý câu hỏi theo 4 kỹ năng và bộ đề tổng hợp</p>
      </div>

      {/* Skill Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {skills.map((skill) => {
          const Icon = skill.icon;
          return (
            <Card
              key={skill.id}
              className={`p-4 cursor-pointer transition-all ${
                activeSkill === skill.id ? 'border-purple-500 bg-purple-50' : 'hover:border-gray-300'
              }`}
              onClick={() => setActiveSkill(skill.id)}
            >
              <div className="flex flex-col items-center text-center">
                <Icon className={`w-6 h-6 mb-2 ${activeSkill === skill.id ? 'text-purple-600' : 'text-gray-600'}`} />
                <p className={`text-sm mb-1 ${activeSkill === skill.id ? 'text-purple-900 font-semibold' : 'text-gray-900'}`}>
                  {skill.label}
                </p>
                <p className="text-xs text-gray-500">{skill.count} câu</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm câu hỏi theo nội dung hoặc chủ đề..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Độ khó" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả độ khó</SelectItem>
              <SelectItem value="easy">Dễ</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="hard">Khó</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import câu hỏi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Chọn kỹ năng</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kỹ năng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="listening">Nghe</SelectItem>
                      <SelectItem value="speaking">Nói</SelectItem>
                      <SelectItem value="reading">Đọc</SelectItem>
                      <SelectItem value="writing">Viết</SelectItem>
                      <SelectItem value="comprehensive">Tổng hợp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tải lên file</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Kéo thả file hoặc click để chọn</p>
                    <p className="text-xs text-gray-500">Hỗ trợ: .docx, .txt (tối đa 10MB)</p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setIsImportOpen(false)}>Hủy</Button>
                  <Button className="flex-1" onClick={() => setIsImportOpen(false)}>Upload</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm câu hỏi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thêm câu hỏi mới</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kỹ năng</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn kỹ năng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="listening">Nghe</SelectItem>
                        <SelectItem value="speaking">Nói</SelectItem>
                        <SelectItem value="reading">Đọc</SelectItem>
                        <SelectItem value="writing">Viết</SelectItem>
                        <SelectItem value="comprehensive">Tổng hợp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Loại câu hỏi</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Trắc nghiệm</SelectItem>
                        <SelectItem value="fill-blank">Điền từ</SelectItem>
                        <SelectItem value="essay">Tự luận</SelectItem>
                        <SelectItem value="speaking">Nói</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Độ khó</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn độ khó" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Dễ</SelectItem>
                        <SelectItem value="medium">Trung bình</SelectItem>
                        <SelectItem value="hard">Khó</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chủ đề</Label>
                    <Input placeholder="VD: Unit 5 - Daily Activities" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Nội dung câu hỏi</Label>
                  <Textarea placeholder="Nhập nội dung câu hỏi..." rows={4} />
                </div>
                
                <div className="space-y-2">
                  <Label>Đáp án (mỗi đáp án một dòng)</Label>
                  <Textarea placeholder="A. Đáp án 1&#10;B. Đáp án 2&#10;C. Đáp án 3&#10;D. Đáp án 4" rows={4} />
                </div>
                
                <div className="space-y-2">
                  <Label>Đáp án đúng</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đáp án đúng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">A</SelectItem>
                      <SelectItem value="1">B</SelectItem>
                      <SelectItem value="2">C</SelectItem>
                      <SelectItem value="3">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Hủy</Button>
                  <Button className="flex-1" onClick={() => setIsAddOpen(false)}>Lưu câu hỏi</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            Tìm thấy <span className="font-semibold">{filteredQuestions.length}</span> câu hỏi
          </p>
        </div>

        {filteredQuestions.map((question) => (
          <Card key={question.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <Badge variant="outline" className="mt-1">
                    {question.skill === 'listening' ? 'Nghe' :
                     question.skill === 'speaking' ? 'Nói' :
                     question.skill === 'reading' ? 'Đọc' :
                     question.skill === 'writing' ? 'Viết' : 'Tổng hợp'}
                  </Badge>
                  <Badge className={getLevelColor(question.level)}>
                    {getLevelText(question.level)}
                  </Badge>
                  <span className="text-xs text-gray-500">{question.topic}</span>
                </div>
                <p className="text-gray-900 mb-3 font-medium">{question.content}</p>
                {question.answers && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {question.answers.map((answer, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border text-sm ${
                          idx === question.correctAnswer
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-gray-50 text-gray-700'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {answer}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">Tạo ngày: {question.createdDate}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Xem
                </Button>
                <Button size="sm" variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Sửa
                </Button>
                <Button size="sm" variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuestionBank;
=======
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
>>>>>>> develop
