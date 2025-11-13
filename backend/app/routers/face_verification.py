"""
Face Verification API Router
Endpoints for enrolling and verifying student faces during exams
"""


from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.student_face_data import StudentFaceData
from app.models.user import User, UserRole
from app.services.face_recognition_service import get_face_recognition_service

router = APIRouter()


# Schemas
class EnrollFaceRequest(BaseModel):
    """Request body for face enrollment"""
    image: str  # base64 encoded image


class EnrollFaceResponse(BaseModel):
    """Response for face enrollment"""
    success: bool
    message: str
    enrollment_id: int | None = None
    confidence: str | None = None


class VerifyFaceRequest(BaseModel):
    """Request body for face verification"""
    image: str  # base64 encoded image
    exercise_id: int | None = None  # For logging purposes


class VerifyFaceResponse(BaseModel):
    """Response for face verification"""
    success: bool
    verified: bool
    message: str
    similarity: float | None = None
    confidence: str | None = None


@router.post("/enroll-face", response_model=EnrollFaceResponse)
async def enroll_student_face(
    request: EnrollFaceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enroll student face for future verification
    Only students can enroll their own faces
    """
    # Only students can enroll faces
    if current_user.role != UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can enroll faces"
        )

    # Get face recognition service
    face_service = get_face_recognition_service()

    # Process face enrollment
    result = face_service.enroll_face(request.image)

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Face enrollment failed")
        )

    # Check if student already has face data
    existing_face = db.query(StudentFaceData).filter(
        StudentFaceData.user_id == current_user.id,
        StudentFaceData.is_active.is_(True)
    ).first()

    if existing_face:
        # Deactivate old face data
        existing_face.is_active = False
        db.commit()

    # Store new face embedding in database
    face_data = StudentFaceData(
        user_id=current_user.id,
        embedding=result["embedding"],
        confidence_score=f"{len(result['embedding'])} features",
        image_quality="good"
    )

    db.add(face_data)
    db.commit()
    db.refresh(face_data)

    return EnrollFaceResponse(
        success=True,
        message="Face enrolled successfully",
        enrollment_id=face_data.id,
        confidence=face_data.confidence_score
    )


@router.post("/verify-face", response_model=VerifyFaceResponse)
async def verify_student_face(
    request: VerifyFaceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify student face before starting exam
    Only students can verify their own faces
    """
    # Only students can verify faces
    if current_user.role != UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can verify faces"
        )

    # Get student's enrolled face data
    face_data = db.query(StudentFaceData).filter(
        StudentFaceData.user_id == current_user.id,
        StudentFaceData.is_active.is_(True)
    ).first()

    if not face_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No face enrolled. Please enroll your face first in your profile settings."
        )

    # Get face recognition service
    face_service = get_face_recognition_service()

    # Verify face against stored embedding
    result = face_service.verify_face(
        base64_image=request.image,
        stored_embedding=face_data.embedding,
        threshold=0.6  # 60% similarity threshold
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Face verification failed")
        )

    # Return verification result
    if result["verified"]:
        message = "Identity verified successfully"
    else:
        message = f"Identity verification failed. Similarity: {result['confidence']}"

    return VerifyFaceResponse(
        success=result["success"],
        verified=result["verified"],
        message=message,
        similarity=result.get("similarity"),
        confidence=result.get("confidence")
    )


@router.get("/enrollment-status")
async def check_enrollment_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if current student has enrolled face
    """
    # Check if face recognition service is available
    face_service = get_face_recognition_service()
    models_ready = face_service.initialize_models()

    if current_user.role != UserRole.USER:
        return {
            "enrolled": False,
            "models_ready": models_ready,
            "message": "Only students need face enrollment"
        }

    face_data = db.query(StudentFaceData).filter(
        StudentFaceData.user_id == current_user.id,
        StudentFaceData.is_active.is_(True)
    ).first()

    return {
        "enrolled": face_data is not None,
        "models_ready": models_ready,
        "enrollment_date": face_data.enrollment_date if face_data else None,
        "message": "Face enrolled" if face_data else "No face enrolled"
    }


@router.delete("/remove-enrollment")
async def remove_face_enrollment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove student's face enrollment
    """
    if current_user.role != UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can remove face enrollment"
        )

    face_data = db.query(StudentFaceData).filter(
        StudentFaceData.user_id == current_user.id,
        StudentFaceData.is_active.is_(True)
    ).first()

    if not face_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No face enrollment found"
        )

    # Soft delete by marking as inactive
    face_data.is_active = False
    db.commit()

    return {
        "success": True,
        "message": "Face enrollment removed successfully"
    }
