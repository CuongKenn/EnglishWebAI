"""
Celery tasks package
"""
from app.tasks.video_tasks import process_ppt_to_video

__all__ = ["process_ppt_to_video"]
