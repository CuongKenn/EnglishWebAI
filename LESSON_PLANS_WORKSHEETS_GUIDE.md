# 📚 Hệ thống Tạo Giáo án & Phiếu học tập bằng AI

## 🎯 Tổng quan

Hệ thống hoàn chỉnh cho phép giáo viên tạo Giáo án và Phiếu học tập cho môn Tiếng Anh, **bám sát Chương trình Giáo dục phổ thông môn Ngoại ngữ 2018 của Việt Nam**.

### ✨ Tính năng chính

#### 1. **Tạo Giáo án bằng AI**
- ✅ Tạo tự động theo chương trình 2018
- ✅ 4 hoạt động chuẩn: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng
- ✅ Mục tiêu đầy đủ: Kiến thức, Kỹ năng, Năng lực, Phẩm chất
- ✅ Tích hợp 4 kỹ năng: Listening, Speaking, Reading, Writing
- ✅ CRUD đầy đủ: Create, Read, Update, Delete

#### 2. **Tạo Phiếu học tập bằng AI**
- ✅ 7 loại phiếu: Trắc nghiệm, Tự luận, Điền khuyết, Theo chủ đề, Tự học, Tình huống, Kết hợp
- ✅ 6 kỹ năng: Listening, Speaking, Reading, Writing, Grammar, Vocabulary
- ✅ 3 độ khó: Dễ, Trung bình, Khó
- ✅ AI tạo nội dung chi tiết với đáp án
- ✅ CRUD đầy đủ

---

## 🏗️ Kiến trúc Backend

### 1. Models (`app/models/`)

#### `lesson_plan.py` - Model Giáo án
```python
class LessonPlan(Base):
    id: int
    teacher_id: int
    title: str
    subject: str (default: "English")
    grade: int (1-12)
    unit: str
    lesson_number: str
    duration: int (phút)
    objectives: JSON  # kiến thức, kỹ năng, năng lực, phẩm chất
    teaching_aids: JSON  # thiết bị dạy học
    activities: JSON  # 4 hoạt động
    notes: str
    homework: str
    ai_generated: int (0/1)
```

#### `worksheet.py` - Model Phiếu học tập
```python
class Worksheet(Base):
    id: int
    teacher_id: int
    title: str
    grade: int (1-12)
    unit: str
    worksheet_type: str  # multiple_choice, essay, fill_in_blank, etc.
    skill_focus: str  # listening, speaking, reading, writing, etc.
    difficulty_level: str  # easy, medium, hard
    content: JSON
    answer_key: JSON
    duration: int (phút)
    total_points: int
    ai_generated: int (0/1)
```

### 2. AI Service (`app/services/gemini_service.py`)

#### Gemini AI Methods
```python
async def generate_lesson_plan(
    grade, unit, lesson_number, duration,
    focus_skills, language_functions,
    vocabulary_topics, grammar_points
) -> Dict

async def generate_worksheet(
    grade, unit, worksheet_type, skill_focus,
    difficulty_level, num_questions, duration
) -> Dict
```

### 3. API Endpoints

#### Lesson Plans (`/api/v1/lesson-plans/`)
- `GET /` - Lấy danh sách
- `GET /{id}` - Lấy chi tiết
- `POST /` - Tạo thủ công
- `POST /generate` - **Tạo bằng AI**
- `PUT /{id}` - Cập nhật
- `DELETE /{id}` - Xóa

#### Worksheets (`/api/v1/worksheets/`)
- `GET /` - Lấy danh sách (filter: grade, type, skill)
- `GET /{id}` - Lấy chi tiết
- `POST /` - Tạo thủ công
- `POST /generate` - **Tạo bằng AI**
- `PUT /{id}` - Cập nhật
- `DELETE /{id}` - Xóa

---

## 🎨 Kiến trúc Frontend

### 1. Components

#### `LessonPlans` Component
**Location**: `frontend/src/pages/Teacher/LessonPlans/`

**Features**:
- 📊 Stats cards: Tổng giáo án, AI generated, Manual
- 🎴 Card grid layout với AI badge
- 🔍 Filter theo khối lớp
- ➕ Tạo thủ công hoặc bằng AI
- 👁️ View chi tiết với modal
- ✏️ Edit với form đầy đủ
- 🗑️ Delete với confirmation

#### `Worksheets` Component
**Location**: `frontend/src/pages/Teacher/Worksheets/`

**Features**:
- 📊 Stats cards: Tổng phiếu, AI, Trắc nghiệm, Tự luận
- 🎴 Card grid với type badge + difficulty badge
- 🔍 Filter: Khối lớp, Loại, Kỹ năng
- 🤖 AI generation với form đầy đủ
- 👁️ View detail
- 🗑️ Delete

### 2. API Integration (`services/api.js`)

```javascript
// Lesson Plans API
lessonPlansAPI.getAll(params)
lessonPlansAPI.getById(id)
lessonPlansAPI.create(data)
lessonPlansAPI.generateWithAI(data)  // ⭐ AI Generation
lessonPlansAPI.update(id, data)
lessonPlansAPI.delete(id)

// Worksheets API
worksheetsAPI.getAll(params)
worksheetsAPI.getById(id)
worksheetsAPI.create(data)
worksheetsAPI.generateWithAI(data)  // ⭐ AI Generation
worksheetsAPI.update(id, data)
worksheetsAPI.delete(id)
```

### 3. Navigation Integration

**Location**: `TeacherDashboardV3/components/Sidebar.jsx`

```javascript
{
  title: 'TRỢ LÝ AI',
  items: [
    { id: 'lesson-plans', label: 'Tạo giáo án', icon: Wand2 },
    { id: 'worksheets', label: 'Tạo phiếu học tập', icon: Sparkles },
    // ...
  ]
}
```

---

## 🎨 UI/UX Design

### Color Scheme
- **Lesson Plans**: Purple gradient (`#8b5cf6` → `#7c3aed`)
- **Worksheets**: Cyan gradient (`#06b6d4` → `#0891b2`)
- **AI Features**: Pink gradient (`#ec4899` → `#db2777`)

### Responsive Design
- **Desktop**: 4-column grid
- **Tablet**: 2-3 columns
- **Mobile**: 1 column, full width

### Key UI Elements
- ✨ **AI Badge**: Pink gradient với Sparkles icon
- 🎯 **Difficulty Badges**: Color-coded (Green=Easy, Orange=Medium, Red=Hard)
- 📝 **Type Badges**: Cyan với icon phù hợp
- 🎴 **Card Hover**: Lift effect với shadow
- 📊 **Stats Cards**: Số liệu trực quan

---

## 🚀 Cách sử dụng

### 1. Tạo Giáo án bằng AI

**Bước 1**: Vào `Dashboard` → `TRỢ LÝ AI` → `Tạo giáo án`

**Bước 2**: Click nút "✨ Tạo bằng AI"

**Bước 3**: Điền form:
```
- Khối lớp: 6-12 (chọn khối phù hợp)
- Unit/Chủ đề: "Unit 7 - Technology"
- Tiết học: "Lesson 1"
- Thời lượng: 45 phút
- Kỹ năng tập trung: [Listening, Speaking]
- Chức năng ngôn ngữ: "Asking for directions"
- Ghi chú thêm: (tùy chọn)
```

**Bước 4**: Click "✨ Tạo giáo án"

**Kết quả**: AI sẽ tạo giáo án hoàn chỉnh với:
- ✅ Mục tiêu bài học (4 thành phần)
- ✅ Thiết bị dạy học
- ✅ 4 hoạt động chi tiết
- ✅ Ghi chú & Bài tập về nhà

### 2. Tạo Phiếu học tập bằng AI

**Bước 1**: Vào `TRỢ LÝ AI` → `Tạo phiếu học tập`

**Bước 2**: Click "✨ Tạo bằng AI"

**Bước 3**: Điền form:
```
- Khối lớp: 6-12
- Unit/Chủ đề: "Unit 7 - Technology"
- Loại phiếu: Trắc nghiệm / Tự luận / Điền khuyết / ...
- Kỹ năng: Reading / Listening / Writing / ...
- Độ khó: Dễ / Trung bình / Khó
- Số câu hỏi: 10-50
- Thời gian: 30 phút
```

**Bước 4**: Click "✨ Tạo phiếu học tập"

**Kết quả**: AI sẽ tạo phiếu học tập với:
- ✅ Câu hỏi theo loại đã chọn
- ✅ Đáp án chi tiết
- ✅ Ghi chú cho giáo viên
- ✅ Điểm số & Thời gian

### 3. Quản lý & Chỉnh sửa

#### View chi tiết:
- Click nút "👁️ Chi tiết" trên card
- Xem đầy đủ nội dung, mục tiêu, hoạt động

#### Edit:
- Click nút "✏️ Sửa"
- Chỉnh sửa các trường cần thiết
- Lưu thay đổi

#### Delete:
- Click nút "🗑️ Xóa"
- Confirm trong popup
- Giáo án/Phiếu sẽ bị xóa vĩnh viễn

---

## 📋 Chương trình 2018 - Compliance

### Lesson Plan Structure (Giáo án)

#### 1. Mục tiêu bài học
- **Kiến thức**: Nhận biết, hiểu về từ vựng, ngữ pháp, chức năng ngôn ngữ
- **Kỹ năng**: Phát triển 4 kỹ năng Nghe-Nói-Đọc-Viết
- **Năng lực**:
  - Tự học và tự chủ
  - Giao tiếp và hợp tác
  - Giải quyết vấn đề và sáng tạo
  - Sử dụng ngôn ngữ
- **Phẩm chất**:
  - Yêu nước, tự hào dân tộc
  - Nhân ái, khoan dung
  - Chăm chỉ, trung thực
  - Trách nhiệm

#### 2. Tiến trình dạy học (4 hoạt động)

**Hoạt động 1: Khởi động (Warm-up)**
- Mục đích: Tạo hứng thú, kết nối bài học
- Phương pháp: Game, Brainstorming, Discussion

**Hoạt động 2: Hình thành kiến thức (Presentation)**
- Mục đích: Giới thiệu từ vựng, ngữ pháp mới
- Phương pháp: Presentation, Demonstration, Guided discovery

**Hoạt động 3: Luyện tập (Practice)**
- Mục đích: Thực hành, củng cố
- Phương pháp: Pair work, Group work, Role-play

**Hoạt động 4: Vận dụng (Production)**
- Mục đích: Sử dụng trong tình huống thực tế
- Phương pháp: Project, Discussion, Creative tasks

### Worksheet Types (Phiếu học tập)

1. **Trắc nghiệm**: Kiểm tra kiến thức, dễ chấm điểm
2. **Tự luận**: Phát triển tư duy, viết
3. **Điền khuyết**: Ghi nhớ từ vựng, ngữ pháp
4. **Theo chủ đề**: Luyện tập chuyên sâu
5. **Tự học**: Hướng dẫn học tập tự chủ
6. **Tình huống**: Vận dụng kiến thức thực tế
7. **Kết hợp**: Đa dạng dạng bài

---

## 🔧 Technical Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLAlchemy ORM (SQLite/PostgreSQL)
- **AI**: Google Gemini 1.5 Flash
- **Authentication**: JWT Bearer Token

### Frontend
- **Framework**: React 18
- **Styling**: CSS Modules + Custom CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Router**: React Router v6

---

## 📝 Database Schema

### Lesson Plans Table
```sql
CREATE TABLE lesson_plans (
    id INTEGER PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    subject VARCHAR DEFAULT 'English',
    grade INTEGER NOT NULL,
    unit VARCHAR,
    lesson_number VARCHAR,
    duration INTEGER,
    objectives JSON,
    teaching_aids JSON,
    activities JSON,
    content TEXT,
    notes TEXT,
    homework TEXT,
    ai_generated INTEGER DEFAULT 0,
    ai_prompt TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);
```

### Worksheets Table
```sql
CREATE TABLE worksheets (
    id INTEGER PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    subject VARCHAR DEFAULT 'English',
    grade INTEGER NOT NULL,
    unit VARCHAR,
    worksheet_type VARCHAR NOT NULL,
    skill_focus VARCHAR,
    difficulty_level VARCHAR,
    content JSON,
    teacher_notes TEXT,
    answer_key JSON,
    duration INTEGER,
    total_points INTEGER,
    ai_generated INTEGER DEFAULT 0,
    ai_prompt TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);
```

---

## ✅ Hoàn thành 100%

### Backend ✅
- [x] Models (LessonPlan, Worksheet)
- [x] Schemas (Pydantic validation)
- [x] AI Service (Gemini integration)
- [x] Routers (CRUD + AI endpoints)
- [x] Database migration

### Frontend ✅
- [x] LessonPlans component với UI đẹp
- [x] Worksheets component với UI đẹp
- [x] API integration
- [x] Navigation trong TeacherDashboard
- [x] Responsive design
- [x] Modal workflows (Create, Edit, Delete, View)

### Features ✅
- [x] AI Generation với Gemini
- [x] CRUD đầy đủ
- [x] Filter và search
- [x] Stats và analytics
- [x] Bám sát chương trình 2018

---

## 🚦 Cách test

### 1. Start Backend
```bash
cd EnglishWebAI/backend
python -m uvicorn main:app --reload
```

### 2. Start Frontend
```bash
cd EnglishWebAI/frontend
npm start
```

### 3. Login as Teacher
- Email: `teacher@example.com`
- Password: (mật khẩu của bạn)

### 4. Test Flow
1. Vào `TRỢ LÝ AI` → `Tạo giáo án`
2. Click "✨ Tạo bằng AI"
3. Điền: Lớp 6, Unit 7 - Technology, Lesson 1
4. Submit → Đợi 10-20 giây
5. Kiểm tra giáo án được tạo
6. Test Edit, Delete, View

7. Vào `Tạo phiếu học tập`
8. Click "✨ Tạo bằng AI"
9. Điền: Lớp 6, Unit 7, Trắc nghiệm, Reading, 10 câu
10. Submit → Kiểm tra phiếu được tạo

---

## 📚 Tài liệu tham khảo

- Chương trình Giáo dục phổ thông môn Ngoại ngữ 2018
- Phương pháp dạy học Communicative Language Teaching (CLT)
- Google Gemini API Documentation

---

**Được tạo bởi**: AI Assistant
**Ngày**: October 2025
**Version**: 1.0.0

🎉 **Hệ thống đã sẵn sàng để sử dụng!**

