import { useState } from 'react';
import { 
  Plus, Search, FileQuestion, Zap, TrendingUp, AlertTriangle,
  Edit, Copy, Trash2, Upload, Download, Sparkles, Database, X, 
  Filter, ChevronDown, Check, Eye, Headphones, BookOpen, PenTool,
  Bot, Settings, Play, Clock, Target, FileText, Wand2
} from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import AddQuestionModal from './AddQuestionModal';

export default function QuestionBankV2() {
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
  
  // AI Generation states
  const [aiGenerationConfig, setAiGenerationConfig] = useState({
    testName: '',
    totalQuestions: 10,
    skillDistribution: {
      listening: 25,
      speaking: 25,
      reading: 25,
      writing: 25
    },
    difficultyDistribution: {
      easy: 40,
      medium: 40,
      hard: 20
    },
    timeLimit: 60,
    topics: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTest, setGeneratedTest] = useState(null);
  
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

  const handleAIGeneration = async () => {
    if (questions.length === 0) {
      alert('Ngân hàng câu hỏi trống! Vui lòng thêm câu hỏi trước khi tạo đề thi.');
      return;
    }

    if (!validateConfig()) {
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation process with more realistic logic
    setTimeout(() => {
      // Filter questions based on skill distribution
      const skillCounts = {};
      Object.keys(aiGenerationConfig.skillDistribution).forEach(skill => {
        skillCounts[skill] = Math.round(
          (aiGenerationConfig.totalQuestions * aiGenerationConfig.skillDistribution[skill]) / 100
        );
      });

      // Distribute questions by skill
      const generatedQuestions = [];
      Object.entries(skillCounts).forEach(([skill, count]) => {
        const skillQuestions = questions.filter(q => q.skill_type === skill);
        const selectedQuestions = skillQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, count)
          .map((q, index) => ({
            ...q,
            id: `generated_${Date.now()}_${skill}_${index}`,
            generated: true
          }));
        generatedQuestions.push(...selectedQuestions);
      });

      // Fill remaining slots with random questions if needed
      const remaining = aiGenerationConfig.totalQuestions - generatedQuestions.length;
      if (remaining > 0) {
        const availableQuestions = questions.filter(q => 
          !generatedQuestions.some(gq => gq.id === q.id)
        );
        const additionalQuestions = availableQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, remaining)
          .map((q, index) => ({
            ...q,
            id: `generated_${Date.now()}_additional_${index}`,
            generated: true
          }));
        generatedQuestions.push(...additionalQuestions);
      }

      // Shuffle final questions
      const shuffledQuestions = generatedQuestions.sort(() => Math.random() - 0.5);
      
      setGeneratedTest({
        name: aiGenerationConfig.testName || `Đề thi AI - ${new Date().toLocaleDateString()}`,
        questions: shuffledQuestions,
        timeLimit: aiGenerationConfig.timeLimit,
        totalPoints: shuffledQuestions.reduce((sum, q) => sum + q.points, 0),
        skillDistribution: aiGenerationConfig.skillDistribution,
        createdAt: new Date().toISOString()
      });
      setIsGenerating(false);
    }, 2000);
  };

  const handleExportTest = () => {
    if (!generatedTest) return;
    
    const testData = {
      name: generatedTest.name,
      timeLimit: generatedTest.timeLimit,
      totalPoints: generatedTest.totalPoints,
      questions: generatedTest.questions.map((q, index) => ({
        number: index + 1,
        question: q.question_text,
        type: q.question_type,
        skill: q.skill_type,
        difficulty: q.difficulty,
        points: q.points,
        options: q.options || [],
        correctAnswer: q.correct_answer,
        tags: q.tags || []
      }))
    };

    const dataStr = JSON.stringify(testData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedTest.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateExercise = () => {
    if (!generatedTest) return;
    // This would integrate with the existing exercise creation system
    alert('Tính năng tạo bài tập từ đề thi AI sẽ được tích hợp với hệ thống quản lý bài tập hiện có.');
  };

  const handleResetConfig = () => {
    setAiGenerationConfig({
      testName: '',
      totalQuestions: 10,
      skillDistribution: {
        listening: 25,
        speaking: 25,
        reading: 25,
        writing: 25
      },
      difficultyDistribution: {
        easy: 40,
        medium: 40,
        hard: 20
      },
      timeLimit: 60,
      topics: []
    });
    setGeneratedTest(null);
  };

  const validateConfig = () => {
    const totalSkillPercentage = Object.values(aiGenerationConfig.skillDistribution).reduce((sum, val) => sum + val, 0);
    if (totalSkillPercentage !== 100) {
      alert('Tổng phần trăm phân bố kỹ năng phải bằng 100%');
      return false;
    }
    if (aiGenerationConfig.totalQuestions < 1 || aiGenerationConfig.totalQuestions > 50) {
      alert('Số câu hỏi phải từ 1 đến 50');
      return false;
    }
    if (aiGenerationConfig.timeLimit < 15 || aiGenerationConfig.timeLimit > 180) {
      alert('Thời gian làm bài phải từ 15 đến 180 phút');
      return false;
    }
    return true;
  };
  
  const getSkillIcon = (skill) => {
    const icons = {
      listening: Headphones,
      speaking: '🗣️',
      reading: BookOpen,
      writing: PenTool
    };
    return icons[skill] || FileQuestion;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getSkillColor = (skill) => {
    const colors = {
      listening: 'bg-blue-100 text-blue-800',
      speaking: 'bg-purple-100 text-purple-800',
      reading: 'bg-green-100 text-green-800',
      writing: 'bg-orange-100 text-orange-800'
    };
    return colors[skill] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      {/* Header Section - Match Courses style */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ngân hàng Câu hỏi</h1>
            <p className="text-gray-600">Quản lý và tạo đề từ ngân hàng câu hỏi của bạn</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
              <Upload size={18} />
              Import Excel
            </button>
            <button 
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={18} />
              Thêm câu hỏi
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Match Courses style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Tổng câu hỏi</p>
              <p className="text-3xl font-bold text-gray-900">{totalQuestions}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Dễ</p>
              <p className="text-3xl font-bold text-gray-900">{easyCount}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Trung bình</p>
              <p className="text-3xl font-bold text-gray-900">{mediumCount}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Khó</p>
              <p className="text-3xl font-bold text-gray-900">{hardCount}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter - Match Courses style */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
              >
                <option value="">Tất cả kỹ năng</option>
                <option value="listening">Nghe</option>
                <option value="speaking">Nói</option>
                <option value="reading">Đọc</option>
                <option value="writing">Viết</option>
              </select>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Tất cả loại</option>
                <option value="multiple_choice">Trắc nghiệm</option>
                <option value="fill_blank">Điền từ</option>
                <option value="true_false">Đúng/Sai</option>
                <option value="short_answer">Tự luận</option>
              </select>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
              >
                <option value="">Tất cả độ khó</option>
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Grid - Match Courses style */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Danh sách câu hỏi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuestions.map((question) => {
            const SkillIcon = getSkillIcon(question.skill_type);
            return (
              <Card key={question.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillColor(question.skill_type)}`}>
                      {question.skill_type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDuplicateQuestion(question)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <SkillIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">{question.points} điểm</span>
                  </div>
                  <p className="text-gray-900 text-sm leading-relaxed line-clamp-3">
                    {question.question_text}
                  </p>
                </div>
                
                {question.question_type === 'multiple_choice' && question.options && (
                  <div className="mb-4">
                    <div className="space-y-1">
                      {question.options.map((option, idx) => (
                        <div key={idx} className={`text-xs p-2 rounded ${
                          option.startsWith(question.correct_answer + '.') 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-50 text-gray-600'
                        }`}>
                          {option}
                          {option.startsWith(question.correct_answer + '.') && (
                            <Check className="w-3 h-3 inline ml-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {(question.question_type === 'fill_blank' || question.question_type === 'short_answer') && (
                  <div className="mb-4">
                    <div className="bg-green-100 text-green-800 text-xs p-2 rounded">
                      Đáp án: {question.correct_answer}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex gap-2">
                    {question.tags?.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="bg-gray-100 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span>Đã dùng: {question.times_used} lần</span>
                </div>
              </Card>
            );
          })}
        </div>
        
        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <FileQuestion className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy câu hỏi nào</p>
          </div>
        )}
      </div>

      {/* AI Test Generation Section */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sinh đề trực tiếp bằng AI</h2>
            <p className="text-gray-600">Tạo đề thi tự động từ ngân hàng câu hỏi với AI</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Cấu hình đề thi</h3>
            </div>

            <div className="space-y-6">
              {/* Test Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đề thi
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nhập tên đề thi..."
                  value={aiGenerationConfig.testName}
                  onChange={(e) => setAiGenerationConfig(prev => ({
                    ...prev,
                    testName: e.target.value
                  }))}
                />
              </div>

              {/* Total Questions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số câu hỏi
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={aiGenerationConfig.totalQuestions}
                    onChange={(e) => setAiGenerationConfig(prev => ({
                      ...prev,
                      totalQuestions: parseInt(e.target.value) || 10
                    }))}
                  />
                  <span className="text-sm text-gray-500">câu</span>
                </div>
              </div>

              {/* Time Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian làm bài
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="15"
                    max="180"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={aiGenerationConfig.timeLimit}
                    onChange={(e) => setAiGenerationConfig(prev => ({
                      ...prev,
                      timeLimit: parseInt(e.target.value) || 60
                    }))}
                  />
                  <span className="text-sm text-gray-500">phút</span>
                </div>
              </div>

              {/* Skill Distribution */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Phân bố kỹ năng (%)
                  </label>
                  <span className={`text-xs px-2 py-1 rounded ${
                    Object.values(aiGenerationConfig.skillDistribution).reduce((sum, val) => sum + val, 0) === 100 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Tổng: {Object.values(aiGenerationConfig.skillDistribution).reduce((sum, val) => sum + val, 0)}%
                  </span>
                </div>
                <div className="space-y-3">
                  {Object.entries(aiGenerationConfig.skillDistribution).map(([skill, percentage]) => (
                    <div key={skill} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-gray-600 capitalize">
                        {skill === 'listening' ? 'Nghe' : 
                         skill === 'speaking' ? 'Nói' :
                         skill === 'reading' ? 'Đọc' : 'Viết'}
                      </div>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={percentage}
                          className="w-full"
                          onChange={(e) => setAiGenerationConfig(prev => ({
                            ...prev,
                            skillDistribution: {
                              ...prev.skillDistribution,
                              [skill]: parseInt(e.target.value)
                            }
                          }))}
                        />
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">
                        {percentage}%
                      </div>
                    </div>
                  ))}
                </div>
                {Object.values(aiGenerationConfig.skillDistribution).reduce((sum, val) => sum + val, 0) !== 100 && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Tổng phần trăm phải bằng 100%
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAIGeneration}
                  disabled={isGenerating || questions.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Đang tạo đề...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Tạo đề thi bằng AI
                    </>
                  )}
                </button>
                <button
                  onClick={handleResetConfig}
                  disabled={isGenerating}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          </Card>

          {/* Preview Panel */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Eye className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Xem trước đề thi</h3>
            </div>

            {generatedTest ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{generatedTest.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <FileQuestion className="w-4 h-4" />
                      {generatedTest.questions.length} câu
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {generatedTest.timeLimit} phút
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {generatedTest.totalPoints} điểm
                    </div>
                  </div>
                  
                  {/* Skill Distribution Chart */}
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Phân bố kỹ năng:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(generatedTest.skillDistribution).map(([skill, percentage]) => {
                        const skillQuestions = generatedTest.questions.filter(q => q.skill_type === skill).length;
                        return (
                          <div key={skill} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              {skill === 'listening' ? 'Nghe' : 
                               skill === 'speaking' ? 'Nói' :
                               skill === 'reading' ? 'Đọc' : 'Viết'}
                            </span>
                            <span className="font-medium text-gray-900">
                              {skillQuestions} câu ({percentage}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {generatedTest.questions.slice(0, 5).map((question, index) => (
                    <div key={question.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {question.question_text}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${getSkillColor(question.skill_type)}`}>
                              {question.skill_type.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">{question.points} điểm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {generatedTest.questions.length > 5 && (
                    <div className="text-center text-sm text-gray-500 py-2">
                      ... và {generatedTest.questions.length - 5} câu hỏi khác
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleExportTest}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Xuất đề thi
                  </button>
                  <button 
                    onClick={handleCreateExercise}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Tạo bài tập
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Chưa có đề thi nào được tạo</p>
                <p className="text-sm text-gray-400">Cấu hình và nhấn "Tạo đề thi bằng AI" để bắt đầu</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddQuestionModal
          onClose={() => setShowAddModal(false)}
          onAdd={(newQuestion) => {
            setQuestions([...questions, { ...newQuestion, id: Date.now() }]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}