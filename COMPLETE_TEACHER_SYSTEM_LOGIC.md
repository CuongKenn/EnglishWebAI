# 📚 HỆ THỐNG HOÀN CHỈNH - Logic Giáo viên & Học sinh

## 🎯 Tổng quan Hệ thống Mới

### Thay đổi quan trọng:
1. ❌ **BỎ "Lớp học của tôi" (Teacher)** - Giáo viên KHÔNG tạo lớp
2. ✅ **Quản lý Lớp học** - Giáo viên CHỈ quản lý học sinh trong lớp đã được Admin phân công
3. ✅ **Bài tập & Kiểm tra** - Nhiều loại test, nhiều cách tạo đề
4. ✅ **Logic Kỹ năng** - Rõ ràng khi nào PHẢI chọn, khi nào KHÔNG chọn

---

## 👥 PHÂN QUYỀN

### 🔴 ADMIN (Quản trị viên)
**Quyền hạn:**
- ✅ Tạo lớp học mới
- ✅ Phân công giáo viên cho lớp
- ✅ Quản lý toàn bộ hệ thống

**Không được:**
- ❌ Tạo bài tập (công việc của giáo viên)

### 🔵 TEACHER (Giáo viên)
**Quyền hạn:**
- ✅ Quản lý học sinh trong lớp được phân công
- ✅ Thêm/xóa học sinh (thủ công hoặc import Excel)
- ✅ Tạo bài tập / kiểm tra
- ✅ Chấm điểm và cho feedback

**Không được:**
- ❌ Tạo lớp học mới (chỉ Admin)
- ❌ Xóa lớp học (chỉ Admin)

### 🟢 STUDENT (Học sinh)
**Quyền hạn:**
- ✅ Xem lớp học của mình
- ✅ Làm bài tập / kiểm tra
- ✅ Xem điểm và feedback

---

## 📋 I. QUẢN LÝ LỚP HỌC (Class Management)

### Vị trí: Teacher Dashboard → Quản lý Lớp học

### A. Luồng hoạt động:

```
Admin tạo lớp → Phân công giáo viên → Giáo viên quản lý học sinh
```

### B. Giao diện:

```
┌────────────────┬──────────────────────────────────────┐
│ Lớp học của tôi│ [Lớp 10A1]                          │
│                │ Thêm học sinh | Import Excel        │
│ □ Lớp 10A1     │                                      │
│ □ Lớp 10A2     │ ┌────────────────────────────────┐ │
│ □ Lớp 11B1     │ │ 👤 Nguyễn Văn A                │ │
│                │ │ 📧 nguyenvana@gmail.com         │ │
│                │ │ ✅ Đang học              [🗑️]  │ │
│                │ └────────────────────────────────┘ │
└────────────────┴──────────────────────────────────────┘
```

### C. Chức năng:

#### 1. **Thêm học sinh thủ công**
```
Click "Thêm học sinh" → Modal hiện ra
Điền thông tin:
  - Họ và tên *
  - Email *
  - Số điện thoại (tùy chọn)
→ Click "Thêm học sinh"
→ API: POST /api/v1/classes/{classId}/students
```

**Request:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "phone": "0123456789"
}
```

#### 2. **Import từ Excel**
```
Click "Import Excel" → Modal hiện ra
Step 1: Tải file mẫu (Download template)
Step 2: Điền thông tin vào Excel
Step 3: Upload file lên
→ API: POST /api/v1/classes/{classId}/students/import
```

**File Excel format:**
| Họ và tên | Email | Số điện thoại |
|-----------|-------|---------------|
| Nguyễn Văn A | nguyenvana@gmail.com | 0123456789 |
| Trần Thị B | tranthib@gmail.com | 0987654321 |

**Request:**
```javascript
FormData:
  file: excel_file.xlsx
  classId: 1
```

#### 3. **Xóa học sinh**
```
Click icon 🗑️ → Confirm dialog
→ API: DELETE /api/v1/classes/{classId}/students/{studentId}
```

### D. API Endpoints:

```
GET    /api/v1/teacher/classes              # Lấy danh sách lớp giáo viên dạy
GET    /api/v1/classes/{id}/students        # Lấy danh sách học sinh trong lớp
POST   /api/v1/classes/{id}/students        # Thêm học sinh thủ công
POST   /api/v1/classes/{id}/students/import # Import từ Excel
DELETE /api/v1/classes/{id}/students/{sid}  # Xóa học sinh
```

---

## 📝 II. BÀI TẬP & KIỂM TRA (Exercise Management)

### Vị trí: Teacher Dashboard → Bài tập & Kiểm tra

### A. Các loại Bài tập / Kiểm tra:

| Loại | Code | Kỹ năng | Điểm TB | Mục đích |
|------|------|---------|---------|----------|
| **Bài tập Kỹ năng** | `skill_exercise` | ✅ PHẢI chọn 1 kỹ năng | 10 | Luyện tập 1 kỹ năng cụ thể |
| **Kiểm tra 15 phút** | `test_15min` | ✅ PHẢI chọn 1 kỹ năng | 10 | Test ngắn 1 kỹ năng |
| **Kiểm tra Giữa kì** | `midterm` | ❌ KHÔNG chọn | 50 | Tổng hợp nhiều kỹ năng |
| **Kiểm tra Cuối kì** | `final` | ❌ KHÔNG chọn | 100 | Tổng hợp toàn bộ |

### B. Logic Kỹ năng:

```javascript
// QUAN TRỌNG: Logic chọn kỹ năng

if (testType === 'skill_exercise' || testType === 'test_15min') {
  // PHẢI chọn kỹ năng
  showSkillSelector = true;
  required = true;
  options = ['listening', 'speaking', 'reading', 'writing'];
  
  // Học sinh sẽ thấy trong Exercise Hub → Filter theo kỹ năng
  // Điểm sẽ được tính vào "Kỹ năng X" trong tab Điểm & Tiến độ
  
} else if (testType === 'midterm' || testType === 'final') {
  // KHÔNG chọn kỹ năng (test tổng hợp)
  showSkillSelector = false;
  skillType = null;
  
  // Học sinh sẽ thấy trong Exercise Hub → Tab "Bài kiểm tra"
  // Điểm sẽ được tính vào "Kiểm tra Giữa kì/Cuối kì"
}
```

### C. Phương thức tạo đề:

#### 1. **Tự nhập (Manual)**
```
Giáo viên tự soạn:
  - Tiêu đề
  - Nội dung đề bài (textarea)
  - Câu hỏi
  - Yêu cầu
```

**Use case:** Đề đã có sẵn trong đầu, muốn tạo nhanh

#### 2. **Import File**
```
Upload file Word/PDF:
  - Đề bài đã soạn sẵn trong Word
  - Hệ thống extract text từ file
  - Tự động tạo bài tập
```

**Use case:** Đề đã soạn trên Word, muốn tái sử dụng

**Supported formats:** .docx, .doc, .pdf (Max 10MB)

#### 3. **AI Sinh đề**
```
Upload nhiều file tham khảo → AI học và tạo đề mới
```

**Quy trình:**
```
Step 1: Upload files tham khảo (có thể nhiều files)
  - Đề cũ năm trước
  - Tài liệu SGK
  - Bài tập mẫu
  
Step 2: AI phân tích và học
  - Cấu trúc đề
  - Độ khó
  - Dạng câu hỏi
  - Nội dung kiến thức
  
Step 3: AI tạo đề mới
  - Tương tự nhưng khác
  - Đảm bảo không trùng
  - Theo yêu cầu của giáo viên

Step 4: Giáo viên review và chỉnh sửa
  - Xem trước đề AI tạo
  - Sửa nếu cần
  - Approve và giao cho học sinh
```

**Ví dụ:**
```
Giáo viên upload 3 files:
  - de_thi_2023.docx
  - de_thi_2024.docx  
  - bai_tap_unit_5.pdf
  
Yêu cầu: "Tạo 10 câu hỏi trắc nghiệm về thì hiện tại hoàn thành, 
          độ khó trung bình, có đáp án"
          
AI sinh ra:
  - 10 câu hỏi MỚI
  - Theo cấu trúc tương tự
  - Độ khó phù hợp
  - Có đáp án chi tiết
```

**API:**
```
POST /api/v1/exercises/ai-generate
FormData:
  files: [file1, file2, file3]
  prompt: "Yêu cầu với AI..."
  testType: "skill_exercise"
  skillType: "listening"
  classId: 1
  maxScore: 10
```

### D. Giao diện tạo bài tập:

```
┌─────────────────────────────────────────────────────┐
│ Tạo Bài tập / Kiểm tra Mới                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Loại bài tập:                                       │
│ [Bài tập Kỹ năng] [Kiểm tra 15'] [Giữa kì] [Cuối kì]│
│                                                      │
│ Kỹ năng đánh giá: (chỉ hiện nếu Bài tập/15')       │
│ ( ) 🎧 Nghe  ( ) 🗣️ Nói  ( ) 📖 Đọc  ( ) ✍️ Viết   │
│                                                      │
│ Phương thức tạo đề:                                 │
│ [Tự nhập] [Import File] [AI Sinh đề]               │
│                                                      │
│ --- Content theo phương thức ---                    │
│                                                      │
│ [Tạo bài tập]                                       │
└─────────────────────────────────────────────────────┘
```

### E. Flow hoàn chỉnh:

```
┌──────────────────────────────────────────────────────┐
│                 GIÁO VIÊN TẠO BÀI TẬP                │
└──────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Chọn loại bài tập / kiểm tra  │
        └───────────────────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────┐              ┌──────────────────┐
│ Bài tập       │              │ Kiểm tra         │
│ Kỹ năng       │              │ Giữa kì/Cuối kì  │
│               │              │                  │
│ ✅ PHẢI chọn  │              │ ❌ KHÔNG chọn    │
│ kỹ năng       │              │ kỹ năng          │
└───────────────┘              └──────────────────┘
        │                                 │
        └───────────────┬────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Chọn phương thức tạo đề:      │
        │ □ Tự nhập                     │
        │ □ Import File                 │
        │ □ AI Sinh đề                  │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Điền thông tin:               │
        │ - Lớp học                     │
        │ - Tiêu đề                     │
        │ - Hạn nộp                     │
        │ - Điểm tối đa                 │
        │ - Bật AI chấm điểm (option)  │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Lưu vào database              │
        └───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Học sinh nhìn thấy trong:     │
        │ - My Classes → Tab Bài tập    │
        │ - Exercise Hub → Filter        │
        └───────────────────────────────┘
```

---

## 👨‍🎓 III. HỌC SINH NHÌN THẤY GÌ?

### A. My Classes (`/my-classes`)

**Học sinh KHÔNG thấy phần tạo lớp, CHỈ thấy:**
- Các lớp đã được thêm vào bởi giáo viên/admin
- Bài giảng của lớp
- **Bài tập của lớp** (tất cả loại)

```
Lớp 10A1
├── Tab: Tổng quan
├── Tab: Bài giảng
└── Tab: Bài tập
    ├── Bài tập Nghe Hiểu - Unit 5 (skill_exercise)
    ├── Kiểm tra 15 phút - Kỹ năng Viết (test_15min)
    ├── Kiểm tra Giữa kì (midterm)
    └── Kiểm tra Cuối kì (final)
```

### B. Exercise Hub (`/exercise-hub`)

**Sidebar với filter thông minh:**

```
📝 Tất cả bài tập      → Hiển thị TẤT CẢ
🎧 Bài tập Nghe        → Chỉ skill_exercise + test_15min có skill=listening
🗣️ Bài tập Nói         → Chỉ skill_exercise + test_15min có skill=speaking
📖 Bài tập Đọc         → Chỉ skill_exercise + test_15min có skill=reading
✍️ Bài tập Viết        → Chỉ skill_exercise + test_15min có skill=writing
📊 Bài kiểm tra        → midterm + final (không có skill)
🏆 Điểm & Tiến độ      → Xem điểm chi tiết
```

### C. Tab "Điểm & Tiến độ"

**Hiển thị 2 sections:**

#### 1. Đánh giá theo 4 Kỹ năng:
```
┌────────────────────────────────────────┐
│ 🎧 Kỹ năng Nghe       [████████] 85%  │
│ 5 bài tập • 42.5/50 điểm               │
│                                        │
│ 🗣️ Kỹ năng Nói        [██████  ] 75%  │
│ 3 bài tập • 22.5/30 điểm               │
│                                        │
│ 📖 Kỹ năng Đọc        [█████████] 92%  │
│ 6 bài tập • 55/60 điểm                 │
│                                        │
│ ✍️ Kỹ năng Viết       [███████ ] 78%  │
│ 4 bài tập • 31/40 điểm                 │
└────────────────────────────────────────┘
```

**Logic tính:**
```javascript
// Lấy TẤT CẢ bài tập có skill_type = "listening"
const listeningExercises = submissions.filter(s => 
  (s.exercise.type === 'skill_exercise' || s.exercise.type === 'test_15min') &&
  s.exercise.skill_type === 'listening' &&
  s.status === 'graded'
);

const totalScore = listeningExercises.reduce((sum, s) => sum + s.score, 0);
const maxPossible = listeningExercises.reduce((sum, s) => sum + s.exercise.max_score, 0);

const averageListening = (totalScore / maxPossible) * 100;
```

#### 2. Đánh giá theo Loại Kiểm tra:
```
┌────────────────────────────────────────┐
│ ⏱️  Kiểm tra 15 phút    8.5/10 (85%)  │
│ 5 bài kiểm tra                         │
│                                        │
│ 📋 Kiểm tra Giữa kì     42/50  (84%)  │
│ 2 bài kiểm tra                         │
│                                        │
│ 🏆 Kiểm tra Cuối kì     82/100 (82%)  │
│ 1 bài kiểm tra                         │
│                                        │
│ ⭐ Điểm TB Tổng hợp     8.1/10 (81%)  │
│ Tất cả bài kiểm tra                    │
└────────────────────────────────────────┘
```

**Logic tính:**
```javascript
// Kiểm tra 15 phút
const tests15Min = submissions.filter(s => 
  s.exercise.type === 'test_15min' &&
  s.status === 'graded'
);

// Kiểm tra giữa kì
const midtermTests = submissions.filter(s => 
  s.exercise.type === 'midterm' &&
  s.status === 'graded'
);

// Kiểm tra cuối kì
const finalTests = submissions.filter(s => 
  s.exercise.type === 'final' &&
  s.status === 'graded'
);
```

---

## 🗄️ IV. DATABASE STRUCTURE

### Table: `exercises`
```sql
CREATE TABLE exercises (
  id INT PRIMARY KEY,
  class_id INT NOT NULL,                    -- Lớp học nào
  title VARCHAR NOT NULL,                   -- Tiêu đề
  description TEXT,                         -- Mô tả
  type VARCHAR NOT NULL,                    -- 'skill_exercise' | 'test_15min' | 'midterm' | 'final'
  skill_type VARCHAR NULL,                  -- 'listening' | 'speaking' | 'reading' | 'writing' | NULL
  max_score FLOAT NOT NULL,                 -- Điểm tối đa
  due_at DATETIME,                          -- Hạn nộp
  enable_ai_grading BOOLEAN DEFAULT false,  -- Bật AI chấm
  rubrics JSON,                             -- Rubric chấm điểm
  content JSON,                             -- Nội dung bài tập
  creation_method VARCHAR,                  -- 'manual' | 'import' | 'ai'
  ai_training_files JSON,                   -- Files dùng để train AI (nếu method=ai)
  created_by INT NOT NULL,                  -- Teacher ID
  created_at DATETIME DEFAULT NOW(),
  
  -- CONSTRAINTS
  CHECK (
    (type IN ('skill_exercise', 'test_15min') AND skill_type IS NOT NULL) OR
    (type IN ('midterm', 'final') AND skill_type IS NULL)
  )
);
```

### Table: `exercise_submissions`
```sql
CREATE TABLE exercise_submissions (
  id INT PRIMARY KEY,
  exercise_id INT NOT NULL,
  student_id INT NOT NULL,
  content_text TEXT,                  -- Bài làm text
  content_url VARCHAR,                -- File/Audio URL
  score FLOAT,                        -- Điểm cuối cùng
  feedback TEXT,                      -- Feedback từ giáo viên
  ai_feedback TEXT,                   -- Feedback từ AI
  ai_score FLOAT,                     -- Điểm từ AI
  rubrics_scores JSON,                -- Điểm chi tiết 4 kỹ năng
  error_analysis JSON,                -- Phân tích lỗi
  status VARCHAR DEFAULT 'submitted', -- 'submitted' | 'graded' | 'late'
  submitted_at DATETIME DEFAULT NOW(),
  graded_at DATETIME,
  ai_graded_at DATETIME
);
```

### Table: `enrollments` (Học sinh trong lớp)
```sql
CREATE TABLE enrollments (
  id INT PRIMARY KEY,
  class_id INT NOT NULL,
  student_id INT NOT NULL,
  status VARCHAR DEFAULT 'active',    -- 'active' | 'inactive'
  enrolled_at DATETIME DEFAULT NOW(),
  enrolled_by INT,                    -- Teacher/Admin ID who added the student
  
  UNIQUE(class_id, student_id)
);
```

---

## 🔄 V. API ENDPOINTS SUMMARY

### Class Management:
```
GET    /api/v1/teacher/classes                    # Lấy lớp giáo viên dạy
GET    /api/v1/classes/{id}/students              # Lấy học sinh trong lớp
POST   /api/v1/classes/{id}/students              # Thêm học sinh
POST   /api/v1/classes/{id}/students/import       # Import Excel
DELETE /api/v1/classes/{id}/students/{studentId}  # Xóa học sinh
GET    /api/v1/classes/{id}/students/template     # Download Excel template
```

### Exercise Management (Teacher):
```
POST   /api/v1/exercises                     # Tạo bài tập (manual/import)
POST   /api/v1/exercises/ai-generate         # AI sinh đề
GET    /api/v1/exercises                     # Lấy bài tập của giáo viên
PUT    /api/v1/exercises/{id}                # Sửa bài tập
DELETE /api/v1/exercises/{id}                # Xóa bài tập
GET    /api/v1/exercises/{id}/submissions    # Xem bài nộp
PUT    /api/v1/submissions/{id}/grade        # Chấm điểm
```

### Exercise (Student):
```
GET    /api/v1/exercises                        # Lấy bài tập của học sinh
GET    /api/v1/classes/{id}/exercises           # Lấy bài tập theo lớp
POST   /api/v1/exercises/{id}/submit            # Nộp bài
GET    /api/v1/exercises/my-submissions         # Xem bài đã nộp
GET    /api/v1/exercises/statistics/skills      # Thống kê theo kỹ năng
GET    /api/v1/exercises/statistics/test-types  # Thống kê theo loại test
```

---

## ✅ CHECKLIST HOÀN CHỈNH

### Giáo viên:
- [x] Xem danh sách lớp được phân công (không tạo lớp mới)
- [x] Thêm học sinh thủ công
- [x] Import học sinh từ Excel
- [x] Xóa học sinh khỏi lớp
- [x] Tạo 4 loại bài tập/kiểm tra
- [x] Chọn kỹ năng (nếu skill_exercise hoặc test_15min)
- [x] KHÔNG chọn kỹ năng (nếu midterm hoặc final)
- [x] Tạo đề bằng 3 cách: Manual, Import, AI
- [x] AI sinh đề từ files tham khảo
- [x] Bật/tắt AI chấm điểm
- [x] Chấm điểm và sửa AI feedback

### Học sinh:
- [x] Xem lớp học đã được thêm vào
- [x] Xem bài tập trong My Classes
- [x] Xem bài tập trong Exercise Hub (filter theo kỹ năng)
- [x] Làm và nộp bài
- [x] Xem điểm theo 4 kỹ năng
- [x] Xem điểm theo loại kiểm tra (15', giữa kì, cuối kì)
- [x] Xem feedback từ giáo viên/AI

### Admin:
- [x] Tạo lớp học mới
- [x] Phân công giáo viên cho lớp
- [x] Quản lý toàn bộ hệ thống

---

## 🎨 UI/UX HIGHLIGHTS

### 1. Class Management:
- Sidebar hiển thị lớp
- Click vào lớp → Hiển thị học sinh
- 2 nút: "Thêm học sinh" + "Import Excel"
- Search bar để tìm học sinh
- Table học sinh với status (Đang học/Nghỉ học)

### 2. Exercise Management:
- 4 cards chọn loại test
- Skill selector (chỉ hiện với skill_exercise và test_15min)
- 3 tabs chọn phương thức: Manual, Import, AI
- AI section: Upload nhiều files + prompt
- Preview đề trước khi tạo

### 3. Exercise Hub (Student):
- Sidebar giống AI Practice
- Filter thông minh theo kỹ năng
- Tab "Điểm & Tiến độ" với 2 sections:
  - Biểu đồ 4 kỹ năng
  - Biểu đồ loại kiểm tra
- Grades table với emojis

---

**Cập nhật**: 26/10/2025
**Version**: 3.0 Complete System
**Status**: ✅ HOÀN THIỆN TOÀN BỘ LOGIC

