import { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, FileAudio, Upload, Check, FileText, Headphones, Mic, BookOpen, PenLine } from 'lucide-react';
import './AddQuestionModal.css';
import Toast from '../../../../components/Toast/Toast';
import useToast from '../../../../hooks/useToast';

export default function AddQuestionModal({ onClose, onAdd, mode = 'add', initialData = null }) {
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  
  // Basic fields
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [skillType, setSkillType] = useState('listening');
  const [difficulty, setDifficulty] = useState('medium');
  const [topic, setTopic] = useState('');
  const [points, setPoints] = useState(2);
  
  // MCQ fields
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  
  // Listening-specific
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const audioInputRef = useRef(null);
  
  // Speaking-specific
  const [speakingPrompt, setSpeakingPrompt] = useState('');
  const [speakingInstructions, setSpeakingInstructions] = useState(['']);
  const [prepTime, setPrepTime] = useState(30);
  const [speakTime, setSpeakTime] = useState(60);
  
  // Reading-specific
  const [readingPassage, setReadingPassage] = useState('');
  const [passageFile, setPassageFile] = useState(null);
  const [useFile, setUseFile] = useState(false);
  const passageFileInputRef = useRef(null);
  
  // Writing-specific
  const [writingPrompt, setWritingPrompt] = useState('');
  const [writingType, setWritingType] = useState('essay');
  const [minWords, setMinWords] = useState(150);
  const [maxWords, setMaxWords] = useState(300);
  const [writingRequirements, setWritingRequirements] = useState(['']);
  
  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && initialData) {

      setQuestionText(initialData.question_text || '');
      setQuestionType(initialData.question_type || 'multiple_choice');
      setSkillType(initialData.skill_type || 'listening');
      setDifficulty(initialData.difficulty || 'medium');
      setTopic(initialData.topic || '');
      setPoints(initialData.points || 2);
      
      // MCQ
      if (initialData.options && Array.isArray(initialData.options)) {
        setOptions(initialData.options);
      }
      setCorrectAnswer(initialData.correct_answer || '');
      
      // Listening
      setTranscript(initialData.transcript || '');
      
      // Speaking
      if (initialData.skill_type === 'speaking') {
        setSpeakingPrompt(initialData.question_text || '');
        if (initialData.requirements && Array.isArray(initialData.requirements)) {
          setSpeakingInstructions(initialData.requirements);
        }
      }
      
      // Reading
      if (initialData.skill_type === 'reading') {
        setReadingPassage(initialData.passage_text || '');
        setUseFile(!!initialData.passage_url && !initialData.passage_text);
      }
      
      // Writing
      if (initialData.skill_type === 'writing') {
        setWritingPrompt(initialData.question_text || '');
        setWritingType(initialData.writing_type || 'essay');
        if (initialData.word_limit) {
          setMinWords(initialData.word_limit.min || 150);
          setMaxWords(initialData.word_limit.max || 300);
        }
        if (initialData.requirements && Array.isArray(initialData.requirements)) {
          setWritingRequirements(initialData.requirements);
        }
      }
    }
  }, [mode, initialData]);
  
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
    }
  };
  
  const handlePassageFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setPassageFile(file);
    
    // Auto-parse DOCX files to text
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      try {

        // Import API
        const { questionBankAPI } = await import('../../../../services/api');
        
        // Parse DOCX
        const result = await questionBankAPI.parseDocx(file);

        // Set text to textarea
        setReadingPassage(result.text);
        
        // Clear file since we have text now
        setPassageFile(null);
        setUseFile(false);
        
        showSuccess(`✅ Đã parse file thành công!\n\n${result.paragraphs} đoạn văn, ${result.characters} ký tự\n\nBạn có thể chỉnh sửa text trong ô bên dưới.`);
      } catch (err) {
        console.error('[READING] Parse DOCX failed:', err);
        showError(`⚠️ Không thể parse file DOCX:\n\n${err.response?.data?.detail || err.message}\n\nVui lòng copy text thủ công hoặc chọn file khác.`);
      }
    }
  };
  
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
  
  const addWritingRequirement = () => {
    setWritingRequirements([...writingRequirements, '']);
  };
  
  const updateWritingRequirement = (index, value) => {
    const updated = [...writingRequirements];
    updated[index] = value;
    setWritingRequirements(updated);
  };
  
  const removeWritingRequirement = (index) => {
    setWritingRequirements(writingRequirements.filter((_, i) => i !== index));
  };
  
  const updateOption = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };
  
  const handleSubmit = () => {
    // Validation per skill type
    const errors = [];
    
    if (skillType === 'listening') {
      if (!questionText.trim()) {
        errors.push('• Vui lòng nhập câu hỏi nghe');
      }
      if (!audioFile && !transcript) {
        errors.push('• Vui lòng upload file audio HOẶC nhập transcript');
      }
      if (questionType === 'multiple_choice') {
        const filledOptions = options.filter(opt => opt.trim());
        if (filledOptions.length < 2) {
          errors.push('• Cần ít nhất 2 đáp án cho trắc nghiệm');
        }
        if (!correctAnswer.trim()) {
          errors.push('• Vui lòng chọn đáp án đúng');
        }
      } else if (questionType === 'fill_blank' || questionType === 'short_answer') {
        if (!correctAnswer.trim()) {
          errors.push('• Vui lòng nhập đáp án đúng');
        }
      }
    } else if (skillType === 'speaking') {
      if (!speakingPrompt.trim()) {
        errors.push('• Vui lòng nhập câu hỏi/chủ đề nói');
      }
      if (prepTime < 0 || prepTime > 300) {
        errors.push('• Thời gian chuẩn bị phải từ 0-300 giây');
      }
      if (speakTime < 10 || speakTime > 600) {
        errors.push('• Thời gian nói phải từ 10-600 giây');
      }
    } else if (skillType === 'reading') {
      if (!questionText.trim()) {
        errors.push('• Vui lòng nhập câu hỏi đọc');
      }
      if (!readingPassage.trim() && !useFile) {
        errors.push('• Vui lòng nhập đoạn văn đọc');
      }
      if (useFile && !passageFile) {
        errors.push('• Vui lòng chọn file đoạn văn');
      }
      if (questionType === 'multiple_choice') {
        const filledOptions = options.filter(opt => opt.trim());
        if (filledOptions.length < 2) {
          errors.push('• Cần ít nhất 2 đáp án cho trắc nghiệm');
        }
        if (!correctAnswer.trim()) {
          errors.push('• Vui lòng chọn đáp án đúng');
        }
      } else if (questionType === 'fill_blank' || questionType === 'short_answer') {
        if (!correctAnswer.trim()) {
          errors.push('• Vui lòng nhập đáp án đúng');
        }
      }
    } else if (skillType === 'writing') {
      if (!writingPrompt.trim()) {
        errors.push('• Vui lòng nhập đề bài viết');
      }
      if (minWords <= 0 || minWords > 1000) {
        errors.push('• Số từ tối thiểu phải từ 1-1000');
      }
      if (maxWords < minWords) {
        errors.push('• Số từ tối đa phải lớn hơn số từ tối thiểu');
      }
      if (maxWords > 2000) {
        errors.push('• Số từ tối đa không vượt quá 2000');
      }
    }
    
    // Common validation
    if (!topic.trim()) {
      errors.push('• Vui lòng nhập chủ đề');
    }
    if (points <= 0 || points > 100) {
      errors.push('• Điểm phải từ 1-100');
    }
    
    if (errors.length > 0) {
      showWarning('⚠️ Vui lòng kiểm tra lại:\n\n' + errors.join('\n'));
      return;
    }
    
    // Build question object based on skill type
    const baseQuestion = {
      skill_type: skillType,
      question_type: questionType,
      difficulty,
      topic,
      points,
      created_at: new Date().toISOString().split('T')[0]
    };
    
    let questionData = { ...baseQuestion };
    
    // Add skill-specific data
    if (skillType === 'listening') {
      questionData = {
        ...questionData,
        question_text: questionText,
        // Pass actual file up for upload; preview handled locally
        audio_url: null,
        transcript,
        options: questionType === 'multiple_choice' ? options : null,
        correct_answer: correctAnswer
      };
    } else if (skillType === 'speaking') {
      questionData = {
        ...questionData,
        question_text: speakingPrompt,
        instructions: speakingInstructions.filter(i => i),
        preparation_time: prepTime,
        speaking_time: speakTime
      };
    } else if (skillType === 'reading') {
      questionData = {
        ...questionData,
        question_text: questionText,
        passage: useFile ? null : readingPassage,
        passage_url: null,
        options: questionType === 'multiple_choice' ? options : null,
        correct_answer: correctAnswer
      };
    } else if (skillType === 'writing') {
      questionData = {
        ...questionData,
        question_text: writingPrompt,
        writing_type: writingType,
        word_limit: { min: minWords, max: maxWords },
        requirements: writingRequirements.filter(r => r)
      };
    }
    
    // Attach raw files so parent can upload
    onAdd({
      ...questionData,
      _files: {
        audioFile: audioFile || null,
        passageFile: useFile ? (passageFile || null) : null,
      }
    });
  };
  
  return (
    <div className="add-question-modal-overlay" onClick={onClose}>
      <div className="add-question-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="add-question-modal-header">
          <div>
            <h2>{mode === 'edit' ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}</h2>
            <p>{mode === 'edit' ? 'Cập nhật thông tin câu hỏi' : 'Điền thông tin chi tiết cho câu hỏi'}</p>
          </div>
          <button onClick={onClose} className="close-btn-aq">×</button>
        </div>
        
        <div className="add-question-modal-body">
          {/* Skill Type Selection */}
          <div className="form-group-aq">
            <label>Kỹ năng *</label>
            {mode === 'edit' && <p className="text-xs text-gray-500 mt-1">Không thể thay đổi kỹ năng khi chỉnh sửa</p>}
            <div className="skill-pills">
              <button 
                className={`skill-pill ${skillType === 'listening' ? 'active' : ''}`}
                onClick={() => mode === 'add' && setSkillType('listening')}
                disabled={mode === 'edit'}
                style={mode === 'edit' ? {opacity: 0.6, cursor: 'not-allowed'} : {}}
              >
                <Headphones className="inline-block w-4 h-4 mr-1" /> Nghe
              </button>
              <button 
                className={`skill-pill ${skillType === 'speaking' ? 'active' : ''}`}
                onClick={() => mode === 'add' && setSkillType('speaking')}
                disabled={mode === 'edit'}
                style={mode === 'edit' ? {opacity: 0.6, cursor: 'not-allowed'} : {}}
              >
                <Mic className="inline-block w-4 h-4 mr-1" /> Nói
              </button>
              <button 
                className={`skill-pill ${skillType === 'reading' ? 'active' : ''}`}
                onClick={() => mode === 'add' && setSkillType('reading')}
                disabled={mode === 'edit'}
                style={mode === 'edit' ? {opacity: 0.6, cursor: 'not-allowed'} : {}}
              >
                <BookOpen className="inline-block w-4 h-4 mr-1" /> Đọc
              </button>
              <button 
                className={`skill-pill ${skillType === 'writing' ? 'active' : ''}`}
                onClick={() => mode === 'add' && setSkillType('writing')}
                disabled={mode === 'edit'}
                style={mode === 'edit' ? {opacity: 0.6, cursor: 'not-allowed'} : {}}
              >
                <PenLine className="inline-block w-4 h-4 mr-1" /> Viết
              </button>
            </div>
          </div>
          
          {/* Question Type (not for Speaking/Writing) */}
          {(skillType === 'listening' || skillType === 'reading') && (
            <div className="form-group-aq">
              <label>Loại câu hỏi *</label>
              <select 
                value={questionType} 
                onChange={(e) => setQuestionType(e.target.value)}
                className="form-select-aq"
              >
                <option value="multiple_choice">Trắc nghiệm</option>
                <option value="fill_blank">Điền từ</option>
                <option value="true_false">Đúng/Sai</option>
                <option value="short_answer">Tự luận ngắn</option>
              </select>
            </div>
          )}
          
          {/* Skill-specific forms */}
          {skillType === 'listening' && renderListeningForm()}
          {skillType === 'speaking' && renderSpeakingForm()}
          {skillType === 'reading' && renderReadingForm()}
          {skillType === 'writing' && renderWritingForm()}
          
          {/* Common fields */}
          <div className="form-row-aq">
            <div className="form-group-aq">
              <label>Độ khó *</label>
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
                className="form-select-aq"
              >
                <option value="easy">🟢 Dễ</option>
                <option value="medium">🟡 Trung bình</option>
                <option value="hard">🔴 Khó</option>
              </select>
            </div>
            <div className="form-group-aq">
              <label>Điểm *</label>
              <input 
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                min="0.5"
                step="0.5"
                className="form-input-aq"
              />
            </div>
          </div>
          
          <div className="form-group-aq">
            <label>Chủ đề</label>
            <input 
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Grammar, Vocabulary, Comprehension..."
              className="form-input-aq"
            />
          </div>
        </div>
        
        <div className="add-question-modal-footer">
          <button onClick={onClose} className="btn-cancel-aq">Hủy</button>
          <button onClick={handleSubmit} className="btn-submit-aq">
            <Check size={18} />
            {mode === 'edit' ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}
          </button>
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
      <div className="skill-form-section">
        <div className="section-title-aq"><Headphones className="inline-block w-5 h-5 mr-2" /> Nội dung câu hỏi Nghe</div>
        
        {/* Audio Upload */}
        <div className="form-group-aq">
          <label>File Audio (.mp3, .wav)</label>
          <div className="upload-zone-aq" onClick={() => audioInputRef.current?.click()}>
            <input 
              ref={audioInputRef}
              type="file" 
              accept="audio/*"
              onChange={handleAudioUpload}
              style={{ display: 'none' }}
            />
            {!audioFile ? (
              <>
                <FileAudio size={40} className="upload-icon-aq" />
                <p>Click để chọn file audio</p>
                <span className="upload-hint-aq">Tối đa 50MB</span>
              </>
            ) : (
              <div className="file-preview-aq">
                <FileAudio size={24} />
                <div className="file-info-aq">
                  <span className="file-name-aq">{audioFile.name}</span>
                  <span className="file-size-aq">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <audio controls src={URL.createObjectURL(audioFile)} className="audio-preview-aq" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                  className="btn-remove-file-aq"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Transcript */}
        <div className="form-group-aq">
          <label>Transcript (Bản ghi âm)</label>
          <textarea 
            className="form-textarea-aq"
            rows="4"
            placeholder="Nhập transcript của audio..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </div>
        
        {/* Question Text */}
        <div className="form-group-aq">
          <label>Câu hỏi *</label>
          <textarea 
            className="form-textarea-aq"
            rows="3"
            placeholder="Ví dụ: What is the main topic of the conversation?"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
        </div>
        
        {/* Options (if MCQ) */}
        {questionType === 'multiple_choice' && (
          <div className="form-group-aq">
            <label>Đáp án *</label>
            {options.map((opt, i) => (
              <input 
                key={i}
                type="text"
                placeholder={`${String.fromCharCode(65 + i)}. Đáp án ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                className="form-input-aq option-input"
              />
            ))}
            <select 
              className="form-select-aq"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
            >
              <option value="">Chọn đáp án đúng</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
        )}
        
        {/* Other question types */}
        {(questionType === 'fill_blank' || questionType === 'short_answer') && (
          <div className="form-group-aq">
            <label>Đáp án đúng *</label>
            <input 
              type="text"
              placeholder="Nhập đáp án..."
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="form-input-aq"
            />
          </div>
        )}
        
        {questionType === 'true_false' && (
          <div className="form-group-aq">
            <label>Đáp án đúng *</label>
            <select 
              className="form-select-aq"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
            >
              <option value="">Chọn...</option>
              <option value="true">Đúng</option>
              <option value="false">Sai</option>
            </select>
          </div>
        )}
      </div>
    );
  }
  
  // Speaking Form
  function renderSpeakingForm() {
    return (
      <div className="skill-form-section">
        <div className="section-title-aq">🗣️ Nội dung câu hỏi Nói</div>
        
        <div className="form-group-aq">
          <label>Đề bài *</label>
          <textarea 
            className="form-textarea-aq"
            rows="4"
            placeholder="Ví dụ: Describe your favorite book and explain why you like it."
            value={speakingPrompt}
            onChange={(e) => setSpeakingPrompt(e.target.value)}
          />
        </div>
        
        <div className="form-group-aq">
          <label>Hướng dẫn chi tiết</label>
          {speakingInstructions.map((inst, idx) => (
            <div key={idx} className="dynamic-input-row">
              <input 
                type="text"
                className="form-input-aq"
                placeholder={`Hướng dẫn ${idx + 1}`}
                value={inst}
                onChange={(e) => updateSpeakingInstruction(idx, e.target.value)}
              />
              {speakingInstructions.length > 1 && (
                <button 
                  onClick={() => removeSpeakingInstruction(idx)}
                  className="btn-remove-item-aq"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addSpeakingInstruction} className="btn-add-item-aq">
            <Plus size={14} />
            Thêm hướng dẫn
          </button>
        </div>
        
        <div className="form-row-aq">
          <div className="form-group-aq">
            <label>Thời gian chuẩn bị (giây)</label>
            <input 
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              className="form-input-aq"
            />
          </div>
          <div className="form-group-aq">
            <label>Thời gian nói (giây)</label>
            <input 
              type="number"
              value={speakTime}
              onChange={(e) => setSpeakTime(Number(e.target.value))}
              className="form-input-aq"
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Reading Form
  function renderReadingForm() {
    return (
      <div className="skill-form-section">
        <div className="section-title-aq">📖 Nội dung câu hỏi Đọc</div>
        
        <div className="form-group-aq">
          <label>Đoạn văn</label>
          <div className="toggle-switch-aq">
            <button 
              className={!useFile ? 'active' : ''}
              onClick={() => setUseFile(false)}
            >
              Nhập văn bản
            </button>
            <button 
              className={useFile ? 'active' : ''}
              onClick={() => setUseFile(true)}
            >
              Upload file
            </button>
          </div>
        </div>
        
        {!useFile ? (
          <div className="form-group-aq">
            <textarea 
              className="form-textarea-aq"
              rows="10"
              placeholder="Nhập hoặc paste đoạn văn..."
              value={readingPassage}
              onChange={(e) => setReadingPassage(e.target.value)}
            />
            <div className="text-stats-aq">
              <span>📊 {readingPassage.split(/\s+/).filter(w => w).length} từ</span>
              <span>📄 {readingPassage.length} ký tự</span>
            </div>
          </div>
        ) : (
          <div className="form-group-aq">
            <div className="upload-zone-aq" onClick={() => passageFileInputRef.current?.click()}>
              <input 
                ref={passageFileInputRef}
                type="file" 
                accept=".pdf,.doc,.docx,.txt"
                onChange={handlePassageFileUpload}
                style={{ display: 'none' }}
              />
              {!passageFile ? (
                <>
                  <FileText size={40} className="upload-icon-aq" />
                  <p>Click để chọn file</p>
                  <span className="upload-hint-aq">PDF, Word, hoặc Text - Tối đa 10MB</span>
                </>
              ) : (
                <div className="file-preview-aq">
                  <FileText size={24} />
                  <div className="file-info-aq">
                    <span className="file-name-aq">{passageFile.name}</span>
                    <span className="file-size-aq">{(passageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setPassageFile(null); }}
                    className="btn-remove-file-aq"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Question Text */}
        <div className="form-group-aq">
          <label>Câu hỏi *</label>
          <textarea 
            className="form-textarea-aq"
            rows="3"
            placeholder="Ví dụ: According to the passage, what is...?"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
        </div>
        
        {/* Same options as Listening */}
        {questionType === 'multiple_choice' && (
          <div className="form-group-aq">
            <label>Đáp án *</label>
            {options.map((opt, i) => (
              <input 
                key={i}
                type="text"
                placeholder={`${String.fromCharCode(65 + i)}. Đáp án ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                className="form-input-aq option-input"
              />
            ))}
            <select 
              className="form-select-aq"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
            >
              <option value="">Chọn đáp án đúng</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
        )}
        
        {(questionType === 'fill_blank' || questionType === 'short_answer') && (
          <div className="form-group-aq">
            <label>Đáp án đúng *</label>
            <input 
              type="text"
              placeholder="Nhập đáp án..."
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="form-input-aq"
            />
          </div>
        )}
      </div>
    );
  }
  
  // Writing Form
  function renderWritingForm() {
    return (
      <div className="skill-form-section">
        <div className="section-title-aq">✍️ Nội dung câu hỏi Viết</div>
        
        <div className="form-group-aq">
          <label>Đề bài *</label>
          <textarea 
            className="form-textarea-aq"
            rows="4"
            placeholder="Ví dụ: Write an essay about the importance of learning English..."
            value={writingPrompt}
            onChange={(e) => setWritingPrompt(e.target.value)}
          />
        </div>
        
        <div className="form-group-aq">
          <label>Loại bài viết</label>
          <select 
            value={writingType}
            onChange={(e) => setWritingType(e.target.value)}
            className="form-select-aq"
          >
            <option value="essay">Essay (Tiểu luận)</option>
            <option value="letter">Letter (Thư)</option>
            <option value="email">Email</option>
            <option value="report">Report (Báo cáo)</option>
            <option value="story">Story (Truyện ngắn)</option>
            <option value="review">Review (Bài nhận xét)</option>
          </select>
        </div>
        
        <div className="form-row-aq">
          <div className="form-group-aq">
            <label>Số từ tối thiểu *</label>
            <input 
              type="number"
              value={minWords}
              onChange={(e) => setMinWords(Number(e.target.value))}
              min="50"
              className="form-input-aq"
            />
          </div>
          <div className="form-group-aq">
            <label>Số từ tối đa *</label>
            <input 
              type="number"
              value={maxWords}
              onChange={(e) => setMaxWords(Number(e.target.value))}
              min="100"
              className="form-input-aq"
            />
          </div>
        </div>
        
        <div className="form-group-aq">
          <label>Yêu cầu chi tiết</label>
          {writingRequirements.map((req, idx) => (
            <div key={idx} className="dynamic-input-row">
              <input 
                type="text"
                className="form-input-aq"
                placeholder={`Yêu cầu ${idx + 1}`}
                value={req}
                onChange={(e) => updateWritingRequirement(idx, e.target.value)}
              />
              {writingRequirements.length > 1 && (
                <button 
                  onClick={() => removeWritingRequirement(idx)}
                  className="btn-remove-item-aq"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addWritingRequirement} className="btn-add-item-aq">
            <Plus size={14} />
            Thêm yêu cầu
          </button>
        </div>
      </div>
    );
  }
}

