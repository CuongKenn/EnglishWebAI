import { useState, useRef, useEffect } from 'react';
import { 
  X, FileText, Clock, Award, Upload, FileUp, 
  Sparkles, Bot, Headphones, Book, MessageSquare, PenTool
} from 'lucide-react';
import { apiV1 } from '../../../../../services/api';
import Toast from '../../../../../components/Toast/Toast';
import useToast from '../../../../../hooks/useToast';
import './CreateExerciseModalV2.css';

export default function CreateExerciseModalV2({ onClose, onCreate }) {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  
  // Step 1: Test Type
  const [testType, setTestType] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  
  // Step 2: Creation Method
  const [creationMethod, setCreationMethod] = useState('');
  
  // Step 3: Basic Info
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  const [classes, setClasses] = useState([]);
  
  // AI Generation
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState(null);
  const [showAiPreview, setShowAiPreview] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generationProgress, setGenerationProgress] = useState('');
  
  // Import File (for midterm/final exams)
  const [importedFile, setImportedFile] = useState(null);
  
  // Manual creation states
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [readingPassage, setReadingPassage] = useState('');
  const [questions, setQuestions] = useState([]);
  const [writingPrompt, setWritingPrompt] = useState('');
  const [speakingPrompt, setSpeakingPrompt] = useState('');
  const [minWords, setMinWords] = useState(150);
  const [maxWords, setMaxWords] = useState(300);
  
  // Current step
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await apiV1.get('/classes/teaching');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAIGeneration = async () => {
    if (!title.trim()) {
      showWarning('Vui lòng nhập tiêu đề!');
      return;
    }
    if (!classId) {
      showWarning('Vui lòng chọn lớp học!');
      return;
    }
    if (uploadedFiles.length === 0) {
      showWarning('Vui lòng upload ít nhất 1 file!');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress('📄 Đang đọc nội dung file...');
    
    try {
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('title', title.trim());
      formData.append('class_id', classId);
      formData.append('test_type', testType);
      
      // For midterm/final, set skill_type as 'all' or send all skills
      if (testType === 'midterm' || testType === 'final') {
        formData.append('skill_type', 'all');
      } else {
        formData.append('skill_type', selectedSkill);
      }
      
      formData.append('max_score', maxScore);
      if (dueDate) {
        formData.append('due_date', dueDate);
      }
      if (aiPrompt.trim()) {
        formData.append('prompt', aiPrompt.trim());
      }

      // Simulate progress updates
      setTimeout(() => setGenerationProgress('🤖 AI đang phân tích nội dung...'), 2000);
      setTimeout(() => setGenerationProgress('✨ Đang sinh câu hỏi...'), 5000);
      setTimeout(() => setGenerationProgress('📝 Đang hoàn thiện đề bài...'), 10000);

      const response = await apiV1.post('/exercises/generate-from-files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setGenerationProgress('✅ Hoàn tất!');
      
      console.log('AI Generated Response:', response.data);
      
      // Backend returns {success, message, exercise_id, exercise}
      const generatedExercise = response.data.exercise || response.data;
      
      if (!generatedExercise) {
        throw new Error('Backend không trả về exercise data');
      }
      
      console.log('Generated Exercise:', generatedExercise);
      
      // Store generated content for preview
      setAiGeneratedContent(generatedExercise);
      setShowAiPreview(true);
      showSuccess('✅ AI đã sinh đề xong! Vui lòng xem và chỉnh sửa nếu cần.');
    } catch (error) {
      console.error('Error generating exercise:', error);
      setGenerationProgress('');
      showError('❌ Lỗi khi sinh đề: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(''), 1000);
    }
  };

  const handleConfirmAIGeneration = () => {
    // Confirm and create the exercise with AI generated content
    onCreate(aiGeneratedContent);
    setShowAiPreview(false);
    onClose();
  };

  const handleEditAIContent = (field, value) => {
    // Allow editing AI generated content before confirming
    setAiGeneratedContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManualCreation = async () => {
    if (!title.trim()) {
      showWarning('Vui lòng nhập tiêu đề!');
      return;
    }
    if (!classId) {
      showWarning('Vui lòng chọn lớp học!');
      return;
    }

    // Build exercise content based on skill
    const content = {};
    
    if (selectedSkill === 'listening') {
      if (!audioFile) {
        showWarning('Vui lòng upload file audio!');
        return;
      }
      if (questions.length === 0) {
        showWarning('Vui lòng thêm ít nhất 1 câu hỏi!');
        return;
      }
      
      // Need to upload audio file first
      try {
        const formData = new FormData();
        formData.append('file', audioFile);
        
        const uploadResponse = await apiV1.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        content.audio_url = uploadResponse.data.url;
        content.transcript = transcript;
        content.questions = questions;
      } catch (error) {
        showError('Lỗi khi upload file audio!');
        return;
      }
    } else if (selectedSkill === 'reading') {
      if (!readingPassage.trim()) {
        showWarning('Vui lòng nhập đoạn văn!');
        return;
      }
      if (questions.length === 0) {
        showWarning('Vui lòng thêm ít nhất 1 câu hỏi!');
        return;
      }
      content.passage = readingPassage;
      content.questions = questions;
    } else if (selectedSkill === 'writing') {
      if (!writingPrompt.trim()) {
        showWarning('Vui lòng nhập đề bài Writing!');
        return;
      }
      content.prompt = writingPrompt;
      content.min_words = minWords;
      content.max_words = maxWords;
    } else if (selectedSkill === 'speaking') {
      if (!speakingPrompt.trim()) {
        showWarning('Vui lòng nhập đề bài Speaking!');
        return;
      }
      content.prompt = speakingPrompt;
    }

    const exercise = {
      title: title.trim(),
      type: testType,
      skill_type: (testType === 'midterm' || testType === 'final') ? 'all' : selectedSkill,
      class_id: classId,
      due_at: dueDate,
      max_score: maxScore,
      content: content
    };

    onCreate(exercise);
    onClose();
  };

  const handleImportCreation = async () => {
    if (!title.trim()) {
      showWarning('Vui lòng nhập tiêu đề!');
      return;
    }
    if (!classId) {
      showWarning('Vui lòng chọn lớp học!');
      return;
    }
    if (!importedFile) {
      showWarning('Vui lòng upload file Word!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', importedFile);
      formData.append('title', title.trim());
      formData.append('type', testType);
      formData.append('skill_type', (testType === 'midterm' || testType === 'final') ? 'all' : selectedSkill);
      formData.append('class_id', classId);
      if (dueDate) formData.append('due_date', dueDate);
      formData.append('max_score', maxScore);

      const response = await apiV1.post('/exercises/import-word', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showSuccess('Tạo bài tập thành công!');
      // Import already created the exercise, so just signal success with the created exercise
      onCreate({ 
        _imported: true, 
        exercise_id: response.data.exercise_id 
      });
      onClose();
    } catch (error) {
      console.error('Error importing exercise:', error);
      showError(error.response?.data?.detail || 'Lỗi khi tạo bài tập từ file Word!');
    }
  };

  // Question management
  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: 0,
      points: 1,
      explanation: '',
      // For matching type
      pairs: [{ left: '', right: '' }]
    }]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    
    // Reset answers when changing question type
    if (field === 'type') {
      if (value === 'multiple_choice') {
        updated[index].options = ['', '', '', ''];
        updated[index].correct_answer = 0;
      } else if (value === 'true_false') {
        updated[index].correct_answer = 'true';
      } else if (value === 'fill_blank' || value === 'short_answer') {
        updated[index].correct_answer = '';
      } else if (value === 'matching') {
        updated[index].pairs = [{ left: '', right: '' }];
      }
    }
    
    setQuestions(updated);
  };

  const updateQuestionOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addMatchingPair = (qIndex) => {
    const updated = [...questions];
    if (!updated[qIndex].pairs) updated[qIndex].pairs = [];
    updated[qIndex].pairs.push({ left: '', right: '' });
    setQuestions(updated);
  };

  const updateMatchingPair = (qIndex, pIndex, side, value) => {
    const updated = [...questions];
    updated[qIndex].pairs[pIndex][side] = value;
    setQuestions(updated);
  };

  const removeMatchingPair = (qIndex, pIndex) => {
    const updated = [...questions];
    updated[qIndex].pairs = updated[qIndex].pairs.filter((_, i) => i !== pIndex);
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const canProceedToStep3 = () => {
    if (testType === 'midterm' || testType === 'final') {
      return testType && creationMethod;
    }
    return testType && selectedSkill && creationMethod;
  };

  // Render question form based on type
  const renderQuestionForm = (q, qIdx) => (
    <div key={qIdx} className="question-card-v2">
      <div className="question-header-v2">
        <span>Câu {qIdx + 1}</span>
        <button onClick={() => removeQuestion(qIdx)} className="btn-remove-v2">
          <X size={16} />
        </button>
      </div>
      
      {/* Question Type Selector */}
      <div className="form-group-v2">
        <label>Loại câu hỏi</label>
        <select
          className="input-v2"
          value={q.type}
          onChange={(e) => updateQuestion(qIdx, 'type', e.target.value)}
        >
          <option value="multiple_choice">Trắc nghiệm (Multiple Choice)</option>
          <option value="true_false">Đúng/Sai (True/False)</option>
          <option value="fill_blank">Điền vào chỗ trống (Fill in the Blank)</option>
          <option value="short_answer">Câu trả lời ngắn (Short Answer)</option>
          <option value="matching">Ghép cặp (Matching)</option>
        </select>
      </div>
      
      <input
        type="text"
        className="input-v2"
        placeholder="Câu hỏi..."
        value={q.question}
        onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
      />

      {/* Multiple Choice Options */}
      {q.type === 'multiple_choice' && (
        <div className="options-grid-v2">
          {q.options?.map((opt, oIdx) => (
            <div key={oIdx} className="option-item-v2">
              <input
                type="radio"
                name={`correct-${qIdx}`}
                checked={q.correct_answer === oIdx}
                onChange={() => updateQuestion(qIdx, 'correct_answer', oIdx)}
              />
              <input
                type="text"
                className="input-v2"
                placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                value={opt}
                onChange={(e) => updateQuestionOption(qIdx, oIdx, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* True/False */}
      {q.type === 'true_false' && (
        <div className="form-group-v2">
          <label>Đáp án đúng</label>
          <select
            className="input-v2"
            value={q.correct_answer}
            onChange={(e) => updateQuestion(qIdx, 'correct_answer', e.target.value)}
          >
            <option value="true">Đúng (True)</option>
            <option value="false">Sai (False)</option>
          </select>
        </div>
      )}

      {/* Fill in the Blank */}
      {q.type === 'fill_blank' && (
        <div className="form-group-v2">
          <label>Đáp án đúng</label>
          <input
            type="text"
            className="input-v2"
            placeholder="Nhập đáp án..."
            value={q.correct_answer}
            onChange={(e) => updateQuestion(qIdx, 'correct_answer', e.target.value)}
          />
          <small style={{color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block'}}>
            Sử dụng ___ hoặc [...] trong câu hỏi để đánh dấu chỗ trống
          </small>
        </div>
      )}

      {/* Short Answer */}
      {q.type === 'short_answer' && (
        <div className="form-group-v2">
          <label>Gợi ý đáp án</label>
          <textarea
            className="input-v2"
            rows="2"
            placeholder="Nhập gợi ý đáp án hoặc từ khóa cần có..."
            value={q.correct_answer}
            onChange={(e) => updateQuestion(qIdx, 'correct_answer', e.target.value)}
          />
          <small style={{color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block'}}>
            Câu trả lời ngắn sẽ được chấm thủ công hoặc AI
          </small>
        </div>
      )}

      {/* Matching */}
      {q.type === 'matching' && (
        <div className="matching-section">
          <label>Các cặp ghép</label>
          {(q.pairs || []).map((pair, pIdx) => (
            <div key={pIdx} className="matching-pair" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
              <input
                type="text"
                className="input-v2"
                placeholder="Bên trái..."
                value={pair.left}
                onChange={(e) => updateMatchingPair(qIdx, pIdx, 'left', e.target.value)}
              />
              <span style={{padding: '0 8px', color: '#9ca3af'}}>⟷</span>
              <input
                type="text"
                className="input-v2"
                placeholder="Bên phải..."
                value={pair.right}
                onChange={(e) => updateMatchingPair(qIdx, pIdx, 'right', e.target.value)}
              />
              <button
                onClick={() => removeMatchingPair(qIdx, pIdx)}
                className="btn-remove-v2"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() => addMatchingPair(qIdx)}
            className="btn-add-secondary"
            style={{marginTop: '8px'}}
          >
            + Thêm cặp
          </button>
        </div>
      )}

      {/* Explanation field for all types */}
      <div className="form-group-v2">
        <label>Giải thích (tùy chọn)</label>
        <textarea
          className="input-v2"
          rows="2"
          placeholder="Giải thích đáp án..."
          value={q.explanation || ''}
          onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
        />
      </div>

      <div className="form-row-v2">
        <div className="form-group-v2">
          <label>Điểm</label>
          <input
            type="number"
            className="input-v2"
            value={q.points}
            onChange={(e) => updateQuestion(qIdx, 'points', Number(e.target.value))}
            min="0.5"
            step="0.5"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="exercise-modal-v2-overlay" onClick={onClose}>
      <div className="exercise-modal-v2" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-v2-header">
          <h2>Tạo Bài tập / Kiểm tra Mới</h2>
          <button className="modal-v2-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-v2-body">
          {/* Step 1: Test Type Selection */}
          <div className="form-section-v2">
            <h3 className="section-title-v2">Loại bài tập / kiểm tra</h3>
            <div className="test-type-grid-v2">
              <button 
                className={`test-type-card-v2 ${testType === 'skill_exercise' ? 'active' : ''}`}
                onClick={() => setTestType('skill_exercise')}
              >
                <FileText size={28} />
                <span className="card-title">Bài tập Kỹ năng</span>
                <span className="card-desc">Luyện 1 kỹ năng cụ thể</span>
              </button>
              
              <button 
                className={`test-type-card-v2 ${testType === 'test_15min' ? 'active' : ''}`}
                onClick={() => setTestType('test_15min')}
              >
                <Clock size={28} />
                <span className="card-title">Kiểm tra 15 phút</span>
                <span className="card-desc">Test ngắn 1 kỹ năng</span>
              </button>
              
              <button 
                className={`test-type-card-v2 ${testType === 'midterm' ? 'active' : ''}`}
                onClick={() => setTestType('midterm')}
              >
                <FileText size={28} />
                <span className="card-title">Kiểm tra Giữa kì</span>
                <span className="card-desc">Tổng hợp nhiều kỹ năng</span>
              </button>
              
              <button 
                className={`test-type-card-v2 ${testType === 'final' ? 'active' : ''}`}
                onClick={() => setTestType('final')}
              >
                <Award size={28} />
                <span className="card-title">Kiểm tra Cuối kì</span>
                <span className="card-desc">Đánh giá tổng thể</span>
              </button>
            </div>
          </div>

          {/* Step 2: Skill Selection (Only for skill_exercise and test_15min) */}
          {testType && (testType === 'skill_exercise' || testType === 'test_15min') && (
            <div className="form-section-v2 animate-slide-in">
              <h3 className="section-title-v2">Kỹ năng đánh giá</h3>
              <div className="skill-grid-v2">
                <button
                  className={`skill-card-v2 ${selectedSkill === 'listening' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('listening')}
                >
                  <Headphones size={24} />
                  <span>Nghe</span>
                </button>
                
                <button
                  className={`skill-card-v2 ${selectedSkill === 'speaking' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('speaking')}
                >
                  <MessageSquare size={24} />
                  <span>Nói</span>
                </button>
                
                <button
                  className={`skill-card-v2 ${selectedSkill === 'reading' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('reading')}
                >
                  <Book size={24} />
                  <span>Đọc</span>
                </button>
                
                <button
                  className={`skill-card-v2 ${selectedSkill === 'writing' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('writing')}
                >
                  <PenTool size={24} />
                  <span>Viết</span>
                </button>
              </div>
            </div>
          )}

          {/* Info for Midterm/Final (All 4 skills) */}
          {testType && (testType === 'midterm' || testType === 'final') && (
            <div className="form-section-v2 animate-slide-in">
              <div style={{
                background: 'linear-gradient(135deg, #10b98115 0%, #05966915 100%)',
                border: '2px solid #10b98130',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'start',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Award size={24} color="white" />
                </div>
                <div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#047857',
                    marginBottom: '8px'
                  }}>
                    Kiểm tra tổng hợp 4 kỹ năng
                  </h4>
                  <p style={{
                    fontSize: '14px',
                    color: '#065f46',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    Đề thi này sẽ bao gồm đầy đủ cả 4 kỹ năng: Listening (Nghe), Speaking (Nói), Reading (Đọc), và Writing (Viết). 
                    Bạn có thể tự nhập nội dung hoặc upload file Word có sẵn lên hệ thống.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Creation Method */}
          {testType && (
            (testType === 'skill_exercise' || testType === 'test_15min') ? selectedSkill : true
          ) && (
            <div className="form-section-v2 animate-slide-in">
              <h3 className="section-title-v2">Phương thức tạo đề</h3>
              
              {/* For Midterm/Final: Only Manual and Import */}
              {(testType === 'midterm' || testType === 'final') ? (
                <div className="creation-method-grid-v2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <button
                    className={`method-card-v2 ${creationMethod === 'manual' ? 'active' : ''}`}
                    onClick={() => setCreationMethod('manual')}
                  >
                    <FileText size={32} />
                    <span className="method-title">Tự nhập</span>
                  </button>
                  
                  <button
                    className={`method-card-v2 ${creationMethod === 'import' ? 'active' : ''}`}
                    onClick={() => setCreationMethod('import')}
                  >
                    <FileUp size={32} />
                    <span className="method-title">Upload File Word</span>
                  </button>
                </div>
              ) : (
                /* For Skill Exercise & 15min: Manual, Import, and AI */
                <div className="creation-method-grid-v2">
                  <button
                    className={`method-card-v2 ${creationMethod === 'manual' ? 'active' : ''}`}
                    onClick={() => setCreationMethod('manual')}
                  >
                    <FileText size={32} />
                    <span className="method-title">Tự nhập</span>
                  </button>
                  
                  <button
                    className={`method-card-v2 ${creationMethod === 'import' ? 'active' : ''}`}
                    onClick={() => setCreationMethod('import')}
                  >
                    <FileUp size={32} />
                    <span className="method-title">Import File</span>
                  </button>
                  
                  <button
                    className={`method-card-v2 ai-card ${creationMethod === 'ai' ? 'active' : ''}`}
                    onClick={() => setCreationMethod('ai')}
                  >
                    <Bot size={32} />
                    <span className="method-title">AI Sinh đề</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Basic Info + Method Specific */}
          {canProceedToStep3() && (
            <div className="form-section-v2 animate-slide-in">
              <h3 className="section-title-v2">Tiêu đề *</h3>
              <input
                type="text"
                className="input-v2"
                placeholder="VD: Bài tập Nghe - Unit 5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="form-row-v2">
                <div className="form-group-v2">
                  <label>Lớp học *</label>
                  <select 
                    className="select-v2"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  >
                    <option value="">Chọn lớp...</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group-v2">
                  <label>Hạn nộp</label>
                  <input
                    type="date"
                    className="input-v2"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                
                <div className="form-group-v2">
                  <label>Điểm tối đa</label>
                  <input
                    type="number"
                    className="input-v2"
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              {/* AI File Upload Section */}
              {creationMethod === 'ai' && (
                <div className="ai-upload-section-v2">
                  <label className="upload-label-v2">
                    <FileUp size={48} />
                    <span className="upload-title">Kéo thả file vào đây hoặc click để chọn</span>
                    <span className="upload-desc">Hỗ trợ: Word (.docx), PDF, PowerPoint</span>
                    <input
                      type="file"
                      multiple
                      accept=".docx,.doc,.pdf,.pptx,.ppt"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {uploadedFiles.length > 0 && (
                    <div className="uploaded-files-v2">
                      <h4>📄 Files đã upload ({uploadedFiles.length})</h4>
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="file-item-v2">
                          <FileText size={20} />
                          <div className="file-info-v2">
                            <span className="file-name-v2">{file.name}</span>
                            <span className="file-size-v2">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          <button 
                            className="btn-remove-file-v2"
                            onClick={() => removeFile(idx)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Prompt Section */}
                  <div className="form-group-v2" style={{marginTop: '20px'}}>
                    <label>Yêu cầu bổ sung với AI (tùy chọn)</label>
                    <textarea
                      className="input-v2"
                      rows="4"
                      placeholder="VD: Tạo 15 câu hỏi trắc nghiệm về thì hiện tại hoàn thành, độ khó trung bình, tập trung vào cách dùng và dấu hiệu nhận biết..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      style={{resize: 'vertical'}}
                    />
                    <small style={{color: '#6b7280', fontSize: '13px', marginTop: '8px', display: 'block'}}>
                      💡 AI sẽ phân tích nội dung từ file và tạo đề theo yêu cầu của bạn
                    </small>
                  </div>
                </div>
              )}

              {/* Import File Section (for midterm/final) */}
              {creationMethod === 'import' && (
                <div className="ai-upload-section-v2">
                  <label className="upload-label-v2">
                    <FileUp size={48} />
                    <span className="upload-title">Upload file đề thi Word</span>
                    <span className="upload-desc">
                      {(testType === 'midterm' || testType === 'final') 
                        ? 'File Word sẽ được lưu trên server để học sinh tải về và làm bài'
                        : 'Hỗ trợ: Word (.docx, .doc)'}
                    </span>
                    <input
                      type="file"
                      accept=".docx,.doc"
                      onChange={(e) => setImportedFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {importedFile && (
                    <div className="uploaded-files-v2">
                      <h4>📄 File đã chọn</h4>
                      <div className="file-item-v2">
                        <FileText size={20} />
                        <div className="file-info-v2">
                          <span className="file-name-v2">{importedFile.name}</span>
                          <span className="file-size-v2">
                            {(importedFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <button 
                          className="btn-remove-file-v2"
                          onClick={() => setImportedFile(null)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {(testType === 'midterm' || testType === 'final') && (
                    <div style={{
                      marginTop: '16px',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #3b82f615 0%, #8b5cf615 100%)',
                      border: '2px solid #3b82f630',
                      borderRadius: '12px',
                      fontSize: '14px',
                      color: '#374151',
                      lineHeight: '1.6'
                    }}>
                      <strong style={{color: '#3b82f6', display: 'block', marginBottom: '8px'}}>
                        💡 Lưu ý:
                      </strong>
                      File Word này sẽ được lưu trữ trên server. Học sinh sẽ tải file về, làm bài và nộp lại file hoàn thành.
                    </div>
                  )}
                </div>
              )}

              {/* Manual Content Section */}
              {creationMethod === 'manual' && (
                <div className="manual-content-section-v2">
                  {/* For midterm/final - show info message */}
                  {(testType === 'midterm' || testType === 'final') && (
                    <div style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      border: '2px solid #fbbf24',
                      borderRadius: '12px',
                      marginBottom: '20px'
                    }}>
                      <strong style={{color: '#92400e', display: 'block', marginBottom: '8px'}}>
                        ⚠️ Chế độ tự nhập cho bài kiểm tra tổng hợp:
                      </strong>
                      <p style={{color: '#78350f', fontSize: '14px', margin: 0, lineHeight: '1.6'}}>
                        Để tạo bài kiểm tra giữa kỳ/cuối kỳ (4 kỹ năng), khuyến nghị sử dụng chức năng 
                        <strong> "Upload File Word"</strong> để upload file đề thi có sẵn. 
                        Chức năng tự nhập thủ công phù hợp hơn cho bài tập theo kỹ năng đơn lẻ.
                      </p>
                    </div>
                  )}

                  {/* For skill exercises - show skill form */}
                  {selectedSkill === 'listening' && (
                    <div className="skill-form-v2">
                      <h4 className="skill-form-title">🎧 Nội dung bài Listening</h4>
                      
                      <div className="form-group-v2">
                        <label>Upload file audio *</label>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setAudioFile(e.target.files[0])}
                          className="input-v2"
                        />
                        {audioFile && (
                          <div className="file-preview-v2">
                            <FileText size={16} />
                            <span>{audioFile.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="form-group-v2">
                        <label>Transcript (tùy chọn)</label>
                        <textarea
                          className="input-v2"
                          rows="6"
                          placeholder="Nhập nội dung bài nghe..."
                          value={transcript}
                          onChange={(e) => setTranscript(e.target.value)}
                        />
                      </div>

                      <div className="questions-section-v2">
                        <div className="questions-header-v2">
                          <h5>Câu hỏi ({questions.length})</h5>
                          <button className="btn-add-question-v2" onClick={addQuestion}>
                            + Thêm câu hỏi
                          </button>
                        </div>

                        {questions.map((q, qIdx) => renderQuestionForm(q, qIdx))}
                      </div>
                    </div>
                  )}

                  {/* Reading */}
                  {selectedSkill === 'reading' && (
                    <div className="skill-form-v2">
                      <h4 className="skill-form-title">📖 Nội dung bài Reading</h4>
                      
                      <div className="form-group-v2">
                        <label>Đoạn văn *</label>
                        <textarea
                          className="input-v2"
                          rows="10"
                          placeholder="Nhập hoặc dán đoạn văn..."
                          value={readingPassage}
                          onChange={(e) => setReadingPassage(e.target.value)}
                        />
                      </div>

                      <div className="questions-section-v2">
                        <div className="questions-header-v2">
                          <h5>Câu hỏi ({questions.length})</h5>
                          <button className="btn-add-question-v2" onClick={addQuestion}>
                            + Thêm câu hỏi
                          </button>
                        </div>

                        {questions.map((q, qIdx) => renderQuestionForm(q, qIdx))}
                      </div>
                    </div>
                  )}

                  {/* Writing */}
                  {selectedSkill === 'writing' && (
                    <div className="skill-form-v2">
                      <h4 className="skill-form-title">✍️ Nội dung bài Writing</h4>
                      
                      <div className="form-group-v2">
                        <label>Đề bài *</label>
                        <textarea
                          className="input-v2"
                          rows="6"
                          placeholder="VD: Write an essay about the advantages and disadvantages of social media..."
                          value={writingPrompt}
                          onChange={(e) => setWritingPrompt(e.target.value)}
                        />
                      </div>

                      <div className="form-row-v2">
                        <div className="form-group-v2">
                          <label>Số từ tối thiểu</label>
                          <input
                            type="number"
                            className="input-v2"
                            value={minWords}
                            onChange={(e) => setMinWords(Number(e.target.value))}
                            min="50"
                          />
                        </div>
                        <div className="form-group-v2">
                          <label>Số từ tối đa</label>
                          <input
                            type="number"
                            className="input-v2"
                            value={maxWords}
                            onChange={(e) => setMaxWords(Number(e.target.value))}
                            min="100"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Speaking */}
                  {selectedSkill === 'speaking' && (
                    <div className="skill-form-v2">
                      <h4 className="skill-form-title">🎤 Nội dung bài Speaking</h4>
                      
                      <div className="form-group-v2">
                        <label>Đề bài *</label>
                        <textarea
                          className="input-v2"
                          rows="6"
                          placeholder="VD: Describe your favorite place to visit. Explain why you like it and what you usually do there..."
                          value={speakingPrompt}
                          onChange={(e) => setSpeakingPrompt(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {canProceedToStep3() && (
          <div className="modal-v2-footer">
            <button className="btn-v2 btn-cancel-v2" onClick={onClose}>
              Hủy
            </button>
            
            {creationMethod === 'ai' ? (
              <>
                <button 
                  className="btn-v2 btn-ai-v2"
                  onClick={handleAIGeneration}
                  disabled={isGenerating || uploadedFiles.length === 0}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner-v2"></span>
                      Đang sinh đề...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Tạo bài tập
                    </>
                  )}
                </button>
                {isGenerating && generationProgress && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                    border: '2px solid #667eea30',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#667eea',
                    fontWeight: '600',
                    animation: 'pulse 2s infinite'
                  }}>
                    {generationProgress}
                  </div>
                )}
              </>
            ) : creationMethod === 'import' ? (
              <button 
                className="btn-v2 btn-create-v2"
                onClick={handleImportCreation}
              >
                <FileUp size={20} />
                Upload & Tạo bài tập
              </button>
            ) : (
              <button 
                className="btn-v2 btn-create-v2"
                onClick={handleManualCreation}
              >
                <FileText size={20} />
                Tạo bài tập
              </button>
            )}
          </div>
        )}

        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
            duration={toast.duration}
          />
        )}
      </div>

      {/* AI Preview Modal */}
      {showAiPreview && aiGeneratedContent && (
        <div className="ai-preview-overlay" onClick={() => setShowAiPreview(false)}>
          <div className="ai-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-preview-header">
              <h2>
                <Bot size={24} />
                Xem trước bài tập do AI sinh
              </h2>
              <button className="btn-close-preview" onClick={() => setShowAiPreview(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="ai-preview-body">
              <div className="preview-info-box">
                <Sparkles size={20} />
                <p>AI đã phân tích nội dung và tạo bài tập tự động. Bạn có thể xem lại và chỉnh sửa trước khi xác nhận tạo.</p>
              </div>

              <div className="preview-section">
                <h3>📝 Thông tin cơ bản</h3>
                <div className="preview-field">
                  <label>Tiêu đề:</label>
                  <input
                    type="text"
                    className="input-v2"
                    value={aiGeneratedContent.title || title}
                    onChange={(e) => handleEditAIContent('title', e.target.value)}
                  />
                </div>
                <div className="preview-field">
                  <label>Loại:</label>
                  <span className="preview-badge">{testType}</span>
                </div>
                <div className="preview-field">
                  <label>Kỹ năng:</label>
                  <span className="preview-badge">{selectedSkill || 'All Skills'}</span>
                </div>
              </div>

              <div className="preview-section">
                <h3>📄 Nội dung bài tập</h3>
                <div className="preview-content">
                  {!aiGeneratedContent.content || Object.keys(aiGeneratedContent.content || {}).length === 0 ? (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#6b7280',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '2px dashed #e5e7eb'
                    }}>
                      <Bot size={48} color="#9ca3af" />
                      <p style={{marginTop: '12px', fontSize: '14px'}}>
                        Không có nội dung bài tập. Backend có thể chưa tạo content.
                      </p>
                      <pre style={{
                        textAlign: 'left',
                        fontSize: '12px',
                        background: '#fff',
                        padding: '12px',
                        borderRadius: '6px',
                        marginTop: '16px',
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(aiGeneratedContent, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="generated-content-preview">
                      {/* Display passage/audio/prompt based on skill type */}
                      {aiGeneratedContent.content.passage && (
                        <div className="content-block">
                          <h4>Đoạn văn:</h4>
                          <textarea
                            className="input-v2"
                            rows="6"
                            value={aiGeneratedContent.content.passage}
                            onChange={(e) => handleEditAIContent('content', {
                              ...aiGeneratedContent.content,
                              passage: e.target.value
                            })}
                          />
                        </div>
                      )}
                      
                      {aiGeneratedContent.content.questions && aiGeneratedContent.content.questions.length > 0 ? (
                        <div className="content-block">
                          <h4>Câu hỏi ({aiGeneratedContent.content.questions.length}):</h4>
                          <div className="questions-preview">
                            {aiGeneratedContent.content.questions.map((q, idx) => (
                              <div key={idx} className="question-preview-item">
                                <strong>Câu {idx + 1}:</strong> {q.question || q.text || 'Không có câu hỏi'}
                                {q.options && q.options.length > 0 && (
                                  <ul className="options-preview">
                                    {q.options.map((opt, i) => (
                                      <li key={i} className={i === q.correct_answer ? 'correct-option' : ''}>
                                        {opt} {i === q.correct_answer && '✓'}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          padding: '20px',
                          background: '#fef3c7',
                          borderRadius: '8px',
                          border: '1px solid #fbbf24',
                          color: '#92400e'
                        }}>
                          <strong>⚠️ Chưa có câu hỏi</strong>
                          <p style={{margin: '8px 0 0', fontSize: '14px'}}>
                            AI chưa sinh câu hỏi. Kiểm tra lại file tài liệu hoặc thử lại.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ai-preview-footer">
              <button 
                className="btn-v2 btn-cancel-v2"
                onClick={() => setShowAiPreview(false)}
              >
                Hủy
              </button>
              <button 
                className="btn-v2 btn-create-v2"
                onClick={handleConfirmAIGeneration}
              >
                <Award size={20} />
                Xác nhận và Tạo bài tập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
