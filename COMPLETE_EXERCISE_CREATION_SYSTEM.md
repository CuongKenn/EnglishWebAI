# 🎯 HỆ THỐNG TẠO BÀI TẬP HOÀN CHỈNH - 4 KỸ NĂNG + NGÂN HÀNG CÂU HỎI

## 📋 Tổng quan

Hệ thống hoàn chỉnh cho phép Teacher:
1. ✅ Tạo bài tập 4 kỹ năng với upload file đa dạng
2. ✅ Quản lý Ngân hàng câu hỏi
3. ✅ AI sinh đề từ ngân hàng câu hỏi
4. ✅ Xem chi tiết, chỉnh sửa, xóa bài tập
5. ✅ Download đề (AI hoặc manual)

---

## 🎨 I. EXERCISE MANAGEMENT - FORM CHI TIẾT

### A. Listening (Nghe) - Upload Audio

```jsx
<div className="listening-form">
  <h3>🎧 Tạo bài tập Nghe</h3>
  
  {/* Upload Audio File */}
  <div className="file-upload-section">
    <label>File Audio * (.mp3, .wav, .ogg)</label>
    <div className="upload-zone">
      <input 
        type="file" 
        accept="audio/*" 
        onChange={handleAudioUpload}
        id="audio-file"
      />
      <label htmlFor="audio-file" className="upload-label">
        <Upload size={32} />
        <p>Kéo thả file audio hoặc click để chọn</p>
        <span>Tối đa 50MB</span>
      </label>
    </div>
    
    {/* Preview uploaded audio */}
    {audioFile && (
      <div className="file-preview">
        <FileAudio size={24} />
        <div className="file-info">
          <span className="file-name">{audioFile.name}</span>
          <span className="file-size">{formatFileSize(audioFile.size)}</span>
        </div>
        <audio controls src={URL.createObjectURL(audioFile)} />
        <button onClick={removeAudioFile}>
          <Trash2 size={16} />
        </button>
      </div>
    )}
  </div>
  
  {/* Transcript */}
  <div className="form-group">
    <label>Transcript (Bản ghi âm)</label>
    <textarea 
      rows="8"
      placeholder="Nhập transcript của audio..."
    />
    <label className="checkbox-label">
      <input type="checkbox" />
      Hiển thị transcript cho học sinh
    </label>
  </div>
  
  {/* Questions Section */}
  <div className="questions-section">
    <div className="section-header">
      <h4>Câu hỏi</h4>
      <button onClick={openQuestionBank}>
        <Database size={18} />
        Chọn từ Ngân hàng
      </button>
      <button onClick={addNewQuestion}>
        <Plus size={18} />
        Thêm câu hỏi mới
      </button>
    </div>
    
    {questions.map((q, idx) => (
      <QuestionCard key={idx} question={q} onRemove={() => removeQuestion(idx)} />
    ))}
  </div>
</div>
```

### B. Speaking (Nói) - Đề bài Text

```jsx
<div className="speaking-form">
  <h3>🗣️ Tạo bài tập Nói</h3>
  
  {/* Prompt */}
  <div className="form-group">
    <label>Đề bài *</label>
    <textarea 
      rows="4"
      placeholder="Ví dụ: Describe your favorite book and explain why you like it."
    />
  </div>
  
  {/* Optional: Reference Audio (Teacher's sample) */}
  <div className="form-group">
    <label>Audio mẫu (tùy chọn)</label>
    <input 
      type="file" 
      accept="audio/*"
      onChange={handleSampleAudioUpload}
    />
    {sampleAudio && <audio controls src={sampleAudio} />}
  </div>
  
  {/* Instructions */}
  <div className="form-group">
    <label>Hướng dẫn chi tiết</label>
    {instructions.map((inst, idx) => (
      <div key={idx} className="instruction-row">
        <input 
          value={inst}
          onChange={(e) => updateInstruction(idx, e.target.value)}
          placeholder={`Hướng dẫn ${idx + 1}`}
        />
        <button onClick={() => removeInstruction(idx)}>
          <X size={16} />
        </button>
      </div>
    ))}
    <button onClick={addInstruction}>
      <Plus size={16} />
      Thêm hướng dẫn
    </button>
  </div>
  
  {/* Time Settings */}
  <div className="form-row">
    <div className="form-group">
      <label>Thời gian chuẩn bị (giây)</label>
      <input type="number" defaultValue="60" />
    </div>
    <div className="form-group">
      <label>Thời gian nói (giây)</label>
      <input type="number" defaultValue="180" />
    </div>
  </div>
  
  {/* Sample Answer */}
  <div className="form-group">
    <label>Bài mẫu (tùy chọn)</label>
    <textarea rows="6" placeholder="Nhập bài mẫu..." />
  </div>
</div>
```

### C. Reading (Đọc) - Upload File hoặc Text

```jsx
<div className="reading-form">
  <h3>📖 Tạo bài tập Đọc</h3>
  
  {/* Input Method Selection */}
  <div className="input-method-tabs">
    <button 
      className={inputMethod === 'text' ? 'active' : ''}
      onClick={() => setInputMethod('text')}
    >
      <FileText size={18} />
      Nhập văn bản
    </button>
    <button 
      className={inputMethod === 'upload' ? 'active' : ''}
      onClick={() => setInputMethod('upload')}
    >
      <Upload size={18} />
      Upload file
    </button>
  </div>
  
  {/* Text Input */}
  {inputMethod === 'text' && (
    <div className="form-group">
      <label>Đoạn văn *</label>
      <textarea 
        rows="15"
        placeholder="Nhập hoặc paste đoạn văn..."
        onChange={handlePassageChange}
      />
      <div className="text-stats">
        <span>📊 {wordCount} từ</span>
        <span>📄 {charCount} ký tự</span>
      </div>
    </div>
  )}
  
  {/* File Upload */}
  {inputMethod === 'upload' && (
    <div className="file-upload-section">
      <label>Upload file (.pdf, .docx, .txt)</label>
      <div className="upload-zone">
        <input 
          type="file" 
          accept=".pdf,.doc,.docx,.txt"
          onChange={handlePassageFileUpload}
          id="passage-file"
        />
        <label htmlFor="passage-file" className="upload-label">
          <FileText size={32} />
          <p>Kéo thả file hoặc click để chọn</p>
          <span>PDF, Word, hoặc Text - Tối đa 10MB</span>
        </label>
      </div>
      
      {passageFile && (
        <div className="file-preview">
          <File size={24} />
          <div className="file-info">
            <span className="file-name">{passageFile.name}</span>
            <span className="file-size">{formatFileSize(passageFile.size)}</span>
          </div>
          <button onClick={previewPassageFile}>
            <Eye size={16} />
            Xem trước
          </button>
          <button onClick={removePassageFile}>
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  )}
  
  {/* Questions (similar to Listening) */}
  <div className="questions-section">
    {/* Same as Listening */}
  </div>
</div>
```

### D. Writing (Viết) - Đề bài Text

```jsx
<div className="writing-form">
  <h3>✍️ Tạo bài tập Viết</h3>
  
  {/* Prompt */}
  <div className="form-group">
    <label>Đề bài *</label>
    <textarea 
      rows="4"
      placeholder="Ví dụ: Write an essay about the importance of learning English..."
    />
  </div>
  
  {/* Type Selection */}
  <div className="form-group">
    <label>Loại bài viết</label>
    <select>
      <option value="essay">Essay (Tiểu luận)</option>
      <option value="letter">Letter (Thư)</option>
      <option value="email">Email</option>
      <option value="report">Report (Báo cáo)</option>
      <option value="story">Story (Truyện ngắn)</option>
      <option value="review">Review (Bài nhận xét)</option>
    </select>
  </div>
  
  {/* Word Limit */}
  <div className="form-row">
    <div className="form-group">
      <label>Số từ tối thiểu *</label>
      <input type="number" defaultValue="250" min="50" />
    </div>
    <div className="form-group">
      <label>Số từ tối đa *</label>
      <input type="number" defaultValue="400" min="100" />
    </div>
  </div>
  
  {/* Instructions */}
  <div className="form-group">
    <label>Yêu cầu chi tiết</label>
    {instructions.map((inst, idx) => (
      <div key={idx} className="instruction-row">
        <input 
          value={inst}
          placeholder={`Yêu cầu ${idx + 1}`}
        />
        <button onClick={() => removeInstruction(idx)}>
          <X size={16} />
        </button>
      </div>
    ))}
    <button onClick={addInstruction}>
      <Plus size={16} />
      Thêm yêu cầu
    </button>
  </div>
  
  {/* Sample Essay */}
  <div className="form-group">
    <label>Bài mẫu (tùy chọn)</label>
    <textarea rows="10" placeholder="Nhập bài mẫu..." />
  </div>
  
  {/* Or Upload Sample */}
  <div className="form-group">
    <label>Hoặc upload bài mẫu (.pdf, .docx)</label>
    <input type="file" accept=".pdf,.doc,.docx" />
  </div>
</div>
```

---

## 🗄️ II. NGÂN HÀNG CÂU HỎI (Question Bank)

### A. Cấu trúc Database

```sql
CREATE TABLE question_bank (
  id INT PRIMARY KEY,
  teacher_id INT NOT NULL,
  
  -- Question Content
  question_text TEXT NOT NULL,
  question_type VARCHAR NOT NULL,  -- 'multiple_choice' | 'fill_blank' | 'true_false' | 'short_answer'
  
  -- For Multiple Choice
  options JSON,                     -- ["A. Option 1", "B. Option 2", ...]
  correct_answer VARCHAR,           -- "A" or "B" or text
  
  -- Metadata
  skill_type VARCHAR,               -- 'listening' | 'speaking' | 'reading' | 'writing'
  difficulty VARCHAR,               -- 'easy' | 'medium' | 'hard'
  topic VARCHAR,                    -- "Grammar", "Vocabulary", "Comprehension", etc.
  tags JSON,                        -- ["present_perfect", "tense", "grammar"]
  points FLOAT DEFAULT 1,
  
  -- Usage tracking
  times_used INT DEFAULT 0,
  last_used_at DATETIME,
  
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW()
);
```

### B. QuestionBank Component UI

```jsx
<div className="question-bank-container">
  {/* Header */}
  <div className="qb-header">
    <h1>Ngân hàng Câu hỏi</h1>
    <div className="qb-actions">
      <button onClick={openImportModal}>
        <Upload size={18} />
        Import từ Excel
      </button>
      <button onClick={openAddQuestionModal}>
        <Plus size={18} />
        Thêm câu hỏi
      </button>
    </div>
  </div>
  
  {/* Stats */}
  <div className="qb-stats">
    <div className="stat-card">
      <FileQuestion size={32} />
      <div>
        <div className="stat-value">{totalQuestions}</div>
        <div className="stat-label">Tổng câu hỏi</div>
      </div>
    </div>
    <div className="stat-card">
      <Zap size={32} />
      <div>
        <div className="stat-value">{easyCount}</div>
        <div className="stat-label">Dễ</div>
      </div>
    </div>
    <div className="stat-card">
      <TrendingUp size={32} />
      <div>
        <div className="stat-value">{mediumCount}</div>
        <div className="stat-label">Trung bình</div>
      </div>
    </div>
    <div className="stat-card">
      <AlertTriangle size={32} />
      <div>
        <div className="stat-value">{hardCount}</div>
        <div className="stat-label">Khó</div>
      </div>
    </div>
  </div>
  
  {/* Filters */}
  <div className="qb-filters">
    <select onChange={filterBySkill}>
      <option value="">Tất cả kỹ năng</option>
      <option value="listening">Nghe</option>
      <option value="speaking">Nói</option>
      <option value="reading">Đọc</option>
      <option value="writing">Viết</option>
    </select>
    
    <select onChange={filterByType}>
      <option value="">Tất cả loại</option>
      <option value="multiple_choice">Trắc nghiệm</option>
      <option value="fill_blank">Điền từ</option>
      <option value="true_false">Đúng/Sai</option>
      <option value="short_answer">Tự luận ngắn</option>
    </select>
    
    <select onChange={filterByDifficulty}>
      <option value="">Tất cả độ khó</option>
      <option value="easy">Dễ</option>
      <option value="medium">Trung bình</option>
      <option value="hard">Khó</option>
    </select>
    
    <input 
      type="search" 
      placeholder="Tìm kiếm câu hỏi..."
      onChange={handleSearch}
    />
  </div>
  
  {/* Question List */}
  <div className="qb-list">
    {questions.map((q) => (
      <div key={q.id} className="question-card-bank">
        <div className="question-card-header">
          <span className={`difficulty-badge ${q.difficulty}`}>
            {q.difficulty}
          </span>
          <span className={`skill-badge ${q.skill_type}`}>
            {getSkillIcon(q.skill_type)} {q.skill_type}
          </span>
          <span className="type-badge">{q.question_type}</span>
        </div>
        
        <div className="question-card-body">
          <p className="question-text">{q.question_text}</p>
          {q.question_type === 'multiple_choice' && (
            <div className="options-preview">
              {q.options.map((opt, i) => (
                <span key={i} className={opt[0] === q.correct_answer ? 'correct' : ''}>
                  {opt}
                </span>
              ))}
            </div>
          )}
          {q.topic && <span className="topic-tag">{q.topic}</span>}
        </div>
        
        <div className="question-card-footer">
          <span className="usage-info">
            Đã dùng: {q.times_used} lần
          </span>
          <div className="question-actions">
            <button onClick={() => editQuestion(q)}>
              <Edit size={16} />
            </button>
            <button onClick={() => duplicateQuestion(q)}>
              <Copy size={16} />
            </button>
            <button onClick={() => deleteQuestion(q.id)}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
  
  {/* Generate Test from Question Bank */}
  <div className="generate-test-section">
    <h3>Tạo đề từ Ngân hàng</h3>
    <div className="generate-form">
      <div className="form-row">
        <select>
          <option>Chọn kỹ năng</option>
          <option value="listening">Nghe</option>
          <option value="reading">Đọc</option>
        </select>
        <select>
          <option>Độ khó</option>
          <option value="easy">Dễ</option>
          <option value="medium">TB</option>
          <option value="hard">Khó</option>
        </select>
        <input 
          type="number" 
          placeholder="Số câu hỏi"
          min="5"
          max="50"
        />
      </div>
      <button className="btn-generate-test">
        <Sparkles size={18} />
        Tạo đề tự động
      </button>
    </div>
  </div>
</div>
```

---

## 🤖 III. AI GENERATE VỚI QUESTION BANK

### A. UI trong ExerciseManagement

```jsx
{/* Khi chọn "AI Sinh đề" */}
<div className="ai-generate-section">
  <div className="ai-options">
    {/* Option 1: AI tự sinh từ files */}
    <label className="ai-option-card">
      <input 
        type="radio" 
        name="ai-source"
        value="files"
        checked={aiSource === 'files'}
        onChange={(e) => setAiSource(e.target.value)}
      />
      <div className="option-content">
        <FileUp size={24} />
        <h4>Sinh từ Files</h4>
        <p>AI phân tích files bạn upload và tạo đề mới</p>
      </div>
    </label>
    
    {/* Option 2: Lấy từ Question Bank */}
    <label className="ai-option-card">
      <input 
        type="radio" 
        name="ai-source"
        value="question_bank"
        checked={aiSource === 'question_bank'}
        onChange={(e) => setAiSource(e.target.value)}
      />
      <div className="option-content">
        <Database size={24} />
        <h4>Lấy từ Ngân hàng Câu hỏi</h4>
        <p>AI chọn câu hỏi phù hợp từ ngân hàng của bạn</p>
      </div>
    </label>
  </div>
  
  {/* If AI source = files */}
  {aiSource === 'files' && (
    <div className="ai-upload-section">
      {/* Upload multiple files */}
      <div className="upload-zone-multiple">
        <Upload size={40} />
        <p>Upload tài liệu tham khảo (có thể nhiều files)</p>
        <input 
          type="file" 
          multiple 
          onChange={handleFilesUpload}
        />
      </div>
      <div className="uploaded-files-list">
        {uploadedFiles.map((file, idx) => (
          <div key={idx} className="uploaded-file-item">
            <File size={18} />
            <span>{file.name}</span>
            <button onClick={() => removeFile(idx)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )}
  
  {/* If AI source = question_bank */}
  {aiSource === 'question_bank' && (
    <div className="ai-qb-section">
      <h4>Cấu hình tạo đề từ Ngân hàng</h4>
      
      <div className="form-row">
        <div className="form-group">
          <label>Số câu hỏi</label>
          <input type="number" defaultValue="10" min="5" max="50" />
        </div>
        <div className="form-group">
          <label>Độ khó</label>
          <select>
            <option value="mixed">Trộn lẫn</option>
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
        </div>
      </div>
      
      <div className="form-group">
        <label>Chủ đề (tùy chọn)</label>
        <input type="text" placeholder="Ví dụ: Grammar, Vocabulary, etc." />
      </div>
      
      <div className="difficulty-distribution">
        <h5>Phân bố độ khó (nếu chọn Trộn lẫn)</h5>
        <div className="slider-group">
          <label>Dễ: {easyPercent}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={easyPercent}
            onChange={(e) => setEasyPercent(e.target.value)}
          />
        </div>
        <div className="slider-group">
          <label>TB: {mediumPercent}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={mediumPercent}
          />
        </div>
        <div className="slider-group">
          <label>Khó: {hardPercent}%</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={hardPercent}
          />
        </div>
      </div>
    </div>
  )}
  
  {/* AI Prompt */}
  <div className="form-group">
    <label>Yêu cầu bổ sung với AI (tùy chọn)</label>
    <textarea 
      rows="4"
      placeholder="Ví dụ: Tạo câu hỏi về thì hiện tại hoàn thành, tránh câu hỏi quá dài..."
    />
  </div>
  
  {/* Generate Button */}
  <button className="btn-ai-generate">
    <Sparkles size={20} />
    {aiSource === 'files' ? 'AI Phân tích & Tạo đề' : 'AI Chọn câu & Tạo đề'}
  </button>
</div>
```

---

## 👁️ IV. EXERCISE DETAIL MODAL (Popup)

### A. ExerciseDetailModal Component

```jsx
<Modal 
  isOpen={showDetailModal} 
  onClose={() => setShowDetailModal(false)}
  size="large"
>
  <div className="exercise-detail-modal">
    {/* Header */}
    <div className="modal-header-detail">
      <div>
        <h2>{exercise.title}</h2>
        <div className="exercise-meta">
          <span className={`skill-badge ${exercise.skill_type}`}>
            {getSkillIcon(exercise.skill_type)} {exercise.skill_type}
          </span>
          <span className={`type-badge ${exercise.type}`}>
            {exercise.type}
          </span>
          <span className="class-info">{exercise.class_name}</span>
        </div>
      </div>
      <button className="close-btn" onClick={onClose}>×</button>
    </div>
    
    {/* Content based on skill_type */}
    <div className="modal-body-detail">
      {/* LISTENING */}
      {exercise.skill_type === 'listening' && (
        <div className="listening-detail">
          <div className="audio-section-detail">
            <h3>🎧 Audio</h3>
            <audio controls src={exercise.content.audio_url} />
            <a href={exercise.content.audio_url} download>
              <Download size={16} />
              Tải xuống audio
            </a>
          </div>
          
          {exercise.content.transcript && (
            <div className="transcript-section-detail">
              <h3>📄 Transcript</h3>
              <p>{exercise.content.transcript}</p>
            </div>
          )}
          
          <div className="questions-section-detail">
            <h3>Câu hỏi ({exercise.content.questions.length})</h3>
            {exercise.content.questions.map((q, idx) => (
              <div key={idx} className="question-preview">
                <div className="q-header">
                  <span>Câu {idx + 1}</span>
                  <span>{q.points} điểm</span>
                </div>
                <p>{q.question}</p>
                {q.type === 'multiple_choice' && (
                  <div className="options-preview">
                    {q.options.map((opt, i) => (
                      <div key={i} className={opt[0] === q.correct_answer ? 'correct-option' : ''}>
                        {opt} {opt[0] === q.correct_answer && '✓'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* SPEAKING */}
      {exercise.skill_type === 'speaking' && (
        <div className="speaking-detail">
          <div className="prompt-section-detail">
            <h3>Đề bài</h3>
            <p className="prompt-text">{exercise.content.prompt}</p>
          </div>
          
          <div className="instructions-section-detail">
            <h3>Hướng dẫn</h3>
            <ul>
              {exercise.content.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>
          
          <div className="time-info">
            <div>⏰ Chuẩn bị: {exercise.content.preparation_time}s</div>
            <div>🎤 Thời gian nói: {exercise.content.time_limit}s</div>
          </div>
          
          {exercise.content.sample_answer && (
            <div className="sample-section-detail">
              <h3>Bài mẫu</h3>
              <p>{exercise.content.sample_answer}</p>
            </div>
          )}
        </div>
      )}
      
      {/* READING */}
      {exercise.skill_type === 'reading' && (
        <div className="reading-detail">
          <div className="passage-section-detail">
            <h3>📖 Đoạn văn</h3>
            {exercise.content.passage_url ? (
              <div className="file-attachment">
                <File size={24} />
                <a href={exercise.content.passage_url} target="_blank">
                  Xem file đính kèm
                </a>
                <a href={exercise.content.passage_url} download>
                  <Download size={16} />
                  Tải xuống
                </a>
              </div>
            ) : (
              <div className="passage-text-display">
                {exercise.content.passage}
              </div>
            )}
            <div className="passage-stats">
              <span>📊 {exercise.content.word_count} từ</span>
            </div>
          </div>
          
          <div className="questions-section-detail">
            {/* Similar to Listening */}
          </div>
        </div>
      )}
      
      {/* WRITING */}
      {exercise.skill_type === 'writing' && (
        <div className="writing-detail">
          <div className="prompt-section-detail">
            <h3>Đề bài</h3>
            <p className="prompt-text">{exercise.content.prompt}</p>
          </div>
          
          <div className="writing-info">
            <div>📝 Loại: {exercise.content.type}</div>
            <div>📏 Số từ: {exercise.content.word_limit.min} - {exercise.content.word_limit.max}</div>
          </div>
          
          <div className="requirements-section-detail">
            <h3>Yêu cầu</h3>
            <ul>
              {exercise.content.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>
          
          {exercise.content.sample_essay && (
            <div className="sample-section-detail">
              <h3>Bài mẫu</h3>
              <div className="essay-text">{exercise.content.sample_essay}</div>
            </div>
          )}
        </div>
      )}
    </div>
    
    {/* Footer Actions */}
    <div className="modal-footer-detail">
      <div className="left-actions">
        <button className="btn-download-exercise" onClick={handleDownload}>
          <Download size={18} />
          Tải xuống đề (.pdf)
        </button>
        {exercise.ai_generated && (
          <span className="ai-badge-detail">
            <Sparkles size={14} />
            AI Generated
          </span>
        )}
      </div>
      <div className="right-actions">
        <button className="btn-delete" onClick={handleDelete}>
          <Trash2 size={18} />
          Xóa
        </button>
        <button className="btn-edit" onClick={handleEdit}>
          <Edit size={18} />
          Chỉnh sửa
        </button>
      </div>
    </div>
  </div>
</Modal>
```

---

## 📥 V. DOWNLOAD FEATURES

### A. Download Exercise as PDF

```javascript
// API endpoint
POST /api/v1/exercises/:id/download
Response: PDF file

// Frontend
const handleDownloadExercise = async (exerciseId) => {
  try {
    const response = await apiV1.post(
      `/exercises/${exerciseId}/download`,
      { format: 'pdf' },
      { responseType: 'blob' }
    );
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exercise.title}.pdf`;
    link.click();
  } catch (error) {
    console.error('Download failed:', error);
  }
};
```

### B. Download from Question Bank

```javascript
// Generate test from question bank and download
const handleGenerateAndDownload = async () => {
  try {
    const response = await apiV1.post('/question-bank/generate-test', {
      skill_type: 'reading',
      difficulty: 'mixed',
      question_count: 10,
      topic: 'Grammar'
    }, { responseType: 'blob' });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Generated_Test_${Date.now()}.pdf`;
    link.click();
  } catch (error) {
    console.error('Generate and download failed:', error);
  }
};
```

---

## 🔄 VI. COMPLETE FLOW

### Teacher creates exercise with 4 skills:

```
1. Vào "Bài tập & Kiểm tra"
2. Click "Tạo bài tập mới"
3. Chọn loại & kỹ năng
4. Điền form tương ứng:
   - Listening: Upload audio (.mp3) + câu hỏi
   - Speaking: Đề bài text + instructions
   - Reading: Upload file (.pdf) hoặc paste text + câu hỏi
   - Writing: Đề bài text + yêu cầu
5. (Optional) Chọn từ Question Bank
6. (Optional) AI sinh đề (từ files hoặc từ QB)
7. Preview
8. Lưu
9. (Optional) Download PDF
```

### Question Bank Flow:

```
1. Vào "Ngân hàng Câu hỏi"
2. Thêm câu hỏi:
   - Manual: Form thêm từng câu
   - Import: Upload Excel
3. Filter & Search
4. Tạo đề từ QB:
   - Chọn skill, difficulty, số câu
   - AI tự động chọn câu phù hợp
   - Download PDF
5. Hoặc dùng trong Exercise Management
```

---

**Version:** 1.0  
**Status:** Design Complete  
**Next:** Implementation

