"""
Celery Application Configuration
Background task processing for video generation
"""
import logging

from celery import Celery
from celery.signals import task_postrun, task_prerun

from app.core.config import settings

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "englishwebai",
    broker=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    backend=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    include=[
        "app.tasks.video_tasks",  # Video generation tasks
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    task_soft_time_limit=3300,  # 55 minutes soft limit
    worker_prefetch_multiplier=1,  # Process one task at a time
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks
    task_acks_late=True,  # Acknowledge after completion
    task_reject_on_worker_lost=True,
    result_expires=86400,  # Keep results for 24 hours
)

@task_prerun.connect
def task_prerun_handler(task_id, task, *args, **kwargs):
    """Log when task starts"""
    logger.info(f"Task {task.name} [{task_id}] starting")

@task_postrun.connect
def task_postrun_handler(task_id, task, *args, **kwargs):
    """Log when task completes"""
    logger.info(f"Task {task.name} [{task_id}] completed")
