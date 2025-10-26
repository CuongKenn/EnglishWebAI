# 🔧 HƯỚNG DẪN FIX TOÀN DIỆN - TẤT CẢ VẤN ĐỀ

## 📋 TÓM TẮT CÁC VẤN ĐỀ

### ❌ Vấn đề 1: Kiểm tra Giữa kì/Cuối kì hiện sai form
**Current:** Hiện form Listening với audio upload  
**Expected:** Upload Word/PDF document  

**Root Cause:**
```javascript
// File: CreateExerciseModal.jsx, line ~270
{creationMethod === 'manual' && (
  <>
    {selectedSkill === 'listening' && renderListeningForm()}
    // ... other skills
  </>
)}
```

Problem: `requiresSkill` logic cho phép chọn skill cho mid-term/final, nhưng mid-term/final KHÔNG NÊN có skill selection!

**Fix Logic:**
```javascript
// Mid-term và Final tests:
// - KHÔNG chọn skill
// - Upload Word/PDF file
// - KHÔNG có questions section (vì đã có trong file)

if (testType === 'midterm' || testType === 'final') {
  // Render upload Word/PDF form
  // NO skill selection
  // NO individual questions
} else {
  // Skill-based exercise or 15-min test
  // Show skill selection
  // Show skill-specific forms
}
```

---

### ❌ Vấn đề 2: Import File không hiện upload zone
**Current:** Section trống  
**Expected:** File upload zone với description  

**Root Cause:**
```javascript
// File: CreateExerciseModal.jsx
{creationMethod === 'import' && (
  // TODO: Chưa có gì ở đây!
)}
```

**Fix:**
```javascript
{creationMethod === 'import' && (
  <div className="import-section">
    <div className="upload-zone-large">
      <input type="file" onChange={handleImportFile} />
      <FileUp size={48} />
      <h4>Upload file Word hoặc PDF</h4>
      <p>Hệ thống sẽ tự động phân tích và tạo câu hỏi</p>
    </div>
    {importedFile && (
      <div className="file-preview">
        {/* Show file info */}
      </div>
    )}
  </div>
)}
```

---

### ❌ Vấn đề 3: AI sinh đề không hiện file upload
**Current:** Chỉ có radio buttons, không có upload zone  
**Expected:** Khi chọn "Sinh từ Files", hiện upload zone  

**Root Cause:**
```javascript
// File: CreateExerciseModal.jsx, line ~900+
{aiSource === 'files' && (
  <div className="ai-upload-section">
    {/* CÓ code nhưng có thể CSS ẩn hoặc logic sai */}
  </div>
)}
```

**Fix:**
```javascript
{aiSource === 'files' && (
  <div className="ai-files-section">
    <div className="form-section-ex">
      <label className="form-label-ex">Upload tài liệu (có thể nhiều files)</label>
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
        <p>Click để chọn files</p>
        <span>Word, PDF, hoặc Text</span>
      </div>
    </div>
    
    {aiFiles.length > 0 && (
      <div className="uploaded-files-list">
        <h5>📄 Files đã upload ({aiFiles.length})</h5>
        {aiFiles.map((file, idx) => (
          <div key={idx} className="uploaded-file-item">
            <File size={18} />
            <span>{file.name}</span>
            <button onClick={() => removeAiFile(idx)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

---

### ❌ Vấn đề 4: "Từ Ngân hàng" button không làm gì
**Current:** Button tồn tại nhưng onClick empty  
**Expected:** Mở modal chọn questions từ Question Bank  

**Root Cause:**
```javascript
// File: CreateExerciseModal.jsx, line ~650
<button className="btn-from-bank">
  <Database size={16} />
  Từ Ngân hàng
</button>
// Missing onClick handler!
```

**Fix:**
```javascript
// Add state
const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);

// Add button handler
<button 
  className="btn-from-bank"
  onClick={() => setShowQuestionBankModal(true)}
>
  <Database size={16} />
  Từ Ngân hàng
</button>

// Add modal at end
{showQuestionBankModal && (
  <QuestionBankSelectorModal
    onClose={() => setShowQuestionBankModal(false)}
    onSelect={(selectedQuestions) => {
      setQuestions([...questions, ...selectedQuestions]);
      setShowQuestionBankModal(false);
    }}
  />
)}
```

---

### ❌ Vấn đề 5: Giao diện không đồng nhất
**Current:** Mỗi section có style riêng  
**Expected:** Toàn bộ system có cùng design language  

**Issues:**
- Colors khác nhau
- Border radius khác nhau
- Spacing không consistent
- Typography không unified
- Card styles khác nhau

**Fix: Tạo Design System**

```css
/* Design System Variables */
:root {
  /* Colors */
  --primary: #667eea;
  --primary-dark: #764ba2;
  --success: #43e97b;
  --warning: #fa709a;
  --danger: #ff6b6b;
  
  /* Backgrounds */
  --bg-main: #f8f9fc;
  --bg-card: #ffffff;
  --bg-secondary: #f5f7fa;
  
  /* Borders */
  --border-color: #e8eaf6;
  --border-radius: 12px;
  --border-radius-lg: 20px;
  --border-width: 2px;
  
  /* Spacing */
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  
  /* Typography */
  --font-size-xs: 12px;
  --font-size-sm: 13px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 32px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
}

/* Unified Card Style */
.card-unified {
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: var(--border-width) solid transparent;
  transition: all 0.3s;
}

.card-unified:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

/* Unified Button */
.btn-primary-unified {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary-unified:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
```

Apply to ALL components:
- ExerciseManagement
- QuestionBank
- Courses
- ClassManagement
- All modals

---

### ❌ Vấn đề 6: Khóa học chưa có 4 kỹ năng
**Current:** Courses component có button "Add Materials" nhưng không có 4 skills  
**Expected:** Có thể add content cho 4 kỹ năng với nhiều câu hỏi  

**Fix: Update Courses Component**

```javascript
// File: Courses.jsx

// Add modal similar to ExerciseManagement
const [showAddContentModal, setShowAddContentModal] = useState(false);

// In course detail page
<button onClick={() => setShowAddContentModal(true)}>
  <Plus size={18} />
  Thêm nội dung
</button>

// Modal structure
<AddCourseContentModal
  courseId={selectedCourse.id}
  onClose={() => setShowAddContentModal(false)}
  onAdd={(content) => {
    // Save course content
  }}
>
  {/* Same structure as CreateExerciseModal */}
  {/* But for "Lesson Content" not "Exercise" */}
  
  1. Select Skill (Listening, Speaking, Reading, Writing)
  2. Upload files based on skill
  3. Add multiple questions
  4. Save to course
</AddCourseContentModal>
```

---

## 🎯 IMPLEMENTATION PLAN

### Phase 1: Fix CreateExerciseModal Logic (Priority: CRITICAL)

**Step 1.1: Fix Test Type Logic**
```javascript
// Line ~50
const requiresSkill = testType === 'skill_exercise' || testType === 'test_15min';
const isMidtermOrFinal = testType === 'midterm' || testType === 'final';
```

**Step 1.2: Conditional Rendering**
```javascript
{creationMethod === 'manual' && (
  <>
    {isMidtermOrFinal ? (
      // Render Mid-term/Final form (Word/PDF upload)
      renderMidtermFinalForm()
    ) : (
      // Render skill-based forms
      <>
        {selectedSkill === 'listening' && renderListeningForm()}
        {selectedSkill === 'speaking' && renderSpeakingForm()}
        {selectedSkill === 'reading' && renderReadingForm()}
        {selectedSkill === 'writing' && renderWritingForm()}
      </>
    )}
  </>
)}
```

**Step 1.3: Add renderMidtermFinalForm()**
```javascript
function renderMidtermFinalForm() {
  return (
    <div className="midterm-final-form">
      <h4>📄 Upload đề thi</h4>
      <div className="upload-zone-doc">
        <input 
          type="file" 
          accept=".pdf,.doc,.docx"
          onChange={handleTestFileUpload}
          ref={testFileInputRef}
        />
        <FileText size={48} />
        <p>Click để chọn file Word hoặc PDF</p>
      </div>
      {testFile && (
        <div className="file-preview">
          {/* Preview */}
        </div>
      )}
    </div>
  );
}
```

### Phase 2: Fix Import Section

```javascript
{creationMethod === 'import' && (
  <div className="import-section-content">
    <div className="import-header">
      <Upload size={32} />
      <h3>Import đề từ file</h3>
      <p>Hỗ trợ Word, PDF, Excel</p>
    </div>
    
    <div className="upload-zone-import">
      <input 
        type="file"
        accept=".pdf,.doc,.docx,.xlsx"
        onChange={handleImportFileUpload}
        ref={importFileInputRef}
      />
      <p>Kéo thả file vào đây hoặc click để chọn</p>
    </div>
  </div>
)}
```

### Phase 3: Fix AI Section

```javascript
{creationMethod === 'ai' && (
  <div className="ai-section-content">
    {/* Radio selection */}
    <div className="ai-source-selection">
      <label>
        <input 
          type="radio" 
          value="files"
          checked={aiSource === 'files'}
          onChange={(e) => setAiSource(e.target.value)}
        />
        <div>Sinh từ Files</div>
      </label>
      <label>
        <input 
          type="radio" 
          value="question_bank"
          checked={aiSource === 'question_bank'}
          onChange={(e) => setAiSource(e.target.value)}
        />
        <div>Lấy từ Ngân hàng</div>
      </label>
    </div>
    
    {/* Conditional content */}
    {aiSource === 'files' && (
      <div className="ai-files-upload">
        <div className="upload-zone-ai" onClick={() => aiFilesRef.current?.click()}>
          <input 
            ref={aiFilesRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={handleAiFilesUpload}
            style={{ display: 'none' }}
          />
          <FileUp size={48} />
          <p>Click để chọn files (có thể chọn nhiều)</p>
        </div>
        
        {aiFiles.length > 0 && (
          <div className="files-list">
            {aiFiles.map((file, idx) => (
              <div key={idx} className="file-item">
                <span>{file.name}</span>
                <button onClick={() => removeAiFile(idx)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
    
    {aiSource === 'question_bank' && (
      <div className="ai-qb-config">
        {/* QB configuration form */}
      </div>
    )}
  </div>
)}
```

### Phase 4: Add QuestionBankSelectorModal

```javascript
// New component: QuestionBankSelectorModal.jsx
export default function QuestionBankSelectorModal({ onClose, onSelect }) {
  const [questions, setQuestions] = useState(/* fetch from API */);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  
  const toggleQuestion = (question) => {
    if (selectedQuestions.find(q => q.id === question.id)) {
      setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };
  
  return (
    <div className="qb-selector-modal">
      <div className="modal-header">
        <h2>Chọn câu hỏi từ Ngân hàng</h2>
        <button onClick={onClose}>×</button>
      </div>
      
      <div className="modal-body">
        <div className="filters">
          {/* Skill, Type, Difficulty filters */}
        </div>
        
        <div className="questions-list">
          {questions.map((q) => (
            <div 
              key={q.id} 
              className={`question-item ${selectedQuestions.find(sq => sq.id === q.id) ? 'selected' : ''}`}
              onClick={() => toggleQuestion(q)}
            >
              <input 
                type="checkbox"
                checked={!!selectedQuestions.find(sq => sq.id === q.id)}
                readOnly
              />
              <div className="question-content">
                <p>{q.question_text}</p>
                <div className="badges">
                  <span>{q.skill_type}</span>
                  <span>{q.difficulty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="modal-footer">
        <span>Đã chọn: {selectedQuestions.length} câu</span>
        <button onClick={() => onSelect(selectedQuestions)}>
          Thêm vào bài tập
        </button>
      </div>
    </div>
  );
}
```

### Phase 5: Add 4 Skills to Courses

```javascript
// Update Courses.jsx

// Add state
const [showAddLessonContentModal, setShowAddLessonContentModal] = useState(false);

// In lesson detail view
<button onClick={() => setShowAddLessonContentModal(true)}>
  <Plus size={18} />
  Thêm nội dung bài học
</button>

// Modal (reuse CreateExerciseModal structure)
{showAddLessonContentModal && (
  <AddLessonContentModal
    lessonId={selectedLesson.id}
    onClose={() => setShowAddLessonContentModal(false)}
    onAdd={(content) => {
      // Add content to lesson
      // Structure:
      // {
      //   skill_type: 'listening' | 'speaking' | 'reading' | 'writing',
      //   content: { /* skill-specific content */ },
      //   questions: [ /* array of questions */ ]
      // }
    }}
  />
)}
```

### Phase 6: Unified Design System

**Create:** `design-system.css`
```css
/* ALL unified styles as shown above */
```

**Update ALL components to use:**
- `.card-unified`
- `.btn-primary-unified`
- `.btn-secondary-unified`
- Consistent spacing variables
- Consistent colors
- Consistent typography

---

## 📝 IMPLEMENTATION CHECKLIST

### CreateExerciseModal:
- [ ] Add `isMidtermOrFinal` logic
- [ ] Add `renderMidtermFinalForm()`
- [ ] Fix conditional rendering for test types
- [ ] Add testFile state & upload handler
- [ ] Fix Import section (add upload zone)
- [ ] Fix AI section (show upload zone)
- [ ] Add QuestionBank button onClick
- [ ] Add QuestionBankSelectorModal
- [ ] Test all flows

### QuestionBank:
- [ ] Already redesigned ✅
- [ ] Ensure design matches system

### Courses:
- [ ] Add "Thêm nội dung" button
- [ ] Create AddLessonContentModal
- [ ] Add 4 skills forms
- [ ] Add multiple questions support
- [ ] Save to lesson

### Design System:
- [ ] Create design-system.css
- [ ] Apply to ExerciseManagement
- [ ] Apply to QuestionBank
- [ ] Apply to Courses
- [ ] Apply to all modals
- [ ] Test consistency

---

## 🎨 MOCKUP - UNIFIED DESIGN

```
All pages should have:

┌─ Hero Section (Gradient) ──────────────────┐
│  [Icon] Title                    [Actions] │
│  Description text                           │
└────────────────────────────────────────────┘

┌─ Stats Dashboard ──────────────────────────┐
│  [Card 1]  [Card 2]  [Card 3]  [Card 4]   │
│  3D hover effects, same style              │
└────────────────────────────────────────────┘

┌─ Filters & Actions ────────────────────────┐
│  [Search]  [Filter 1]  [Filter 2]  [Clear]│
└────────────────────────────────────────────┘

┌─ Content Grid ─────────────────────────────┐
│  [Card]  [Card]  [Card]                    │
│  [Card]  [Card]  [Card]                    │
│  Same hover effects, borders, shadows      │
└────────────────────────────────────────────┘
```

---

## 🚀 TESTING GUIDE

### Test 1: Mid-term/Final Tests
```
1. Click "Tạo bài tập mới"
2. Select "Kiểm tra Giữa kì" or "Kiểm tra Cuối kì"
3. → Should NOT see skill selection
4. → Should see Word/PDF upload zone
5. Upload a PDF file
6. → Should see file preview
7. Fill title, class, due date
8. Click "Tạo bài tập"
9. → Should save successfully
```

### Test 2: Import File
```
1. Click "Tạo bài tập mới"
2. Select "Import File"
3. → Should see upload zone with instructions
4. Upload a Word file
5. → Should process and show preview
6. Click "Tạo bài tập"
```

### Test 3: AI from Files
```
1. Click "Tạo bài tập mới"
2. Select "AI Sinh đề"
3. Select "Sinh từ Files"
4. → Should see upload zone
5. Upload multiple files
6. → Should see files list with remove buttons
7. Enter AI prompt
8. Click "AI Phân tích & Tạo đề"
```

### Test 4: From Question Bank
```
1. In CreateExerciseModal
2. In Questions section
3. Click "Từ Ngân hàng"
4. → Modal opens with question list
5. Filter by skill, difficulty
6. Check multiple questions
7. Click "Thêm vào bài tập"
8. → Questions added to exercise
```

### Test 5: Courses 4 Skills
```
1. Go to Courses
2. Select a course
3. Select a lesson
4. Click "Thêm nội dung bài học"
5. → Modal opens
6. Select skill (Listening/Speaking/Reading/Writing)
7. Fill content based on skill
8. Add multiple questions
9. Save
10. → Content added to lesson
```

---

## 📊 ESTIMATED TIME

- Phase 1 (CreateExerciseModal): 3 hours
- Phase 2 (Import): 30 min
- Phase 3 (AI): 1 hour
- Phase 4 (QB Selector): 2 hours
- Phase 5 (Courses): 2 hours
- Phase 6 (Design System): 2 hours

**Total:** ~10-12 hours work

---

## ✅ SUCCESS CRITERIA

- [ ] Mid-term/Final tests có upload Word/PDF
- [ ] Import File hiện upload zone
- [ ] AI sinh đề hiện file upload
- [ ] "Từ Ngân hàng" button hoạt động
- [ ] Courses có 4 skills forms
- [ ] Courses có thể add nhiều câu hỏi
- [ ] Toàn bộ system design đồng nhất
- [ ] All hover effects consistent
- [ ] All colors from design system
- [ ] All spacing consistent
- [ ] Responsive trên mobile

---

**Next Steps:** Implement từng phase một, test kỹ, rồi move to next phase.

