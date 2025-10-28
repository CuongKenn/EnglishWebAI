import { useEffect, useRef, useState } from 'react';
import { 
  Plus, Search, FileQuestion, Zap, TrendingUp, AlertTriangle,
  Edit, Copy, Trash2, Upload, Download, Sparkles, Database, X, 
  Filter, ChevronDown, Check, Eye, Headphones, BookOpen, PenTool,
  Bot, Settings, Play, Clock, Target, FileText, Wand2, Mic
} from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import AddQuestionModal from './AddQuestionModal';
import { questionBankAPI } from '../../../../services/api';

export default function QuestionBankV2() {
  const [questions, setQuestions] = useState([]);
  const [testSets, setTestSets] = useState([]);
  const [selectedTestSet, setSelectedTestSet] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
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
    topics: [],
    aiOnly: true,
    avoidDuplicates: true,
    maxAIAttempts: 5
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTest, setGeneratedTest] = useState(null);
  
  const fileInputRef = useRef(null);

  // Load questions from backend
  const loadQuestions = async () => {
    try {
      const res = await questionBankAPI.list();
      const items = res.items || [];
      setQuestions(items.map((it) => ({
        id: it.id,
        question_text: it.question_text,
        question_type: it.question_type,
        options: it.options || undefined,
        correct_answer: it.correct_answer,
        skill_type: it.skill_type,
        difficulty: it.difficulty,
        topic: it.topic,
        tags: it.tags || [],
        points: it.points || 1,
        times_used: it.times_used || 0,
        created_at: it.created_at,
      })));
    } catch (e) {
      console.error('Failed to load questions', e);
    }
  };

  // Load test sets from backend
  const loadTestSets = async () => {
    try {
      const res = await questionBankAPI.getTestSets();
      setTestSets(res.testsets || []);
    } catch (e) {
      console.error('Failed to load test sets', e);
    }
  };

  useEffect(() => {
    loadQuestions();
    loadTestSets();
  }, []);

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
  
  const handleDeleteQuestion = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await questionBankAPI.remove(id);
      await loadQuestions();
    } catch (e) {
      alert('Xóa thất bại');
    }
  };
  
  const handleDuplicateQuestion = async (question) => {
    try {
      await questionBankAPI.duplicate(question.id);
      await loadQuestions();
    } catch (e) {
      alert('Nhân bản thất bại');
    }
  };

  const handleAIGeneration = async () => {
    if (!validateConfig()) return;
    setIsGenerating(true);
    
    // Debug: Log config being sent
    console.log('=== AI Generation Config ===');
    console.log('Total Questions:', aiGenerationConfig.totalQuestions);
    console.log('Skill Distribution:', aiGenerationConfig.skillDistribution);
    console.log('Time Limit:', aiGenerationConfig.timeLimit);
    console.log('AI Only:', aiGenerationConfig.aiOnly);
    console.log('Avoid Duplicates:', aiGenerationConfig.avoidDuplicates);
    
    try {
      const res = await questionBankAPI.generateTest(aiGenerationConfig);
      // Map to local UI structure
      const mapped = (res.questions || []).map((q, idx) => ({
        id: `generated_${Date.now()}_${idx}`,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        correct_answer: q.correct_answer,
        skill_type: q.skill_type,
        difficulty: q.difficulty || 'medium',
        topic: q.topic,
        tags: q.tags || [],
        points: q.points || 1,
        transcript: q.transcript,
        passage_text: q.passage_text,
        times_used: 0,
        created_at: res.createdAt,
        generated: true,
      }));
      setGeneratedTest({
        name: res.name,
        questions: mapped,
        timeLimit: res.timeLimit,
        totalPoints: res.totalPoints,
        skillDistribution: res.skillDistribution,
        createdAt: res.createdAt,
      });
      
      // Debug: Log actual results
      console.log('=== AI Generation Results ===');
      console.log('Total Questions Generated:', mapped.length);
      const skillCounts = {};
      ['listening', 'speaking', 'reading', 'writing'].forEach(skill => {
        skillCounts[skill] = mapped.filter(q => q.skill_type === skill).length;
      });
      console.log('Skill Counts:', skillCounts);
      console.log('Expected Distribution:', aiGenerationConfig.skillDistribution);
      
      // Show alert if mismatch
      const totalPct = Object.values(aiGenerationConfig.skillDistribution).reduce((s, v) => s + v, 0);
      if (totalPct === 100) {
        const mismatches = [];
        ['listening', 'speaking', 'reading', 'writing'].forEach(skill => {
          const expected = Math.round(aiGenerationConfig.totalQuestions * (aiGenerationConfig.skillDistribution[skill] / 100));
          const actual = skillCounts[skill];
          if (expected > 0 && actual === 0) {
            mismatches.push(`${skill}: mong đợi ${expected} câu nhưng được 0 câu`);
          }
        });
        if (mismatches.length > 0) {
          console.warn('⚠️ SKILL MISMATCH:', mismatches.join(', '));
          alert('⚠️ Cảnh báo: Một số kỹ năng không tạo được câu hỏi:\n\n' + mismatches.join('\n') + '\n\nVui lòng:\n1. Bỏ tick "Tránh trùng với ngân hàng"\n2. Kiểm tra GEMINI_API_KEY\n3. Xem log backend để biết chi tiết');
        }
      }
    } catch (e) {
      alert('Tạo đề thi bằng AI thất bại');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportTest = () => {
    if (!generatedTest) return;
    const payload = {
      name: generatedTest.name,
      timeLimit: generatedTest.timeLimit,
      totalPoints: generatedTest.totalPoints,
      questions: generatedTest.questions.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        skill_type: q.skill_type,
        options: q.options || [],
        correct_answer: q.correct_answer,
        difficulty: q.difficulty,
        topic: q.topic,
        tags: q.tags || [],
        points: q.points || 1,
      }))
    };

    questionBankAPI.exportDocx(payload).then((res) => {
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedTest.name.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }).catch(() => {
      alert('Xuất DOCX thất bại');
    });
  };

  const handleCreateExercise = async () => {
    if (!generatedTest) return;
    try {
      const payload = {
        name: generatedTest.name,
        timeLimit: generatedTest.timeLimit,
        totalPoints: generatedTest.totalPoints,
        questions: generatedTest.questions.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          skill_type: q.skill_type,
          options: q.options || [],
          correct_answer: q.correct_answer,
          difficulty: q.difficulty,
          topic: q.topic,
          tags: q.tags || [],
          points: q.points || 1,
        }))
      };
      // Optional: prompt for classId
      const classIdStr = window.prompt('Nhập class_id để gắn bài tập (bỏ trống nếu không):', '');
      const classId = classIdStr && !isNaN(parseInt(classIdStr)) ? parseInt(classIdStr) : null;
      const res = await questionBankAPI.createExerciseFromTest(payload, classId);
      alert(`Đã tạo bài tập #${res.id}${res.class_id ? ' cho lớp ' + res.class_id : ''}`);
    } catch (e) {
      alert('Tạo bài tập thất bại');
    }
  };

  const handleSaveToBank = async () => {
    if (!generatedTest) return;
    try {
      const payload = {
        name: generatedTest.name,
        timeLimit: generatedTest.timeLimit,
        totalPoints: generatedTest.totalPoints,
        skillDistribution: generatedTest.skillDistribution,
        questions: generatedTest.questions.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          skill_type: q.skill_type,
          options: q.options || [],
          correct_answer: q.correct_answer,
          difficulty: q.difficulty,
          topic: q.topic,
          tags: q.tags || [],
          points: q.points || 1,
          transcript: q.transcript,
          passage_text: q.passage_text,
        }))
      };
      // Chỉ lưu bộ đề, không lưu từng câu riêng lẻ
      const setRes = await questionBankAPI.saveTestSet(payload);
      alert(`✅ Đã lưu bộ đề #${setRes.id} vào ngân hàng (${generatedTest.questions.length} câu hỏi)`);
      // Refresh danh sách bộ đề
      await loadTestSets();
    } catch (e) {
      console.error('Lỗi lưu bộ đề:', e);
      alert('❌ Lưu vào ngân hàng thất bại');
    }
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
      topics: [],
      aiOnly: false
    });
    setGeneratedTest(null);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.docx')) {
      alert('⚠️ Vui lòng chọn file CSV hoặc DOCX');
      e.target.value = '';
      return;
    }
    
    try {
      const res = await questionBankAPI.importCSV(file);
      if (res.errors && res.errors.length > 0) {
        const errorMsg = res.errors.slice(0, 5).join('\n');
        alert(`Import: ${res.imported} thành công, ${res.failed} lỗi\n\nLỗi:\n${errorMsg}${res.errors.length > 5 ? '\n...' : ''}`);
      } else {
        alert(`✅ Import thành công: ${res.imported} câu hỏi`);
      }
      await loadQuestions();
    } catch (err) {
      console.error('Import error:', err);
      alert(`❌ Import thất bại: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
    } finally {
      e.target.value = '';
    }
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
      speaking: Mic,
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

  const handleViewTestSet = async (testSetId) => {
    try {
      const detail = await questionBankAPI.getTestSetDetail(testSetId);
      setSelectedTestSet(detail);
      // Convert to generatedTest format for preview
      const mapped = (detail.questions || []).map((q, idx) => ({
        id: `testset_${testSetId}_${idx}`,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        correct_answer: q.correct_answer,
        skill_type: q.skill_type,
        difficulty: q.difficulty || 'medium',
        topic: q.topic,
        tags: q.tags || [],
        points: q.points || 1,
        transcript: q.transcript,
        passage_text: q.passage_text,
      }));
      setGeneratedTest({
        name: detail.name,
        questions: mapped,
        timeLimit: detail.timeLimit,
        totalPoints: detail.totalPoints,
        skillDistribution: detail.skillDistribution,
        createdAt: detail.createdAt,
      });
    } catch (e) {
      console.error('Failed to load test set detail', e);
      alert('Không thể tải bộ đề');
    }
  };

  const handleDeleteTestSet = async (testSetId) => {
    if (!confirm('Bạn có chắc muốn xóa bộ đề này?')) return;
    try {
      await questionBankAPI.deleteTestSet(testSetId);
      alert('✅ Đã xóa bộ đề');
      await loadTestSets();
      if (selectedTestSet && selectedTestSet.id === testSetId) {
        setSelectedTestSet(null);
        setGeneratedTest(null);
      }
    } catch (e) {
      console.error('Failed to delete test set', e);
      alert('❌ Xóa bộ đề thất bại');
    }
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
            <input ref={fileInputRef} type="file" accept=".csv,.docx" style={{ display: 'none' }} onChange={handleImportFile} />
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2" onClick={handleImportClick}>
              <Upload size={18} />
              Import File
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
                      onClick={() => setEditingQuestion(question)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDuplicateQuestion(question)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Sao chép"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Xóa"
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
                  <p className="text-gray-900 text-sm font-medium leading-relaxed line-clamp-2 mb-2">
                    {question.question_text}
                  </p>
                  
                  {/* Additional info based on skill type */}
                  {question.skill_type === 'listening' && (
                    <div className="mt-2 space-y-1">
                      {question.media_url && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Headphones size={12} />
                          <span>Có file audio</span>
                        </div>
                      )}
                      {question.transcript && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded line-clamp-2">
                          📝 Transcript: {question.transcript}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {question.skill_type === 'reading' && (
                    <div className="mt-2">
                      {(question.passage_text || question.passage_url) && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded line-clamp-3">
                          📖 {question.passage_text ? question.passage_text : 'Có file đoạn văn'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {question.skill_type === 'speaking' && (
                    <div className="mt-2">
                      {question.requirements && question.requirements.length > 0 && (
                        <div className="text-xs text-gray-600">
                          💡 {question.requirements.length} yêu cầu
                        </div>
                      )}
                    </div>
                  )}
                  
                  {question.skill_type === 'writing' && (
                    <div className="mt-2">
                      {question.word_limit && (
                        <div className="text-xs text-gray-600">
                          📏 {question.word_limit.min}-{question.word_limit.max} từ
                        </div>
                      )}
                      {question.requirements && question.requirements.length > 0 && (
                        <div className="text-xs text-gray-600">
                          💡 {question.requirements.length} yêu cầu
                        </div>
                      )}
                    </div>
                  )}
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

      {/* Saved Test Sets Section */}
      <div className="mt-12 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bộ đề đã lưu</h2>
            <p className="text-gray-600">Các bộ đề thi đã tạo và lưu trữ ({testSets.length} bộ đề)</p>
          </div>
        </div>

        {testSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testSets.map((testSet) => (
              <Card key={testSet.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{testSet.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(testSet.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTestSet(testSet.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Xóa bộ đề"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <FileQuestion className="w-4 h-4" />
                      Số câu hỏi:
                    </span>
                    <span className="font-medium text-gray-900">{testSet.questionCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Thời gian:
                    </span>
                    <span className="font-medium text-gray-900">{testSet.timeLimit} phút</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Tổng điểm:
                    </span>
                    <span className="font-medium text-gray-900">{testSet.totalPoints}</span>
                  </div>
                </div>

                {testSet.skillDistribution && Object.keys(testSet.skillDistribution).length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-600 mb-2">Phân bố kỹ năng:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(testSet.skillDistribution).map(([skill, percentage]) => (
                        percentage > 0 && (
                          <span key={skill} className={`px-2 py-1 rounded text-xs ${getSkillColor(skill)}`}>
                            {skill === 'listening' ? 'Nghe' : 
                             skill === 'speaking' ? 'Nói' :
                             skill === 'reading' ? 'Đọc' : 'Viết'}: {percentage}%
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleViewTestSet(testSet.id)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Xem chi tiết
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Chưa có bộ đề nào được lưu</p>
              <p className="text-sm text-gray-400">Tạo đề thi bằng AI và lưu vào ngân hàng để quản lý</p>
            </div>
          </Card>
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
            <p className="text-gray-600">Tạo đề thi tự động ngẫu nhiên không trùng lặp với AI</p>
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
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            console.log(`Skill ${skill} changed to ${newValue}%`);
                            setAiGenerationConfig(prev => ({
                              ...prev,
                              skillDistribution: {
                                ...prev.skillDistribution,
                                [skill]: newValue
                              }
                            }));
                          }}
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

              {/* Fallback option when AI lacks questions */}
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={!aiGenerationConfig.aiOnly}
                    onChange={(e) => setAiGenerationConfig(prev => ({
                      ...prev,
                      aiOnly: !e.target.checked
                    }))}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Bổ sung từ ngân hàng nếu AI thiếu</div>
                    <div className="text-xs text-gray-600">Giữ đúng tổng số câu bằng cách tự động lấy thêm từ ngân hàng cá nhân khi AI không sinh đủ ở một kỹ năng.</div>
                  </div>
                </label>
              </div>

              {/* Avoid duplicates option */}
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={aiGenerationConfig.avoidDuplicates}
                    onChange={(e) => setAiGenerationConfig(prev => ({
                      ...prev,
                      avoidDuplicates: e.target.checked
                    }))}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Tránh trùng với ngân hàng</div>
                    <div className="text-xs text-gray-600">AI sẽ sinh nội dung mới và bỏ qua các câu/đoạn đã có trong ngân hàng của bạn.</div>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAIGeneration}
                  disabled={isGenerating}
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

                {/* Listening: only a play button (no transcript shown) */}
                {(() => {
                  const q = generatedTest.questions.find(x => x.skill_type === 'listening' && x.transcript);
                  if (!q) return null;
                  return (
                    <div className="flex justify-end mb-1">
                      <button
                        className="text-purple-700 text-xs hover:underline"
                        onClick={() => {
                          try {
                            const utter = new SpeechSynthesisUtterance(q.transcript);
                            utter.lang = 'en-US';
                            window.speechSynthesis.cancel();
                            window.speechSynthesis.speak(utter);
                          } catch (e) {
                            alert('Trình duyệt không hỗ trợ phát giọng nói.');
                          }
                        }}
                      >
                        Phát đoạn nghe
                      </button>
                    </div>
                  );
                })()}

                {/* Reading: show passage (script) for students to read */}
                {(() => {
                  const rq = generatedTest.questions.find(x => x.skill_type === 'reading' && x.passage_text);
                  if (!rq) return null;
                  return (
                    <div className="mb-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="text-sm font-medium text-green-900 mb-1">Đoạn đọc (Reading)</div>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{rq.passage_text}</p>
                    </div>
                  );
                })()}

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
                    onClick={handleSaveToBank}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Database className="w-4 h-4" />
                    Lưu vào ngân hàng
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
          mode="add"
          onClose={() => setShowAddModal(false)}
          onAdd={async (newQuestion) => {
            console.log('[ADD QUESTION] Received:', newQuestion);
            
            try {
              let payload = {};
              
              // ========== LISTENING ==========
              if (newQuestion.skill_type === 'listening') {
                console.log('[LISTENING] Processing...');
                
                // Upload audio nếu có
                let media_url = null;
                const files = newQuestion._files || {};
                console.log('[LISTENING] Files object:', files);
                console.log('[LISTENING] audioFile:', files.audioFile);
                
                if (files.audioFile) {
                  try {
                    console.log('[LISTENING] Uploading audio...', {
                      name: files.audioFile.name,
                      type: files.audioFile.type,
                      size: files.audioFile.size
                    });
                    const uploadRes = await questionBankAPI.uploadAudio(files.audioFile);
                    media_url = uploadRes.url;
                    console.log('[LISTENING] Audio uploaded successfully:', media_url);
                  } catch (err) {
                    console.error('[LISTENING] Audio upload failed:', err);
                    console.error('[LISTENING] Error response:', err.response?.data);
                    alert(`⚠️ Upload audio thất bại:\n\n${err.response?.data?.detail || err.message}\n\nVui lòng kiểm tra định dạng file và thử lại.`);
                    // Don't continue if audio upload fails for listening questions
                    return;
                  }
                } else {
                  console.log('[LISTENING] No audio file provided');
                }
                
                payload = {
                  skill_type: 'listening',
                  question_type: newQuestion.question_type || 'short_answer',
                  difficulty: newQuestion.difficulty || 'medium',
                  topic: newQuestion.topic,
                  question_text: newQuestion.question_text,
                  media_url: media_url,
                  transcript: newQuestion.transcript || null,
                  options: newQuestion.question_type === 'multiple_choice' ? newQuestion.options : null,
                  correct_answer: newQuestion.correct_answer || null,
                  points: newQuestion.points || 2,
                  tags: ['listening'],
                };
              }
              
              // ========== SPEAKING ==========
              else if (newQuestion.skill_type === 'speaking') {
                console.log('[SPEAKING] Processing...');
                
                payload = {
                  skill_type: 'speaking',
                  question_type: 'task',
                  difficulty: newQuestion.difficulty || 'medium',
                  topic: newQuestion.topic,
                  question_text: newQuestion.question_text,
                  requirements: newQuestion.instructions || null,
                  points: newQuestion.points || 3,
                  tags: ['speaking'],
                };
              }
              
              // ========== READING ==========
              else if (newQuestion.skill_type === 'reading') {
                console.log('[READING] Processing...');
                
                // Xử lý passage
                let passage_text = newQuestion.passage || null;
                let passage_url = null;
                
                const files = newQuestion._files || {};
                if (files.passageFile) {
                  try {
                    console.log('[READING] Uploading passage file...');
                    const uploadRes = await questionBankAPI.uploadPassage(files.passageFile);
                    passage_url = uploadRes.url;
                    console.log('[READING] Passage uploaded:', passage_url);
                  } catch (err) {
                    console.error('[READING] Passage upload failed:', err);
                    alert('⚠️ Upload passage thất bại, sử dụng text passage thay thế...');
                  }
                }
                
                payload = {
                  skill_type: 'reading',
                  question_type: newQuestion.question_type || 'short_answer',
                  difficulty: newQuestion.difficulty || 'medium',
                  topic: newQuestion.topic,
                  question_text: newQuestion.question_text,
                  passage_text: passage_text,
                  passage_url: passage_url,
                  options: newQuestion.question_type === 'multiple_choice' ? newQuestion.options : null,
                  correct_answer: newQuestion.correct_answer || null,
                  points: newQuestion.points || 2,
                  tags: ['reading'],
                };
              }
              
              // ========== WRITING ==========
              else if (newQuestion.skill_type === 'writing') {
                console.log('[WRITING] Processing...');
                
                payload = {
                  skill_type: 'writing',
                  question_type: 'task',
                  difficulty: newQuestion.difficulty || 'medium',
                  topic: newQuestion.topic,
                  question_text: newQuestion.question_text,
                  writing_type: newQuestion.writing_type || 'essay',
                  word_limit_min: newQuestion.word_limit?.min || 150,
                  word_limit_max: newQuestion.word_limit?.max || 300,
                  requirements: newQuestion.requirements || null,
                  points: newQuestion.points || 4,
                  tags: ['writing'],
                };
              }
              
              // Validate payload
              if (!payload.skill_type || !payload.question_text || !payload.topic) {
                throw new Error('Thiếu thông tin bắt buộc: skill_type, question_text, topic');
              }
              
              console.log('[ADD QUESTION] Final payload:', payload);
              
              // Create question
              await questionBankAPI.create(payload);
              console.log('[ADD QUESTION] Success!');
              
              alert('✅ Đã thêm câu hỏi thành công');
              await loadQuestions();
              setShowAddModal(false);
              
            } catch (e) {
              console.error('[ADD QUESTION] Error:', e);
              const errorMsg = e.response?.data?.detail || e.message || 'Unknown error';
              alert(`❌ Thêm câu hỏi thất bại:\n\n${errorMsg}`);
            }
          }}
        />
      )}
      
      {/* Edit Modal */}
      {editingQuestion && (
        <AddQuestionModal
          mode="edit"
          initialData={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onAdd={async (updatedQuestion) => {
            console.log('[EDIT QUESTION] Received:', updatedQuestion);
            
            try {
              let payload = {};
              
              // ========== LISTENING ==========
              if (updatedQuestion.skill_type === 'listening') {
                console.log('[LISTENING] Processing update...');
                
                // Upload audio nếu có file mới
                let media_url = editingQuestion.media_url; // Keep existing URL
                const files = updatedQuestion._files || {};
                
                if (files.audioFile) {
                  try {
                    console.log('[LISTENING] Uploading new audio...');
                    const uploadRes = await questionBankAPI.uploadAudio(files.audioFile);
                    media_url = uploadRes.url;
                    console.log('[LISTENING] New audio uploaded:', media_url);
                  } catch (err) {
                    console.error('[LISTENING] Audio upload failed:', err);
                    alert(`⚠️ Upload audio thất bại:\n\n${err.response?.data?.detail || err.message}`);
                    return;
                  }
                }
                
                payload = {
                  skill_type: 'listening',
                  question_type: updatedQuestion.question_type || 'short_answer',
                  difficulty: updatedQuestion.difficulty || 'medium',
                  topic: updatedQuestion.topic,
                  question_text: updatedQuestion.question_text,
                  media_url: media_url,
                  transcript: updatedQuestion.transcript || null,
                  options: updatedQuestion.question_type === 'multiple_choice' ? updatedQuestion.options : null,
                  correct_answer: updatedQuestion.correct_answer || null,
                  points: updatedQuestion.points || 2,
                  tags: ['listening'],
                };
              }
              
              // ========== SPEAKING ==========
              else if (updatedQuestion.skill_type === 'speaking') {
                payload = {
                  skill_type: 'speaking',
                  question_type: 'task',
                  difficulty: updatedQuestion.difficulty || 'medium',
                  topic: updatedQuestion.topic,
                  question_text: updatedQuestion.question_text,
                  requirements: updatedQuestion.instructions || null,
                  points: updatedQuestion.points || 3,
                  tags: ['speaking'],
                };
              }
              
              // ========== READING ==========
              else if (updatedQuestion.skill_type === 'reading') {
                let passage_text = updatedQuestion.passage || editingQuestion.passage_text;
                let passage_url = editingQuestion.passage_url;
                
                const files = updatedQuestion._files || {};
                if (files.passageFile) {
                  try {
                    console.log('[READING] Uploading new passage...');
                    const uploadRes = await questionBankAPI.uploadPassage(files.passageFile);
                    passage_url = uploadRes.url;
                    passage_text = null; // Use file instead
                  } catch (err) {
                    console.error('[READING] Passage upload failed:', err);
                    alert('⚠️ Upload passage thất bại, sử dụng text thay thế...');
                  }
                }
                
                payload = {
                  skill_type: 'reading',
                  question_type: updatedQuestion.question_type || 'short_answer',
                  difficulty: updatedQuestion.difficulty || 'medium',
                  topic: updatedQuestion.topic,
                  question_text: updatedQuestion.question_text,
                  passage_text: passage_text,
                  passage_url: passage_url,
                  options: updatedQuestion.question_type === 'multiple_choice' ? updatedQuestion.options : null,
                  correct_answer: updatedQuestion.correct_answer || null,
                  points: updatedQuestion.points || 2,
                  tags: ['reading'],
                };
              }
              
              // ========== WRITING ==========
              else if (updatedQuestion.skill_type === 'writing') {
                payload = {
                  skill_type: 'writing',
                  question_type: 'task',
                  difficulty: updatedQuestion.difficulty || 'medium',
                  topic: updatedQuestion.topic,
                  question_text: updatedQuestion.question_text,
                  writing_type: updatedQuestion.writing_type || 'essay',
                  word_limit: updatedQuestion.word_limit || { min: 150, max: 300 },
                  requirements: updatedQuestion.requirements || null,
                  points: updatedQuestion.points || 4,
                  tags: ['writing'],
                };
              }
              
              console.log('[EDIT QUESTION] Final payload:', payload);
              
              // Update question
              await questionBankAPI.update(editingQuestion.id, payload);
              console.log('[EDIT QUESTION] Success!');
              
              alert('✅ Đã cập nhật câu hỏi thành công');
              await loadQuestions();
              setEditingQuestion(null);
              
            } catch (e) {
              console.error('[EDIT QUESTION] Error:', e);
              const errorMsg = e.response?.data?.detail || e.message || 'Unknown error';
              alert(`❌ Cập nhật câu hỏi thất bại:\n\n${errorMsg}`);
            }
          }}
        />
      )}
    </div>
  );
}
