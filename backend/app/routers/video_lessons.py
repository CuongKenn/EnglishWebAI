"""
Video Lesson Generation API
Convert PowerPoint slides to video lessons with AI narration
"""
import logging
import os
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.video_lesson import VideoLesson
from app.services.ppt_video_service import PPTVideoService
from app.tasks.video_tasks import process_ppt_to_video

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/video-lessons", tags=["video-lessons"])


class VideoLessonResponse(BaseModel):
    id: int
    lesson_id: int | None
    teacher_id: int
    title: str
    video_url: str | None
    status: str  # pending, processing, completed, failed
    progress: int | None = 0
    slides_count: int | None
    slides_metadata: list[str] | None = None
    duration_seconds: int | None
    voice_type: str | None
    language: str | None
    created_at: datetime
    ppt_url: str | None = None

    class Config:
        from_attributes = True


class VideoGenerationRequest(BaseModel):
    voice_type: str = "vi-VN-HoaiMyNeural"
    speech_rate: str = "0%"
    speech_pitch: str = "0%"
    language: str = "vi"  # vi or en
    auto_generate_script: bool = True  # Generate script from content if no notes


class VideoLessonUpdate(BaseModel):
    title: str | None = None
    lesson_id: int | None = None


async def process_ppt_to_video_background(
    ppt_path: str,
    output_video_path: str,
    voice: str,
    rate: str,
    pitch: str,
    language: str,
    auto_generate: bool
):
    """
    Background task to process PPT → Video
    This runs asynchronously to avoid blocking the API
    """
    try:
        logger.info(f"Starting PPT to video conversion: {ppt_path}")

        # 1. Extract slides
        temp_dir = os.path.join(os.path.dirname(ppt_path), "slides_temp")
        slides_data = PPTVideoService.extract_slides(ppt_path, temp_dir)

        if not slides_data:
            raise ValueError("No slides found in PowerPoint")

        # 2. Generate scripts and audio for each slide
        video_segments = []

        for idx, slide_data in enumerate(slides_data, 1):
            logger.info(f"Processing slide {idx}/{len(slides_data)}")

            # Generate or use existing script
            if auto_generate or not slide_data['notes']:
                script = await PPTVideoService.generate_script_for_slide(slide_data, language)
            else:
                script = slide_data['notes']

            if not script.strip():
                logger.warning(f"Slide {idx} has no script, skipping narration")
                continue

            # Text to speech
            audio_path = os.path.join(temp_dir, f"audio_{idx:03d}.wav")
            success = PPTVideoService.text_to_speech_azure(
                text=script,
                output_path=audio_path,
                voice=voice,
                rate=rate,
                pitch=pitch
            )

            if not success:
                logger.error(f"Failed to generate audio for slide {idx}")
                continue

            # Create video segment
            segment_path = os.path.join(temp_dir, f"segment_{idx:03d}.mp4")
            success = PPTVideoService.create_video_segment(
                image_path=slide_data['image_path'],
                audio_path=audio_path,
                output_path=segment_path
            )

            if success:
                video_segments.append(segment_path)

        # 3. Merge all segments
        if not video_segments:
            raise ValueError("No video segments were created")

        logger.info(f"Merging {len(video_segments)} video segments")
        success = PPTVideoService.merge_video_segments(
            segment_paths=video_segments,
            output_path=output_video_path
        )

        if not success:
            raise ValueError("Failed to merge video segments")

        logger.info(f"Video generation completed: {output_video_path}")

        # Cleanup temp files
        # TODO: Clean up temp directory

        return True

    except Exception as e:
        logger.error(f"Error in background video processing: {e}", exc_info=True)
        return False


@router.post("/generate-from-ppt", response_model=VideoLessonResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_video_from_ppt(
    file: UploadFile = File(..., description="PowerPoint file (.ppt or .pptx)"),
    title: str = Form(..., description="Video title"),
    lesson_id: int | None = Form(None, description="Associated lesson ID"),
    class_id: int | None = Form(None, description="Associated class ID"),
    voice_type: str = Form("vi-VN-HoaiMyNeural", description="Azure TTS voice"),
    speech_rate: str = Form("0%", description="Speech rate (-50% to +100%)"),
    speech_pitch: str = Form("0%", description="Speech pitch (-50% to +50%)"),
    language: str = Form("vi", description="Script language (vi/en)"),
    auto_generate_script: bool = Form(True, description="Auto-generate script if no notes"),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload PowerPoint and generate video lesson with AI narration

    Process:
    1. Upload PPT file
    2. Extract slides as images
    3. Generate narration script (from notes or AI)
    4. Convert text to speech
    5. Create video from slides + audio
    6. Return video URL

    This is an async operation - returns immediately with status 'processing'
    """
    # Check permissions
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can generate video lessons"
        )

    # Validate file type
    if not file.filename.endswith(('.ppt', '.pptx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PowerPoint files (.ppt, .pptx) are supported"
        )

    # Check dependencies
    try:
        PPTVideoService.check_dependencies()
    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(e)
        ) from e

    # Save uploaded file
    upload_dir = os.path.join("media", "video_lessons", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    ppt_path = os.path.join(upload_dir, filename)

    # Save file
    with open(ppt_path, "wb") as f:
        content = await file.read()
        f.write(content)

    logger.info(f"Uploaded PPT: {ppt_path} ({len(content)} bytes)")

    # Create database record
    video_lesson = VideoLesson(
        title=title,
        lesson_id=lesson_id,
        class_id=class_id,
        teacher_id=current_user.id,
        ppt_file_path=ppt_path,
        voice_type=voice_type,
        language=language,
        status="pending"
    )
    db.add(video_lesson)
    db.commit()
    db.refresh(video_lesson)

    logger.info(f"Created VideoLesson record: ID {video_lesson.id}")

    # Dispatch Celery task for async processing
    task = process_ppt_to_video.delay(
        video_lesson_id=video_lesson.id,
        ppt_path=ppt_path,
        voice=voice_type,
        rate=speech_rate,
        pitch=speech_pitch,
        language=language
    )

    logger.info(f"Dispatched Celery task {task.id} for VideoLesson {video_lesson.id}")

    # Return response immediately
    response = VideoLessonResponse(
        id=video_lesson.id,
        lesson_id=video_lesson.lesson_id,
        teacher_id=video_lesson.teacher_id,
        title=video_lesson.title,
        video_url=video_lesson.video_url,
        status=video_lesson.status,
        slides_count=video_lesson.slides_count,
        duration_seconds=video_lesson.duration_seconds,
        voice_type=video_lesson.voice_type,
        language=video_lesson.language,
        created_at=video_lesson.created_at
    )

    if video_lesson.ppt_file_path:
        # Convert file path to URL
        # Path is like "media/video_lessons/uploads/filename.pptx"
        # URL should be "/media/video_lessons/uploads/filename.pptx"
        response.ppt_url = "/" + video_lesson.ppt_file_path.replace("\\", "/")

    return response


@router.get("/{video_id}", response_model=VideoLessonResponse)
async def get_video_lesson(
    video_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get video lesson details and status"""
    video_lesson = db.query(VideoLesson).filter(VideoLesson.id == video_id).first()

    if not video_lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video lesson {video_id} not found"
        )

    # Check permissions (only teacher who created it or admin can view)
    if video_lesson.teacher_id != current_user.id and current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this video lesson"
        )

    response = VideoLessonResponse.model_validate(video_lesson)
    if video_lesson.ppt_file_path:
        response.ppt_url = "/" + video_lesson.ppt_file_path.replace("\\", "/")
    return response


@router.get("/", response_model=list[VideoLessonResponse])
async def list_video_lessons(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all video lessons for current teacher"""
    query = db.query(VideoLesson)

    # Teachers see only their own videos
    if current_user.role == UserRole.TEACHER:
        query = query.filter(VideoLesson.teacher_id == current_user.id)
    # Admins see all videos (no filter needed)

    videos = query.order_by(VideoLesson.created_at.desc()).offset(skip).limit(limit).all()

    results = []
    for v in videos:
        resp = VideoLessonResponse.model_validate(v)
        if v.ppt_file_path:
            resp.ppt_url = "/" + v.ppt_file_path.replace("\\", "/")
        results.append(resp)

    return results


@router.put("/{video_id}", response_model=VideoLessonResponse)
async def update_video_lesson(
    video_id: int,
    payload: VideoLessonUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update video lesson details (title, lesson_id)"""
    video_lesson = db.query(VideoLesson).filter(VideoLesson.id == video_id).first()

    if not video_lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video lesson {video_id} not found"
        )

    # Check permissions
    if video_lesson.teacher_id != current_user.id and current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this video lesson"
        )

    if payload.title is not None:
        video_lesson.title = payload.title

    if payload.lesson_id is not None:
        # Verify lesson exists and belongs to a class the teacher manages?
        # For now, just check if lesson exists
        from app.models.lesson import Lesson
        lesson = db.query(Lesson).filter(Lesson.id == payload.lesson_id).first()
        if not lesson:
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lesson {payload.lesson_id} not found"
            )
        video_lesson.lesson_id = payload.lesson_id
        video_lesson.class_id = lesson.class_id  # Auto-update class_id from lesson

    db.commit()
    db.refresh(video_lesson)
    return VideoLessonResponse.model_validate(video_lesson)
