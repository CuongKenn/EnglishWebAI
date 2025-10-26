# 🎯 THIẾT KẾ BÀI TẬP 4 KỸ NĂNG

## 📋 Tổng quan

Hệ thống bài tập hỗ trợ **4 kỹ năng** với cấu trúc dữ liệu và UI riêng biệt:
1. 🎧 **Listening (Nghe)**
2. 🗣️ **Speaking (Nói)**
3. 📖 **Reading (Đọc)**
4. ✍️ **Writing (Viết)**

---

## 🗄️ I. CẤU TRÚC DỮ LIỆU (Database)

### Table: `exercises`

```sql
CREATE TABLE exercises (
  id INT PRIMARY KEY,
  class_id INT NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL,              -- 'skill_exercise' | 'test_15min' | 'midterm' | 'final'
  skill_type VARCHAR,                 -- 'listening' | 'speaking' | 'reading' | 'writing'
  max_score FLOAT NOT NULL,
  due_at DATETIME,
  enable_ai_grading BOOLEAN DEFAULT false,
  
  -- CONTENT STRUCTURE (JSON)
  content JSON,                       -- Cấu trúc khác nhau cho từng kỹ năng
  
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT NOW()
);
```

### Content Structure cho từng kỹ năng:

#### 1. 🎧 LISTENING (Nghe)

```json
{
  "skill": "listening",
  "audio_url": "/uploads/audio/listening_unit5.mp3",
  "transcript": "This is the full transcript...",
  "show_transcript": false,
  "duration": 180,
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "What is the main topic?",
      "options": ["A. Travel", "B. Food", "C. Sports", "D. Music"],
      "correct_answer": "A",
      "points": 2
    },
    {
      "id": 2,
      "type": "fill_blank",
      "question": "The speaker mentioned _____ countries.",
      "correct_answer": "five",
      "points": 2
    },
    {
      "id": 3,
      "type": "true_false",
      "question": "The speaker has never been to Paris.",
      "correct_answer": false,
      "points": 1
    }
  ]
}
```

#### 2. 🗣️ SPEAKING (Nói)

```json
{
  "skill": "speaking",
  "prompt": "Describe your favorite holiday destination.",
  "instructions": [
    "Speak for 2-3 minutes",
    "Include: location, activities, why you like it",
    "Use past tense and descriptive adjectives"
  ],
  "time_limit": 180,
  "preparation_time": 60,
  "sample_answer": "Last summer, I visited...",
  "rubrics": {
    "pronunciation": 25,
    "fluency": 25,
    "vocabulary": 25,
    "grammar": 25
  }
}
```

#### 3. 📖 READING (Đọc)

```json
{
  "skill": "reading",
  "passage": "Climate change is one of the most pressing issues... (full text)",
  "passage_type": "article",
  "word_count": 450,
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "According to the passage, what is the main cause of climate change?",
      "options": ["A. Deforestation", "B. Fossil fuels", "C. Agriculture", "D. All of the above"],
      "correct_answer": "D",
      "points": 2
    },
    {
      "id": 2,
      "type": "short_answer",
      "question": "List three effects of climate change mentioned in the passage.",
      "sample_answer": "Rising sea levels, extreme weather, biodiversity loss",
      "points": 3
    },
    {
      "id": 3,
      "type": "matching",
      "question": "Match the terms with their definitions:",
      "pairs": [
        {"term": "Carbon footprint", "definition": "Total greenhouse gas emissions"},
        {"term": "Renewable energy", "definition": "Energy from natural sources"}
      ],
      "points": 2
    }
  ]
}
```

#### 4. ✍️ WRITING (Viết)

```json
{
  "skill": "writing",
  "prompt": "Write an essay about the importance of learning English in the modern world.",
  "type": "essay",
  "instructions": [
    "Minimum 250 words",
    "Include: introduction, 2-3 body paragraphs, conclusion",
    "Use formal language",
    "Provide examples to support your points"
  ],
  "word_limit": {
    "min": 250,
    "max": 400
  },
  "rubrics": {
    "content": 25,
    "organization": 25,
    "vocabulary": 25,
    "grammar": 25
  },
  "sample_essay": "In today's globalized world, English has become..."
}
```

---

## 🎨 II. UI CHO GIÁO VIÊN (Thêm Bài tập)

### Flow thêm bài tập:

```
Chọn kỹ năng → Form tương ứng → Preview → Lưu
```

### A. Form Listening (Nghe)

```jsx
<div className="listening-form">
  <h3>🎧 Tạo bài tập Nghe</h3>
  
  {/* Upload Audio */}
  <div className="audio-upload">
    <label>File Audio *</label>
    <input type="file" accept="audio/*" />
    <audio controls src={audioUrl} />
  </div>
  
  {/* Transcript */}
  <div className="transcript-section">
    <label>Transcript (Bản ghi âm)</label>
    <textarea placeholder="Nhập transcript..."></textarea>
    <label>
      <input type="checkbox" />
      Hiển thị transcript cho học sinh (không khuyến khích)
    </label>
  </div>
  
  {/* Questions */}
  <div className="questions-section">
    <h4>Câu hỏi</h4>
    <button onClick={addQuestion}>+ Thêm câu hỏi</button>
    
    {questions.map((q, idx) => (
      <div key={idx} className="question-card">
        <select value={q.type} onChange={handleTypeChange}>
          <option value="multiple_choice">Trắc nghiệm</option>
          <option value="fill_blank">Điền từ</option>
          <option value="true_false">Đúng/Sai</option>
        </select>
        
        {q.type === 'multiple_choice' && (
          <>
            <input placeholder="Câu hỏi" />
            <input placeholder="A. Đáp án 1" />
            <input placeholder="B. Đáp án 2" />
            <input placeholder="C. Đáp án 3" />
            <input placeholder="D. Đáp án 4" />
            <select>
              <option>Đáp án đúng: A</option>
              <option>Đáp án đúng: B</option>
              <option>Đáp án đúng: C</option>
              <option>Đáp án đúng: D</option>
            </select>
          </>
        )}
        
        <input type="number" placeholder="Điểm" defaultValue="2" />
      </div>
    ))}
  </div>
</div>
```

### B. Form Speaking (Nói)

```jsx
<div className="speaking-form">
  <h3>🗣️ Tạo bài tập Nói</h3>
  
  {/* Prompt */}
  <div className="prompt-section">
    <label>Đề bài *</label>
    <textarea 
      placeholder="Ví dụ: Describe your favorite book..."
      rows="3"
    ></textarea>
  </div>
  
  {/* Instructions */}
  <div className="instructions-section">
    <label>Hướng dẫn</label>
    {instructions.map((inst, idx) => (
      <input 
        key={idx}
        placeholder={`Hướng dẫn ${idx + 1}`}
        value={inst}
      />
    ))}
    <button onClick={addInstruction}>+ Thêm hướng dẫn</button>
  </div>
  
  {/* Time Settings */}
  <div className="time-settings">
    <label>
      Thời gian chuẩn bị (giây)
      <input type="number" defaultValue="60" />
    </label>
    <label>
      Thời gian nói (giây)
      <input type="number" defaultValue="180" />
    </label>
  </div>
  
  {/* Sample Answer */}
  <div className="sample-section">
    <label>Bài mẫu (tùy chọn)</label>
    <textarea 
      placeholder="Last summer, I read..."
      rows="5"
    ></textarea>
  </div>
</div>
```

### C. Form Reading (Đọc)

```jsx
<div className="reading-form">
  <h3>📖 Tạo bài tập Đọc</h3>
  
  {/* Passage */}
  <div className="passage-section">
    <label>Đoạn văn *</label>
    <textarea 
      placeholder="Nhập đoạn văn..."
      rows="10"
    ></textarea>
    <div className="passage-stats">
      <span>Số từ: {wordCount}</span>
      <span>Độ khó: {difficulty}</span>
    </div>
  </div>
  
  {/* Questions (giống Listening) */}
  <div className="questions-section">
    <h4>Câu hỏi</h4>
    <button onClick={addQuestion}>+ Thêm câu hỏi</button>
    
    {/* Similar to Listening questions */}
  </div>
</div>
```

### D. Form Writing (Viết)

```jsx
<div className="writing-form">
  <h3>✍️ Tạo bài tập Viết</h3>
  
  {/* Prompt */}
  <div className="prompt-section">
    <label>Đề bài *</label>
    <textarea 
      placeholder="Write an essay about..."
      rows="3"
    ></textarea>
  </div>
  
  {/* Type */}
  <div className="type-section">
    <label>Loại bài viết</label>
    <select>
      <option value="essay">Essay (Tiểu luận)</option>
      <option value="letter">Letter (Thư)</option>
      <option value="email">Email</option>
      <option value="report">Report (Báo cáo)</option>
      <option value="story">Story (Truyện)</option>
    </select>
  </div>
  
  {/* Word Limit */}
  <div className="word-limit">
    <label>
      Số từ tối thiểu
      <input type="number" defaultValue="250" />
    </label>
    <label>
      Số từ tối đa
      <input type="number" defaultValue="400" />
    </label>
  </div>
  
  {/* Instructions */}
  <div className="instructions-section">
    <label>Yêu cầu chi tiết</label>
    {instructions.map((inst, idx) => (
      <input 
        key={idx}
        placeholder={`Yêu cầu ${idx + 1}`}
      />
    ))}
  </div>
  
  {/* Sample Essay */}
  <div className="sample-section">
    <label>Bài mẫu (tùy chọn)</label>
    <textarea rows="8"></textarea>
  </div>
</div>
```

---

## 🎓 III. UI CHO HỌC SINH (Làm Bài tập)

### A. Làm bài Listening (Nghe)

```jsx
<div className="do-listening">
  <div className="exercise-header">
    <h2>🎧 Bài tập Nghe - Unit 5</h2>
    <div className="time-remaining">⏱️ 15:00</div>
  </div>
  
  {/* Audio Player */}
  <div className="audio-section">
    <audio controls>
      <source src={audioUrl} type="audio/mpeg" />
    </audio>
    <div className="audio-controls">
      <button>⏮️ Replay</button>
      <button>⏯️ Play/Pause</button>
      <button>⏭️ Next</button>
    </div>
    {showTranscript && (
      <div className="transcript">
        <h4>Transcript:</h4>
        <p>{transcript}</p>
      </div>
    )}
  </div>
  
  {/* Questions */}
  <div className="questions-section">
    {questions.map((q, idx) => (
      <div key={q.id} className="question-card">
        <div className="question-header">
          <span className="question-number">Câu {idx + 1}</span>
          <span className="question-points">{q.points} điểm</span>
        </div>
        
        <p className="question-text">{q.question}</p>
        
        {q.type === 'multiple_choice' && (
          <div className="options">
            {q.options.map((opt, i) => (
              <label key={i} className="option">
                <input 
                  type="radio" 
                  name={`q${q.id}`}
                  value={opt[0]}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}
        
        {q.type === 'fill_blank' && (
          <input 
            type="text" 
            placeholder="Nhập câu trả lời..."
            className="answer-input"
          />
        )}
        
        {q.type === 'true_false' && (
          <div className="true-false">
            <label>
              <input type="radio" name={`q${q.id}`} value="true" />
              <span>✅ Đúng</span>
            </label>
            <label>
              <input type="radio" name={`q${q.id}`} value="false" />
              <span>❌ Sai</span>
            </label>
          </div>
        )}
      </div>
    ))}
  </div>
  
  {/* Submit */}
  <div className="submit-section">
    <button className="btn-save-draft">💾 Lưu nháp</button>
    <button className="btn-submit">✅ Nộp bài</button>
  </div>
</div>
```

### B. Làm bài Speaking (Nói)

```jsx
<div className="do-speaking">
  <div className="exercise-header">
    <h2>🗣️ Bài tập Nói - Describe your favorite...</h2>
    <div className="time-remaining">⏱️ Chuẩn bị: 60s</div>
  </div>
  
  {/* Prompt */}
  <div className="prompt-section">
    <h3>Đề bài:</h3>
    <p className="prompt-text">{prompt}</p>
  </div>
  
  {/* Instructions */}
  <div className="instructions">
    <h4>Hướng dẫn:</h4>
    <ul>
      {instructions.map((inst, i) => (
        <li key={i}>{inst}</li>
      ))}
    </ul>
  </div>
  
  {/* Recording Section */}
  <div className="recording-section">
    <div className="recording-status">
      {status === 'preparing' && (
        <>
          <div className="countdown">⏳ Chuẩn bị: {prepTime}s</div>
          <button onClick={startRecording}>🎙️ Bắt đầu ghi âm</button>
        </>
      )}
      
      {status === 'recording' && (
        <>
          <div className="recording-indicator">
            <span className="pulse">🔴</span>
            Đang ghi âm... {recordTime}s / {timeLimit}s
          </div>
          <button onClick={stopRecording}>⏹️ Dừng</button>
        </>
      )}
      
      {status === 'recorded' && (
        <>
          <audio controls src={recordedUrl} />
          <div className="recording-actions">
            <button onClick={playRecording}>▶️ Nghe lại</button>
            <button onClick={reRecord}>🔄 Ghi lại</button>
            <button onClick={submitRecording}>✅ Nộp bài</button>
          </div>
        </>
      )}
    </div>
    
    {/* Waveform Visualization */}
    <div className="waveform">
      <canvas ref={waveformCanvas}></canvas>
    </div>
  </div>
  
  {/* Sample Answer (Optional) */}
  {sampleAnswer && (
    <details className="sample-answer">
      <summary>💡 Xem bài mẫu</summary>
      <p>{sampleAnswer}</p>
    </details>
  )}
</div>
```

### C. Làm bài Reading (Đọc)

```jsx
<div className="do-reading">
  <div className="exercise-header">
    <h2>📖 Bài tập Đọc - Climate Change</h2>
    <div className="time-remaining">⏱️ 20:00</div>
  </div>
  
  {/* Split View: Passage + Questions */}
  <div className="reading-layout">
    {/* Passage Panel */}
    <div className="passage-panel">
      <div className="passage-toolbar">
        <button onClick={increaseFontSize}>A+</button>
        <button onClick={decreaseFontSize}>A-</button>
        <button onClick={toggleHighlight}>🖍️ Highlight</button>
      </div>
      
      <div className="passage-content" style={{ fontSize }}>
        <h3>{passageTitle}</h3>
        <div 
          className="passage-text"
          dangerouslySetInnerHTML={{ __html: passage }}
        />
        <div className="passage-info">
          <span>📊 {wordCount} từ</span>
          <span>⏱️ Thời gian đọc ước tính: {estimatedTime} phút</span>
        </div>
      </div>
    </div>
    
    {/* Questions Panel */}
    <div className="questions-panel">
      {questions.map((q, idx) => (
        <div key={q.id} className="question-card">
          <div className="question-header">
            <span>Câu {idx + 1}</span>
            <span>{q.points} điểm</span>
          </div>
          
          <p>{q.question}</p>
          
          {/* Similar to Listening UI */}
          {renderQuestionInput(q)}
        </div>
      ))}
    </div>
  </div>
  
  {/* Submit */}
  <div className="submit-section">
    <button className="btn-save-draft">💾 Lưu nháp</button>
    <button className="btn-submit">✅ Nộp bài</button>
  </div>
</div>
```

### D. Làm bài Writing (Viết)

```jsx
<div className="do-writing">
  <div className="exercise-header">
    <h2>✍️ Bài tập Viết - Essay</h2>
    <div className="stats">
      <span>📝 {wordCount}/{wordLimit.max} từ</span>
      <span>⏱️ {timeSpent}</span>
    </div>
  </div>
  
  {/* Prompt */}
  <div className="prompt-section">
    <h3>Đề bài:</h3>
    <p>{prompt}</p>
  </div>
  
  {/* Instructions */}
  <div className="instructions">
    <h4>Yêu cầu:</h4>
    <ul>
      {instructions.map((inst, i) => (
        <li key={i}>{inst}</li>
      ))}
    </ul>
  </div>
  
  {/* Editor */}
  <div className="editor-section">
    <div className="editor-toolbar">
      <button onClick={undo}>↶ Undo</button>
      <button onClick={redo}>↷ Redo</button>
      <button onClick={checkSpelling}>✔️ Kiểm tra lỗi</button>
      <button onClick={countWords}>📊 Đếm từ</button>
    </div>
    
    <textarea
      ref={editorRef}
      className="writing-editor"
      placeholder="Bắt đầu viết bài..."
      onChange={handleTextChange}
      value={content}
    />
    
    {/* Word Count Progress */}
    <div className="word-count-progress">
      <div 
        className="progress-bar"
        style={{ 
          width: `${(wordCount / wordLimit.min) * 100}%`,
          backgroundColor: wordCount >= wordLimit.min ? '#10b981' : '#f59e0b'
        }}
      />
      <span>
        {wordCount < wordLimit.min 
          ? `Còn ${wordLimit.min - wordCount} từ để đạt yêu cầu tối thiểu`
          : `✅ Đã đủ ${wordLimit.min} từ`
        }
      </span>
    </div>
    
    {/* Spelling Errors */}
    {spellingErrors.length > 0 && (
      <div className="spelling-errors">
        <h4>⚠️ Có {spellingErrors.length} lỗi chính tả:</h4>
        <ul>
          {spellingErrors.map((err, i) => (
            <li key={i}>
              <span className="error-word">{err.word}</span>
              → Gợi ý: {err.suggestions.join(', ')}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
  
  {/* Sample Essay */}
  {sampleEssay && (
    <details className="sample-essay">
      <summary>💡 Xem bài mẫu</summary>
      <div className="sample-content">{sampleEssay}</div>
    </details>
  )}
  
  {/* Submit */}
  <div className="submit-section">
    <button className="btn-save-draft">💾 Lưu nháp</button>
    <button className="btn-submit" disabled={wordCount < wordLimit.min}>
      ✅ Nộp bài
    </button>
  </div>
</div>
```

---

## 🔄 IV. FLOW HOÀN CHỈNH

### Teacher Flow:

```
1. Vào "Bài tập & Kiểm tra"
2. Click "Tạo bài tập mới"
3. Chọn loại: Bài tập Kỹ năng
4. Chọn kỹ năng: Nghe/Nói/Đọc/Viết
5. Điền form tương ứng:
   - Listening: Upload audio + câu hỏi
   - Speaking: Đề bài + hướng dẫn
   - Reading: Đoạn văn + câu hỏi
   - Writing: Đề bài + yêu cầu
6. Preview
7. Lưu → Học sinh nhìn thấy
```

### Student Flow:

```
1. Vào "Exercise Hub" hoặc "My Classes"
2. Chọn bài tập theo kỹ năng
3. Làm bài:
   - Listening: Nghe audio → Trả lời câu hỏi
   - Speaking: Đọc đề → Ghi âm
   - Reading: Đọc đoạn văn → Trả lời câu hỏi
   - Writing: Đọc đề → Viết bài
4. Review (nếu cần)
5. Nộp bài
6. Chờ chấm điểm
7. Xem kết quả + feedback
```

---

## 📊 V. AUTO-GRADING LOGIC

### Tự động chấm được:
- ✅ **Listening**: Trắc nghiệm, Đúng/Sai, Điền từ (exact match)
- ✅ **Reading**: Trắc nghiệm, Đúng/Sai, Matching

### Cần AI/Teacher chấm:
- ⏳ **Speaking**: AI phân tích pronunciation, fluency
- ⏳ **Writing**: AI đánh giá grammar, coherence, content
- ⏳ **Listening/Reading**: Câu hỏi tự luận

### Scoring Logic:

```javascript
// Auto-grading for MC and T/F
function autoGrade(submission, exercise) {
  let totalScore = 0;
  
  exercise.content.questions.forEach((q) => {
    const studentAnswer = submission.answers[q.id];
    
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      if (studentAnswer === q.correct_answer) {
        totalScore += q.points;
      }
    }
    
    if (q.type === 'fill_blank') {
      // Case-insensitive comparison
      if (studentAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()) {
        totalScore += q.points;
      }
    }
  });
  
  return totalScore;
}

// AI grading for Speaking/Writing
async function aiGrade(submission, exercise) {
  if (exercise.skill_type === 'speaking') {
    // Call AI API to analyze audio
    const analysis = await analyzeAudio(submission.content_url);
    return {
      score: analysis.overall_score,
      rubrics: {
        pronunciation: analysis.pronunciation_score,
        fluency: analysis.fluency_score,
        vocabulary: analysis.vocabulary_score,
        grammar: analysis.grammar_score
      },
      feedback: analysis.detailed_feedback
    };
  }
  
  if (exercise.skill_type === 'writing') {
    // Call AI API to analyze text
    const analysis = await analyzeText(submission.content_text);
    return {
      score: analysis.overall_score,
      rubrics: {
        content: analysis.content_score,
        organization: analysis.organization_score,
        vocabulary: analysis.vocabulary_score,
        grammar: analysis.grammar_score
      },
      feedback: analysis.detailed_feedback,
      error_analysis: analysis.errors
    };
  }
}
```

---

## 🗄️ VI. DATABASE - SUBMISSIONS

### Table: `exercise_submissions`

```sql
CREATE TABLE exercise_submissions (
  id INT PRIMARY KEY,
  exercise_id INT NOT NULL,
  student_id INT NOT NULL,
  
  -- Answers (JSON structure khác nhau cho từng kỹ năng)
  answers JSON,
  
  -- For Speaking: Audio file
  audio_url VARCHAR,
  
  -- For Writing: Text content
  content_text TEXT,
  
  -- Scoring
  score FLOAT,
  auto_score FLOAT,
  ai_score FLOAT,
  rubrics_scores JSON,
  
  -- Feedback
  feedback TEXT,
  ai_feedback TEXT,
  error_analysis JSON,
  
  -- Status
  status VARCHAR DEFAULT 'draft',  -- 'draft' | 'submitted' | 'graded'
  
  submitted_at DATETIME,
  graded_at DATETIME,
  
  FOREIGN KEY (exercise_id) REFERENCES exercises(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);
```

### Answers Structure:

**Listening/Reading:**
```json
{
  "1": "A",
  "2": "five",
  "3": false,
  "4": "B"
}
```

**Speaking:**
```json
{
  "audio_url": "/uploads/audio/student_123_speaking.mp3",
  "duration": 156,
  "recorded_at": "2025-11-05T14:30:00Z"
}
```

**Writing:**
```json
{
  "content": "In today's globalized world, English...",
  "word_count": 287,
  "time_spent": 1800
}
```

---

## 📱 VII. RESPONSIVE & ACCESSIBILITY

### Mobile Support:
- Listening: Touch-friendly audio controls
- Speaking: Mobile microphone access
- Reading: Adjustable font size, night mode
- Writing: Mobile-optimized keyboard

### Accessibility:
- Screen reader support
- Keyboard navigation
- High contrast mode
- Closed captions for audio (if available)

---

**Version:** 1.0  
**Next:** Implement DoExercise component  
**Status:** Design Complete ✅

