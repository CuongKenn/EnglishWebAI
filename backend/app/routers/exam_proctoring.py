"""
Exam Proctoring API Router
Endpoints for exam monitoring and proctoring
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.exam_proctoring_service import get_exam_proctoring_service

router = APIRouter()


# Request/Response Schemas
class StartMonitoringRequest(BaseModel):
    submission_id: int
    exam_id: int


class StartMonitoringResponse(BaseModel):
    success: bool
    session_token: str | None = None
    error: str | None = None


class VerifyIdentityRequest(BaseModel):
    session_token: str
    base64_image: str


class VerifyIdentityResponse(BaseModel):
    success: bool
    verified: bool
    confidence: str | None = None
    similarity: float | None = None
    error: str | None = None
    auto_submit: bool | None = False
    reason: str | None = None
    critical_count: int | None = None


class MonitorBehaviorRequest(BaseModel):
    session_token: str
    base64_image: str


class MonitorBehaviorResponse(BaseModel):
    success: bool
    face_detected: bool
    num_faces: int
    is_attentive: bool | None = None
    violations: list[str] | None = None
    head_pose: dict | None = None
    gaze_direction: str | None = None
    warning: str | None = None
    message: str | None = None
    error: str | None = None
    auto_submit: bool | None = False
    reason: str | None = None


class EndMonitoringRequest(BaseModel):
    session_token: str


class EndMonitoringResponse(BaseModel):
    success: bool
    error: str | None = None


class SessionStatusResponse(BaseModel):
    session_id: int
    submission_id: int
    is_active: bool
    warning_count: int
    critical_count: int
    auto_submitted: bool
    auto_submit_reason: str | None = None
    needs_identity_check: bool
    last_identity_check: str | None = None
    started_at: str | None = None


class ProctoringLogResponse(BaseModel):
    id: int
    submission_id: int
    event_type: str
    severity: str
    message: str
    confidence_score: float | None = None
    timestamp: datetime

    class Config:
        from_attributes = True


@router.post("/start-monitoring", response_model=StartMonitoringResponse)
async def start_monitoring(
    request: StartMonitoringRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start a monitoring session for an exam
    """
    proctoring_service = get_exam_proctoring_service()

    success, session, error = proctoring_service.create_monitoring_session(
        db=db,
        submission_id=request.submission_id,
        student_id=current_user.id,
        exam_id=request.exam_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Failed to create monitoring session"
        )

    return StartMonitoringResponse(
        success=True,
        session_token=session.session_token
    )


@router.post("/verify-identity", response_model=VerifyIdentityResponse)
async def verify_identity(
    request: VerifyIdentityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify student identity against enrolled face (periodic check)
    """
    proctoring_service = get_exam_proctoring_service()

    success, result = proctoring_service.verify_identity(
        db=db,
        session_token=request.session_token,
        base64_image=request.base64_image
    )

    return VerifyIdentityResponse(
        success=success,
        verified=result.get('verified', False),
        confidence=result.get('confidence'),
        similarity=result.get('similarity'),
        error=result.get('error'),
        auto_submit=result.get('auto_submit', False),
        reason=result.get('reason'),
        critical_count=result.get('critical_count')
    )


@router.post("/monitor-behavior", response_model=MonitorBehaviorResponse)
async def monitor_behavior(
    request: MonitorBehaviorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Monitor student behavior (continuous gaze and head pose tracking)
    """
    proctoring_service = get_exam_proctoring_service()

    success, analysis = proctoring_service.monitor_behavior(
        db=db,
        session_token=request.session_token,
        base64_image=request.base64_image
    )

    return MonitorBehaviorResponse(
        success=success,
        face_detected=analysis.get('face_detected', False),
        num_faces=analysis.get('num_faces', 0),
        is_attentive=analysis.get('is_attentive'),
        violations=analysis.get('violations'),
        head_pose=analysis.get('head_pose'),
        gaze_direction=analysis.get('gaze_direction'),
        warning=analysis.get('warning'),
        message=analysis.get('message'),
        error=analysis.get('error'),
        auto_submit=analysis.get('auto_submit', False),
        reason=analysis.get('reason')
    )


@router.post("/end-monitoring", response_model=EndMonitoringResponse)
async def end_monitoring(
    request: EndMonitoringRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    End a monitoring session
    """
    proctoring_service = get_exam_proctoring_service()

    success, error = proctoring_service.end_monitoring_session(
        db=db,
        session_token=request.session_token
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Failed to end monitoring session"
        )

    return EndMonitoringResponse(success=True)


@router.get("/session-status/{session_token}", response_model=SessionStatusResponse)
async def get_session_status(
    session_token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current session status
    """
    proctoring_service = get_exam_proctoring_service()

    status_data = proctoring_service.get_session_status(
        db=db,
        session_token=session_token
    )

    if not status_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    return SessionStatusResponse(**status_data)


@router.get("/proctoring-logs/{submission_id}", response_model=list[ProctoringLogResponse])
async def get_proctoring_logs(
    submission_id: int,
    severity: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all proctoring logs for a submission
    Optional filter by severity: info, warning, critical
    """
    proctoring_service = get_exam_proctoring_service()

    logs = proctoring_service.get_proctoring_logs(
        db=db,
        submission_id=submission_id,
        severity=severity
    )

    return [ProctoringLogResponse.from_orm(log) for log in logs]
