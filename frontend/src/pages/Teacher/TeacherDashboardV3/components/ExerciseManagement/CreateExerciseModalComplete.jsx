import { useState, useRef, useEffect } from 'react';
import { 
  X, FileText, Clock, Award, Upload, FileAudio, File, 
  Plus, Trash2, Sparkles, Bot, Database, FileUp, Check
} from 'lucide-react';
import './ExerciseManagement.css';
import QuestionBankSelectorModal from './QuestionBankSelectorModal';
import { apiV1 } from '../../../../../services/api';
import examService from '../../../../../services/examService';
import Toast from '../../../../../components/Toast/Toast';
import useToast from '../../../../../hooks/useToast';

export default function CreateExerciseModalComplete({ onClose, onCreate }) {
  const { toast, showSuccess, showWarning, hideToast } = useToast();
  const [testType, setTestType] = useState('skill_exercise');
  const [selectedSkill, setSelectedSkill] = useState('listening');
  const [inputMethod, setInputMethod] = useState('manual'); // 'manual', 'ai', 'import'
  
  // Classes from API
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  
  // Listening fields
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  
  // Reading fields
  const [passageText, setPassageText] = useState('');
  const [readingInputMethod, setReadingInputMethod] = useState('text'); // 'text' or 'upload'
  
  // Speaking fields
  const [speakingPrompt, setSpeakingPrompt] = useState('');
  const [speakingInstructions, setSpeakingInstructions] = useState(['']);
  const [prepTime, setPrepTime] = useState(60);
  const [speakTime, setSpeakTime] = useState(180);
  
  // Writing fields
  const [writingPrompt, setWritingPrompt] = useState('');
  const [writingType, setWritingType] = useState('essay');
  const [writingInstructions, setWritingInstructions] = useState(['']);
  const [minWords, setMinWords] = useState(250);
  const [maxWords, setMaxWords] = useState(400);
  
  // Questions
  const [questions, setQuestions] = useState([]);
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  
  // Import states
  const [wordFile, setWordFile] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [isUploadingWord, setIsUploadingWord] = useState(false);
  const wordFileInputRef = useRef(null);
  const importFileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const passageFileInputRef = useRef(null);
  
  // AI Generation states
  const [aiSource, setAiSource] = useState('curriculum'); // 'curriculum', 'files', 'question_bank'
  const [aiFiles, setAiFiles] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [qbNumQuestions, setQbNumQuestions] = useState(20);
  const [qbDifficulty, setQbDifficulty] = useState('mixed');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiFormData, setAiFormData] = useState({ semester: '1' });
  const aiFilesInputRef = useRef(null);
  
  // Logic helpers
  const requiresSkill = testType === 'skill_exercise' || testType === 'test_15min';
  const isMidtermOrFinal = testType === 'midterm' || testType === 'final';
  
  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await apiV1.get('/classes/teaching');
        setClasses(response.data);
        if (response.data.length > 0 && !classId) {
          setClassId(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoadingClasses(false);
      }
    };
    
    fetchClasses();
  }, []);
  
  // Auto-switch to AI mode when selecting midterm/final
  useEffect(() => {
    if (testType === 'midterm' || testType === 'final') {
      setInputMethod('ai');
    }
  }, [testType]);
  
  // Question handlers
  const addQuestion = () => {
    setQuestions([...questions, {
      id: Date.now(),
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 2
    }]);
  };
  
  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };
  
  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };
  
  const updateQuestionOption = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };
  
  const handleQuestionsFromBank = (selectedQuestions) => {
    setQuestions([...questions, ...selectedQuestions]);
    setShowQuestionBankModal(false);
  };
  
  // Instructions handlers
  const addSpeakingInstruction = () => {
    setSpeakingInstructions([...speakingInstructions, '']);
  };
  
  const updateSpeakingInstruction = (index, value) => {
    const updated = [...speakingInstructions];
    updated[index] = value;
    setSpeakingInstructions(updated);
  };
  
  const removeSpeakingInstruction = (index) => {
    setSpeakingInstructions(speakingInstructions.filter((_, i) => i !== index));
  };
  
  const addWritingInstruction = () => {
    setWritingInstructions([...writingInstructions, '']);
  };
  
  const updateWritingInstruction = (index, value) => {
    const updated = [...writingInstructions];
    updated[index] = value;
    setWritingInstructions(updated);
  };
  
  const removeWritingInstruction = (index) => {
    setWritingInstructions(writingInstructions.filter((_, i) => i !== index));
  };
  
  // Audio file upload handler
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        showWarning('File audio quá lớn! Tối đa 50MB.');
        return;
      }
      setAudioFile(file);
      // Optionally upload to server immediately or wait until form submit
    }
  };
  
  // AI file handlers
  const handleAiFilesUpload = (e) => {
    const files = Array.from(e.target.files);
    setAiFiles([...aiFiles, ...files]);
  };
  
  const removeAiFile = (index) => {
    setAiFiles(aiFiles.filter((_, i) => i !== index));
  };
  
  // Word file upload handler
  const handleWordFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWordFile(file);
    }
  };
  
  // Import file upload handler  
  const handleImportFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };
  
  // Word import submit handler
  const handleWordImportSubmit = async () => {
    if (!wordFile || !classId || !title) {
      showWarning('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    
    setIsUploadingWord(true);
    try {
      const formData = new FormData();
      formData.append('file', wordFile);
      formData.append('title', title);
      formData.append('class_id', classId);
      formData.append('due_date', dueDate);
      formData.append('test_type', testType);
      
      // Call API to upload and process Word file
      // const response = await examService.uploadWordExam(formData);
      showSuccess('Đang xử lý file Word... (3-5 phút)');
      
      // Close modal after successful upload
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error uploading Word file:', error);
      showWarning('Lỗi khi upload file Word!');
    } finally {
      setIsUploadingWord(false);
    }
  };
  
  // AI Generate function
  const handleGenerateWithAI = async () => {
    if (!classId) {
      showWarning('Vui lòng chọn lớp học!');
      return;
    }
    
    setIsGeneratingAI(true);
    
    try {
      // Get class info to determine grade and semester
      const classInfo = classes.find(c => c.id === parseInt(classId));
      const grade = classInfo?.grade || classInfo?.name?.match(/\d+/)?.[0] || '10';
      const semester = aiFormData.semester || '1';
      
      // Prepare API payload with new parameters
      const questionsCount = aiFormData.questionsPerSkill && aiFormData.questionsPerSkill !== '' 
        ? parseInt(aiFormData.questionsPerSkill) 
        : 10;
      
      const payload = {
        exam_type: testType === 'midterm' ? 'midterm' : 'final',
        grade: grade,
        semester: semester,
        // New parameters
        difficulty: aiFormData.difficulty || 'mixed',
        questions_per_skill: isNaN(questionsCount) ? 10 : questionsCount,
        additional_notes: aiFormData.additionalNotes || ''
      };
      
      console.log('[AI Generate] Payload:', payload);
      
      // Call AI generate API
      const response = await examService.generateFullExam(payload);
      
      console.log('[AI Generate] Full Response:', JSON.stringify(response, null, 2));
      console.log('[AI Generate] Listening:', response?.listening);
      console.log('[AI Generate] Reading:', response?.reading);
      console.log('[AI Generate] Writing:', response?.writing);
      console.log('[AI Generate] Speaking:', response?.speaking);
      
      // Populate form with AI generated data
      // LISTENING Section
      if (response && response.listening) {
        const listeningData = response.listening;
        console.log('[AI Generate] Setting Listening data:', listeningData);
        
        // Set script/transcript
        setTranscript(listeningData.script || listeningData.transcript || '');
        
        // Set audio URL if available
        if (listeningData.audio_url) {
          setAudioUrl(listeningData.audio_url);
          console.log('[AI Generate] Audio URL set:', listeningData.audio_url);
        }
        
        // Show transcript by default for teacher preview
        setShowTranscript(true);
      }
      
      // READING Section
      if (response && response.reading) {
        setPassageText(response.reading.passage || '');
        console.log('[AI Generate] Setting Reading passage');
      }
      
      // WRITING Section
      if (response && response.writing) {
        setWritingPrompt(response.writing.prompt || '');
        if (response.writing.instructions && Array.isArray(response.writing.instructions)) {
          setWritingInstructions(response.writing.instructions);
        }
        if (response.writing.min_words) setMinWords(response.writing.min_words);
        if (response.writing.max_words) setMaxWords(response.writing.max_words);
        console.log('[AI Generate] Setting Writing data');
      }
      
      // SPEAKING Section
      if (response && response.speaking) {
        console.log('[AI Generate] Speaking section received:', response.speaking);
        // Try to get prompt from various possible fields
        const speakingPrompt = response.speaking.prompt || response.speaking.topic || '';
        console.log('[AI Generate] Extracted speakingPrompt:', speakingPrompt);
        setSpeakingPrompt(speakingPrompt);
        
        if (response.speaking.instructions && Array.isArray(response.speaking.instructions)) {
          console.log('[AI Generate] Setting speaking instructions:', response.speaking.instructions);
          setSpeakingInstructions(response.speaking.instructions);
        } else if (response.speaking.questions && response.speaking.questions.length > 0) {
          // Fallback: use questions as instructions if no instructions provided
          const speakingQ = response.speaking.questions.map(q => q.question || q.text || '').filter(q => q);
          if (speakingQ.length > 0) {
            console.log('[AI Generate] Using questions as instructions:', speakingQ);
            setSpeakingInstructions(speakingQ);
          }
        }
        
        if (response.speaking.prep_time) setPrepTime(response.speaking.prep_time);
        if (response.speaking.speak_time) setSpeakTime(response.speaking.speak_time);
        
        console.log('[AI Generate] Speaking data set successfully');
      }
      
      // Collect all questions from sections
      const allQuestions = [];
      
      if (response.listening && response.listening.questions) {
        // Tag questions with section for later filtering
        const listeningQuestions = response.listening.questions.map(q => ({
          ...q,
          section: 'listening',
          skill: 'listening'
        }));
        allQuestions.push(...listeningQuestions);
        console.log(`[AI Generate] Added ${listeningQuestions.length} listening questions`);
      }
      
      if (response.reading && response.reading.questions) {
        // Tag questions with section for later filtering
        const readingQuestions = response.reading.questions.map(q => ({
          ...q,
          section: 'reading',
          skill: 'reading'
        }));
        allQuestions.push(...readingQuestions);
        console.log(`[AI Generate] Added ${readingQuestions.length} reading questions`);
      }
      
      setQuestions(allQuestions);
      console.log(`[AI Generate] Total questions set: ${allQuestions.length}`);
      
      // Switch to manual mode to show preview
      setInputMethod('manual');
      console.log('[AI Generate] Switched to manual mode for preview');
      
      showSuccess('✨ AI đã sinh đề thành công! Vui lòng kiểm tra và chỉnh sửa nếu cần.');
      
    } catch (error) {
      console.error('[AI Generate] Error:', error);
      showWarning('Lỗi khi sinh đề với AI: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsGeneratingAI(false);
    }
  };
  
  const handleSubmit = () => {
    if (!title) {
      showWarning('Vui lòng nhập tiêu đề!');
      return;
    }
    
    // Build exercise object for backend
    const exercise = {
      title,
      type: testType,
      skill: requiresSkill ? selectedSkill : null,
      classId: classId,
      dueDate: dueDate,
      maxScore: maxScore,
      description: '',
      content: {},
    };
    
    // Add content based on skill type
    if (isMidtermOrFinal) {
        // Mid-term/Final: Comprehensive test with all sections
        exercise.content = {
          type: 'comprehensive_test'
        };
        
        // Add listening section if has transcript/audio
        if (transcript || audioUrl) {
          exercise.content.listening = {
            script: transcript,
            audio_url: audioUrl,
            questions: questions.filter(q => q.section === 'listening' || q.skill === 'listening')
          };
        }
        
        // Add reading section if has passage
        if (passageText) {
          exercise.content.reading = {
            passage: passageText,
            word_count: passageText.split(/\s+/).filter(w => w).length,
            questions: questions.filter(q => q.section === 'reading' || q.skill === 'reading')
          };
        }
        
        // Add writing section if has prompt
        if (writingPrompt) {
          exercise.content.writing = {
            prompt: writingPrompt,
            type: writingType,
            instructions: writingInstructions.filter(i => i),
            word_limit: { min: minWords, max: maxWords }
          };
        }
        
        // Add speaking section if has prompt
        if (speakingPrompt) {
          exercise.content.speaking = {
            prompt: speakingPrompt,
            instructions: speakingInstructions.filter(i => i),
            preparation_time: prepTime,
            time_limit: speakTime
          };
        }
        
        // If no sections, at least include all questions
        if (!exercise.content.listening && !exercise.content.reading && !exercise.content.writing && !exercise.content.speaking) {
          exercise.content.questions = questions;
        }
      } else {
        // Skill-based
        if (selectedSkill === 'listening') {
          exercise.content = {
            audio_url: audioUrl,
            transcript,
            show_transcript: showTranscript,
            questions
          };
        } else if (selectedSkill === 'speaking') {
          exercise.content = {
            prompt: speakingPrompt,
            instructions: speakingInstructions.filter(i => i),
            preparation_time: prepTime,
            time_limit: speakTime
          };
        } else if (selectedSkill === 'reading') {
          exercise.content = {
            passage: passageText,
            word_count: passageText.split(/\s+/).filter(w => w).length,
            questions
          };
        } else if (selectedSkill === 'writing') {
          exercise.content = {
            prompt: writingPrompt,
            type: writingType,
            instructions: writingInstructions.filter(i => i),
            word_limit: { min: minWords, max: maxWords }
          };
        }
      }
    
    onCreate(exercise);
  };
  
  return (
    <div className="exercise-modal-overlay" onClick={onClose}>
      <div className="exercise-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-ex">
          <h2>Tạo Bài tập / Kiểm tra Mới</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body-ex">
          {/* Test Type Selection */}
          <div className="form-section-ex">
            <label className="form-label-ex">Loại bài tập / kiểm tra</label>
            <div className="test-type-grid">
              <button 
                className={`test-type-card ${testType === 'skill_exercise' ? 'active' : ''}`}
                onClick={() => setTestType('skill_exercise')}
              >
                <FileText size={24} />
                <span className="type-title">Bài tập Kỹ năng</span>
                <span className="type-desc">Luyện 1 kỹ năng cụ thể</span>
              </button>
              
              <button 
                className={`test-type-card ${testType === 'test_15min' ? 'active' : ''}`}
                onClick={() => setTestType('test_15min')}
              >
                <Clock size={24} />
                <span className="type-title">Kiểm tra 15 phút</span>
                <span className="type-desc">Test ngắn 1 kỹ năng</span>
              </button>
              
              <button 
                className={`test-type-card ${testType === 'midterm' ? 'active' : ''}`}
                onClick={() => setTestType('midterm')}
              >
                <FileText size={24} />
                <span className="type-title">Kiểm tra Giữa kì</span>
                <span className="type-desc">Tổng hợp nhiều kỹ năng</span>
              </button>
              
              <button 
                className={`test-type-card ${testType === 'final' ? 'active' : ''}`}
                onClick={() => setTestType('final')}
              >
                <Award size={24} />
                <span className="type-title">Kiểm tra Cuối kì</span>
                <span className="type-desc">Tổng hợp toàn bộ</span>
              </button>
            </div>
          </div>
          
          {/* Skill Selection (only for skill_exercise and test_15min) */}
          {requiresSkill && (
            <div className="form-section-ex">
              <label className="form-label-ex">Kỹ năng đánh giá</label>
              <div className="skill-selector-ex">
                <label className="skill-option-ex">
                  <input 
                    type="radio" 
                    name="skill" 
                    value="listening" 
                    checked={selectedSkill === 'listening'}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                  />
                  <span>🎧 Nghe</span>
                </label>
                <label className="skill-option-ex">
                  <input 
                    type="radio" 
                    name="skill" 
                    value="speaking"
                    checked={selectedSkill === 'speaking'}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                  />
                  <span>🗣️ Nói</span>
                </label>
                <label className="skill-option-ex">
                  <input 
                    type="radio" 
                    name="skill" 
                    value="reading"
                    checked={selectedSkill === 'reading'}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                  />
                  <span>📖 Đọc</span>
                </label>
                <label className="skill-option-ex">
                  <input 
                    type="radio" 
                    name="skill" 
                    value="writing"
                    checked={selectedSkill === 'writing'}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                  />
                  <span>✍️ Viết</span>
                </label>
              </div>
            </div>
          )}
          
          {/* Basic Info */}
          <div className="form-section-ex">
            <label className="form-label-ex">Tiêu đề *</label>
            <input 
              type="text" 
              className="form-input-ex" 
              placeholder="Ví dụ: Bài tập Nghe - Unit 5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
              
              <div className="form-row-ex">
                <div className="form-section-ex">
                  <label className="form-label-ex">Lớp học</label>
                  <select className="form-select-ex" value={classId} onChange={(e) => setClassId(e.target.value)}>
                    <option value="">Chọn lớp</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-section-ex">
                  <label className="form-label-ex">Hạn nộp</label>
                  <input 
                    type="datetime-local" 
                    className="form-input-ex"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="form-section-ex">
                  <label className="form-label-ex">Điểm tối đa</label>
                  <input 
                    type="number" 
                    className="form-input-ex" 
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                  />
                </div>
              </div>
              
              {/* Conditional content based on test type */}
              {isMidtermOrFinal ? (
                renderMidtermFinalForm()
              ) : (
                <>
                  {selectedSkill === 'listening' && renderListeningForm()}
                  {selectedSkill === 'speaking' && renderSpeakingForm()}
                  {selectedSkill === 'reading' && renderReadingForm()}
                  {selectedSkill === 'writing' && renderWritingForm()}
                </>
              )}
        </div>
        
        <div className="modal-footer-ex">
          <button className="btn-cancel-ex" onClick={onClose}>Hủy</button>
          <button className="btn-create-ex" onClick={handleSubmit}>
            <Plus size={18} />
            Tạo bài tập
          </button>
        </div>
      </div>
      
      {/* Question Bank Selector Modal */}
      {showQuestionBankModal && (
        <QuestionBankSelectorModal
          skillType={selectedSkill}
          onClose={() => setShowQuestionBankModal(false)}
          onSelect={handleQuestionsFromBank}
        />
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
  );
  
  // RENDER FUNCTIONS CONTINUED IN NEXT PART...
  
  // Mid-term/Final Form
  function renderMidtermFinalForm() {
    return (
      <div className="midterm-final-form">
        <h4 className="section-title">� Câu hỏi kiểm tra</h4>
        <p className="section-desc">Thêm các câu hỏi cho đề {testType === 'midterm' ? 'giữa kỳ' : 'cuối kỳ'}</p>
        
        {/* Input Method Selection */}
        <div className="form-section-ex">
          <div className="input-method-selector">
            <label className="method-option">
              <input 
                type="radio" 
                name="inputMethod" 
                value="manual" 
                checked={inputMethod === 'manual'}
                onChange={() => setInputMethod('manual')}
              />
              <span>✍️ Tạo thủ công</span>
            </label>
            <label className="method-option">
              <input 
                type="radio" 
                name="inputMethod" 
                value="ai" 
                checked={inputMethod === 'ai'}
                onChange={() => setInputMethod('ai')}
              />
              <span>🤖 AI Sinh đề</span>
            </label>
            <label className="method-option">
              <input 
                type="radio" 
                name="inputMethod" 
                value="import" 
                checked={inputMethod === 'import'}
                onChange={() => setInputMethod('import')}
              />
              <span>📄 Import từ File</span>
            </label>
          </div>
        </div>
        
        {/* Render based on selected method */}
        {inputMethod === 'manual' && (
          <>
            <p className="section-desc">Tạo đề thi toàn diện với 4 kỹ năng</p>
            
            {/* Listening Section */}
            <div className="comprehensive-section">
              <h5 className="section-subtitle">🎧 Phần Nghe (Listening)</h5>
              {renderListeningForm()}
            </div>
            
            {/* Reading Section */}
            <div className="comprehensive-section">
              <h5 className="section-subtitle">📖 Phần Đọc (Reading)</h5>
              {renderReadingForm()}
            </div>
            
            {/* Writing Section */}
            <div className="comprehensive-section">
              <h5 className="section-subtitle">✍️ Phần Viết (Writing)</h5>
              {renderWritingForm()}
            </div>
            
            {/* Speaking Section */}
            <div className="comprehensive-section">
              <h5 className="section-subtitle">🗣️ Phần Nói (Speaking)</h5>
              {renderSpeakingForm()}
            </div>
            
            <div className="info-box-note">
              <span className="info-icon">💡</span>
              <p>Đề thi toàn diện bao gồm cả 4 kỹ năng. Mỗi phần có câu hỏi riêng.</p>
            </div>
          </>
        )}
        {inputMethod === 'ai' && renderAIForm()}
        {inputMethod === 'import' && renderImportForm()}
      </div>
    );
  }
  
  // Listening Form
  function renderListeningForm() {
    return (
      <div className="listening-form-content">
        <h4 className="section-title">🎧 Nội dung bài Nghe</h4>
        
        {/* Audio Upload or AI Generated Audio */}
        <div className="form-section-ex">
          <label className="form-label-ex">File Audio * (.mp3, .wav, .ogg)</label>
          
          {/* Show AI generated audio - ONLY show green box when AI audio exists */}
          {audioUrl ? (
            <div className="audio-preview-container">
              <div className="audio-info-box">
                <FileAudio size={28} className="audio-icon-success" />
                <div className="audio-info-text">
                  <span className="audio-label">🤖 Audio được tạo bởi AI</span>
                  <span className="audio-url">{audioUrl}</span>
                </div>
                <button 
                  onClick={() => { 
                    setAudioUrl(''); 
                    setAudioFile(null);
                    // Clear the file input
                    if (audioInputRef.current) {
                      audioInputRef.current.value = '';
                    }
                  }}
                  className="btn-remove-file"
                  type="button"
                  title="Xóa audio AI"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <audio controls src={audioUrl} className="audio-player-full" style={{ width: '100%', marginTop: '12px' }} />
            </div>
          ) : (
            /* Upload zone - only show when NO AI audio */
            <div 
              className="file-upload-zone" 
              onClick={() => audioInputRef.current?.click()}
            >
              <input 
                ref={audioInputRef}
                type="file" 
                accept="audio/*"
                onChange={handleAudioUpload}
                style={{ display: 'none' }}
              />
              {!audioFile ? (
                <>
                  <FileAudio size={40} className="upload-icon" />
                  <p>Click để chọn file audio</p>
                  <span className="upload-hint">Tối đa 50MB</span>
                </>
              ) : (
                <div className="file-preview-box">
                  <FileAudio size={28} />
                  <div className="file-info">
                    <span className="file-name">{audioFile.name}</span>
                    <span className="file-size">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <audio controls src={URL.createObjectURL(audioFile)} className="audio-preview" />
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setAudioFile(null); 
                      setAudioUrl('');
                      if (audioInputRef.current) {
                        audioInputRef.current.value = '';
                      }
                    }}
                    className="btn-remove-file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Transcript */}
        <div className="form-section-ex">
          <label className="form-label-ex">Transcript (Bản ghi âm)</label>
          <textarea 
            className="form-textarea-ex"
            rows="6"
            placeholder="Nhập transcript của audio..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
          <label className="checkbox-label-ex">
            <input 
              type="checkbox"
              checked={showTranscript}
              onChange={(e) => setShowTranscript(e.target.checked)}
            />
            <span>Hiển thị transcript cho học sinh</span>
          </label>
        </div>
        
        {/* Questions */}
        {renderQuestions()}
      </div>
    );
  }
  
  // Speaking Form
  function renderSpeakingForm() {
    return (
      <div className="speaking-form-content">
        <h4 className="section-title">🗣️ Nội dung bài Nói</h4>
        
        {/* Prompt */}
        <div className="form-section-ex">
          <label className="form-label-ex">Đề bài *</label>
          <textarea 
            className="form-textarea-ex"
            rows="4"
            placeholder="Ví dụ: Describe your favorite book and explain why you like it."
            value={speakingPrompt}
            onChange={(e) => setSpeakingPrompt(e.target.value)}
          />
        </div>
        
        {/* Instructions */}
        <div className="form-section-ex">
          <label className="form-label-ex">Hướng dẫn chi tiết</label>
          {speakingInstructions.map((inst, idx) => (
            <div key={idx} className="instruction-row">
              <input 
                type="text"
                className="form-input-ex"
                placeholder={`Hướng dẫn ${idx + 1}`}
                value={inst}
                onChange={(e) => updateSpeakingInstruction(idx, e.target.value)}
              />
              {speakingInstructions.length > 1 && (
                <button 
                  onClick={() => removeSpeakingInstruction(idx)}
                  className="btn-remove-item"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addSpeakingInstruction} className="btn-add-item">
            <Plus size={16} />
            Thêm hướng dẫn
          </button>
        </div>
        
        {/* Time Settings */}
        <div className="form-row-ex">
          <div className="form-section-ex">
            <label className="form-label-ex">Thời gian chuẩn bị (giây)</label>
            <input 
              type="number" 
              className="form-input-ex"
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
            />
          </div>
          <div className="form-section-ex">
            <label className="form-label-ex">Thời gian nói (giây)</label>
            <input 
              type="number" 
              className="form-input-ex"
              value={speakTime}
              onChange={(e) => setSpeakTime(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Reading Form
  function renderReadingForm() {
    return (
      <div className="reading-form-content">
        <h4 className="section-title">📖 Nội dung bài Đọc</h4>
        
        {/* Input Method Tabs */}
        <div className="input-method-tabs">
          <button 
            className={`method-tab ${readingInputMethod === 'text' ? 'active' : ''}`}
            onClick={() => setReadingInputMethod('text')}
          >
            <FileText size={18} />
            Nhập văn bản
          </button>
          <button 
            className={`method-tab ${readingInputMethod === 'upload' ? 'active' : ''}`}
            onClick={() => setReadingInputMethod('upload')}
          >
            <Upload size={18} />
            Upload file
          </button>
        </div>
        
        {/* Text Input */}
        {readingInputMethod === 'text' && (
          <div className="form-section-ex">
            <label className="form-label-ex">Đoạn văn *</label>
            <textarea 
              className="form-textarea-ex"
              rows="15"
              placeholder="Nhập hoặc paste đoạn văn..."
              value={passageText}
              onChange={(e) => setPassageText(e.target.value)}
            />
            <div className="text-stats">
              <span>📊 {passageText.split(/\s+/).filter(w => w).length} từ</span>
              <span>📄 {passageText.length} ký tự</span>
            </div>
          </div>
        )}
        
        {/* File Upload */}
        {readingInputMethod === 'upload' && (
          <div className="form-section-ex">
            <label className="form-label-ex">Upload file (.pdf, .docx, .txt)</label>
            <div className="file-upload-zone" onClick={() => passageFileInputRef.current?.click()}>
              <input 
                ref={passageFileInputRef}
                type="file" 
                accept=".pdf,.doc,.docx,.txt"
                onChange={handlePassageFileUpload}
                style={{ display: 'none' }}
              />
              {!passageFile ? (
                <>
                  <File size={40} className="upload-icon" />
                  <p>Click để chọn file</p>
                  <span className="upload-hint">PDF, Word, hoặc Text - Tối đa 10MB</span>
                </>
              ) : (
                <div className="file-preview-box">
                  <File size={28} />
                  <div className="file-info">
                    <span className="file-name">{passageFile.name}</span>
                    <span className="file-size">{(passageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPassageFile(null); }}
                    className="btn-remove-file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Questions */}
        {renderQuestions()}
      </div>
    );
  }
  
  // Writing Form
  function renderWritingForm() {
    return (
      <div className="writing-form-content">
        <h4 className="section-title">✍️ Nội dung bài Viết</h4>
        
        {/* Prompt */}
        <div className="form-section-ex">
          <label className="form-label-ex">Đề bài *</label>
          <textarea 
            className="form-textarea-ex"
            rows="4"
            placeholder="Ví dụ: Write an essay about the importance of learning English..."
            value={writingPrompt}
            onChange={(e) => setWritingPrompt(e.target.value)}
          />
        </div>
        
        {/* Type */}
        <div className="form-section-ex">
          <label className="form-label-ex">Loại bài viết</label>
          <select 
            className="form-select-ex"
            value={writingType}
            onChange={(e) => setWritingType(e.target.value)}
          >
            <option value="essay">Essay (Tiểu luận)</option>
            <option value="letter">Letter (Thư)</option>
            <option value="email">Email</option>
            <option value="report">Report (Báo cáo)</option>
            <option value="story">Story (Truyện ngắn)</option>
            <option value="review">Review (Bài nhận xét)</option>
          </select>
        </div>
        
        {/* Word Limit */}
        <div className="form-row-ex">
          <div className="form-section-ex">
            <label className="form-label-ex">Số từ tối thiểu *</label>
            <input 
              type="number" 
              className="form-input-ex"
              value={minWords}
              onChange={(e) => setMinWords(Number(e.target.value))}
              min="50"
            />
          </div>
          <div className="form-section-ex">
            <label className="form-label-ex">Số từ tối đa *</label>
            <input 
              type="number" 
              className="form-input-ex"
              value={maxWords}
              onChange={(e) => setMaxWords(Number(e.target.value))}
              min="100"
            />
          </div>
        </div>
        
        {/* Instructions */}
        <div className="form-section-ex">
          <label className="form-label-ex">Yêu cầu chi tiết</label>
          {writingInstructions.map((inst, idx) => (
            <div key={idx} className="instruction-row">
              <input 
                type="text"
                className="form-input-ex"
                placeholder={`Yêu cầu ${idx + 1}`}
                value={inst}
                onChange={(e) => updateWritingInstruction(idx, e.target.value)}
              />
              {writingInstructions.length > 1 && (
                <button 
                  onClick={() => removeWritingInstruction(idx)}
                  className="btn-remove-item"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addWritingInstruction} className="btn-add-item">
            <Plus size={16} />
            Thêm yêu cầu
          </button>
        </div>
      </div>
    );
  }
  
  // Import Form
  function renderImportForm() {
    // Word Import Special Case
    if (testType === 'midterm' || testType === 'final') {
      return (
        <div className="import-form-content word-import-special">
          <div className="word-import-header">
            <div className="import-icon-wrapper">
              <FileText size={32} className="gradient-icon" />
            </div>
            <div>
              <h3 className="import-title">📄 Import Đề Thi Từ File Word</h3>
              <p className="import-subtitle">AI sẽ tự động phân tích và tạo đề thi tương tác</p>
            </div>
          </div>
          
          <div className="form-section-ex">
            <label className="form-label-ex">Tiêu đề bài tập <span className="required">*</span></label>
            <input
              type="text"
              className="form-input-ex"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiểm tra Giữa kỳ 1 - Tiếng Anh 5"
              required
            />
          </div>

          <div className="form-section-ex">
            <label className="form-label-ex">Lớp học <span className="required">*</span></label>
            <select className="form-select-ex" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">-- Chọn lớp học --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.grade && `(Khối ${cls.grade})`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-section-ex">
            <label className="form-label-ex">Upload file Word <span className="required">*</span></label>
            <div 
              className={`file-upload-zone-word ${wordFile ? 'has-file' : ''}`}
              onClick={() => wordFileInputRef.current?.click()}
            >
              <input 
                ref={wordFileInputRef}
                type="file"
                accept=".doc,.docx"
                onChange={handleWordFileUpload}
                style={{ display: 'none' }}
              />
              {!wordFile ? (
                <div className="word-upload-placeholder">
                  <FileUp size={56} className="upload-icon-word" />
                  <h4>Kéo thả file Word vào đây</h4>
                  <p>hoặc click để chọn file</p>
                  <span className="upload-hint-word">Hỗ trợ: .docx và .doc (Word 97-2003)</span>
                  <span className="upload-hint-word" style={{ color: '#10b981', fontSize: '11px' }}>✅ Cả 2 định dạng đều được hỗ trợ</span>
                </div>
              ) : (
                <div className="word-file-preview">
                  <FileText size={40} className="file-icon-word" />
                  <div className="word-file-info">
                    <span className="word-file-name">{wordFile.name}</span>
                    <span className="word-file-size">
                      {(wordFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setWordFile(null); 
                      setWordUploadError(null);
                    }}
                    className="btn-remove-word-file"
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
            {wordUploadError && (
              <div className="word-error-message">
                <span className="error-icon">⚠️</span>
                {wordUploadError}
              </div>
            )}
          </div>
          
          <div className="info-box-word">
            <span className="info-icon-word">💡</span>
            <div className="info-content-word">
              <p><strong>Hướng dẫn:</strong></p>
              <ul>
                <li>File Word cần có cấu trúc rõ ràng với các phần: Listening, Reading, Writing, Speaking</li>
                <li>AI sẽ tự động trích xuất hình ảnh và phân tích câu hỏi</li>
                <li>Đề thi sẽ được tạo thành dạng tương tác cho học sinh làm trên web</li>
                <li>Bạn có thể chỉnh sửa sau khi import</li>
                <li><strong>⏱️ Lưu ý:</strong> Quá trình xử lý bằng AI mất 3-5 phút (file lớn có thể lâu hơn), vui lòng chờ đợi</li>
              </ul>
            </div>
          </div>
          
          <div className="word-import-actions">
            <button 
              className="btn-cancel-word" 
              onClick={onClose}
              type="button"
              disabled={isUploadingWord}
            >
              Hủy
            </button>
            <button 
              className="btn-import-word" 
              onClick={handleWordImportSubmit}
              type="button"
              disabled={!wordFile || !classId || isUploadingWord}
            >
              {isUploadingWord ? (
                <>
                  <div className="spinner-small" />
                  Đang xử lý bằng AI (3-5 phút)...
                </>
              ) : (
                <>
                  <FileUp size={18} />
                  Import & Tạo Đề Thi
                </>
              )}
            </button>
          </div>
        </div>
      );
    }
    
    // Normal Import for other types
    return (
      <div className="import-form-content">
        
        <div className="form-section-ex">
          <label className="form-label-ex">Tiêu đề *</label>
          <input 
            type="text" 
            className="form-input-ex" 
            placeholder="Nhập tiêu đề bài tập"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="form-row-ex">
          <div className="form-section-ex">
            <label className="form-label-ex">Lớp học</label>
            <select className="form-select-ex" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Chọn lớp</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="form-section-ex">
            <label className="form-label-ex">Hạn nộp</label>
            <input 
              type="datetime-local" 
              className="form-input-ex"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="form-section-ex">
          <label className="form-label-ex">Upload file *</label>
          <div className="file-upload-zone-large" onClick={() => importFileInputRef.current?.click()}>
            <input 
              ref={importFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xlsx"
              onChange={handleImportFileUpload}
              style={{ display: 'none' }}
            />
            {!importFile ? (
              <>
                <FileUp size={64} className="upload-icon" />
                <h4>Kéo thả file vào đây hoặc click để chọn</h4>
                <p>Hỗ trợ: Word (.docx), PDF, Excel (.xlsx)</p>
                <span className="upload-hint">Tối đa 20MB</span>
              </>
            ) : (
              <div className="file-preview-box-large">
                <File size={48} />
                <div className="file-info-large">
                  <span className="file-name-large">{importFile.name}</span>
                  <span className="file-size-large">{(importFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span className="file-type-large">{importFile.type}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
                  className="btn-remove-file-large"
                >
                  <Trash2 size={20} />
                  Xóa file
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="info-box-note">
          <span className="info-icon">💡</span>
          <div>
            <p><strong>Lưu ý:</strong></p>
            <ul>
              <li>File nên có cấu trúc rõ ràng với câu hỏi và đáp án</li>
              <li>Hệ thống sẽ tự động phân tích và tạo bài tập</li>
              <li>Bạn có thể chỉnh sửa sau khi import</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  // AI Form
  function renderAIForm() {
    // Get grade and semester from selected class
    const selectedClass = classes.find(c => c.id === parseInt(classId));
    const grade = selectedClass?.grade || selectedClass?.name?.match(/\d+/)?.[0] || '10';
    
    return (
      <div className="ai-form-content">
        <div className="ai-form-header">
          <div className="ai-header-icon">
            <Bot size={32} />
          </div>
          <div className="ai-header-text">
            <h4>Tạo đề thi bằng AI thông minh</h4>
            <p>AI sẽ tự động tạo đề thi toàn diện với 4 kỹ năng theo chương trình học</p>
          </div>
        </div>
        
        {/* Basic Information */}
        <div className="form-section-ex">
          <label className="form-label-ex">Tiêu đề đề thi *</label>
          <input 
            type="text" 
            className="form-input-ex" 
            placeholder="Ví dụ: Đề kiểm tra giữa kỳ I - Khối 10"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        {/* Class, Grade, Semester Row */}
        <div className="form-row-ex">
          <div className="form-section-ex">
            <label className="form-label-ex">Lớp học <span className="required">*</span></label>
            <select 
              className="form-select-ex" 
              value={classId} 
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.grade && `(Khối ${cls.grade})`}
                </option>
              ))}
            </select>
          </div>
          <div className="form-section-ex">
            <label className="form-label-ex">Khối lớp</label>
            <input 
              type="text" 
              className="form-input-ex"
              value={grade}
              disabled
              style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
            />
          </div>
          <div className="form-section-ex">
            <label className="form-label-ex">Học kỳ</label>
            <select 
              className="form-select-ex"
              value={aiFormData.semester || '1'}
              onChange={(e) => setAiFormData({ ...aiFormData, semester: e.target.value })}
            >
              <option value="1">Học kỳ I</option>
              <option value="2">Học kỳ II</option>
            </select>
          </div>
        </div>
        
        {/* Due Date and Score */}
        <div className="form-row-ex">
          <div className="form-section-ex">
            <label className="form-label-ex">Hạn nộp</label>
            <input 
              type="datetime-local" 
              className="form-input-ex"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="form-section-ex">
            <label className="form-label-ex">Điểm tối đa</label>
            <input 
              type="number" 
              className="form-input-ex"
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              min="1"
              max="10"
            />
          </div>
        </div>
        
        {/* AI Source Selection */}
        <div className="form-section-ex">
          <label className="form-label-ex">Nguồn tạo đề</label>
          <div className="ai-source-selection">
            <label className={`ai-source-card ${aiSource === 'curriculum' ? 'active' : ''}`}>
              <input 
                type="radio"
                name="ai-source"
                value="curriculum"
                checked={aiSource === 'curriculum'}
                onChange={(e) => setAiSource(e.target.value)}
              />
              <div className="source-icon">
                <Sparkles size={28} />
              </div>
              <div className="source-content">
                <h4>Chương trình học</h4>
                <p>Theo SGK Tiếng Anh 2018</p>
              </div>
            </label>
            
            <label className={`ai-source-card ${aiSource === 'files' ? 'active' : ''}`}>
              <input 
                type="radio"
                name="ai-source"
                value="files"
                checked={aiSource === 'files'}
                onChange={(e) => setAiSource(e.target.value)}
              />
              <div className="source-icon">
                <FileUp size={28} />
              </div>
              <div className="source-content">
                <h4>Upload Files</h4>
                <p>AI phân tích từ file của bạn</p>
              </div>
            </label>
            
            <label className={`ai-source-card ${aiSource === 'question_bank' ? 'active' : ''}`}>
              <input 
                type="radio"
                name="ai-source"
                value="question_bank"
                checked={aiSource === 'question_bank'}
                onChange={(e) => setAiSource(e.target.value)}
              />
              <div className="source-icon">
                <Database size={28} />
              </div>
              <div className="source-content">
                <h4>Ngân hàng câu hỏi</h4>
                <p>Từ câu hỏi có sẵn</p>
              </div>
            </label>
          </div>
        </div>
        
        {/* AI from Curriculum */}
        {aiSource === 'curriculum' && (
          <div className="ai-curriculum-section">
            <div className="info-box-highlight">
              <div className="highlight-icon">
                <Sparkles size={24} />
              </div>
              <div className="highlight-content">
                <h5>Tự động sinh đề theo chương trình</h5>
                <p>AI sẽ tạo đề thi toàn diện với 4 kỹ năng dựa trên chương trình Tiếng Anh 2018 cho khối {selectedClass?.grade || selectedClass?.name?.match(/\d+/)?.[0] || '10'}, học kỳ {aiFormData.semester || '1'}:</p>
                <div className="skill-checklist">
                  <div className="skill-item">
                    <div className="skill-icon">🎧</div>
                    <div>
                      <strong>Nghe (Listening)</strong>
                      <p>Audio tự động + câu hỏi trắc nghiệm</p>
                    </div>
                  </div>
                  <div className="skill-item">
                    <div className="skill-icon">📖</div>
                    <div>
                      <strong>Đọc (Reading)</strong>
                      <p>Bài đọc phù hợp trình độ + câu hỏi</p>
                    </div>
                  </div>
                  <div className="skill-item">
                    <div className="skill-icon">✍️</div>
                    <div>
                      <strong>Viết (Writing)</strong>
                      <p>Đề bài viết luận theo chủ đề</p>
                    </div>
                  </div>
                  <div className="skill-item">
                    <div className="skill-icon">🗣️</div>
                    <div>
                      <strong>Nói (Speaking)</strong>
                      <p>Câu hỏi trả lời và thảo luận</p>
                    </div>
                  </div>
                </div>
                <div className="estimate-time">
                  <Clock size={16} />
                  <span>Thời gian tạo đề: Khoảng 3-5 phút</span>
                </div>
              </div>
            </div>
            
            {/* Advanced Options */}
            <div className="advanced-options">
              <h5 className="options-title">Tùy chỉnh nâng cao (không bắt buộc)</h5>
              <div className="form-row-ex">
                <div className="form-section-ex">
                  <label className="form-label-ex">Độ khó</label>
                  <select 
                    className="form-select-ex"
                    value={aiFormData.difficulty || 'mixed'}
                    onChange={(e) => setAiFormData({ ...aiFormData, difficulty: e.target.value })}
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                    <option value="mixed">Trộn lẫn</option>
                  </select>
                </div>
                <div className="form-section-ex">
                  <label className="form-label-ex">Số câu hỏi mỗi kỹ năng</label>
                  <input 
                    type="number" 
                    className="form-input-ex"
                    placeholder="Mặc định: 5-7 câu"
                    value={aiFormData.questionsPerSkill || ''}
                    onChange={(e) => setAiFormData({ ...aiFormData, questionsPerSkill: e.target.value })}
                    min="3"
                    max="15"
                  />
                </div>
              </div>
              
              <div className="form-section-ex">
                <label className="form-label-ex">Chú thích thêm cho AI (không bắt buộc)</label>
                <textarea 
                  className="form-textarea-ex"
                  rows="3"
                  placeholder="Ví dụ: Tập trung vào chủ đề môi trường và công nghệ, sử dụng từ vựng học kỳ 1..."
                  value={aiFormData.additionalNotes || ''}
                  onChange={(e) => setAiFormData({ ...aiFormData, additionalNotes: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* AI from Files */}
        {aiSource === 'files' && (
          <div className="ai-files-section">
            <div className="form-section-ex">
              <label className="form-label-ex">Upload tài liệu tham khảo (có thể nhiều files)</label>
              <div className="file-upload-zone-multiple" onClick={() => aiFilesInputRef.current?.click()}>
                <input 
                  ref={aiFilesInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleAiFilesUpload}
                  style={{ display: 'none' }}
                />
                <FileUp size={48} />
                <p>Click để chọn files (có thể chọn nhiều)</p>
                <span className="upload-hint">Word, PDF, hoặc Text</span>
              </div>
            </div>
            
            {aiFiles.length > 0 && (
              <div className="uploaded-files-list">
                <h5>📄 Files đã upload ({aiFiles.length})</h5>
                {aiFiles.map((file, idx) => (
                  <div key={idx} className="uploaded-file-item">
                    <File size={18} />
                    <span className="file-name">{file.name}</span>
                    <button onClick={() => removeAiFile(idx)} className="btn-remove-file-small">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="form-section-ex">
              <label className="form-label-ex">Yêu cầu bổ sung với AI (tùy chọn)</label>
              <textarea 
                className="form-textarea-ex"
                rows="4"
                placeholder="Ví dụ: Tạo 10 câu hỏi trắc nghiệm về thì hiện tại hoàn thành, độ khó trung bình..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
          </div>
        )}
        
        {/* AI from Question Bank */}
        {aiSource === 'question_bank' && (
          <div className="ai-qb-section">
            <h4>Cấu hình tạo đề từ Ngân hàng</h4>
            
            <div className="form-row-ex">
              <div className="form-section-ex">
                <label className="form-label-ex">Số câu hỏi</label>
                <input 
                  type="number"
                  className="form-input-ex"
                  value={qbNumQuestions}
                  onChange={(e) => setQbNumQuestions(Number(e.target.value))}
                  min="5"
                  max="50"
                />
              </div>
              <div className="form-section-ex">
                <label className="form-label-ex">Độ khó</label>
                <select 
                  className="form-select-ex"
                  value={qbDifficulty}
                  onChange={(e) => setQbDifficulty(e.target.value)}
                >
                  <option value="mixed">Trộn lẫn</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Generate Summary & Button */}
        <div className="ai-generate-section">
          <div className="generate-summary">
            <h5>📋 Tóm tắt cấu hình</h5>
            <div className="summary-items">
              <div className="summary-item">
                <span className="label">Lớp:</span>
                <span className="value">{selectedClass?.name || 'Chưa chọn'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Khối:</span>
                <span className="value">{grade}</span>
              </div>
              <div className="summary-item">
                <span className="label">Học kỳ:</span>
                <span className="value">Học kỳ {aiFormData.semester || '1'}</span>
              </div>
              <div className="summary-item">
                <span className="label">Độ khó:</span>
                <span className="value">
                  {aiFormData.difficulty === 'easy' ? 'Dễ' : 
                   aiFormData.difficulty === 'medium' ? 'Trung bình' : 
                   aiFormData.difficulty === 'hard' ? 'Khó' : 'Trộn lẫn'}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            className="btn-generate-ai" 
            onClick={handleGenerateWithAI}
            disabled={isGeneratingAI || !classId}
          >
            {isGeneratingAI ? (
              <>
                <div className="spinner-small"></div>
                Đang sinh đề với AI (3-5 phút)...
              </>
            ) : (
              <>
                <Bot size={20} />
                Tạo đề thi bằng AI ngay
              </>
            )}
          </button>
          
          {!classId && (
            <p className="ai-warning">⚠️ Vui lòng chọn lớp học trước khi tạo đề</p>
          )}
        </div>
      </div>
    );
  }
  
  // Questions Section
  function renderQuestions() {
    return (
      <div className="questions-section-form">
        <div className="section-header-with-actions">
          <h4>Câu hỏi</h4>
          <div className="question-actions">
            <button 
              className="btn-from-bank"
              onClick={() => setShowQuestionBankModal(true)}
            >
              <Database size={16} />
              Từ Ngân hàng
            </button>
            <button className="btn-add-question" onClick={addQuestion}>
              <Plus size={16} />
              Thêm câu hỏi
            </button>
          </div>
        </div>
        
        {questions.length === 0 ? (
          <div className="empty-questions">
            <p>Chưa có câu hỏi. Click "Thêm câu hỏi" hoặc "Từ Ngân hàng"</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="question-form-card">
              <div className="question-form-header">
                <span>Câu {idx + 1}</span>
                <button onClick={() => removeQuestion(idx)} className="btn-remove-question">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="form-section-ex">
                <label>Loại câu hỏi</label>
                <select 
                  className="form-select-ex"
                  value={q.type}
                  onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                >
                  <optgroup label="Trắc nghiệm">
                    <option value="multiple_choice">Trắc nghiệm (A/B/C/D)</option>
                    <option value="fill_blank">Điền từ</option>
                    <option value="true_false">Đúng/Sai</option>
                  </optgroup>
                  <optgroup label="Tự luận">
                    <option value="short_answer">Tự luận ngắn</option>
                    <option value="essay">Tự luận dài (Essay)</option>
                  </optgroup>
                  <optgroup label="Kỹ năng">
                    <option value="speaking">Speaking (Nói)</option>
                    <option value="listening">Listening (Nghe)</option>
                    <option value="reading">Reading (Đọc)</option>
                    <option value="writing">Writing (Viết)</option>
                  </optgroup>
                </select>
              </div>
              
              <div className="form-section-ex">
                <label>
                  {q.type === 'listening' && '🎧 Đề bài Listening'}
                  {q.type === 'reading' && '📖 Đoạn văn Reading'}
                  {q.type === 'speaking' && '🗣️ Yêu cầu Speaking'}
                  {q.type === 'writing' && '✍️ Đề bài Writing'}
                  {!['listening', 'reading', 'speaking', 'writing'].includes(q.type) && 'Câu hỏi'}
                </label>
                <textarea
                  className="form-input-ex"
                  placeholder={
                    q.type === 'listening' ? 'Nhập đề bài hoặc link audio...' :
                    q.type === 'reading' ? 'Nhập đoạn văn để học sinh đọc...' :
                    q.type === 'speaking' ? 'Nhập yêu cầu: "Hãy nói về..." hoặc câu để đọc...' :
                    q.type === 'writing' ? 'Nhập đề bài: "Viết một đoạn văn về..."' :
                    'Nhập câu hỏi...'
                  }
                  value={q.question}
                  onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                  rows={q.type === 'reading' || q.type === 'writing' ? 5 : 3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              
              {q.type === 'multiple_choice' && (
                <>
                  <div className="form-section-ex">
                    <label>Đáp án</label>
                    {q.options.map((opt, optIdx) => (
                      <input 
                        key={optIdx}
                        type="text"
                        className="form-input-ex"
                        placeholder={`${String.fromCharCode(65 + optIdx)}. Đáp án ${optIdx + 1}`}
                        value={opt}
                        onChange={(e) => updateQuestionOption(idx, optIdx, e.target.value)}
                        style={{ marginBottom: '8px' }}
                      />
                    ))}
                    <select 
                      className="form-select-ex"
                      value={q.correct_answer}
                      onChange={(e) => updateQuestion(idx, 'correct_answer', e.target.value)}
                    >
                      <option value="">Chọn đáp án đúng</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </>
              )}
              
              {(q.type === 'fill_blank' || q.type === 'short_answer') && (
                <div className="form-section-ex">
                  <label>Đáp án đúng</label>
                  <input 
                    type="text"
                    className="form-input-ex"
                    placeholder="Nhập đáp án..."
                    value={q.correct_answer}
                    onChange={(e) => updateQuestion(idx, 'correct_answer', e.target.value)}
                  />
                </div>
              )}
              
              {q.type === 'true_false' && (
                <div className="form-section-ex">
                  <label>Đáp án đúng</label>
                  <select 
                    className="form-select-ex"
                    value={q.correct_answer}
                    onChange={(e) => updateQuestion(idx, 'correct_answer', e.target.value)}
                  >
                    <option value="">Chọn...</option>
                    <option value="true">Đúng</option>
                    <option value="false">Sai</option>
                  </select>
                </div>
              )}
              
              {/* Skill-based questions: Speaking, Listening, Reading, Writing */}
              {q.type === 'speaking' && (
                <div className="form-section-ex">
                  <div className="info-box" style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#0369a1' }}>
                      ℹ️ <strong>Chấm tự động bằng Azure Speech API:</strong> Phát âm, độ trôi chảy, tính hoàn chỉnh
                    </p>
                  </div>
                  <label>Văn bản tham khảo (optional - để AI so sánh)</label>
                  <textarea
                    className="form-input-ex"
                    placeholder="Nhập văn bản tham khảo mà học sinh cần đọc (nếu có)..."
                    value={q.reference_text || ''}
                    onChange={(e) => updateQuestion(idx, 'reference_text', e.target.value)}
                    rows={3}
                  />
                </div>
              )}
              
              {q.type === 'writing' && (
                <div className="form-section-ex">
                  <div className="info-box" style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
                      ℹ️ <strong>Chấm tự động bằng ChatGPT AI:</strong> Nội dung, tổ chức, từ vựng, ngữ pháp, kỹ thuật
                    </p>
                  </div>
                  <label>Yêu cầu độ dài (optional)</label>
                  <input
                    type="number"
                    className="form-input-ex"
                    placeholder="Số từ tối thiểu (VD: 150)"
                    value={q.min_words || ''}
                    onChange={(e) => updateQuestion(idx, 'min_words', Number(e.target.value))}
                  />
                </div>
              )}
              
              {q.type === 'listening' && (
                <div className="form-section-ex">
                  <div className="info-box" style={{ background: '#f3e8ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b21a8' }}>
                      ℹ️ <strong>Audio file:</strong> Học sinh nghe audio và trả lời câu hỏi
                    </p>
                  </div>
                  <label>Link audio hoặc upload file</label>
                  <input
                    type="text"
                    className="form-input-ex"
                    placeholder="https://... hoặc /media/audio/..."
                    value={q.audio_url || ''}
                    onChange={(e) => updateQuestion(idx, 'audio_url', e.target.value)}
                  />
                  <label style={{ marginTop: '12px' }}>Câu hỏi sau khi nghe</label>
                  <textarea
                    className="form-input-ex"
                    placeholder="VD: What is the main topic? Who are the speakers?"
                    value={q.listening_question || ''}
                    onChange={(e) => updateQuestion(idx, 'listening_question', e.target.value)}
                    rows={2}
                  />
                </div>
              )}
              
              {q.type === 'reading' && (
                <div className="form-section-ex">
                  <div className="info-box" style={{ background: '#dcfce7', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>
                      ℹ️ <strong>Reading comprehension:</strong> Học sinh đọc đoạn văn và trả lời
                    </p>
                  </div>
                  <label>Câu hỏi sau khi đọc</label>
                  <textarea
                    className="form-input-ex"
                    placeholder="VD: What is the main idea? According to the passage..."
                    value={q.reading_question || ''}
                    onChange={(e) => updateQuestion(idx, 'reading_question', e.target.value)}
                    rows={2}
                  />
                </div>
              )}
              
              <div className="form-section-ex">
                <label>Điểm</label>
                <input 
                  type="number"
                  className="form-input-ex"
                  value={q.points}
                  onChange={(e) => updateQuestion(idx, 'points', Number(e.target.value))}
                  min="0.5"
                  step="0.5"
                />
              </div>
            </div>
          ))
        )}
      </div>
    );
  }
}
