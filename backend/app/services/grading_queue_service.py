"""
Grading Queue Service
Manages the queue for auto-grading submissions with background processing
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import asyncio
import logging

from app.models.grading_queue import GradingQueue
from app.models.submission import Submission
from app.models.exercise import Exercise
from app.services.ai_grading_service import AIGradingService

logger = logging.getLogger(__name__)


class GradingQueueService:
    """Service for managing grading queue and processing submissions"""
    
    def __init__(self):
        self.ai_grading_service = AIGradingService()
        self.processing_timeout = timedelta(minutes=10)  # Timeout for stuck items
    
    # ========== Queue Management ==========
    
    def add_to_queue(
        self, 
        db: Session, 
        submission_id: int,
        exercise_id: int,
        student_id: int,
        class_id: Optional[int] = None,
        priority: int = 50
    ) -> GradingQueue:
        """Add a submission to the grading queue"""
        
        # Check if already in queue
        existing = db.query(GradingQueue).filter(
            GradingQueue.submission_id == submission_id
        ).first()
        
        if existing:
            logger.warning(f"Submission {submission_id} already in queue (id={existing.id})")
            return existing
        
        # Create queue item
        queue_item = GradingQueue(
            submission_id=submission_id,
            exercise_id=exercise_id,
            student_id=student_id,
            class_id=class_id,
            status="pending",
            priority=priority,
            attempts=0,
            max_attempts=3
        )
        
        db.add(queue_item)
        db.commit()
        db.refresh(queue_item)
        
        logger.info(f"Added submission {submission_id} to grading queue (priority={priority})")
        return queue_item
    
    def get_next_pending(self, db: Session) -> Optional[GradingQueue]:
        """Get next pending item from queue (highest priority first)"""
        
        # Reset stuck items (processing > timeout)
        self._reset_stuck_items(db)
        
        # Get next pending item (order by priority DESC, then created_at ASC)
        queue_item = db.query(GradingQueue).filter(
            GradingQueue.status == "pending"
        ).order_by(
            GradingQueue.priority.desc(),
            GradingQueue.created_at.asc()
        ).first()
        
        return queue_item
    
    def _reset_stuck_items(self, db: Session):
        """Reset items stuck in 'processing' status"""
        timeout_threshold = datetime.utcnow() - self.processing_timeout
        
        stuck_items = db.query(GradingQueue).filter(
            and_(
                GradingQueue.status == "processing",
                GradingQueue.started_at < timeout_threshold
            )
        ).all()
        
        for item in stuck_items:
            logger.warning(f"Resetting stuck queue item {item.id} (submission_id={item.submission_id})")
            item.status = "pending"
            item.started_at = None
            item.attempts += 1
            
            if item.attempts >= item.max_attempts:
                item.status = "failed"
                item.error_message = "Exceeded max attempts (timeout)"
        
        if stuck_items:
            db.commit()
    
    def update_status(
        self, 
        db: Session, 
        queue_id: int, 
        status: str, 
        error_message: Optional[str] = None
    ):
        """Update queue item status"""
        queue_item = db.query(GradingQueue).filter(GradingQueue.id == queue_id).first()
        
        if not queue_item:
            logger.error(f"Queue item {queue_id} not found")
            return
        
        queue_item.status = status
        queue_item.updated_at = datetime.utcnow()
        
        if status == "processing":
            queue_item.started_at = datetime.utcnow()
        elif status == "completed":
            queue_item.completed_at = datetime.utcnow()
        elif status == "failed":
            queue_item.error_message = error_message
        
        db.commit()
        logger.info(f"Queue item {queue_id} status updated to {status}")
    
    # ========== Processing ==========
    
    async def process_next_pending(self, db: Session) -> bool:
        """Process the next pending item in queue"""
        queue_item = self.get_next_pending(db)
        
        if not queue_item:
            return False  # No pending items
        
        await self.process_item(db, queue_item)
        return True
    
    async def process_item(self, db: Session, queue_item: GradingQueue):
        """Process a single queue item (auto-grade submission)"""
        
        try:
            logger.info(f"Processing queue item {queue_item.id} (submission_id={queue_item.submission_id})")
            
            # Update status to processing
            self.update_status(db, queue_item.id, "processing")
            
            # Get submission and exercise
            submission = db.query(Submission).filter(Submission.id == queue_item.submission_id).first()
            exercise = db.query(Exercise).filter(Exercise.id == queue_item.exercise_id).first()
            
            if not submission or not exercise:
                raise Exception(f"Submission or Exercise not found (sub={queue_item.submission_id}, ex={queue_item.exercise_id})")
            
            # Update submission grading status
            submission.grading_status = "grading"
            db.commit()
            
            # Auto-grade using AI
            result = await self.ai_grading_service.grade_comprehensive_submission(
                exercise_content=exercise.content,
                student_answers=submission.answers,
                audio_file_path=submission.content_url
            )
            
            # Store AI results (hidden from student until teacher review)
            submission.score = result['total_score']
            submission.ai_score = result['total_score']
            submission.original_ai_score = result['total_score']
            submission.rubrics_scores = result
            
            # Build comprehensive feedback from all sections
            feedback_parts = []
            
            # Listening feedback
            if result.get('listening', {}).get('total_points', 0) > 0:
                listening_correct = len([q for q in result['listening']['questions'] if q.get('is_correct', False)])
                listening_total = len(result['listening']['questions'])
                feedback_parts.append(f"🎧 Listening: {listening_correct}/{listening_total} câu đúng - {result['listening']['total_points']:.1f}/2.5đ")
            
            # Reading feedback
            if result.get('reading', {}).get('total_points', 0) > 0:
                reading_correct = len([q for q in result['reading']['questions'] if q.get('is_correct', False)])
                reading_total = len(result['reading']['questions'])
                feedback_parts.append(f"📖 Reading: {reading_correct}/{reading_total} câu đúng - {result['reading']['total_points']:.1f}/2.5đ")
            
            # Writing feedback
            if result.get('writing', {}).get('points_earned', 0) > 0:
                writing_comment = result['writing'].get('overall_comment', '')
                if writing_comment:
                    feedback_parts.append(f"✍️ Writing: {result['writing']['points_earned']:.1f}/2.5đ\n{writing_comment[:200]}")
                else:
                    feedback_parts.append(f"✍️ Writing: {result['writing']['points_earned']:.1f}/2.5đ")
            
            # Speaking feedback
            if result.get('speaking', {}).get('points_earned', 0) > 0:
                speaking_feedback = result['speaking'].get('feedback', {})
                pronunciation_text = speaking_feedback.get('pronunciation', '')
                content_text = speaking_feedback.get('content', '')
                feedback_parts.append(f"🗣️ Speaking: {result['speaking']['points_earned']:.1f}/2.5đ\n{pronunciation_text}\n{content_text[:200]}")
            
            # Combine all feedback
            if feedback_parts:
                submission.ai_feedback = "\n\n".join(feedback_parts)
            else:
                submission.ai_feedback = f"Tự động chấm: {result['total_score']}/{result['max_score']} điểm"
            
            submission.grading_status = "ai_graded"
            submission.ai_graded_at = datetime.utcnow()
            submission.teacher_reviewed = False
            
            db.commit()
            
            # Mark queue item as completed
            self.update_status(db, queue_item.id, "completed")
            
            logger.info(f"Successfully graded submission {submission.id} (score={result['total_score']}/{result['max_score']})")
            
        except Exception as e:
            logger.error(f"Error processing queue item {queue_item.id}: {e}", exc_info=True)
            
            # Increment attempts
            queue_item.attempts += 1
            
            # Check if max attempts reached
            if queue_item.attempts >= queue_item.max_attempts:
                self.update_status(db, queue_item.id, "failed", str(e))
                
                # Update submission status
                submission = db.query(Submission).filter(Submission.id == queue_item.submission_id).first()
                if submission:
                    submission.grading_status = "failed"
                    submission.feedback = f"Lỗi khi chấm điểm: {str(e)}"
                    db.commit()
            else:
                # Reset to pending for retry
                self.update_status(db, queue_item.id, "pending")
    
    async def process_queue_continuous(self, db: Session):
        """Continuous loop to process queue (for background worker)"""
        logger.info("Starting continuous queue processing...")
        
        while True:
            try:
                # Process next pending item
                processed = await self.process_next_pending(db)
                
                if not processed:
                    # No items in queue, wait before checking again
                    await asyncio.sleep(5)
                else:
                    # Item processed, check for next immediately
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                logger.error(f"Error in continuous queue processing: {e}", exc_info=True)
                await asyncio.sleep(10)  # Wait longer on error
    
    # ========== Queue Statistics ==========
    
    def get_queue_stats(self, db: Session) -> Dict:
        """Get queue statistics"""
        total = db.query(GradingQueue).count()
        pending = db.query(GradingQueue).filter(GradingQueue.status == "pending").count()
        processing = db.query(GradingQueue).filter(GradingQueue.status == "processing").count()
        completed = db.query(GradingQueue).filter(GradingQueue.status == "completed").count()
        failed = db.query(GradingQueue).filter(GradingQueue.status == "failed").count()
        
        # Average processing time (for completed items)
        completed_items = db.query(GradingQueue).filter(
            and_(
                GradingQueue.status == "completed",
                GradingQueue.started_at.isnot(None),
                GradingQueue.completed_at.isnot(None)
            )
        ).all()
        
        avg_processing_time = None
        if completed_items:
            total_time = sum([
                (item.completed_at - item.started_at).total_seconds()
                for item in completed_items
            ])
            avg_processing_time = total_time / len(completed_items)
        
        return {
            "total": total,
            "pending": pending,
            "processing": processing,
            "completed": completed,
            "failed": failed,
            "average_processing_time_seconds": avg_processing_time
        }
    
    def get_pending_submissions(
        self, 
        db: Session, 
        student_id: Optional[int] = None,
        exercise_id: Optional[int] = None,
        class_id: Optional[int] = None
    ) -> List[GradingQueue]:
        """Get pending items with filters"""
        query = db.query(GradingQueue).filter(GradingQueue.status == "pending")
        
        if student_id:
            query = query.filter(GradingQueue.student_id == student_id)
        if exercise_id:
            query = query.filter(GradingQueue.exercise_id == exercise_id)
        if class_id:
            query = query.filter(GradingQueue.class_id == class_id)
        
        return query.order_by(GradingQueue.priority.desc(), GradingQueue.created_at.asc()).all()
    
    # ========== Retry Failed Items ==========
    
    def retry_failed_item(self, db: Session, queue_id: int) -> bool:
        """Retry a failed queue item"""
        queue_item = db.query(GradingQueue).filter(GradingQueue.id == queue_id).first()
        
        if not queue_item:
            logger.error(f"Queue item {queue_id} not found")
            return False
        
        if queue_item.status != "failed":
            logger.warning(f"Queue item {queue_id} is not failed (status={queue_item.status})")
            return False
        
        # Reset for retry
        queue_item.status = "pending"
        queue_item.attempts = 0
        queue_item.error_message = None
        queue_item.started_at = None
        queue_item.completed_at = None
        
        db.commit()
        logger.info(f"Retrying failed queue item {queue_id}")
        return True

