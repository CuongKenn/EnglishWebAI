from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
import os
import shutil
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.material import Material
from app.models.lesson import Lesson
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.schemas.student import MaterialListResponse, MaterialResponse
from app.schemas.student import MaterialCreate, MaterialUpdate

router = APIRouter()


# ===================== Student: Access Materials =====================

@router.get("/student/materials/", response_model=List[MaterialListResponse])
async def get_student_materials_list(
    class_id: Optional[int] = None,
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách học liệu mà học sinh có thể truy cập (endpoint dành riêng cho student)
    - Chỉ trả về học liệu từ các lớp mà học sinh đã tham gia với role='student' và status='active'
    - Có thể lọc theo class_id và type
    """
    # Lấy danh sách class_id mà học sinh đã tham gia
    enrolled_class_ids = db.query(Enrollment.class_id).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.role == "student",
            Enrollment.status == "active"
        )
    ).all()
    
    enrolled_class_ids = [c[0] for c in enrolled_class_ids]
    
    if not enrolled_class_ids:
        return []
    
    # Query materials
    query = db.query(Material).filter(Material.class_id.in_(enrolled_class_ids))
    
    # Filters
    if class_id:
        if class_id not in enrolled_class_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập lớp học này"
            )
        query = query.filter(Material.class_id == class_id)
    
    if type:
        query = query.filter(Material.type == type)
    
    query = query.order_by(Material.created_at.desc())
    materials = query.all()
    
    return materials

# ===================== Public/Legacy Endpoints =====================

@router.get("/", response_model=List[MaterialListResponse])
async def get_student_materials(
    class_id: Optional[int] = None,
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách học liệu mà học sinh có thể truy cập
    - Chỉ trả về học liệu từ các lớp mà học sinh đã tham gia với role='student' và status='active'
    - Có thể lọc theo class_id và type
    """
    # Lấy danh sách class_id mà học sinh đã tham gia
    enrolled_class_ids = db.query(Enrollment.class_id).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.role == "student",
            Enrollment.status == "active"
        )
    ).all()
    
    enrolled_class_ids = [c[0] for c in enrolled_class_ids]
    
    if not enrolled_class_ids:
        return []
    
    # Query materials
    query = db.query(Material).filter(Material.class_id.in_(enrolled_class_ids))
    
    # Filters
    if class_id:
        if class_id not in enrolled_class_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập lớp học này"
            )
        query = query.filter(Material.class_id == class_id)
    
    if type:
        query = query.filter(Material.type == type)
    
    query = query.order_by(Material.created_at.desc())
    materials = query.all()
    
    return materials


@router.get("/student/materials/{material_id}", response_model=MaterialResponse)
async def get_student_material_detail(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy chi tiết học liệu
    - Kiểm tra quyền truy cập: học sinh phải tham gia lớp chứa học liệu
    """
    material = db.query(Material).filter(Material.id == material_id).first()
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy học liệu"
        )
    
    # Determine class_id
    class_id = material.class_id
    if not class_id and material.lesson_id:
        lesson = db.query(Lesson).filter(Lesson.id == material.lesson_id).first()
        if lesson:
            class_id = lesson.class_id
    
    if not class_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Học liệu không thuộc lớp học nào"
        )
    
    # Check enrollment
    enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.class_id == class_id,
            Enrollment.user_id == current_user.id,
            Enrollment.role == "student",
            Enrollment.status == "active"
        )
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập học liệu này"
        )
    
    return material


@router.get("/student/materials/by-class/{class_id}", response_model=List[MaterialResponse])
async def get_student_materials_by_class(
    class_id: int,
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách học liệu theo lớp học
    - Kiểm tra quyền truy cập: học sinh phải tham gia lớp
    """
    # Check enrollment
    enrollment = db.query(Enrollment).filter(
        and_(
            Enrollment.class_id == class_id,
            Enrollment.user_id == current_user.id,
            Enrollment.role == "student",
            Enrollment.status == "active"
        )
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập lớp học này"
        )
    
    # Query materials
    query = db.query(Material).filter(Material.class_id == class_id)
    
    if type:
        query = query.filter(Material.type == type)
    
    query = query.order_by(Material.created_at.desc())
    materials = query.all()
    
    return materials


@router.get("/student/materials/statistics")
async def get_student_materials_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Thống kê học liệu của học sinh
    - Tổng số học liệu có thể truy cập
    - Phân loại theo type
    - Theo từng lớp học
    """
    # Lấy danh sách class_id mà học sinh đã tham gia
    enrolled_classes = db.query(
        Enrollment.class_id,
        Classroom.name
    ).join(
        Classroom, Enrollment.class_id == Classroom.id
    ).filter(
        and_(
            Enrollment.user_id == current_user.id,
            Enrollment.role == "student",
            Enrollment.status == "active"
        )
    ).all()
    
    if not enrolled_classes:
        return {
            "total_materials": 0,
            "by_type": {},
            "by_class": []
        }
    
    enrolled_class_ids = [c[0] for c in enrolled_classes]
    class_names = {c[0]: c[1] for c in enrolled_classes}
    
    # Tổng số materials
    total = db.query(func.count(Material.id)).filter(
        Material.class_id.in_(enrolled_class_ids)
    ).scalar()
    
    # Phân loại theo type
    by_type = db.query(
        Material.type,
        func.count(Material.id).label("count")
    ).filter(
        Material.class_id.in_(enrolled_class_ids)
    ).group_by(Material.type).all()
    
    by_type_dict = {t[0]: t[1] for t in by_type}
    
    # Phân loại theo class
    by_class = db.query(
        Material.class_id,
        func.count(Material.id).label("count")
    ).filter(
        Material.class_id.in_(enrolled_class_ids)
    ).group_by(Material.class_id).all()
    
    by_class_list = [
        {
            "class_id": c[0],
            "class_name": class_names.get(c[0], "Unknown"),
            "count": c[1]
        }
        for c in by_class
    ]
    
    return {
        "total_materials": total,
        "by_type": by_type_dict,
        "by_class": by_class_list
    }


# ===================== Public/Legacy Endpoints =====================

async def get_materials(
    grade: str = None,
    subject: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lấy danh sách học liệu
    """
    # Mock data matching frontend expectations
    mock_materials = [
        {
            "id": 1,
            "title": "English Grade 2 - Basic Vocabulary",
            "description": "Learn basic English vocabulary for beginners",
            "subject": "Vocabulary",
            "grade": "Lớp 2",
            "difficulty": "Dễ",
            "lessons": 15,
            "duration": "2 tuần",
            "progress": 0,
            "image": "📚",
            "color": "blue",
            "chapters": [
                {"id": 1, "title": "Colors and Numbers", "lessons": 5, "completed": 0},
                {"id": 2, "title": "Family Members", "lessons": 5, "completed": 0},
                {"id": 3, "title": "Common Objects", "lessons": 5, "completed": 0}
            ]
        },
        {
            "id": 2,
            "title": "English Grade 3 - Basic Listening",
            "description": "Practice basic English listening comprehension for children",
            "subject": "Listening",
            "grade": "Lớp 3",
            "difficulty": "Trung bình",
            "lessons": 20,
            "duration": "3 tuần",
            "progress": 0,
            "image": "🌍",
            "color": "green",
            "chapters": [
                {"id": 1, "title": "Family and Friends", "lessons": 6, "completed": 0},
                {"id": 2, "title": "Colors and Numbers", "lessons": 7, "completed": 0},
                {"id": 3, "title": "Animals and Nature", "lessons": 7, "completed": 0}
            ]
        },
        {
            "id": 3,
            "title": "English Grade 4 - Reading Comprehension",
            "description": "Develop reading comprehension skills with age-appropriate texts",
            "subject": "Reading",
            "grade": "Lớp 4",
            "difficulty": "Trung bình",
            "lessons": 18,
            "duration": "4 tuần",
            "progress": 0,
            "image": "🔬",
            "color": "purple",
            "chapters": [
                {"id": 1, "title": "Short Stories", "lessons": 6, "completed": 0},
                {"id": 2, "title": "Descriptive Texts", "lessons": 6, "completed": 0},
                {"id": 3, "title": "Reading for Information", "lessons": 6, "completed": 0}
            ]
        }
    ]
    
    # Filter by parameters
    filtered = mock_materials
    if grade:
        filtered = [mat for mat in filtered if mat["grade"] == grade]
    if subject:
        filtered = [mat for mat in filtered if mat["subject"] == subject]
    
    return filtered

@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: int,
    db: Session = Depends(get_db)
):
    """
    Lấy thông tin chi tiết của học liệu
    """
    material = db.query(Material).filter(Material.id == material_id).first()
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy học liệu"
        )
    
    return material

@router.post("/{material_id}/progress")
async def update_material_progress(
    material_id: int,
    progress: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cập nhật tiến độ học liệu
    """
    material = db.query(Material).filter(Material.id == material_id).first()
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy học liệu"
        )
    
    # TODO: Implement MaterialProgress model and logic
    return {
        "message": "Đã cập nhật tiến độ học liệu",
        "material_id": material_id,
        "progress": progress
    }

@router.get("/{material_id}/download")
async def download_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Tải xuống học liệu
    """
    material = db.query(Material).filter(Material.id == material_id).first()
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy học liệu"
        )
    
    if not material.file_path and not material.url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Học liệu không có file để tải xuống"
        )
    
    # TODO: Implement file download logic
    return {
        "url": material.url or material.file_path,
        "filename": material.title
    }


# ===================== Teacher/Admin: CRUD Materials =====================

def _ensure_can_manage_class(db: Session, current_user: User, class_id: int) -> Classroom:
    classroom: Optional[Classroom] = db.query(Classroom).filter(Classroom.id == class_id).first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy lớp học")
    if current_user.role in (UserRole.ADMIN, UserRole.SUPERADMIN):
        return classroom
    if current_user.role == UserRole.TEACHER and classroom.teacher_id == current_user.id:
        return classroom
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền quản lý lớp học này")


def _get_material_class_id(db: Session, material: Material) -> Optional[int]:
    if material.class_id:
        return material.class_id
    if material.lesson_id:
        lesson = db.query(Lesson).filter(Lesson.id == material.lesson_id).first()
        if lesson:
            return lesson.class_id
    return None


@router.get("/by-class/{class_id}", response_model=List[MaterialResponse])
async def list_materials_by_class(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Danh sách học liệu theo lớp (giáo viên lớp hoặc admin)"""
    _ensure_can_manage_class(db, current_user, class_id)
    materials = db.query(Material).filter(Material.class_id == class_id).all()
    return materials


@router.get("/by-lesson/{lesson_id}", response_model=List[MaterialResponse])
async def list_materials_by_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Danh sách học liệu theo bài học (giáo viên lớp của bài học hoặc admin)"""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài học")
    _ensure_can_manage_class(db, current_user, int(lesson.class_id))
    materials = db.query(Material).filter(Material.lesson_id == lesson_id).all()
    return materials


@router.post("/", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_material(
    payload: MaterialCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tạo học liệu mới (chỉ giáo viên lớp hoặc admin)

    Yêu cầu: cung cấp ít nhất một trong `class_id` hoặc `lesson_id`.
    Nếu chỉ có `lesson_id`, hệ thống sẽ suy ra `class_id` từ bài học.
    """
    if not payload.class_id and not payload.lesson_id:
        raise HTTPException(status_code=400, detail="Cần cung cấp class_id hoặc lesson_id")

    # Determine class_id and ensure permission
    class_id: Optional[int] = payload.class_id
    if payload.lesson_id and not class_id:
        lesson = db.query(Lesson).filter(Lesson.id == payload.lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
        class_id = int(lesson.class_id)

    if class_id is None:
        raise HTTPException(status_code=400, detail="Không xác định được lớp học cho học liệu")

    _ensure_can_manage_class(db, current_user, int(class_id))

    material = Material(
        class_id=class_id,
        lesson_id=payload.lesson_id,
        title=payload.title,
        type=payload.type,
        url=payload.url,
        file_path=payload.file_path,
        description=payload.description,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: int,
    payload: MaterialUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cập nhật học liệu (giáo viên lớp hoặc admin)"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Không tìm thấy học liệu")
    class_id = _get_material_class_id(db, material)
    if class_id is None:
        raise HTTPException(status_code=400, detail="Học liệu không gắn với lớp hợp lệ")
    _ensure_can_manage_class(db, current_user, int(class_id))

    if payload.title is not None:
        material.title = payload.title
    if payload.description is not None:
        material.description = payload.description
    if payload.url is not None:
        material.url = payload.url
    if getattr(payload, 'lesson_id', None) is not None:
        if payload.lesson_id is None:
            material.lesson_id = None
        else:
            lesson = db.query(Lesson).filter(Lesson.id == payload.lesson_id).first()
            if not lesson:
                raise HTTPException(status_code=404, detail="Không tìm thấy bài học")
            # Check permission within that class
            _ensure_can_manage_class(db, current_user, int(lesson.class_id))
            material.lesson_id = int(payload.lesson_id)
            # Keep class_id in sync
            material.class_id = int(lesson.class_id)
    db.commit()
    db.refresh(material)
    return material


@router.delete("/{material_id}")
async def delete_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Xóa học liệu (giáo viên lớp hoặc admin)"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Không tìm thấy học liệu")
    class_id = _get_material_class_id(db, material)
    if class_id is None:
        raise HTTPException(status_code=400, detail="Học liệu không gắn với lớp hợp lệ")
    _ensure_can_manage_class(db, current_user, int(class_id))

    # Optionally, remove file from disk
    try:
        if material.file_path and os.path.isfile(material.file_path):
            os.remove(material.file_path)
    except Exception:
        # Ignore file delete errors
        pass

    db.delete(material)
    db.commit()
    return {"message": "Đã xóa học liệu"}


def _pick_writable_materials_dir() -> str:
    """Pick a writable base directory for storing uploaded materials.
    Priority:
    1) ENV MEDIA_ROOT
    2) <project>/media/materials (relative to this file)
    3) /tmp/englishwebai/media/materials
    Returns a path that exists and is writable.
    """
    # 1) ENV override
    env_root = os.getenv("MEDIA_ROOT")
    candidates = []
    if env_root:
        candidates.append(os.path.join(env_root, "materials"))

    # 2) Project media/materials
    proj_media = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "media", "materials"))
    candidates.append(proj_media)

    # 3) /tmp fallback
    candidates.append(os.path.abspath("/tmp/englishwebai/media/materials"))

    for path in candidates:
        try:
            os.makedirs(path, exist_ok=True)
            # Sanity check write permission
            testfile = os.path.join(path, ".permcheck")
            with open(testfile, "w") as f:
                f.write("ok")
            os.remove(testfile)
            return path
        except Exception:
            continue
    # If all fail, raise explicit error
    raise HTTPException(status_code=500, detail="Không thể tạo thư mục lưu trữ học liệu (permissions)")


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_material_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload file học liệu, trả về đường dẫn lưu trữ.
    
    Hỗ trợ các định dạng: PDF, Word, PowerPoint, Excel, Images, Audio, Video, Text
    
    Lưu ý: endpoint này chỉ upload file, chưa tạo bản ghi Material.
    Dùng đường dẫn trả về (file_path) khi gọi API tạo học liệu.
    """
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên hoặc admin mới được upload")

    # Ensure media directory exists and is writable (with fallbacks)
    base_dir = _pick_writable_materials_dir()

    # Build unique filename
    date_dir = datetime.utcnow().strftime("%Y%m%d")
    save_dir = os.path.join(base_dir, date_dir)
    os.makedirs(save_dir, exist_ok=True)

    # Sanitize original filename
    original = os.path.basename(file.filename or "material")
    name, ext = os.path.splitext(original)
    ext = ext.lower()
    
    # Validate file type
    allowed_extensions = {
        # Documents
        '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
        # Text
        '.txt', '.md', '.csv',
        # Images
        '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
        # Audio
        '.mp3', '.wav', '.ogg', '.m4a',
        # Video
        '.mp4', '.avi', '.mov', '.webm',
        # Archives
        '.zip', '.rar'
    }
    
    if ext and ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Định dạng file không được hỗ trợ. Cho phép: {', '.join(allowed_extensions)}"
        )
    
    # Determine file type
    file_type = "file"  # default
    if ext in ['.pdf']:
        file_type = "pdf"
    elif ext in ['.doc', '.docx']:
        file_type = "document"
    elif ext in ['.ppt', '.pptx']:
        file_type = "presentation"  # PowerPoint
    elif ext in ['.xls', '.xlsx']:
        file_type = "spreadsheet"
    elif ext in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']:
        file_type = "image"
    elif ext in ['.mp3', '.wav', '.ogg', '.m4a']:
        file_type = "audio"
    elif ext in ['.mp4', '.avi', '.mov', '.webm']:
        file_type = "video"
    elif ext in ['.txt', '.md', '.csv']:
        file_type = "text"
    
    ts = datetime.utcnow().strftime("%H%M%S%f")
    filename = f"{name}_{ts}{ext}" if ext else f"{name}_{ts}"
    file_path = os.path.join(save_dir, filename)

    # Save file with streaming copy for robustness
    try:
        with open(file_path, "wb") as out:
            # Prefer streaming to handle large files and avoid await issues
            shutil.copyfileobj(file.file, out)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    # If this is a text file, read back as UTF-8 (best effort) for auto material
    text_content = None
    try:
        name_lower = original.lower()
        if (file.content_type or "").startswith("text/") or name_lower.endswith(".txt") or name_lower.endswith(".md"):
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                # Cap to ~200 KB to avoid overly large payloads
                text_content = f.read(200_000)
    except Exception:
        text_content = None

    # Return info
    size = 0
    try:
        size = os.path.getsize(file_path)
    except Exception:
        pass
    # Try compute public URL if stored under project media
    public_url = None
    proj_media_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "media"))
    if file_path.startswith(proj_media_root):
        # Expose as /media/<relative>
        rel = os.path.relpath(file_path, proj_media_root).replace("\\", "/")
        public_url = f"/media/{rel}"
    return {
        "file_path": file_path,
        "filename": original,
        "file_type": file_type,
        "size": size,
        "public_url": public_url,
        "text_content": text_content,
    }
