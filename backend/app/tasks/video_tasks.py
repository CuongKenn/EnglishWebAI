"""
Celery tasks for video processing
"""
import asyncio
import logging
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.video_lesson import VideoLesson
from app.services.ppt_video_service import ppt_video_service
from celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="process_ppt_to_video")
def process_ppt_to_video(
    self,
    video_lesson_id: int,
    ppt_path: str,
    voice: str = "vi-VN-HoaiMyNeural",
    rate: str = "0%",
    pitch: str = "0%",
    language: str = "vi"
):
    """
    Background task to convert PPT to video

    Args:
        video_lesson_id: VideoLesson database ID
        ppt_path: Path to uploaded PPT file
        voice: Azure voice name
        rate: Speech rate
        pitch: Speech pitch
        language: Script language
    """
    db: Session = SessionLocal()

    try:
        # Update status to processing
        video_lesson = db.query(VideoLesson).filter(VideoLesson.id == video_lesson_id).first()
        if not video_lesson:
            raise ValueError(f"VideoLesson {video_lesson_id} not found")

        video_lesson.status = "processing"
        video_lesson.error_message = None
        db.commit()

        logger.info(f"[Task {self.request.id}] Processing video {video_lesson_id}")

        # Create working directories
        base_dir = Path("media/video_lessons") / str(video_lesson_id)
        slides_dir = base_dir / "slides"
        audio_dir = base_dir / "audio"
        segments_dir = base_dir / "segments"

        for directory in [slides_dir, audio_dir, segments_dir]:
            directory.mkdir(parents=True, exist_ok=True)

        # Step 1: Extract slides
        logger.info(f"[Task {self.request.id}] Extracting slides from {ppt_path}")
        slides_data = ppt_video_service.extract_slides(ppt_path, str(slides_dir))

        video_lesson.slides_count = len(slides_data)
        db.commit()

        # Step 2: Generate scripts and audio for each slide
        segment_paths = []
        total_duration = 0

        for i, slide_data in enumerate(slides_data, 1):
            logger.info(f"[Task {self.request.id}] Processing slide {i}/{len(slides_data)}")

            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': i,
                    'total': len(slides_data),
                    'status': f'Processing slide {i}/{len(slides_data)}'
                }
            )

            # Generate script
            script = asyncio.run(ppt_video_service.generate_script_for_slide(slide_data, language))

            if not script.strip():
                # Skip slides without content
                logger.warning(f"[Task {self.request.id}] Slide {i} has no content, skipping")
                continue

            # Generate audio
            audio_path = str(audio_dir / f"slide_{i:03d}.wav")
            success = ppt_video_service.text_to_speech_azure(
                script,
                audio_path,
                voice=voice,
                rate=rate,
                pitch=pitch
            )

            if not success:
                raise RuntimeError(f"Failed to generate audio for slide {i}")

            # Create video segment
            image_path = slide_data['image_path']
            segment_path = str(segments_dir / f"segment_{i:03d}.mp4")

            success = ppt_video_service.create_video_segment(
                image_path,
                audio_path,
                segment_path
            )

            if not success:
                raise RuntimeError(f"Failed to create video segment for slide {i}")

            segment_paths.append(segment_path)

            # Calculate duration (approximate from audio file size)
            # More accurate: use moviepy to get actual duration
            from moviepy.editor import VideoFileClip
            clip = VideoFileClip(segment_path)
            total_duration += clip.duration
            clip.close()

        # Step 3: Merge all segments
        logger.info(f"[Task {self.request.id}] Merging {len(segment_paths)} video segments")

        final_video_path = str(base_dir / "final_video.mp4")
        success = ppt_video_service.merge_video_segments(segment_paths, final_video_path)

        if not success:
            raise RuntimeError("Failed to merge video segments")

        # Update database with final video
        video_lesson.video_url = f"/media/video_lessons/{video_lesson_id}/final_video.mp4"
        video_lesson.duration_seconds = int(total_duration)
        video_lesson.status = "completed"
        video_lesson.completed_at = datetime.utcnow()
        db.commit()

        logger.info(f"[Task {self.request.id}] Video generation completed: {final_video_path}")

        return {
            'video_lesson_id': video_lesson_id,
            'video_url': video_lesson.video_url,
            'duration': total_duration,
            'slides_count': len(slides_data)
        }

    except Exception as e:
        logger.error(f"[Task {self.request.id}] Error processing video: {e}", exc_info=True)

        # Update database with error
        video_lesson = db.query(VideoLesson).filter(VideoLesson.id == video_lesson_id).first()
        if video_lesson:
            video_lesson.status = "failed"
            video_lesson.error_message = str(e)
            db.commit()

        raise

    finally:
        db.close()
