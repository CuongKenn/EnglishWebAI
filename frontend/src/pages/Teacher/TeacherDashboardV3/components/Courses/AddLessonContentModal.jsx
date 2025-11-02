import { useState, useRef } from 'react';
import { X, FileAudio, File, Plus, Trash2, Database, FileText, Upload, Headphones, Mic, BookOpen, PenLine, BarChart3 } from 'lucide-react';
import '../ExerciseManagement/ExerciseManagement.css';
import QuestionBankSelectorModal from '../ExerciseManagement/QuestionBankSelectorModal';

export default function AddLessonContentModal({ lessonId, courseId, onClose, onAdd }) {
  const [selectedSkill, setSelectedSkill] = useState('listening');
  
  // Listening fields
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const audioInputRef = useRef(null);
  
  // Reading fields
  const [readingInputMethod, setReadingInputMethod] = useState('text');
  const [passageText, setPassageText] = useState('');
  const [passageFile, setPassageFile] = useState(null);
  const passageFileInputRef = useRef(null);
  
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
  
  // File handlers
  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) setAudioFile(file);
  };
  
  const handlePassageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setPassageFile(file);
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
  
  const handleQuestionsFromBank = (selectedQuestions) => {
    setQuestions([...questions, ...selectedQuestions]);
    setShowQuestionBankModal(false);
  };
  
  // Instructions handlers (reuse logic from CreateExerciseModalComplete)
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
  
  const handleSubmit = () => {
    const lessonContent = {
      lesson_id: lessonId,
      course_id: courseId,
      skill_type: selectedSkill,
      content: {},
      files: {
        audio_file: audioFile,
        passage_file: passageFile
      }
    };
    
    // Build content based on skill
    if (selectedSkill === 'listening') {
      lessonContent.content = {
        audio_url: audioFile ? URL.createObjectURL(audioFile) : null,
        transcript,
        show_transcript: showTranscript,
        questions
      };
    } else if (selectedSkill === 'speaking') {
      lessonContent.content = {
        prompt: speakingPrompt,
        instructions: speakingInstructions.filter(i => i),
        preparation_time: prepTime,
        time_limit: speakTime
      };
    } else if (selectedSkill === 'reading') {
      lessonContent.content = {
        passage: passageText,
        passage_url: passageFile ? URL.createObjectURL(passageFile) : null,
        word_count: passageText.split(/\s+/).filter(w => w).length,
        questions
      };
    } else if (selectedSkill === 'writing') {
      lessonContent.content = {
        prompt: writingPrompt,
        type: writingType,
        instructions: writingInstructions.filter(i => i),
        word_limit: { min: minWords, max: maxWords }
      };
    }
    
    onAdd(lessonContent);
  };
  
  // NOTE: Render functions are exact copies from CreateExerciseModalComplete
  // For brevity, they're included inline here but reference the same logic
  
  return (
    <div className="exercise-modal-overlay" onClick={onClose}>
      <div className="exercise-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-ex">
          <h2>Thêm Nội dung Bài học</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body-ex">
          {/* Skill Selection */}
          <div className="form-section-ex">
            <label className="form-label-ex">Kỹ năng</label>
            <div className="skill-selector-ex">
              <label className="skill-option-ex">
                <input 
                  type="radio" 
                  name="skill" 
                  value="listening" 
                  checked={selectedSkill === 'listening'}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                />
                <span><Headphones className="inline-block w-4 h-4 mr-1" /> Nghe</span>
              </label>
              <label className="skill-option-ex">
                <input 
                  type="radio" 
                  name="skill" 
                  value="speaking"
                  checked={selectedSkill === 'speaking'}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                />
                <span><Mic className="inline-block w-4 h-4 mr-1" /> Nói</span>
              </label>
              <label className="skill-option-ex">
                <input 
                  type="radio" 
                  name="skill" 
                  value="reading"
                  checked={selectedSkill === 'reading'}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                />
                <span><BookOpen className="inline-block w-4 h-4 mr-1" /> Đọc</span>
              </label>
              <label className="skill-option-ex">
                <input 
                  type="radio" 
                  name="skill" 
                  value="writing"
                  checked={selectedSkill === 'writing'}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                />
                <span><PenLine className="inline-block w-4 h-4 mr-1" /> Viết</span>
              </label>
            </div>
          </div>
          
          {/* Conditional content based on skill - Use same render functions */}
          {selectedSkill === 'listening' && (
            <div className="listening-form-content">
              <h4 className="section-title"><Headphones className="inline-block w-5 h-5 mr-2" /> Nội dung bài Nghe</h4>
              <div className="form-section-ex">
                <label className="form-label-ex">File Audio *</label>
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
                      <FileAudio size={40} />
                      <p>Click để chọn file audio</p>
                    </>
                  ) : (
                    <div className="file-preview-box">
                      <FileAudio size={28} />
                      <span>{audioFile.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-section-ex">
                <label className="form-label-ex">Transcript</label>
                <textarea 
                  className="form-textarea-ex"
                  rows="6"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                />
                <label>
                  <input 
                    type="checkbox"
                    checked={showTranscript}
                    onChange={(e) => setShowTranscript(e.target.checked)}
                  />
                  Hiển thị transcript
                </label>
              </div>
              
              {renderQuestionsSection()}
            </div>
          )}
          
          {selectedSkill === 'speaking' && (
            <div className="speaking-form-content">
              <h4 className="section-title"><Mic className="inline-block w-5 h-5 mr-2" /> Nội dung bài Nói</h4>
              <div className="form-section-ex">
                <label className="form-label-ex">Đề bài *</label>
                <textarea 
                  className="form-textarea-ex"
                  rows="4"
                  value={speakingPrompt}
                  onChange={(e) => setSpeakingPrompt(e.target.value)}
                />
              </div>
              
              <div className="form-section-ex">
                <label className="form-label-ex">Hướng dẫn</label>
                {speakingInstructions.map((inst, idx) => (
                  <div key={idx} className="instruction-row">
                    <input 
                      type="text"
                      className="form-input-ex"
                      value={inst}
                      onChange={(e) => updateSpeakingInstruction(idx, e.target.value)}
                    />
                    {speakingInstructions.length > 1 && (
                      <button onClick={() => removeSpeakingInstruction(idx)}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addSpeakingInstruction} className="btn-add-item">
                  <Plus size={16} /> Thêm hướng dẫn
                </button>
              </div>
              
              <div className="form-row-ex">
                <div className="form-section-ex">
                  <label>Thời gian chuẩn bị (giây)</label>
                  <input 
                    type="number" 
                    className="form-input-ex"
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                  />
                </div>
                <div className="form-section-ex">
                  <label>Thời gian nói (giây)</label>
                  <input 
                    type="number" 
                    className="form-input-ex"
                    value={speakTime}
                    onChange={(e) => setSpeakTime(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}
          
          {selectedSkill === 'reading' && (
            <div className="reading-form-content">
              <h4 className="section-title"><BookOpen className="inline-block w-5 h-5 mr-2" /> Nội dung bài Đọc</h4>
              <div className="input-method-tabs">
                <button 
                  className={`method-tab ${readingInputMethod === 'text' ? 'active' : ''}`}
                  onClick={() => setReadingInputMethod('text')}
                >
                  <FileText size={18} /> Nhập văn bản
                </button>
                <button 
                  className={`method-tab ${readingInputMethod === 'upload' ? 'active' : ''}`}
                  onClick={() => setReadingInputMethod('upload')}
                >
                  <Upload size={18} /> Upload file
                </button>
              </div>
              
              {readingInputMethod === 'text' ? (
                <div className="form-section-ex">
                  <textarea 
                    className="form-textarea-ex"
                    rows="15"
                    value={passageText}
                    onChange={(e) => setPassageText(e.target.value)}
                  />
                  <div className="text-stats">
                    <BarChart3 className="inline-block w-4 h-4 mr-1" /> {passageText.split(/\s+/).filter(w => w).length} từ
                  </div>
                </div>
              ) : (
                <div className="form-section-ex">
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
                        <File size={40} />
                        <p>Click để chọn file</p>
                      </>
                    ) : (
                      <div className="file-preview-box">
                        <File size={28} />
                        <span>{passageFile.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); setPassageFile(null); }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {renderQuestionsSection()}
            </div>
          )}
          
          {selectedSkill === 'writing' && (
            <div className="writing-form-content">
              <h4 className="section-title"><PenLine className="inline-block w-5 h-5 mr-2" /> Nội dung bài Viết</h4>
              <div className="form-section-ex">
                <label className="form-label-ex">Đề bài *</label>
                <textarea 
                  className="form-textarea-ex"
                  rows="4"
                  value={writingPrompt}
                  onChange={(e) => setWritingPrompt(e.target.value)}
                />
              </div>
              
              <div className="form-section-ex">
                <label>Loại bài viết</label>
                <select 
                  className="form-select-ex"
                  value={writingType}
                  onChange={(e) => setWritingType(e.target.value)}
                >
                  <option value="essay">Essay</option>
                  <option value="letter">Letter</option>
                  <option value="email">Email</option>
                  <option value="report">Report</option>
                </select>
              </div>
              
              <div className="form-row-ex">
                <div className="form-section-ex">
                  <label>Số từ tối thiểu</label>
                  <input 
                    type="number" 
                    className="form-input-ex"
                    value={minWords}
                    onChange={(e) => setMinWords(Number(e.target.value))}
                  />
                </div>
                <div className="form-section-ex">
                  <label>Số từ tối đa</label>
                  <input 
                    type="number" 
                    className="form-input-ex"
                    value={maxWords}
                    onChange={(e) => setMaxWords(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="form-section-ex">
                <label>Yêu cầu</label>
                {writingInstructions.map((inst, idx) => (
                  <div key={idx} className="instruction-row">
                    <input 
                      type="text"
                      className="form-input-ex"
                      value={inst}
                      onChange={(e) => updateWritingInstruction(idx, e.target.value)}
                    />
                    {writingInstructions.length > 1 && (
                      <button onClick={() => removeWritingInstruction(idx)}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addWritingInstruction} className="btn-add-item">
                  <Plus size={16} /> Thêm yêu cầu
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer-ex">
          <button className="btn-cancel-ex" onClick={onClose}>Hủy</button>
          <button className="btn-create-ex" onClick={handleSubmit}>
            <Plus size={18} />
            Thêm nội dung
          </button>
        </div>
      </div>
      
      {showQuestionBankModal && (
        <QuestionBankSelectorModal
          skillType={selectedSkill}
          onClose={() => setShowQuestionBankModal(false)}
          onSelect={handleQuestionsFromBank}
        />
      )}
    </div>
  );
  
  // Questions Section (simplified)
  function renderQuestionsSection() {
    return (
      <div className="questions-section-form">
        <div className="section-header-with-actions">
          <h4>Câu hỏi</h4>
          <div className="question-actions">
            <button className="btn-from-bank" onClick={() => setShowQuestionBankModal(true)}>
              <Database size={16} /> Từ Ngân hàng
            </button>
            <button className="btn-add-question" onClick={addQuestion}>
              <Plus size={16} /> Thêm câu hỏi
            </button>
          </div>
        </div>
        
        {questions.length === 0 ? (
          <div className="empty-questions">
            <p>Chưa có câu hỏi</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="question-form-card">
              <div className="question-form-header">
                <span>Câu {idx + 1}</span>
                <button onClick={() => removeQuestion(idx)}>
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="form-section-ex">
                <label>Loại</label>
                <select 
                  className="form-select-ex"
                  value={q.type}
                  onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                >
                  <option value="multiple_choice">Trắc nghiệm</option>
                  <option value="fill_blank">Điền từ</option>
                  <option value="true_false">Đúng/Sai</option>
                  <option value="short_answer">Tự luận</option>
                </select>
              </div>
              
              <div className="form-section-ex">
                <label>Câu hỏi</label>
                <input 
                  type="text"
                  className="form-input-ex"
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
                      placeholder={`${String.fromCharCode(65 + optIdx)}. Đáp án`}
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
              )}
              
              {(q.type === 'fill_blank' || q.type === 'short_answer') && (
                <div className="form-section-ex">
                  <label>Đáp án đúng</label>
                  <input 
                    type="text"
                    className="form-input-ex"
                    value={q.correct_answer}
                    onChange={(e) => updateQuestion(idx, 'correct_answer', e.target.value)}
                  />
                </div>
              )}
              
              {q.type === 'true_false' && (
                <div className="form-section-ex">
                  <label>Đáp án</label>
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
}

