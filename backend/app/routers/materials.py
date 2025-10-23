from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.material import Material
from app.schemas.student import MaterialListResponse, MaterialResponse

router = APIRouter()

@router.get("/", response_model=List[MaterialListResponse])
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
            "title": "Toán lớp 2 - Phép cộng trừ cơ bản",
            "description": "Học các phép cộng trừ cơ bản từ 1-100",
            "subject": "Toán",
            "grade": "Lớp 2",
            "difficulty": "Dễ",
            "lessons": 15,
            "duration": "2 tuần",
            "progress": 0,
            "image": "📚",
            "color": "blue",
            "chapters": [
                {"id": 1, "title": "Phép cộng trong phạm vi 20", "lessons": 5, "completed": 0},
                {"id": 2, "title": "Phép trừ trong phạm vi 20", "lessons": 5, "completed": 0},
                {"id": 3, "title": "Phép cộng trừ có nhớ", "lessons": 5, "completed": 0}
            ]
        },
        {
            "id": 2,
            "title": "Tiếng Anh lớp 3 - Từ vựng cơ bản",
            "description": "Học từ vựng tiếng Anh cơ bản cho trẻ em",
            "subject": "Tiếng Anh",
            "grade": "Lớp 3",
            "difficulty": "Trung bình",
            "lessons": 20,
            "duration": "3 tuần",
            "progress": 0,
            "image": "🌍",
            "color": "green",
            "chapters": [
                {"id": 1, "title": "Gia đình và bạn bè", "lessons": 6, "completed": 0},
                {"id": 2, "title": "Màu sắc và số đếm", "lessons": 7, "completed": 0},
                {"id": 3, "title": "Động vật và thiên nhiên", "lessons": 7, "completed": 0}
            ]
        },
        {
            "id": 3,
            "title": "Khoa học lớp 4 - Thế giới tự nhiên",
            "description": "Khám phá thế giới tự nhiên xung quanh",
            "subject": "Khoa học",
            "grade": "Lớp 4",
            "difficulty": "Trung bình",
            "lessons": 18,
            "duration": "4 tuần",
            "progress": 0,
            "image": "🔬",
            "color": "purple",
            "chapters": [
                {"id": 1, "title": "Thực vật và động vật", "lessons": 6, "completed": 0},
                {"id": 2, "title": "Môi trường sống", "lessons": 6, "completed": 0},
                {"id": 3, "title": "Bảo vệ môi trường", "lessons": 6, "completed": 0}
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
