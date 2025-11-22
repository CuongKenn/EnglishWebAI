"""
Face Verification API Router
Endpoints for enrolling and verifying student faces during exams
"""


from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

import base64
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.exam_monitoring import ExamMonitoringAlert
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


class ContinuousFaceCheckRequest(BaseModel):
    """Request body for continuous face monitoring"""
    image: str  # base64 encoded image
    exercise_id: int | None = None  # For logging purposes


class ContinuousFaceCheckResponse(BaseModel):
    """Response for continuous face monitoring"""
    success: bool
    verified: bool
    face_detected: bool
    face_count: int
    similarity: float | None = None
    confidence: str | None = None
    warning: str | None = None
    alert: str | None = None
    message: str | None = None


class SaveMonitoringAlertRequest(BaseModel):
    """Request to save monitoring alert image"""
    image: str  # base64 encoded image
    alert_type: str  # 'warning' or 'alert'
    exercise_id: int | None = None
    exam_id: int | None = None
    submission_id: int | None = None
    message: str | None = None
    face_count: int | None = None
    verified: bool | None = None
    similarity: str | None = None
    confidence: str | None = None
    consecutive_failures: int = 0


class SaveMonitoringAlertResponse(BaseModel):
    """Response for saving monitoring alert"""
    success: bool
    alert_id: int
    message: str


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


@router.post("/continuous-check", response_model=ContinuousFaceCheckResponse)
async def continuous_face_check(
    request: ContinuousFaceCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Continuous face verification during exam
    This endpoint is called periodically to verify the student's identity
    while they are taking the exam
    """
    # Only students can use continuous check
    if current_user.role != UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can use continuous face check"
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

    # Perform continuous check
    result = face_service.continuous_face_check(
        base64_image=request.image,
        stored_embedding=face_data.embedding,
        threshold=0.6  # 60% similarity threshold
    )

    return ContinuousFaceCheckResponse(
        success=result["success"],
        verified=result.get("verified", False),
        face_detected=result.get("face_detected", False),
        face_count=result.get("face_count", 0),
        similarity=result.get("similarity"),
        confidence=result.get("confidence"),
        warning=result.get("warning"),
        alert=result.get("alert"),
        message=result.get("message")
    )


@router.post("/save-monitoring-alert", response_model=SaveMonitoringAlertResponse)
async def save_monitoring_alert(
    request: SaveMonitoringAlertRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save monitoring alert/warning image for teacher review
    Only students can save their own monitoring alerts
    """
    # Only students can save monitoring alerts
    if current_user.role != UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can save monitoring alerts"
        )

    # Validate alert type
    if request.alert_type not in ["warning", "alert"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="alert_type must be 'warning' or 'alert'"
        )

    # Determine severity based on alert type and consecutive failures
    if request.alert_type == "alert":
        if request.consecutive_failures >= 5:
            severity = "critical"
        elif request.consecutive_failures >= 3:
            severity = "high"
        else:
            severity = "medium"
    else:
        severity = "low"

    # Save image to disk
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image.split(',')[-1] if ',' in request.image else request.image)
        
        # Create monitoring directory
        monitoring_dir = Path("media") / "monitoring"
        monitoring_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        unique_id = uuid.uuid4().hex[:8]
        filename = f"{timestamp}_{current_user.id}_{unique_id}.jpg"
        file_path = monitoring_dir / filename
        
        # Save image
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        # Relative URL for database
        image_url = f"/media/monitoring/{filename}"
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving image: {str(e)}"
        )

    # Create monitoring alert record
    alert = ExamMonitoringAlert(
        exercise_id=request.exercise_id,
        exam_id=request.exam_id,
        submission_id=request.submission_id,
        student_id=current_user.id,
        alert_type=request.alert_type,
        severity=severity,
        image_url=image_url,
        image_base64=request.image,  # Store base64 for quick access
        message=request.message,
        face_count=request.face_count,
        verified=request.verified,
        similarity=request.similarity,
        confidence=request.confidence,
        consecutive_failures=request.consecutive_failures
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return SaveMonitoringAlertResponse(
        success=True,
        alert_id=alert.id,
        message="Monitoring alert saved successfully"
    )


@router.get("/monitoring-alerts")
async def get_monitoring_alerts(
    exercise_id: int | None = None,
    exam_id: int | None = None,
    student_id: int | None = None,
    reviewed: bool | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get monitoring alerts for teacher review
    Only teachers and admins can view monitoring alerts
    """
    # Only teachers and admins can view alerts
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can view monitoring alerts"
        )
    
    # Build query
    query = db.query(ExamMonitoringAlert)
    
    if exercise_id:
        query = query.filter(ExamMonitoringAlert.exercise_id == exercise_id)
    if exam_id:
        query = query.filter(ExamMonitoringAlert.exam_id == exam_id)
    if student_id:
        query = query.filter(ExamMonitoringAlert.student_id == student_id)
    if reviewed is not None:
        query = query.filter(ExamMonitoringAlert.reviewed == reviewed)
    
    # Order by created_at descending
    alerts = query.order_by(ExamMonitoringAlert.created_at.desc()).all()
    
    return {
        "success": True,
        "alerts": [
            {
                "id": alert.id,
                "exercise_id": alert.exercise_id,
                "exam_id": alert.exam_id,
                "submission_id": alert.submission_id,
                "student_id": alert.student_id,
                "student_name": alert.student.full_name if alert.student else None,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "image_url": alert.image_url,
                "message": alert.message,
                "face_count": alert.face_count,
                "verified": alert.verified,
                "similarity": alert.similarity,
                "confidence": alert.confidence,
                "consecutive_failures": alert.consecutive_failures,
                "reviewed": alert.reviewed,
                "reviewed_by": alert.reviewed_by,
                "reviewed_at": alert.reviewed_at.isoformat() if alert.reviewed_at else None,
                "review_notes": alert.review_notes,
                "created_at": alert.created_at.isoformat() if alert.created_at else None
            }
            for alert in alerts
        ]
    }


@router.patch("/monitoring-alerts/{alert_id}/review")
async def review_monitoring_alert(
    alert_id: int,
    review_notes: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark monitoring alert as reviewed by teacher
    """
    # Only teachers and admins can review alerts
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can review alerts"
        )
    
    alert = db.query(ExamMonitoringAlert).filter(ExamMonitoringAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitoring alert not found"
        )
    
    alert.reviewed = True
    alert.reviewed_by = current_user.id
    alert.reviewed_at = datetime.now(timezone.utc)
    if review_notes:
        alert.review_notes = review_notes
    
    db.commit()
    db.refresh(alert)
    
    return {
        "success": True,
        "message": "Alert reviewed successfully"
    }
