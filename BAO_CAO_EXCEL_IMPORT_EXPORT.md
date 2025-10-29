# 📊 BÁO CÁO CHỨC NĂNG EXCEL/CSV IMPORT & EXPORT

## ✅ **TÓM TẮT TỔNG QUAN**

| Chức năng | Vị trí | Backend | Frontend | Trạng thái |
|-----------|--------|---------|----------|------------|
| **Import Users (Admin)** | Admin Dashboard | ✅ Hoạt động | ✅ Hoạt động | 🟢 **HOÀN THIỆN** |
| **Import Questions** | Ngân hàng câu hỏi | ✅ Hoạt động | ✅ Hoạt động | 🟢 **HOÀN THIỆN** |
| **Import Students (Teacher)** | Quản lý lớp học | ❌ Chưa có | 🟡 Chỉ có UI | 🔴 **CHƯA HOẠT ĐỘNG** |
| **Export Error Analysis** | Xuất phân tích lỗi | ✅ Hoạt động | ✅ Hoạt động | 🟢 **HOÀN THIỆN** |
| **Export Reports** | Xuất báo cáo | ✅ Hoạt động | ✅ Hoạt động | 🟢 **HOÀN THIỆN** |
| **Export Test (DOCX)** | Ngân hàng câu hỏi | ✅ Hoạt động | ✅ Hoạt động | 🟢 **HOÀN THIỆN** |

---

## 🟢 **CHỨC NĂNG ĐÃ HOẠT ĐỘNG (5/6)**

### **1. Import Users từ CSV (Admin)** ✅

**Backend:**
- **Endpoint:** `POST /api/v1/admin/users/import-csv`
- **File:** `backend/app/routers/admin.py` (line 70-81)
- **Service:** `AdminService.import_users_csv()`
- **Định dạng:** CSV với headers: `name,email,role,phone`

**Frontend:**
- **Vị trí:** Admin Dashboard → User Management → Import CSV
- **File:** `frontend/src/pages/Admin/`
- **Tính năng:** Upload CSV, download template, bulk import users

**Cách sử dụng:**
```bash
# Format CSV:
name,email,role,phone
Nguyễn Văn A,student1@gmail.com,student,0123456789
Trần Thị B,teacher1@gmail.com,teacher,0987654321
```

---

### **2. Import Questions từ CSV/DOCX** ✅

**Backend:**
- **Endpoint:** `POST /api/v1/question-bank/import`
- **File:** `backend/app/routers/question_bank.py` (line 553-572)
- **Hỗ trợ:** CSV và DOCX
- **Định dạng:** `skill_type,question_type,question_text,options,correct_answer,difficulty,topic`

**Frontend:**
- **Vị trí:** Ngân hàng câu hỏi → Import File button
- **File:** `frontend/src/pages/Teacher/TeacherDashboardV3/components/QuestionBankV2.jsx`
- **API:** `questionBankAPI.importCSV(file)`

**Cách sử dụng:**
```csv
skill_type,question_type,question_text,options,correct_answer,difficulty,topic
reading,multiple_choice,What is the main idea?,A. First|B. Second|C. Third,A,medium,Reading Comprehension
writing,task,Write an essay about...,,,medium,Essay Writing
```

---

### **3. Export Error Analysis (CSV/JSON)** ✅

**Backend:**
- **Endpoint:** `POST /api/v1/weekly-assessments/export/error-analysis`
- **File:** `backend/app/routers/weekly_assessments.py` (line 266-411)
- **Định dạng:** CSV, JSON, Excel (Excel coming soon)

**Frontend:**
- **Vị trí:** Teacher Dashboard → Xuất phân tích lỗi
- **File:** `frontend/src/pages/Teacher/ErrorAnalysis/ErrorAnalysisExport.jsx`
- **Tính năng:** 
  - Chọn lớp, tuần, kỹ năng
  - Xuất CSV hoặc JSON
  - Download trực tiếp

**Cách sử dụng:**
1. Vào Teacher Dashboard
2. Click "📊 Xuất phân tích lỗi"
3. Chọn lớp học
4. Chọn định dạng (CSV/JSON)
5. Click "Tải xuống báo cáo"

**Dữ liệu bao gồm:**
- Tên học sinh
- Bài tập, kỹ năng
- Điểm AI + Teacher
- Chi tiết lỗi sai
- Gợi ý cải thiện
- Phản hồi AI

---

### **4. Export Reports (Excel)** ✅

**Backend:**
- **Endpoint:** `GET /api/v1/exports/*` (nhiều endpoints)
- **File:** `backend/app/routers/exports.py`
- **Library:** `openpyxl`
- **Tính năng:**
  - Export student grades
  - Export class performance
  - Export submissions
  - Styled Excel with headers, borders, colors

**Frontend:**
- **Vị trí:** Teacher Dashboard → Export Reports
- **File:** `frontend/src/pages/Teacher/TeacherDashboardV3/components/ExportReports.jsx`
- **Service:** `exportService.js`

---

### **5. Export Test to DOCX** ✅

**Backend:**
- **Endpoint:** `POST /api/v1/question-bank/export-docx`
- **File:** `backend/app/routers/question_bank.py`
- **Library:** `python-docx`
- **Tính năng:** Export bộ đề thi ra file Word (.docx)

**Frontend:**
- **Vị trí:** Ngân hàng câu hỏi → Generated Test → Export DOCX button
- **API:** `questionBankAPI.exportDocx(test)`

---

## 🔴 **CHỨC NĂNG CHƯA HOẠT ĐỘNG (1/6)**

### **6. Import Students từ Excel (Teacher)** ❌

**Vấn đề:**
- ✅ **Frontend:** Có UI modal đẹp, form upload
- ❌ **Backend:** Không có API endpoint
- ❌ **Logic:** Các button chưa có handler function

**Vị trí UI:**
- Teacher Dashboard → Quản lý lớp học → Click lớp → Click "↑ Import Excel"
- File: `frontend/src/pages/Teacher/TeacherDashboardV3/components/ClassManagement.jsx` (line 204-273)

**Các nút chưa hoạt động:**
1. **"Tải file mẫu"** (line 222-225) - Không có onClick handler
2. **"Chọn file từ máy tính"** (line 233) - Không có input file
3. **"Import học sinh"** (line 266-269) - Không có onClick handler

**Cần làm gì để hoàn thiện:**

#### **Backend (Cần tạo):**
```python
# File: backend/app/routers/classes.py

@router.post("/{class_id}/students/import-csv")
async def import_students_csv(
    class_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import students to class from CSV
    Format: email,name,phone (optional)
    """
    # 1. Kiểm tra quyền (teacher owns class)
    # 2. Parse CSV file
    # 3. Tìm/tạo user accounts
    # 4. Add students to class (Enrollment)
    # 5. Return results (imported count, failed, errors)
```

#### **Frontend (Cần sửa):**
1. Thêm state cho file upload
2. Thêm handler functions:
   - `handleDownloadTemplate()` - Download sample CSV
   - `handleFileSelect()` - Select file from computer
   - `handleImportStudents()` - Upload and import
3. Hiển thị kết quả import (success/fail count)

---

## 📝 **HƯỚNG DẪN SỬA CHỨC NĂNG IMPORT STUDENTS**

### **Bước 1: Tạo Backend API**

Tôi sẽ tạo endpoint mới trong `classes.py`:

```python
POST /api/v1/classes/{class_id}/students/import
Content-Type: multipart/form-data
Body: file (CSV)

CSV Format:
email,name,phone
student1@gmail.com,Nguyễn Văn A,0123456789
student2@gmail.com,Trần Thị B,0987654321
```

### **Bước 2: Download Template**

Tạo endpoint để tải file mẫu:

```python
GET /api/v1/classes/students/template
Response: CSV file download
```

### **Bước 3: Cập nhật Frontend**

Sửa file `ClassManagement.jsx`:
- Thêm state: `importFile`, `importResults`
- Thêm functions để xử lý import
- Connect với backend API

---

## 🎯 **KHUYẾN NGHỊ**

1. **Ưu tiên cao:** Hoàn thiện chức năng Import Students
   - Đây là tính năng quan trọng cho giáo viên
   - UI đã sẵn sàng, chỉ cần backend + logic

2. **Nâng cao:** Thêm Excel export cho Error Analysis
   - Hiện tại chỉ có CSV/JSON
   - Có thể dùng `openpyxl` như trong `exports.py`

3. **Tối ưu:** Thêm validation cho CSV import
   - Kiểm tra format file
   - Validate email format
   - Duplicate detection
   - Error reporting chi tiết

---

## ✅ **CHECKLIST HOÀN THIỆN**

### **Import Students:**
- [ ] Backend: Tạo API endpoint `POST /classes/{id}/students/import`
- [ ] Backend: Tạo API template `GET /classes/students/template`
- [ ] Backend: Service xử lý CSV parsing
- [ ] Backend: Validation email, phone, duplicates
- [ ] Frontend: Handler `handleDownloadTemplate()`
- [ ] Frontend: Handler `handleFileSelect()`  
- [ ] Frontend: Handler `handleImportStudents()`
- [ ] Frontend: Hiển thị kết quả import
- [ ] Testing: Upload CSV thành công
- [ ] Testing: Xử lý lỗi (file sai format, email trùng, v.v.)

---

## 📞 **BẠN MUỐN TÔI LÀM GÌ?**

Tôi có thể giúp bạn:

1. **✨ Hoàn thiện chức năng Import Students** (Backend + Frontend)
2. **📊 Thêm Excel export cho Error Analysis**
3. **🔍 Fix các bug hiện tại trong Excel features**
4. **📝 Tạo documentation chi tiết hơn**

**Bạn muốn tôi làm gì trước?**

