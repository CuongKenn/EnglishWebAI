"""
Student Progress Service
Handles automatic progress tracking, snapshots, and analytics
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

from app.models.student_progress import StudentProgressSnapshot, StudentSkillProgress
from app.models.submission import Submission
from app.models.exercise import Exercise
from app.models.enrollment import Enrollment
from app.models.user import User

logger = logging.getLogger(__name__)


class StudentProgressService:
    """Service for managing student progress tracking"""

    @staticmethod
    def calculate_skill_scores(submissions: List[Submission]) -> Dict[str, Dict]:
        """
        Calculate average scores for each skill from submissions
        
        Returns:
            Dict with skill_type as key and dict with 'score', 'count' as values
        """
        skills = {
            'reading': {'total': 0, 'count': 0},
            'writing': {'total': 0, 'count': 0},
            'listening': {'total': 0, 'count': 0},
            'speaking': {'total': 0, 'count': 0}
        }
        
        for sub in submissions:
            if not sub.exercise or not sub.exercise.skill_type:
                continue
                
            skill_type = sub.exercise.skill_type
            if skill_type not in skills:
                continue
            
            # Calculate percentage if we have both score and max_score
            if (sub.score is not None and sub.graded_at is not None and 
                sub.exercise.max_score and sub.exercise.max_score > 0):
                percentage = (sub.score / sub.exercise.max_score) * 100
                skills[skill_type]['total'] += percentage
                skills[skill_type]['count'] += 1
        
        # Calculate averages
        result = {}
        for skill, data in skills.items():
            if data['count'] > 0:
                result[skill] = {
                    'score': round(data['total'] / data['count'], 2),
                    'count': data['count']
                }
            else:
                result[skill] = {'score': 0.0, 'count': 0}
        
        return result

    @staticmethod
    def calculate_trend(scores: List[float]) -> str:
        """
        Calculate trend from a list of scores
        
        Args:
            scores: List of percentage scores over time
            
        Returns:
            'improving', 'stable', or 'declining'
        """
        if len(scores) < 3:
            return 'stable'
        
        # Compare first half vs second half
        mid = len(scores) // 2
        first_half = sum(scores[:mid]) / mid if mid > 0 else 0
        second_half = sum(scores[mid:]) / (len(scores) - mid)
        
        diff = second_half - first_half
        
        if diff > 5:
            return 'improving'
        elif diff < -5:
            return 'declining'
        else:
            return 'stable'

    @staticmethod
    def create_progress_snapshot(
        db: Session,
        student_id: int,
        class_id: Optional[int] = None,
        period_type: str = "week",
        period_label: Optional[str] = None
    ) -> StudentProgressSnapshot:
        """
        Create a progress snapshot for a student
        
        Args:
            db: Database session
            student_id: Student user ID
            class_id: Optional class ID to filter by
            period_type: Type of period (week, month, semester)
            period_label: Label for the period (e.g., "Week 1")
            
        Returns:
            Created StudentProgressSnapshot
        """
        # Get time range based on period_type
        now = datetime.now()
        if period_type == "week":
            start_date = now - timedelta(days=7)
            if not period_label:
                period_label = f"Week {now.isocalendar()[1]}"
        elif period_type == "month":
            start_date = now - timedelta(days=30)
            if not period_label:
                period_label = f"Month {now.month}"
        else:  # semester
            start_date = now - timedelta(days=120)
            if not period_label:
                period_label = f"Semester {(now.month - 1) // 6 + 1}"
        
        # Get submissions for this period
        query = db.query(Submission).join(
            Exercise, Exercise.id == Submission.exercise_id
        ).filter(
            Submission.student_id == student_id,
            Submission.submitted_at >= start_date
        )
        
        if class_id:
            query = query.filter(Exercise.class_id == class_id)
        
        submissions = query.all()
        
        # Calculate metrics
        total_submissions = len(submissions)
        graded_submissions = [
            s for s in submissions 
            if s.score is not None and s.graded_at is not None
        ]
        graded_count = len(graded_submissions)
        
        # Calculate average score
        if graded_submissions:
            total_score = sum(
                (s.score / s.exercise.max_score * 100) 
                for s in graded_submissions 
                if s.exercise and s.exercise.max_score and s.exercise.max_score > 0
            )
            average_score = round(total_score / graded_count, 2) if graded_count > 0 else 0.0
        else:
            average_score = 0.0
        
        # Calculate skill scores
        skill_scores = StudentProgressService.calculate_skill_scores(submissions)
        
        # Calculate trend
        recent_scores = [
            (s.score / s.exercise.max_score * 100)
            for s in sorted(graded_submissions, key=lambda x: x.submitted_at)
            if s.exercise and s.exercise.max_score and s.exercise.max_score > 0
        ]
        trend = StudentProgressService.calculate_trend(recent_scores)
        
        # Create snapshot
        snapshot = StudentProgressSnapshot(
            student_id=student_id,
            class_id=class_id,
            snapshot_date=now,
            period_type=period_type,
            period_label=period_label,
            total_submissions=total_submissions,
            graded_submissions=graded_count,
            average_score=average_score,
            completion_rate=0.0,  # TODO: Calculate based on expected submissions
            reading_score=skill_scores.get('reading', {}).get('score', 0.0),
            writing_score=skill_scores.get('writing', {}).get('score', 0.0),
            listening_score=skill_scores.get('listening', {}).get('score', 0.0),
            speaking_score=skill_scores.get('speaking', {}).get('score', 0.0),
            reading_count=skill_scores.get('reading', {}).get('count', 0),
            writing_count=skill_scores.get('writing', {}).get('count', 0),
            listening_count=skill_scores.get('listening', {}).get('count', 0),
            speaking_count=skill_scores.get('speaking', {}).get('count', 0),
            trend=trend,
            attendance_rate=0.0,  # TODO: Calculate from attendance records
        )
        
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        
        logger.info(f"Created progress snapshot for student {student_id}, period: {period_label}")
        
        return snapshot

    @staticmethod
    def get_progress_timeline(
        db: Session,
        student_id: int,
        class_id: Optional[int] = None,
        period_type: str = "week",
        limit: int = 12
    ) -> List[StudentProgressSnapshot]:
        """
        Get progress timeline for a student
        
        Args:
            db: Database session
            student_id: Student user ID
            class_id: Optional class ID to filter by
            period_type: Type of period to filter
            limit: Maximum number of snapshots to return
            
        Returns:
            List of StudentProgressSnapshot ordered by date
        """
        query = db.query(StudentProgressSnapshot).filter(
            StudentProgressSnapshot.student_id == student_id,
            StudentProgressSnapshot.period_type == period_type
        )
        
        if class_id:
            query = query.filter(StudentProgressSnapshot.class_id == class_id)
        
        snapshots = query.order_by(
            desc(StudentProgressSnapshot.snapshot_date)
        ).limit(limit).all()
        
        return list(reversed(snapshots))  # Return in chronological order

    @staticmethod
    def record_skill_progress(
        db: Session,
        student_id: int,
        skill_type: str,
        score: float,
        max_score: float,
        exercise_id: Optional[int] = None,
        submission_id: Optional[int] = None,
        strengths: Optional[List[str]] = None,
        weaknesses: Optional[List[str]] = None,
        teacher_notes: Optional[str] = None,
        ai_feedback: Optional[str] = None
    ) -> StudentSkillProgress:
        """
        Record detailed skill progress for a student
        
        Args:
            db: Database session
            student_id: Student user ID
            skill_type: Type of skill (reading, writing, listening, speaking)
            score: Score achieved
            max_score: Maximum possible score
            exercise_id: Optional exercise ID
            submission_id: Optional submission ID
            strengths: List of strength areas
            weaknesses: List of weakness areas
            teacher_notes: Teacher's notes
            ai_feedback: AI-generated feedback
            
        Returns:
            Created StudentSkillProgress
        """
        percentage = (score / max_score * 100) if max_score > 0 else 0.0
        
        progress = StudentSkillProgress(
            student_id=student_id,
            skill_type=skill_type,
            score=score,
            max_score=max_score,
            percentage=round(percentage, 2),
            exercise_id=exercise_id,
            submission_id=submission_id,
            strengths=strengths,
            weaknesses=weaknesses,
            teacher_notes=teacher_notes,
            ai_feedback=ai_feedback
        )
        
        db.add(progress)
        db.commit()
        db.refresh(progress)
        
        return progress

    @staticmethod
    def get_skill_timeline(
        db: Session,
        student_id: int,
        skill_type: str,
        limit: int = 20
    ) -> List[StudentSkillProgress]:
        """
        Get timeline of progress for a specific skill
        
        Args:
            db: Database session
            student_id: Student user ID
            skill_type: Type of skill
            limit: Maximum number of records to return
            
        Returns:
            List of StudentSkillProgress ordered by date
        """
        progress_records = db.query(StudentSkillProgress).filter(
            StudentSkillProgress.student_id == student_id,
            StudentSkillProgress.skill_type == skill_type
        ).order_by(
            desc(StudentSkillProgress.assessment_date)
        ).limit(limit).all()
        
        return list(reversed(progress_records))  # Return in chronological order

    @staticmethod
    def get_student_summary(
        db: Session,
        student_id: int,
        class_id: Optional[int] = None
    ) -> Dict:
        """
        Get comprehensive summary of student progress
        
        Args:
            db: Database session
            student_id: Student user ID
            class_id: Optional class ID to filter by
            
        Returns:
            Dictionary with student progress summary
        """
        # Get latest snapshot
        query = db.query(StudentProgressSnapshot).filter(
            StudentProgressSnapshot.student_id == student_id
        )
        
        if class_id:
            query = query.filter(StudentProgressSnapshot.class_id == class_id)
        
        latest_snapshot = query.order_by(
            desc(StudentProgressSnapshot.snapshot_date)
        ).first()
        
        # Get skill timelines
        skill_timelines = {}
        for skill in ['reading', 'writing', 'listening', 'speaking']:
            timeline = StudentProgressService.get_skill_timeline(db, student_id, skill, limit=10)
            skill_timelines[skill] = [
                {
                    'date': p.assessment_date.isoformat() if p.assessment_date else None,
                    'percentage': p.percentage,
                    'score': p.score,
                    'max_score': p.max_score
                }
                for p in timeline
            ]
        
        summary = {
            'student_id': student_id,
            'latest_snapshot': {
                'average_score': latest_snapshot.average_score if latest_snapshot else 0.0,
                'trend': latest_snapshot.trend if latest_snapshot else 'stable',
                'total_submissions': latest_snapshot.total_submissions if latest_snapshot else 0,
                'graded_submissions': latest_snapshot.graded_submissions if latest_snapshot else 0,
                'skills': {
                    'reading': latest_snapshot.reading_score if latest_snapshot else 0.0,
                    'writing': latest_snapshot.writing_score if latest_snapshot else 0.0,
                    'listening': latest_snapshot.listening_score if latest_snapshot else 0.0,
                    'speaking': latest_snapshot.speaking_score if latest_snapshot else 0.0,
                }
            } if latest_snapshot else None,
            'skill_timelines': skill_timelines
        }
        
        return summary

