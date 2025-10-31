import { useState, useRef, useEffect } from 'react';
import { 
  X, FileText, Clock, Award, Upload, FileAudio, File, 
  Plus, Trash2, Sparkles, Bot, Database, FileUp 
} from 'lucide-react';
import { apiV1 } from '../../../../../services/api';
import Toast from '../../../../../components/Toast/Toast';
import useToast from '../../../../../hooks/useToast';
import './ExerciseManagement.css';

export default function CreateExerciseModal({ onClose, onCreate }) {
  const { toast, showWarning, hideToast } = useToast();
  const [testType, setTestType] = useState('skill_exercise');
  const [selectedSkill, setSelectedSkill] = useState('listening');
  const [creationMethod, setCreationMethod] = useState('manual');
  const [aiSource, setAiSource] = useState('files'); // 'files' | 'question_bank'
  
  // Form fields
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  
  // Classes from API
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Listening fields
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  
  // Reading fields
  const [readingInputMethod, setReadingInputMethod] = useState('text'); // 'text' | 'upload'
  const [passageText, setPassageText] = useState('');
  const [passageFile, setPassageFile] = useState(null);
  
  // Speaking fields
  const [speakingPrompt, setSpeakingPrompt] = useState('');
  const [speakingInstructions, setSpeakingInstructions] = useState(['']);
  const [prepTime, setPrepTime] = useState(60);
  const [speakTime, setSpeakTime] = useState(180);
  const [sampleAudio, setSampleAudio] = useState(null);
  
  // Writing fields
  const [writingPrompt, setWritingPrompt] = useState('');
  const [writingType, setWritingType] = useState('essay');
  const [writingInstructions, setWritingInstructions] = useState(['']);
  const [minWords, setMinWords] = useState(250);
  const [maxWords, setMaxWords] = useState(400);
  const [sampleEssay, setSampleEssay] = useState('');
  
  // Questions (for Listening/Reading)
  const [questions, setQuestions] = useState([]);
  
  // AI fields
  const [aiFiles, setAiFiles] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Question Bank fields
  const [qbNumQuestions, setQbNumQuestions] = useState(10);
  const [qbDifficulty, setQbDifficulty] = useState('mixed');
  const [qbEasyPercent, setQbEasyPercent] = useState(30);
  const [qbMediumPercent, setQbMediumPercent] = useState(50);
  const [qbHardPercent, setQbHardPercent] = useState(20);
  
  const audioInputRef = useRef(null);
  const passageFileInputRef = useRef(null);
  const sampleAudioInputRef = useRef(null);
  
  const requiresSkill = testType === 'skill_exercise' || testType === 'test_15min';
  
  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);
  
  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await apiV1.get('/classes/teaching');
      setClasses(response.data);
      if (response.data.length > 0 && !classId) {
        setClassId(response.data[0].id.toString());
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };
  
  // File handlers
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
    }
  };
  
  const handlePassageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPassageFile(file);
    }
  };
  
  const handleSampleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSampleAudio(file);
    }
  };
  
  const handleAiFilesUpload = (e) => {
    const files = Array.from(e.target.files);
    setAiFiles([...aiFiles, ...files]);
  };
  
  const removeAiFile = (index) => {
    setAiFiles(aiFiles.filter((_, i) => i !== index));
  };
  
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
  
  const handleSubmit = async () => {
    // Validate
    if (!title.trim()) {
      showWarning('Vui lòng nhập tiêu đề!');
      return;
    }

    if (!classId) {
      showWarning('Vui lòng chọn lớp học!');
      return;
    }
    
    // If AI generation mode
    if (creationMethod === 'ai') {
      await handleAIGeneration();
      return;
    }
    
    // Manual creation - Build exercise object
    const exercise = {
      title: title.trim(),
      type: testType,
      skill_type: requiresSkill ? selectedSkill : null,
      class: classId,
      dueDate,
      maxScore,
      status: 'active',
      submissions: 0,
      totalStudents: 25, // Mock
      content: {}
    };
    
    // Add content based on skill
    if (selectedSkill === 'listening') {
      if (!audioFile) {
        showWarning('Vui lòng upload file audio!');
        return;
      }
      if (questions.length === 0) {
        showWarning('Vui lòng thêm ít nhất 1 câu hỏi!');
        return;
      }
      exercise.content = {
        audio_url: audioFile ? URL.createObjectURL(audioFile) : '',
        transcript,
        show_transcript: showTranscript,
        questions
      };
    } else if (selectedSkill === 'speaking') {
      if (!speakingPrompt.trim()) {
        showWarning('Vui lòng nhập đề bài Speaking!');
        return;
      }
      exercise.content = {
        prompt: speakingPrompt,
        instructions: speakingInstructions.filter(i => i),
        preparation_time: prepTime,
        time_limit: speakTime,
        sample_audio: sampleAudio ? URL.createObjectURL(sampleAudio) : null
      };
    } else if (selectedSkill === 'reading') {
      if (!passageText.trim() && !passageFile) {
        showWarning('Vui lòng nhập hoặc upload đoạn văn!');
        return;
      }
      if (questions.length === 0) {
        showWarning('Vui lòng thêm ít nhất 1 câu hỏi!');
        return;
      }
      exercise.content = {
        passage: passageText,
        passage_url: passageFile ? URL.createObjectURL(passageFile) : null,
        word_count: passageText.split(/\s+/).length,
        questions
      };
    } else if (selectedSkill === 'writing') {
      if (!writingPrompt.trim()) {
        showWarning('Vui lòng nhập đề bài Writing!');
        return;
      }
      exercise.content = {
        prompt: writingPrompt,
        type: writingType,
        instructions: writingInstructions.filter(i => i),
        word_limit: { min: minWords, max: maxWords },
        sample_essay: sampleEssay
      };
    }
    
    onCreate(exercise);
  };

  const handleAIGeneration = async () => {
    setIsGenerating(true);
    try {
      if (aiSource === 'files') {
        // AI from uploaded files
        if (aiFiles.length === 0) {
          showWarning('Vui lòng upload ít nhất 1 file tài liệu!');
          setIsGenerating(false);
          return;
        }

        // Upload files first
        const formData = new FormData();
        aiFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('title', title.trim());
        formData.append('class_id', classId);
        formData.append('test_type', testType);
        formData.append('skill_type', selectedSkill);
        formData.append('max_score', maxScore);
        formData.append('due_date', dueDate);
        if (aiPrompt.trim()) {
          formData.append('prompt', aiPrompt.trim());
        }

        // Call AI generation endpoint
        const response = await apiV1.post('/exercises/generate-from-files', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        onCreate(response.data);
        
      } else if (aiSource === 'question_bank') {
        // AI from question bank
        if (qbEasyPercent + qbMediumPercent + qbHardPercent !== 100 && qbDifficulty === 'mixed') {
          showWarning('Tổng phân bố độ khó phải bằng 100%!');
          setIsGenerating(false);
          return;
        }

        const payload = {
          title: title.trim(),
          class_id: classId,
          test_type: testType,
          skill_type: selectedSkill,
          max_score: maxScore,
          due_date: dueDate,
          num_questions: qbNumQuestions,
          difficulty: qbDifficulty,
          difficulty_distribution: qbDifficulty === 'mixed' ? {
            easy: qbEasyPercent,
            medium: qbMediumPercent,
            hard: qbHardPercent
          } : null
        };

        const response = await apiV1.post('/exercises/generate-from-qb', payload);
        onCreate(response.data);
      }
      
    } catch (error) {
      console.error('Error generating AI exercise:', error);
      showWarning('Lỗi khi sinh đề: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsGenerating(false);
    }
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
          
          {/* Skill Selection (if needed) */}
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
          
          {/* Creation Method */}
          <div className="form-section-ex">
            <label className="form-label-ex">Phương thức tạo đề</label>
            <div className="creation-method-tabs">
              <button 
                className={`method-tab ${creationMethod === 'manual' ? 'active' : ''}`}
                onClick={() => setCreationMethod('manual')}
              >
                <FileText size={18} />
                <span>Tự nhập</span>
              </button>
              <button 
                className={`method-tab ${creationMethod === 'import' ? 'active' : ''}`}
                onClick={() => setCreationMethod('import')}
              >
                <Upload size={18} />
                <span>Import File</span>
              </button>
              <button 
                className={`method-tab ${creationMethod === 'ai' ? 'active' : ''}`}
                onClick={() => setCreationMethod('ai')}
              >
                <Bot size={18} />
                <span>AI Sinh đề</span>
              </button>
            </div>
          </div>
          
          {/* Manual Creation */}
          {creationMethod === 'manual' && (
            <>
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
                    {loadingClasses ? (
                      <option disabled>Đang tải...</option>
                    ) : (
                      classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))
                    )}
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
              
              {/* Skill-specific content */}
              {selectedSkill === 'listening' && renderListeningForm()}
              {selectedSkill === 'speaking' && renderSpeakingForm()}
              {selectedSkill === 'reading' && renderReadingForm()}
              {selectedSkill === 'writing' && renderWritingForm()}
            </>
          )}
          
          {/* AI Creation */}
          {creationMethod === 'ai' && renderAIForm()}
        </div>
        
        <div className="modal-footer-ex">
          <button className="btn-cancel-ex" onClick={onClose} disabled={isGenerating}>Hủy</button>
          {creationMethod === 'manual' && (
            <button 
              className="btn-create-ex" 
              onClick={handleSubmit}
              disabled={isGenerating}
            >
              <Plus size={18} />
              Tạo bài tập
            </button>
          )}
          {creationMethod === 'ai' && (
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Bot size={18} />
              Sử dụng nút "Sinh đề bằng AI" bên trên
            </div>
          )}
        </div>
      </div>
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
  
  // Listening Form
  function renderListeningForm() {
    return (
      <div className="listening-form-content">
        <h4 className="section-title">🎧 Nội dung bài Nghe</h4>
        
        {/* Audio Upload */}
        <div className="form-section-ex">
          <label className="form-label-ex">File Audio * (.mp3, .wav, .ogg)</label>
          <div className="file-upload-zone" onClick={() => audioInputRef.current?.click()}>
            <input 
              ref={audioInputRef}
              type="file" 
              accept="audio/*"
              onChange={handleAudioUpload}
              style={{ display: 'none' }}
            />
            {!audioFile ? (
              <>
                <FileAudio size={32} className="upload-icon" />
                <p>Click để chọn file audio</p>
                <span className="upload-hint">Tối đa 50MB</span>
              </>
            ) : (
              <div className="file-preview-box">
                <FileAudio size={24} />
                <div className="file-info">
                  <span className="file-name">{audioFile.name}</span>
                  <span className="file-size">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <audio controls src={URL.createObjectURL(audioFile)} className="audio-preview" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                  className="btn-remove-file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
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
        
        {/* Optional Sample Audio */}
        <div className="form-section-ex">
          <label className="form-label-ex">Audio mẫu (tùy chọn)</label>
          <input 
            ref={sampleAudioInputRef}
            type="file" 
            accept="audio/*"
            onChange={handleSampleAudioUpload}
            className="form-input-ex"
          />
          {sampleAudio && (
            <audio controls src={URL.createObjectURL(sampleAudio)} className="audio-preview" />
          )}
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
                  <File size={32} className="upload-icon" />
                  <p>Click để chọn file</p>
                  <span className="upload-hint">PDF, Word, hoặc Text - Tối đa 10MB</span>
                </>
              ) : (
                <div className="file-preview-box">
                  <File size={24} />
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
        
        {/* Sample Essay */}
        <div className="form-section-ex">
          <label className="form-label-ex">Bài mẫu (tùy chọn)</label>
          <textarea 
            className="form-textarea-ex"
            rows="10"
            placeholder="Nhập bài mẫu..."
            value={sampleEssay}
            onChange={(e) => setSampleEssay(e.target.value)}
          />
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
            <button className="btn-from-bank">
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
                  <option value="multiple_choice">Trắc nghiệm</option>
                  <option value="fill_blank">Điền từ</option>
                  <option value="true_false">Đúng/Sai</option>
                  <option value="short_answer">Tự luận ngắn</option>
                </select>
              </div>
              
              <div className="form-section-ex">
                <label>Câu hỏi</label>
                <input 
                  type="text"
                  className="form-input-ex"
                  placeholder="Nhập câu hỏi..."
                  value={q.question}
                  onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                />
              </div>
              
              {q.type === 'multiple_choice' && (
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
              )}
              
              {q.type === 'fill_blank' && (
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
  
  // AI Form
  function renderAIForm() {
    return (
      <div className="ai-form-content">
        <div style={{
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          border: '2px solid #667eea30',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h4 style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#667eea',
            fontSize: '16px',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            <Bot size={20} />
            AI Sinh đề Tự động
          </h4>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0,
            lineHeight: '1.6'
          }}>
            AI sẽ phân tích tài liệu hoặc ngân hàng câu hỏi của bạn để tự động tạo bài tập phù hợp với cấp độ và yêu cầu.
          </p>
        </div>
        
        {/* AI Source Selection */}
        <div className="ai-source-selection">
          <label className="ai-source-card">
            <input 
              type="radio"
              name="ai-source"
              value="files"
              checked={aiSource === 'files'}
              onChange={(e) => setAiSource(e.target.value)}
            />
            <div className="source-content">
              <FileUp size={24} />
              <h4>Sinh từ Files</h4>
              <p>AI phân tích files bạn upload và tạo đề mới</p>
            </div>
          </label>
          
          <label className="ai-source-card">
            <input 
              type="radio"
              name="ai-source"
              value="question_bank"
              checked={aiSource === 'question_bank'}
              onChange={(e) => setAiSource(e.target.value)}
            />
            <div className="source-content">
              <Database size={24} />
              <h4>Lấy từ Ngân hàng Câu hỏi</h4>
              <p>AI chọn câu hỏi phù hợp từ ngân hàng của bạn</p>
            </div>
          </label>
        </div>
        
        {/* AI from Files */}
        {aiSource === 'files' && (
          <div className="ai-files-section">
            <div className="form-section-ex">
              <label className="form-label-ex">Upload tài liệu tham khảo (có thể nhiều files)</label>
              <div className="file-upload-zone-multiple">
                <FileUp size={32} />
                <p>Click để chọn files</p>
                <input 
                  type="file"
                  multiple
                  onChange={handleAiFilesUpload}
                  style={{ display: 'none' }}
                  id="ai-files-input"
                />
                <label htmlFor="ai-files-input" className="upload-trigger-btn">
                  Chọn files
                </label>
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

            {/* Generate Button */}
            <div style={{marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb'}}>
              <button 
                type="button"
                onClick={handleAIGeneration}
                disabled={aiFiles.length === 0 || isGenerating}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: aiFiles.length === 0 || isGenerating ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: aiFiles.length === 0 || isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  opacity: aiFiles.length === 0 || isGenerating ? 0.6 : 1
                }}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner" style={{
                      display: 'inline-block',
                      width: '18px',
                      height: '18px',
                      border: '3px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }}></span>
                    Đang phân tích và sinh đề...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    🤖 Sinh đề bằng AI từ Files
                  </>
                )}
              </button>
              <p style={{
                marginTop: '12px',
                fontSize: '13px',
                color: '#6b7280',
                textAlign: 'center',
                margin: '12px 0 0 0'
              }}>
                {aiFiles.length === 0 ? '⚠️ Vui lòng upload ít nhất 1 file tài liệu' : '✓ Sẵn sàng sinh đề từ ' + aiFiles.length + ' file(s)'}
              </p>
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
            
            {qbDifficulty === 'mixed' && (
              <div className="difficulty-distribution-section">
                <h5>Phân bố độ khó</h5>
                <div className="slider-group">
                  <label>Dễ: {qbEasyPercent}%</label>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={qbEasyPercent}
                    onChange={(e) => setQbEasyPercent(Number(e.target.value))}
                  />
                </div>
                <div className="slider-group">
                  <label>TB: {qbMediumPercent}%</label>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={qbMediumPercent}
                    onChange={(e) => setQbMediumPercent(Number(e.target.value))}
                  />
                </div>
                <div className="slider-group">
                  <label>Khó: {qbHardPercent}%</label>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={qbHardPercent}
                    onChange={(e) => setQbHardPercent(Number(e.target.value))}
                  />
                </div>
                <div className="total-percent">
                  Tổng: {qbEasyPercent + qbMediumPercent + qbHardPercent}% 
                  {qbEasyPercent + qbMediumPercent + qbHardPercent !== 100 && (
                    <span className="warning-text"> (Phải bằng 100%)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate from Question Bank Button */}
        {aiSource === 'question_bank' && (
          <div style={{marginTop: '24px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb'}}>
            <button 
              type="button"
              onClick={handleAIGeneration}
              disabled={isGenerating || (qbDifficulty === 'mixed' && qbEasyPercent + qbMediumPercent + qbHardPercent !== 100)}
              style={{
                width: '100%',
                padding: '16px',
                background: (isGenerating || (qbDifficulty === 'mixed' && qbEasyPercent + qbMediumPercent + qbHardPercent !== 100)) ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: (isGenerating || (qbDifficulty === 'mixed' && qbEasyPercent + qbMediumPercent + qbHardPercent !== 100)) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                opacity: (isGenerating || (qbDifficulty === 'mixed' && qbEasyPercent + qbMediumPercent + qbHardPercent !== 100)) ? 0.6 : 1
              }}
            >
              {isGenerating ? (
                <>
                  <span className="spinner" style={{
                    display: 'inline-block',
                    width: '18px',
                    height: '18px',
                    border: '3px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }}></span>
                  Đang tạo đề từ ngân hàng...
                </>
              ) : (
                <>
                  <Database size={20} />
                  🤖 Sinh đề từ Ngân hàng Câu hỏi
                </>
              )}
            </button>
            <p style={{
              marginTop: '12px',
              fontSize: '13px',
              color: '#6b7280',
              textAlign: 'center',
              margin: '12px 0 0 0'
            }}>
              {qbDifficulty === 'mixed' && qbEasyPercent + qbMediumPercent + qbHardPercent !== 100 
                ? '⚠️ Tổng phân bố độ khó phải bằng 100%' 
                : `✓ Sẽ tạo ${qbNumQuestions} câu hỏi với độ khó ${qbDifficulty === 'mixed' ? 'trộn lẫn' : qbDifficulty}`}
            </p>
          </div>
        )}
      </div>
    );
  }
}

